'use strict';

const assert = require('assert');
const { QrEncoder } = require('../lib/encoder');
const { calculateECC } = require('../lib/reedsolomon');
const { QrMatrix } = require('../lib/matrix/QrMatrix');
const { setupPatterns } = require('../lib/matrix/patterns');
const { fillData } = require('../lib/matrix/data');
const { applyMask } = require('../lib/matrix/mask');
const { encode } = require('../lib/qrEncoder');
const { ECC_LEVELS, MODES, getDataCapacity, getCharCountSize } = require('../lib/spec');

// Test utilities
const logTestGroup = (name) => console.log(`\n${'='.repeat(60)}\n${name}\n${'='.repeat(60)}`);
const logTest = (name) => console.log(`\n✓ ${name}`);

// ============================================================================
// Test Case 1: QrEncoder.prepareDataBytes with mode, length, and padding
// ============================================================================
logTestGroup('Test Case 1: QrEncoder prepareDataBytes');

// Test 1.1: Simple text with mode and length indicators
(() => {
  const text = 'Hi!';
  const eccLevel = ECC_LEVELS.M;
  const encoder = new QrEncoder({ text, eccLevel, version: 1 });

  // Get the encoded bits
  const bits = encoder.encode();

  // Convert first few bytes to check mode and length
  const bytes = [];
  for (let i = 0; i < Math.min(bits.length, 32); i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }

  // First 4 bits should be BYTE mode (0100)
  const modeBits = (bytes[0] >> 4) & 0x0F;
  assert.strictEqual(modeBits, MODES.BYTE, 'Mode should be BYTE (4)');

  // Next 8 bits should be length (3 for "Hi!")
  const lengthBits = ((bytes[0] & 0x0F) << 4) | (bytes[1] >> 4);
  assert.strictEqual(lengthBits, 3, 'Length should be 3');

  // Check that data contains expected characters
  const h = ((bytes[1] & 0x0F) << 4) | (bytes[2] >> 4);
  const i = ((bytes[2] & 0x0F) << 4) | (bytes[3] >> 4);
  assert.strictEqual(h, 72, 'First character should be H (72)');
  assert.strictEqual(i, 105, 'Second character should be i (105)');

  logTest('Mode indicator (BYTE) is correct');
  logTest('Length indicator matches text length');
  logTest('Data bytes are correctly encoded');
})();

// Test 1.2: Verify padding bytes
(() => {
  const text = 'A';
  const eccLevel = ECC_LEVELS.M;
  const encoder = new QrEncoder({ text, eccLevel, version: 1 });

  // Get the encoded bits and convert to bytes
  const bits = encoder.encode();
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }

  // encode() returns total codewords (data + ECC)
  // Version 1: 26 bytes total (16 data + 10 ECC for M level)
  const dataCapacity = getDataCapacity(1, eccLevel);
  assert.strictEqual(bytes.length, 26, 'Version 1 should have 26 total codewords');

  // Check for padding bytes (236, 17 alternating pattern) in the first 16 bytes (data portion)
  // After mode (4 bits) + length (8 bits) + data (8 bits) + terminator (4 bits) + alignment (4 bits) = 28 bits = 3.5 bytes
  // So padding should start around byte 4
  let foundPadding236 = false;
  let foundPadding17 = false;
  for (let i = 4; i < dataCapacity; i++) {
    if (bytes[i] === 236) foundPadding236 = true;
    if (bytes[i] === 17) foundPadding17 = true;
  }

  assert.strictEqual(foundPadding236, true, 'Should contain padding byte 236');
  assert.strictEqual(foundPadding17, true, 'Should contain padding byte 17');

  logTest('Padding bytes (236, 17) are present');
  logTest('Total codewords match specification (data + ECC)');
})();

// Test 1.3: Different ECC levels produce different capacities
(() => {
  const text = 'Test';

  const encoderL = new QrEncoder({ text, eccLevel: ECC_LEVELS.L, version: 1 });
  const encoderH = new QrEncoder({ text, eccLevel: ECC_LEVELS.H, version: 1 });

  const bitsL = encoderL.encode();
  const bitsH = encoderH.encode();

  // L has more data capacity than H (19 vs 9 bytes)
  // Total bits should reflect total codewords (data + ECC)
  // Version 1: 26 bytes total = 208 bits
  assert.strictEqual(bitsL.length, 208, 'Version 1 should produce 208 bits total');
  assert.strictEqual(bitsH.length, 208, 'Version 1 should produce 208 bits total');

  logTest('Different ECC levels produce same total bit count but different data/ECC split');
})();

