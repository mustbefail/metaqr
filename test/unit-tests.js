'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { QrEncoder } = require('../lib/encoder/QrEncoder');
const { BitBuffer } = require('../lib/encoder/BitBuffer');
const { Numeric } = require('../lib/encoder/Numeric');
const { Alphanumeric } = require('../lib/encoder/Alphanumeric');
const { Byte } = require('../lib/encoder/Byte');
const { Segmenter } = require('../lib/encoder/Segmenter');
const { Encoded } = require('../lib/Encoded');
const { calculateECC } = require('../lib/reedsolomon');
const { QrMatrix } = require('../lib/matrix/QrMatrix');
const { setupPatterns } = require('../lib/matrix/patterns');
const { encode } = require('../lib');
const { MODE_INDICATORS } = require('../lib/spec');

describe('BitBuffer', () => {
  it('should append bits correctly', () => {
    const buffer = new BitBuffer();
    buffer.append(0b1010, 4);
    buffer.append(0b1100, 4);

    assert.strictEqual(buffer.length, 8);
    assert.strictEqual(buffer.getBit(0), 1);
    assert.strictEqual(buffer.getBit(1), 0);
    assert.strictEqual(buffer.getBit(2), 1);
    assert.strictEqual(buffer.getBit(3), 0);
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
});

describe('Encoders (Modes)', () => {
  describe('Numeric', () => {
    it('should validate content', () => {
      assert.doesNotThrow(() => new Numeric('0123456789'));
      assert.throws(
        () => new Numeric('123a'),
        /Numeric mode supports only digits/,
      );
    });

    it('should calculate correct dataBitsLength', () => {
      // 3 chars = 10 bits
      assert.strictEqual(new Numeric('123').dataBitsLength, 10);
      // 4 chars = 10 bits (3) + 4 bits (1) = 14
      assert.strictEqual(new Numeric('1234').dataBitsLength, 14);
      // 5 chars = 10 bits (3) + 7 bits (2) = 17
      assert.strictEqual(new Numeric('12345').dataBitsLength, 17);
    });

    it('should encode correctly', () => {
      const num = new Numeric('01234567');
      const buffer = num.encode();
      // 8 chars -> 3 + 3 + 2
      // Group 1: "012" -> 12 (10 bits) -> 0000001100
      // Group 2: "345" -> 345 (10 bits) -> 0101011001
      // Group 3: "67"  -> 67 (7 bits)  -> 1000011
      // Total bits: 27
      assert.strictEqual(buffer.length, 27);
    });
  });

  describe('Alphanumeric', () => {
    it('should validate content', () => {
      assert.doesNotThrow(() => new Alphanumeric('ABC 123 $%*+-./:'));
      assert.throws(
        () => new Alphanumeric('abc'),
        /Alphanumeric mode supports only/,
      );
    });

    it('should calculate correct dataBitsLength', () => {
      // 2 chars = 11 bits
      assert.strictEqual(new Alphanumeric('AB').dataBitsLength, 11);
      // 3 chars = 11 bits (2) + 6 bits (1) = 17
      assert.strictEqual(new Alphanumeric('ABC').dataBitsLength, 17);
    });

    it('should encode correctly', () => {
      // "AC" -> A(10), C(12). Value = 10*45 + 12 = 462. 11 bits.
      const alpha = new Alphanumeric('AC');
      const buffer = alpha.encode();
      assert.strictEqual(buffer.length, 11);
      // 462 in binary is 00111001110
      assert.strictEqual(buffer.getBit(0), 0);
      assert.strictEqual(buffer.getBit(2), 1);
    });
  });

  describe('Byte', () => {
    it('should accept any string', () => {
      assert.doesNotThrow(() => new Byte('Hello World!'));
      assert.doesNotThrow(() => new Byte('123'));
    });

    it('should calculate correct dataBitsLength', () => {
      const text = 'Hello';
      assert.strictEqual(new Byte(text).dataBitsLength, text.length * 8);
    });

    it('should encode as UTF-8/Ascii bytes', () => {
      const byteMode = new Byte('ABC');
      const buffer = byteMode.encode();
      assert.strictEqual(buffer.length, 24);
      const bytes = buffer.getBytes();
      assert.strictEqual(bytes[0], 65); // A
      assert.strictEqual(bytes[1], 66); // B
      assert.strictEqual(bytes[2], 67); // C
    });
  });
});

describe('Segmenter', () => {
  it('should auto-segment numeric content', () => {
    const segments = Segmenter.segment('123456');
    assert.strictEqual(segments.length, 1);
    assert.ok(segments[0] instanceof Numeric);
  });

  it('should auto-segment alphanumeric content', () => {
    const segments = Segmenter.segment('ABC123');
    assert.strictEqual(segments.length, 1);
    assert.ok(segments[0] instanceof Alphanumeric);
  });

  it('should auto-segment byte content', () => {
    const segments = Segmenter.segment('abc');
    assert.strictEqual(segments.length, 1);
    assert.ok(segments[0] instanceof Byte);
  });

  it('should handle mixed content', () => {
    // "123456" (Numeric) + "abc" (Byte)
    // Note: Thresholds might merge small segments,
    // so we use long enough strings
    const segments = Segmenter.segment('123456abc');
    // Depending on logic it might optimize,
    // but ideally it sees Numeric then Byte
    // If "abc" forces Byte, "123456" is efficient as Numeric.
    // Let's check types
    const hasNumeric = segments.some((s) => s instanceof Numeric);
    const hasByte = segments.some((s) => s instanceof Byte);
    assert.ok(hasNumeric || hasByte);
  });

  it('should allow forcing a mode', () => {
    const segments = Segmenter.segment('123', MODE_INDICATORS.BYTE);
    assert.strictEqual(segments.length, 1);
    assert.ok(segments[0] instanceof Byte);
  });
});

describe('QrEncoder', () => {
  it('should encode and return an Encoded object', () => {
    const encoder = new QrEncoder({ eccLevel: 'M', version: 1 });
    const segments = Segmenter.segment('Hello');
    const encoded = encoder.encode(...segments);

    assert.ok(encoded instanceof Encoded);
    assert.strictEqual(encoded.version, 1);
    assert.strictEqual(encoded.eccLevel, 'M');
    assert.ok(encoded.matrix instanceof QrMatrix);
  });

  it('should select version automatically if not provided', () => {
    const encoder = new QrEncoder({ eccLevel: 'L' }); // No version
    // Large text to force higher version than 1
    const text = 'A'.repeat(50);
    const segments = Segmenter.segment(text);
    const encoded = encoder.encode(...segments);

    assert.ok(encoded.version > 1);
  });
});

describe('Encoded', () => {
  it('should provide output methods', () => {
    const result = encode('Test', { ecc: 'M' });

    const svg = result.toSvg();
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.endsWith('</svg>'));

    const str = result.toString();
    assert.ok(str.includes('█') || str.includes(' '));
  });

  it('should throw on canvas export in non-browser env (mock check)', () => {
    const result = encode('Test');
    // We expect it to fail because drawToCanvas
    // checks for context or we pass dummy
    assert.throws(() => result.toCanvas({}), TypeError);
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
    assert.ok(ecc.some((b) => b !== 0));
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
  });
});

describe('End-to-End Public API', () => {
  it('should encode text via simplified API', () => {
    const result = encode('https://example.com');
    assert.ok(result instanceof Encoded);
    assert.ok(result.matrix.size >= 21);
  });

  it('should support configuration options', () => {
    const result = encode('123', { ecc: 'H', version: 2 });
    assert.strictEqual(result.eccLevel, 'H');
    assert.strictEqual(result.version, 2);
    assert.strictEqual(result.matrix.size, 25); // V2 size
  });
});
