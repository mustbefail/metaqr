'use strict';

const { BitBuffer } = require('./BitBuffer.js');
const { calculateECC } = require('../reedsolomon.js');
const { getBlockInfo, getCharCountSize, getDataCapacity } = require('../utils');
const { calculateNeededBits } = require('./utils');
const { Encoded } = require('../Encoded');

class QrEncoder {
  #eccLevel;
  #version;
  #maskPattern;

  constructor({ eccLevel, version, maskPattern = 'auto' }) {
    this.#eccLevel = eccLevel;
    this.#version = version;
    this.#maskPattern = maskPattern;
  }

  get version() {
    return this.#version;
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

  encode(...segments) {
    if (segments.length === 0) {
      throw new TypeError('At least one segment is required');
    }

    const version = this.#version ?? this.#versionSelect(segments);
    const mode = segments.length === 1 ? segments[0].mode : null;

    const dataBytes = this.#prepareDataBytes(segments, version);
    const blockInfo = getBlockInfo(version, this.#eccLevel);

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

    return new Encoded({
      bits: [...bitBuffer],
      version,
      eccLevel: this.#eccLevel,
      maskPattern: this.#maskPattern,
      mode,
    });
  }

  #prepareDataBytes(segments, version) {
    const bitBuffer = new BitBuffer();
    const targetCapacity = getDataCapacity(version, this.#eccLevel);

    for (const segment of segments) {
      const mode = segment.mode;
      const charCountBits = getCharCountSize(version, mode);
      const charCount = segment.charCount;

      bitBuffer.append(mode, 4);
      bitBuffer.append(charCount, charCountBits);

      bitBuffer.concat(segment.encode());
    }

    // Terminator
    const bitsLeft = targetCapacity * 8 - bitBuffer.length;
    const terminatorLength = Math.min(4, bitsLeft);
    if (terminatorLength > 0) {
      bitBuffer.append(0, terminatorLength);
    }

    // Byte alignment
    if (bitBuffer.length % 8 !== 0) {
      bitBuffer.append(0, 8 - (bitBuffer.length % 8));
    }

    // Padding bytes 236/17
    const currentBytes = Math.ceil(bitBuffer.length / 8);
    let paddingByte = 236;
    for (let i = 0; i < targetCapacity - currentBytes; i++) {
      bitBuffer.append(paddingByte, 8);
      paddingByte = paddingByte === 236 ? 17 : 236;
    }

    return bitBuffer.getBytes();
  }

  #versionSelect(segments) {
    const versionsCount = 40;
    const eccLevel = this.#eccLevel;

    for (let v = 1; v <= versionsCount; v++) {
      const totalBitsNeeded = calculateNeededBits(segments, v);

      const totalBytesNeeded = Math.ceil(totalBitsNeeded / 8);
      if (totalBytesNeeded <= getDataCapacity(v, eccLevel)) {
        return v;
      }
    }

    throw new TypeError('Data is too large for any QR Code version');
  }
}

module.exports = { QrEncoder };