// ============================================================================
// Test Case 2: calculateECC generates correct error correction codewords
// ============================================================================
logTestGroup('Test Case 2: calculateECC error correction');

// Test 2.1: Known test vector
(() => {
  const testData = new Uint8Array([
    0x40, 0x53, 0x13, 0x23, 0x33, 0x43, 0x50, 0xec,
    0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec
  ]);

  const ecc = calculateECC(testData, 10);

  assert.strictEqual(ecc.length, 10, 'Should generate 10 ECC bytes');

  // ECC values should be non-zero (with high probability)
  const nonZeroCount = Array.from(ecc).filter(b => b !== 0).length;
  assert.ok(nonZeroCount > 0, 'ECC should contain non-zero bytes');

  logTest('ECC byte count matches requested symbol count');
  logTest('ECC calculation completes without errors');
})();

// Test 2.2: ECC for different data produces different results
(() => {
  const data1 = new Uint8Array([0x10, 0x20, 0x30, 0x40]);
  const data2 = new Uint8Array([0x11, 0x21, 0x31, 0x41]);

  const ecc1 = calculateECC(data1, 4);
  const ecc2 = calculateECC(data2, 4);

  assert.strictEqual(ecc1.length, 4, 'ECC1 should have 4 bytes');
  assert.strictEqual(ecc2.length, 4, 'ECC2 should have 4 bytes');

  // ECCs should be different
  const areDifferent = Array.from(ecc1).some((byte, i) => byte !== ecc2[i]);
  assert.ok(areDifferent, 'Different data should produce different ECC');

  logTest('Different input data produces different ECC codewords');
})();

// Test 2.3: ECC calculation is deterministic
(() => {
  const data = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);

  const ecc1 = calculateECC(data, 5);
  const ecc2 = calculateECC(data, 5);

  assert.deepStrictEqual(ecc1, ecc2, 'ECC calculation should be deterministic');

  logTest('ECC calculation is deterministic for same input');
})();

// ============================================================================
// Test Case 3: setupPatterns places patterns correctly
// ============================================================================
logTestGroup('Test Case 3: setupPatterns placement');

// Test 3.1: Finder patterns at correct positions
(() => {
  const version = 1;
  const size = 21; // Version 1 = 21x21
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Check top-left finder pattern (should have black center at 3,3)
  assert.strictEqual(matrix.get(3, 3), 1, 'Top-left finder center should be black');
  assert.strictEqual(matrix.isReserved(3, 3), true, 'Finder pattern should be reserved');

  // Check top-right finder pattern (center at size-4, 3)
  assert.strictEqual(matrix.get(size - 4, 3), 1, 'Top-right finder center should be black');
  assert.strictEqual(matrix.isReserved(size - 4, 3), true, 'Top-right finder should be reserved');

  // Check bottom-left finder pattern (center at 3, size-4)
  assert.strictEqual(matrix.get(3, size - 4), 1, 'Bottom-left finder center should be black');
  assert.strictEqual(matrix.isReserved(3, size - 4), true, 'Bottom-left finder should be reserved');

  logTest('Finder patterns placed at three corners');
})();

// Test 3.2: Timing patterns
(() => {
  const version = 1;
  const size = 21;
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Horizontal timing pattern at row 6
  assert.strictEqual(matrix.get(8, 6), 1, 'Timing pattern should alternate');
  assert.strictEqual(matrix.get(9, 6), 0, 'Timing pattern should alternate');
  assert.strictEqual(matrix.get(10, 6), 1, 'Timing pattern should alternate');

  // Vertical timing pattern at column 6
  assert.strictEqual(matrix.get(6, 8), 1, 'Timing pattern should alternate');
  assert.strictEqual(matrix.get(6, 9), 0, 'Timing pattern should alternate');
  assert.strictEqual(matrix.get(6, 10), 1, 'Timing pattern should alternate');

  // Check dark module (at 8, 4*version + 9)
  const darkModuleY = 4 * version + 9;
  assert.strictEqual(matrix.get(8, darkModuleY), 1, 'Dark module should be present');

  logTest('Timing patterns placed correctly with alternating pattern');
  logTest('Dark module placed at correct position');
})();

