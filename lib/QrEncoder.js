'use strict';

const { MODE_INDICATORS } = require('./spec.js');
const { BitBuffer } = require('./BitBuffer.js');
const { calculateECC } = require('./reedsolomon.js');
const { getBlockInfo, getCharCountSize, getDataCapacity } = require('./utils');

const ALPHANUMERICCHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * Encodes text data into a sequence of bits for QR Code.
 */
class QrEncoder {
  #text;
  #eccLevel;
  #version;
  #utf8Data;
  #mode;

  /**
   * Creates a new QrEncoder instance.
   * @param {QrEncoderConfig} config - Encoder configuration.
   */
  constructor({ text, eccLevel, version, mode }) {
    this.#text = text;
    this.#eccLevel = eccLevel;
    this.#utf8Data = new TextEncoder().encode(this.#text);
    this.#mode = mode ?? null;
    this.#version = version ?? this.#versionAutoSelect();
  }

  /**
   * QR Code version (1-40).
   * @returns {number}
   */
  get version() {
    return this.#version;
  }

  /**
   * Encoding mode indicator.
   * @returns {ModeIndicator}
   */
  get mode() {
    return this.#mode ?? this.#getMode();
  }

  /**
   * Encodes the text into a BitBuffer containing data and ECC codewords.
   * @returns {BitBuffer}
   */
  encode() {
    const dataBytes = this.#prepareDataBytes();
    const blockInfo = getBlockInfo(this.#version, this.#eccLevel);

    const { dataBlocks, eccBlocks } = QrEncoder.#splitIntoBlocks(
      dataBytes,
      blockInfo,
    );

    const interleavedData = QrEncoder.#interleaveBlocks(dataBlocks);
    const interleavedEcc = QrEncoder.#interleaveBlocks(eccBlocks);

    const bitBuffer = new BitBuffer();

    for (const byte of interleavedData) {
      bitBuffer.append(byte, 8);
    }
    for (const byte of interleavedEcc) {
      bitBuffer.append(byte, 8);
    }

    return bitBuffer;
  }

  /**
   * Determines encoding mode based on text content.
   * @returns {ModeIndicator}
   */
  #getMode() {
    if (this.#mode !== null) return this.#mode;

    const text = this.#text;
    const numericRe = /^[0-9]+$/;
    const alnumRe = new RegExp(
      `^[${ALPHANUMERICCHARSET.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]+$`,
    );

    if (numericRe.test(text)) return MODE_INDICATORS.NUMERIC;
    if (alnumRe.test(text)) return MODE_INDICATORS.ALPHANUMERIC;
    return MODE_INDICATORS.BYTE;
  }

  /**
   * Splits data bytes into RS blocks and calculates ECC for each.
   * @param {Uint8Array} dataBytes
   * @param {BlockInfo[]} blockInfo
   * @returns {{ dataBlocks: Uint8Array[], eccBlocks: Uint8Array[] }}
   */
  static #splitIntoBlocks(dataBytes, blockInfo) {
    /** @type {Uint8Array[]} */
    const dataBlocks = [];
    /** @type {Uint8Array[]} */
    const eccBlocks = [];
    let dataIndex = 0;

    for (const group of blockInfo) {
      for (let i = 0; i < group.count; i++) {
        const blockData = dataBytes.slice(
          dataIndex,
          dataIndex + group.dataWords,
        );
        dataIndex += group.dataWords;

        const eccBytes = calculateECC(blockData, group.eccWords);

        dataBlocks.push(blockData);
        eccBlocks.push(eccBytes);
      }
    }

