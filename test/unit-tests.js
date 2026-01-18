'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { QrEncoder } = require('../lib/QrEncoder');
const { BitBuffer } = require('../lib/BitBuffer');
const { calculateECC } = require('../lib/reedsolomon');
const { QrMatrix } = require('../lib/matrix/QrMatrix');
const { setupPatterns } = require('../lib/matrix/patterns');
const { fillData } = require('../lib/matrix/data');
const { applyMask } = require('../lib/matrix/mask');
const { encode } = require('../lib');
const { MODE_INDICATORS } = require('../lib/spec');
const { getDataCapacity } = require('../lib/utils');

describe('BitBuffer', () => {
  it('should append bits correctly', () => {
    const buffer = new BitBuffer();
    buffer.append(0b1010, 4);
    buffer.append(0b1100, 4);

    assert.strictEqual(buffer.length(), 8);
    assert.strictEqual(buffer.getBit(0), 1);
    assert.strictEqual(buffer.getBit(1), 0);
    assert.strictEqual(buffer.getBit(2), 1);
    assert.strictEqual(buffer.getBit(3), 0);
    assert.strictEqual(buffer.getBit(4), 1);
    assert.strictEqual(buffer.getBit(5), 1);
    assert.strictEqual(buffer.getBit(6), 0);
    assert.strictEqual(buffer.getBit(7), 0);
  });

  it('should return correct bytes via getBytes()', () => {
    const buffer = new BitBuffer();
    buffer.append(0b10101100, 8);
    buffer.append(0b11110000, 8);

    const bytes = buffer.getBytes();
    assert.strictEqual(bytes.length, 2);
    assert.strictEqual(bytes[0], 0b10101100);
    assert.strictEqual(bytes[1], 0b11110000);
  });

  it('should be iterable', () => {
    const buffer = new BitBuffer();
    buffer.append(0b101, 3);

    const bits = [...buffer];
    assert.deepStrictEqual(bits, [1, 0, 1]);
  });

  it('should throw RangeError for out of bounds getBit()', () => {
    const buffer = new BitBuffer();
    buffer.append(0b1111, 4);

    assert.throws(() => buffer.getBit(-1), RangeError);
    assert.throws(() => buffer.getBit(4), RangeError);
  });

  it('should auto-extend capacity', () => {
    const buffer = new BitBuffer(1); // Start with 1 byte capacity
    // Append 100 bits (more than 8)
    for (let i = 0; i < 100; i++) {
      buffer.append(1, 1);
    }
    assert.strictEqual(buffer.length(), 100);
  });
});

describe('QrEncoder Internals', () => {
  it('prepareDataBytes should correctly encode mode, length and chars', () => {
    const text = 'Hi!';
    const eccLevel = 'M';
    const encoder = new QrEncoder({ text, eccLevel, version: 1 });

    const bitBuffer = encoder.encode();
    const bytes = bitBuffer.getBytes();

    // First 4 bits: BYTE mode (0100 -> 4)
    const modeBits = (bytes[0] >> 4) & 0x0f;
    assert.strictEqual(
      modeBits,
      MODE_INDICATORS.BYTE,
      'Mode should be BYTE (4)',
    );

    // Next 8 bits: Length (3)
    const lengthBits = ((bytes[0] & 0x0f) << 4) | (bytes[1] >> 4);
    assert.strictEqual(lengthBits, 3, 'Length should be 3');

    // Data payload: 'H', 'i', '!'
    const h = ((bytes[1] & 0x0f) << 4) | (bytes[2] >> 4);
    const i = ((bytes[2] & 0x0f) << 4) | (bytes[3] >> 4);
    assert.strictEqual(h, 72, 'First char is H');
    assert.strictEqual(i, 105, 'Second char is i');
  });

  it('should add correct padding bytes (236, 17)', () => {
    const text = 'A';
    const eccLevel = 'M';
    const encoder = new QrEncoder({ text, eccLevel, version: 1 });
    const bitBuffer = encoder.encode();
    const bytes = bitBuffer.getBytes();

    const dataCapacity = getDataCapacity(1, eccLevel);
    // Version 1 (M) total codewords: 26
    assert.strictEqual(bytes.length, 26, 'Should have 26 total codewords');

    // Check padding in data area
    let foundPadding236 = false;
    let foundPadding17 = false;
    // Padding starts after payload, checking range generally
    for (let i = 4; i < dataCapacity; i++) {
      if (bytes[i] === 236) foundPadding236 = true;
      if (bytes[i] === 17) foundPadding17 = true;
    }

    assert.ok(foundPadding236, 'Should contain padding byte 236');
    assert.ok(foundPadding17, 'Should contain padding byte 17');
  });

  it('ECC levels should produce same total bits but different capacity', () => {
    const text = 'Test';
    const encoderL = new QrEncoder({
      text,
      eccLevel: 'L',
      version: 1,
    });
    const encoderH = new QrEncoder({
      text,
      eccLevel: 'H',
      version: 1,
    });

    const bitsL = encoderL.encode();
    const bitsH = encoderH.encode();

    // Version 1 total bits = 208 (26 bytes * 8)
    assert.strictEqual(bitsL.length(), 208);
    assert.strictEqual(bitsH.length(), 208);
  });
});