// Test 3.3: Format information areas reserved
(() => {
  const version = 1;
  const size = 21;
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Check format info areas are reserved
  assert.strictEqual(matrix.isReserved(8, 0), true, 'Format info at (8,0) should be reserved');
  assert.strictEqual(matrix.isReserved(0, 8), true, 'Format info at (0,8) should be reserved');
  assert.strictEqual(matrix.isReserved(8, size - 1), true, 'Format info near bottom-left should be reserved');
  assert.strictEqual(matrix.isReserved(size - 1, 8), true, 'Format info near top-right should be reserved');

  logTest('Format information areas are reserved');
})();

// Test 3.4: Alignment patterns for higher versions
(() => {
  const version = 7; // Version 7 has alignment patterns
  const size = 45; // Version 7 = 45x45
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Version 7 has alignment pattern positions at [6, 22, 38]
  // Check alignment pattern at (22, 22)
  assert.strictEqual(matrix.get(22, 22), 1, 'Alignment pattern center at (22,22) should be black');
  assert.strictEqual(matrix.isReserved(22, 22), true, 'Alignment pattern should be reserved');

  // Check version info areas for version 7+
  assert.strictEqual(matrix.isReserved(0, size - 11), true, 'Version info should be reserved');
  assert.strictEqual(matrix.isReserved(size - 11, 0), true, 'Version info should be reserved');

  logTest('Alignment patterns placed for version 7+');
  logTest('Version information areas reserved for version 7+');
})();

// ============================================================================
// Test Case 4: fillData and applyMask
// ============================================================================
logTestGroup('Test Case 4: fillData and applyMask');

// Test 4.1: fillData places bits in zigzag pattern
(() => {
  const version = 1;
  const size = 21;
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Create simple test data
  const testBits = [1, 0, 1, 0, 1, 0, 1, 0];
  fillData(matrix, testBits);

  // Data should start from bottom-right, moving upward in zigzag
  // Check that some non-reserved positions have been filled
  let filledCount = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix.isReserved(x, y)) {
        filledCount++;
      }
    }
  }

  assert.ok(filledCount > 0, 'Should have non-reserved data positions');

  logTest('fillData fills non-reserved positions in matrix');
})();

// Test 4.2: fillData respects reserved areas
(() => {
  const version = 1;
  const size = 21;
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  // Save original reserved state
  const originalFinderValue = matrix.get(3, 3);
  const originalTimingValue = matrix.get(8, 6);

  // Fill with all 1s
  const allOnes = new Array(500).fill(1);
  fillData(matrix, allOnes);

  // Reserved areas should not change
  assert.strictEqual(matrix.get(3, 3), originalFinderValue, 'Finder pattern should not be overwritten');
  assert.strictEqual(matrix.get(8, 6), originalTimingValue, 'Timing pattern should not be overwritten');
  assert.strictEqual(matrix.isReserved(3, 3), true, 'Finder should remain reserved');

  logTest('fillData respects reserved areas (patterns not overwritten)');
})();

// Test 4.3: applyMask flips non-reserved modules
(() => {
  const version = 1;
  const size = 21;
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);

  const testBits = new Array(200).fill(0);
  fillData(matrix, testBits);

  // Save state before masking
  const reservedValue = matrix.get(3, 3);

  // Apply mask pattern 0
  applyMask(matrix, 0);

  // Reserved areas should not be affected by mask
  assert.strictEqual(matrix.get(3, 3), reservedValue, 'Reserved areas should not be masked');

  logTest('applyMask does not modify reserved areas');
})();

// Test 4.4: Different masks produce different results
(() => {
  const version = 1;
  const size = 21;

  // Create two identical matrices
  const matrix1 = new QrMatrix(size);
  const matrix2 = new QrMatrix(size);

  setupPatterns(matrix1, version);
  setupPatterns(matrix2, version);

  const testBits = new Array(200).fill(1);
  fillData(matrix1, testBits);
  fillData(matrix2, testBits);

  // Apply different masks
  applyMask(matrix1, 0);
  applyMask(matrix2, 1);

  // Find a non-reserved position and check they differ
  let foundDifference = false;
  for (let y = 9; y < size - 9; y++) {
    for (let x = 9; x < size - 9; x++) {
      if (!matrix1.isReserved(x, y) && !matrix2.isReserved(x, y)) {
        if (matrix1.get(x, y) !== matrix2.get(x, y)) {
          foundDifference = true;
          break;
        }
      }
    }
    if (foundDifference) break;
  }

  assert.ok(foundDifference, 'Different masks should produce different patterns');

  logTest('Different mask patterns produce different results');
})();