    return { dataBlocks, eccBlocks };
  }

  /**
   * Interleaves blocks for better error resistance.
   * @param {Uint8Array[]} blocks
   * @returns {number[]}
   */
  static #interleaveBlocks(blocks) {
    /** @type {number[]} */
    const result = [];
    const maxLength = Math.max(...blocks.map((b) => b.length));

    for (let i = 0; i < maxLength; i++) {
      for (const block of blocks) {
        if (i < block.length) {
          result.push(block[i]);
        }
      }
    }

    return result;
  }

  /**
   * Prepares data bytes with mode indicator, character count, and padding.
   * @returns {Uint8Array}
   */
  #prepareDataBytes() {
    const bitBuffer = new BitBuffer();
    const targetCapacity = getDataCapacity(this.#version, this.#eccLevel);

    const mode = this.#getMode();
    const charCountBits = getCharCountSize(this.#version, mode);
    const charCount =
      mode === MODE_INDICATORS.BYTE ? this.#utf8Data.length : this.#text.length;
    this.#validateTextForMode(mode);

    // Mode indicator
    bitBuffer.append(mode, 4);
    // Character count
    bitBuffer.append(charCount, charCountBits);

    // Data bits
    if (mode === MODE_INDICATORS.NUMERIC) {
      this.#encodeNumeric(bitBuffer);
    } else if (mode === MODE_INDICATORS.ALPHANUMERIC) {
      this.#encodeAlphanumeric(bitBuffer);
    } else {
      this.#encodeByte(bitBuffer);
    }

    // Terminator
    const bitsLeft = targetCapacity * 8 - bitBuffer.length();
    const terminatorLength = Math.min(4, bitsLeft);
    if (terminatorLength > 0) {
      bitBuffer.append(0, terminatorLength);
    }

    // Byte alignment
    if (bitBuffer.length() % 8 !== 0) {
      bitBuffer.append(0, 8 - (bitBuffer.length() % 8));
    }

    // Padding bytes 236/17
    const currentBytes = Math.ceil(bitBuffer.length() / 8);
    let paddingByte = 236;
    for (let i = 0; i < targetCapacity - currentBytes; i++) {
      bitBuffer.append(paddingByte, 8);
      paddingByte = paddingByte === 236 ? 17 : 236;
    }

    return bitBuffer.getBytes();
  }

  /**
   * Gets alphanumeric character value (0-44).
   * @param {string} char
   * @returns {number}
   */
  static #getAlphanumericValue(char) {
    const idx = ALPHANUMERICCHARSET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Character "${char}" is not valid in ALPHANUMERIC mode`);
    }
    return idx;
  }

  /**
   * Calculates data bits length for current text in given mode.
   * @param {ModeIndicator} mode
   * @returns {number}
   */
  #getDataBitsLengthForVersion(mode) {
    const length = this.#text.length;

    if (mode === MODE_INDICATORS.NUMERIC) {
      const groupsOf3 = Math.floor(length / 3);
      const remaining = length % 3;
      let bits = groupsOf3 * 10;
      if (remaining === 1) bits += 4;
      else if (remaining === 2) bits += 7;
      return bits;
    }

    if (mode === MODE_INDICATORS.ALPHANUMERIC) {
      const pairs = Math.floor(length / 2);
      const remaining = length % 2;
      let bits = pairs * 11;
      if (remaining === 1) bits += 6;
      return bits;
    }

    if (mode === MODE_INDICATORS.BYTE) {
      return this.#utf8Data.length * 8;
    }

    throw new Error(`Unsupported mode: ${mode}`);
  }

  /**
   * Validates that text is compatible with the given mode.
   * @param {ModeIndicator} mode
   */
  #validateTextForMode(mode) {
    const text = this.#text;
    const re = new RegExp(
      `^[${ALPHANUMERICCHARSET.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}]+$`,
    );

    if (mode === MODE_INDICATORS.NUMERIC) {
      if (!/^[0-9]+$/.test(text)) {
        throw new Error('Numeric mode supports only digits 0-9');
      }
    } else if (mode === MODE_INDICATORS.ALPHANUMERIC) {
      if (!re.test(text)) {
        throw new Error(
          'Alphanumeric mode supports only: 0-9, A-Z, space, $%*+-./:',
        );
      }
    }
  }

  /**
   * Encodes text in numeric mode.
   * @param {BitBuffer} bitBuffer
   */
  #encodeNumeric(bitBuffer) {
    const text = this.#text;
    let i = 0;

    while (i < text.length) {
      const remaining = text.length - i;

      if (remaining >= 3) {
        const group = text.slice(i, i + 3);
        bitBuffer.append(parseInt(group, 10), 10);
        i += 3;
      } else if (remaining === 2) {
        const group = text.slice(i, i + 2);
        bitBuffer.append(parseInt(group, 10), 7);
        i += 2;
      } else {
        const group = text.slice(i, i + 1);
        bitBuffer.append(parseInt(group, 10), 4);
        i += 1;
      }
    }
  }

  /**
   * Encodes text in alphanumeric mode.
   * @param {BitBuffer} bitBuffer
   */
  #encodeAlphanumeric(bitBuffer) {
    const text = this.#text;
    let i = 0;

    while (i < text.length) {
      const remaining = text.length - i;

      if (remaining >= 2) {
        const v1 = QrEncoder.#getAlphanumericValue(text[i]);
        const v2 = QrEncoder.#getAlphanumericValue(text[i + 1]);
        const value = v1 * 45 + v2;
        bitBuffer.append(value, 11);
        i += 2;
      } else {
        const v = QrEncoder.#getAlphanumericValue(text[i]);
        bitBuffer.append(v, 6);
        i += 1;
      }
    }
  }

  /**
   * Encodes text in byte mode (UTF-8).
   * @param {BitBuffer} bitBuffer
   */
  #encodeByte(bitBuffer) {
    for (const byte of this.#utf8Data) {
      bitBuffer.append(byte, 8);
    }
  }

  /**
   * Auto-selects the smallest version that can hold the data.
   * @returns {number}
   */
  #versionAutoSelect() {
    const versionsCount = 40;
    const mode = this.#getMode();
    const modeBits = 4;

    for (let v = 1; v <= versionsCount; v++) {
      const charCountBits = getCharCountSize(v, mode);
      let totalBitsNeeded = modeBits + charCountBits;

      if (mode === MODE_INDICATORS.BYTE) {
        totalBitsNeeded += this.#utf8Data.length * 8;
      } else {
        totalBitsNeeded += this.#getDataBitsLengthForVersion(mode);
      }

      const totalBytesNeeded = Math.ceil(totalBitsNeeded / 8);
      if (totalBytesNeeded <= getDataCapacity(v, this.#eccLevel)) {
        return v;
      }
    }

    throw new TypeError('Data is too large for any QR Code version');
  }
}

module.exports = { QrEncoder };