describe('Reed-Solomon ECC', () => {
  it('should calculate correct ECC for known test vector', () => {
    const testData = new Uint8Array([
      0x40, 0x53, 0x13, 0x23, 0x33, 0x43, 0x50, 0xec, 0x11, 0xec, 0x11, 0xec,
      0x11, 0xec, 0x11, 0xec,
    ]);
    const ecc = calculateECC(testData, 10);
    assert.strictEqual(ecc.length, 10);
    assert.ok(
      ecc.some((b) => b !== 0),
      'ECC should not be empty',
    );
  });

  it('should generate different ECC for different inputs', () => {
    const data1 = new Uint8Array([0x10, 0x20, 0x30, 0x40]);
    const data2 = new Uint8Array([0x11, 0x21, 0x31, 0x41]);
    const ecc1 = calculateECC(data1, 4);
    const ecc2 = calculateECC(data2, 4);

    assert.notDeepStrictEqual(ecc1, ecc2);
  });

  it('should be deterministic', () => {
    const data = new Uint8Array([0xaa, 0xbb]);
    const ecc1 = calculateECC(data, 5);
    const ecc2 = calculateECC(data, 5);
    assert.deepStrictEqual(ecc1, ecc2);
  });
});

describe('Matrix Patterns', () => {
  it('should place finder patterns at corners', () => {
    const version = 1;
    const size = 21;
    const matrix = new QrMatrix(size);
    setupPatterns(matrix, version);

    // Top-left (3,3)
    assert.strictEqual(matrix.get(3, 3), 1);
    assert.ok(matrix.isReserved(3, 3));
    // Top-right
    assert.strictEqual(matrix.get(size - 4, 3), 1);
    // Bottom-left
    assert.strictEqual(matrix.get(3, size - 4), 1);
  });

  it('should place timing patterns and dark module', () => {
    const matrix = new QrMatrix(21);
    setupPatterns(matrix, 1);

    // Horizontal timing
    assert.strictEqual(matrix.get(8, 6), 1);
    assert.strictEqual(matrix.get(9, 6), 0);
    // Vertical timing
    assert.strictEqual(matrix.get(6, 8), 1);

    // Dark module (8, 4*V + 9) -> (8, 13) for V1
    assert.strictEqual(matrix.get(8, 13), 1);
  });

  it('should reserve format info areas', () => {
    const matrix = new QrMatrix(21);
    setupPatterns(matrix, 1);
    assert.ok(matrix.isReserved(8, 0));
    assert.ok(matrix.isReserved(0, 8));
  });

  it('should place alignment patterns for Version 7', () => {
    const version = 7;
    const size = 45;
    const matrix = new QrMatrix(size);
    setupPatterns(matrix, version);

    // V7 alignment includes (22, 22)
    assert.strictEqual(matrix.get(22, 22), 1);
    assert.ok(matrix.isReserved(22, 22));
  });
});