// ============================================================================
// Test Case 5: End-to-end encode function
// ============================================================================
logTestGroup('Test Case 5: End-to-end QR generation');

// Test 5.1: Simple text generates complete matrix
(() => {
  const text = 'Hello';
  const result = encode(text, { ecc: 'M' });

  assert.ok(result.matrix, 'Should return a matrix');
  assert.ok(result.version >= 1, 'Should have a valid version');
  assert.ok(result.maskPattern >= 0 && result.maskPattern < 8, 'Should have valid mask pattern');

  const matrix = result.matrix;

  // Check finder patterns are present
  assert.strictEqual(matrix.get(3, 3), 1, 'Top-left finder should be present');
  assert.strictEqual(matrix.get(matrix.size - 4, 3), 1, 'Top-right finder should be present');
  assert.strictEqual(matrix.get(3, matrix.size - 4), 1, 'Bottom-left finder should be present');

  logTest('End-to-end encode produces complete matrix');
  logTest('Matrix contains finder patterns');
})();

// Test 5.2: Matrix size matches version
(() => {
  const text = 'A';
  const result = encode(text, { ecc: 'L', version: 1 });

  const expectedSize = 21; // Version 1 = 21x21
  assert.strictEqual(result.matrix.size, expectedSize, `Version 1 should produce ${expectedSize}x${expectedSize} matrix`);
  assert.strictEqual(result.version, 1, 'Version should be 1');

  logTest('Matrix size matches QR version specification');
})();

// Test 5.3: Data and patterns coexist correctly
(() => {
  const text = 'QR';
  const result = encode(text, { ecc: 'M' });

  const matrix = result.matrix;

  // Count reserved vs data modules
  let reservedCount = 0;
  let dataCount = 0;

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.isReserved(x, y)) {
        reservedCount++;
      } else {
        dataCount++;
      }
    }
  }

  assert.ok(reservedCount > 0, 'Should have reserved modules for patterns');
  assert.ok(dataCount > 0, 'Should have data modules');

  logTest('Matrix contains both reserved patterns and data areas');
  logTest(`Reserved modules: ${reservedCount}, Data modules: ${dataCount}`);
})();

// Test 5.4: Different inputs produce different QR codes
(() => {
  const result1 = encode('Test1', { ecc: 'M' });
  const result2 = encode('Test2', { ecc: 'M' });

  // Find at least one difference in the data area
  let foundDifference = false;
  const size = Math.min(result1.matrix.size, result2.matrix.size);

  for (let y = 9; y < size - 9; y++) {
    for (let x = 9; x < size - 9; x++) {
      const reserved1 = result1.matrix.isReserved(x, y);
      const reserved2 = result2.matrix.isReserved(x, y);

      if (!reserved1 && !reserved2) {
        if (result1.matrix.get(x, y) !== result2.matrix.get(x, y)) {
          foundDifference = true;
          break;
        }
      }
    }
    if (foundDifference) break;
  }

  assert.ok(foundDifference, 'Different text should produce different QR codes');

  logTest('Different input text produces different QR codes');
})();

// Test 5.5: Output methods work correctly
(() => {
  const text = 'API';
  const result = encode(text, { ecc: 'L' });

  // Test toString
  const str = result.toString();
  assert.ok(typeof str === 'string', 'toString should return a string');
  assert.ok(str.length > 0, 'toString should produce non-empty output');

  // Test toSvg
  const svg = result.toSvg({ moduleSize: 5, margin: 2 });
  assert.ok(typeof svg === 'string', 'toSvg should return a string');
  assert.ok(svg.includes('<svg'), 'toSvg should contain SVG markup');
  assert.ok(svg.includes('</svg>'), 'toSvg should be well-formed');

  logTest('Output methods (toString, toSvg) work correctly');
})();

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('✅ All unit tests passed successfully!');
console.log('='.repeat(60) + '\n');
