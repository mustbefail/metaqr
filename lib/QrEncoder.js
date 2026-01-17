'use strict';

const { MODES } = require('./spec.js');
const { BitBuffer } = require('./BitBuffer.js');
const { calculateECC } = require('./reedsolomon.js');
const { getBlockInfo, getCharCountSize, getDataCapacity } = require('./utils');

const ALPHANUMERICCHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * Encodes text data into a sequence of bits for QR Code.
 */
class QrEncoder {
  #text = '';
  #eccLevel = 'M';
  #version = 1;
  #utf8Data = new Uint8Array();
  #mode = null;

  /**
   * @param {Object} config
   * @param {string} config.text - Text to encode.
   * @param {number} config.eccLevel - Error correction level identifier.
   * @param {number} [config.version] - Explicit version or auto-detected.
   * @param {number} [config.mode] - Explicit mode or auto-detected.
   */
  constructor({ text, eccLevel, version, mode }) {
    this.#text = text;
    this.#eccLevel = eccLevel;
    this.#utf8Data = new TextEncoder().encode(this.#text);
    this.#mode = mode || null;
    this.#version = version || this.#versionAutoSelect();
  }

  get version() {
    return this.#version;
  }

  get mode() {
    return this.#mode || this.#getMode();
  }

  /**
   * Performs encoding.
   * @returns {Array<number>} An array of bits.
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

    return bitBuffer.bits;
  }

  #getMode() {
    if (this.#mode !== null) return this.#mode;

    const text = this.#text;
    const numericRe = /^[0-9]+$/;
    const alnumRe = new RegExp(
      `^[${ALPHANUMERICCHARSET.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]+$`,
    );

    if (numericRe.test(text)) return MODES.NUMERIC;
    if (alnumRe.test(text)) return MODES.ALPHANUMERIC;
    return MODES.BYTE;
  }

  static #splitIntoBlocks(dataBytes, blockInfo) {
    const dataBlocks = [];
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

  static #interleaveBlocks(blocks) {
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

  #prepareDataBytes() {
    const bitBuffer = new BitBuffer();
    const targetCapacity = getDataCapacity(this.#version, this.#eccLevel);

    const mode = this.#getMode();
    const charCountBits = getCharCountSize(this.#version, mode);
    this.#validateTextForMode(mode);

    // Mode indicator
    bitBuffer.append(mode, 4);
    // Character count
    bitBuffer.append(this.#text.length, charCountBits);

    // Data bits
    if (mode === MODES.NUMERIC) {
      this.#encodeNumeric(bitBuffer);
    } else if (mode === MODES.ALPHANUMERIC) {
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

    return bitBuffer.toUint8Array();
  }

  static #getAlphanumericValue(char) {
    const idx = ALPHANUMERICCHARSET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Character "${char}" is not valid in ALPHANUMERIC mode`);
    }
    return idx;
  }

  #getDataBitsLengthForVersion(mode) {
    const length = this.#text.length;

    if (mode === MODES.NUMERIC) {
      const groupsOf3 = Math.floor(length / 3);
      const remaining = length % 3;
      let bits = groupsOf3 * 10;
      if (remaining === 1) bits += 4;
      else if (remaining === 2) bits += 7;
      return bits;
    }

    if (mode === MODES.ALPHANUMERIC) {
      const pairs = Math.floor(length / 2);
      const remaining = length % 2;
      let bits = pairs * 11;
      if (remaining === 1) bits += 6;
      return bits;
    }

    if (mode === MODES.BYTE) {
      return this.#utf8Data.length * 8;
    }

    throw new Error(`Unsupported mode: ${mode}`);
  }

  #validateTextForMode(mode) {
    const text = this.#text;

    if (mode === MODES.NUMERIC) {
      if (!/^[0-9]+$/.test(text)) {
        throw new Error('Numeric mode supports only digits 0-9');
      }
    } else if (mode === MODES.ALPHANUMERIC) {
      const re = new RegExp(
        `^[${ALPHANUMERICCHARSET.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}]+$`,
      );
      if (!re.test(text)) {
        throw new Error(
          'Alphanumeric mode supports only: 0-9, A-Z, space, $%*+-./:',
        );
      }
    }
  }

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

  #encodeByte(bitBuffer) {
    for (const char of this.#utf8Data) {
      bitBuffer.append(char, 8);
    }
  }

  #versionAutoSelect() {
    const versionsCount = 40;
    const mode = this.#getMode();
    const modeBits = 4;

    for (let v = 1; v <= versionsCount; v++) {
      const charCountBits = getCharCountSize(v, mode);
      let totalBitsNeeded = modeBits + charCountBits;

      if (mode === MODES.BYTE) {
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