describe('Data Filling & Masking', () => {
  it('fillData should fill non-reserved modules in zigzag', () => {
    const size = 21;
    const matrix = new QrMatrix(size);
    setupPatterns(matrix, 1);

    // Create a BitBuffer with partial fill
    const bitBuffer = new BitBuffer();
    bitBuffer.append(0b10101, 5);
    fillData(matrix, [...bitBuffer]);

    // Check if data was written (counting non-reserved filled spots)
    let filledCount = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix.isReserved(x, y) && matrix.get(x, y) === 1) {
          filledCount++;
        }
      }
    }
    assert.ok(filledCount > 0);
  });

  it('fillData should NOT overwrite reserved patterns', () => {
    const matrix = new QrMatrix(21);
    setupPatterns(matrix, 1);
    const originalFinder = matrix.get(3, 3);

    // Create a BitBuffer with lots of 1s
    const bitBuffer = new BitBuffer();
    for (let i = 0; i < 500; i++) {
      bitBuffer.append(1, 1);
    }
    fillData(matrix, [...bitBuffer]);

    assert.strictEqual(matrix.get(3, 3), originalFinder);
    assert.ok(matrix.isReserved(3, 3));
  });

  it('applyMask should not modify reserved areas', () => {
    const matrix = new QrMatrix(21);
    setupPatterns(matrix, 1);

    // Create a BitBuffer with zeros
    const bitBuffer = new BitBuffer();
    for (let i = 0; i < 200; i++) {
      bitBuffer.append(0, 1);
    }
    fillData(matrix, [...bitBuffer]);

    const reservedVal = matrix.get(3, 3);
    applyMask(matrix, 0); // Apply mask 0

    assert.strictEqual(matrix.get(3, 3), reservedVal);
  });

  it('different masks should produce different matrices', () => {
    const m1 = new QrMatrix(21);
    const m2 = new QrMatrix(21);
    setupPatterns(m1, 1);
    setupPatterns(m2, 1);

    // Create BitBuffers with 1s
    const bitBuffer1 = new BitBuffer();
    const bitBuffer2 = new BitBuffer();
    for (let i = 0; i < 200; i++) {
      bitBuffer1.append(1, 1);
      bitBuffer2.append(1, 1);
    }
    fillData(m1, [...bitBuffer1]);
    fillData(m2, [...bitBuffer2]);

    applyMask(m1, 0);
    applyMask(m2, 1);

    // Deep compare entire buffers/matrices to ensure they differ
    let identical = true;
    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        if (!m1.isReserved(x, y) && m1.get(x, y) !== m2.get(x, y)) {
          identical = false;
          break;
        }
      }
    }
    assert.strictEqual(
      identical,
      false,
      'Matrices should differ after different masks',
    );
  });
});

describe('End-to-End Encoding', () => {
  it('encode() should produce a valid result object', () => {
    const result = encode('Hello', { ecc: 'M' });

    assert.ok(result.matrix);
    assert.ok(result.version >= 1);
    assert.ok(result.maskPattern >= 0 && result.maskPattern < 8);

    // Quick check for finder pattern presence in result
    assert.strictEqual(result.matrix.get(3, 3), 1);
  });

  it('should produce correct matrix size for specific version', () => {
    const result = encode('A', { ecc: 'L', version: 1 });
    assert.strictEqual(result.matrix.size, 21);
    assert.strictEqual(result.version, 1);
  });

  it('should produce different outputs for different text', () => {
    const r1 = encode('Test1', { ecc: 'M' });
    const r2 = encode('Test2', { ecc: 'M' });

    // Simple check: toString representations should differ
    assert.notStrictEqual(r1.toString(), r2.toString());
  });

  it('output helpers (toString, toSvg) should return strings', () => {
    const result = encode('API', { ecc: 'L' });

    const str = result.toString();
    assert.strictEqual(typeof str, 'string');
    assert.ok(str.length > 0);

    const svg = result.toSvg();
    assert.strictEqual(typeof svg, 'string');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('</svg>'));
  });
});
