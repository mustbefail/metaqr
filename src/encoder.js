const {
  getCharCountSize,
  getDataCapacity,
  MODES,
  getBlockInfo,
} = require('./spec');
const { BitBuffer } = require('./bitBuffer.js');
const { calculateECC } = require('./reedsolomon');

class QrEncoder {
  #text = '';
  #eccLevel = 0;
  #version = 1;
  #utf8Data = new Uint8Array();

  constructor({ text, eccLevel, version }) {
    this.#text = text;
    this.#eccLevel = eccLevel;
    this.#utf8Data = new TextEncoder().encode(this.#text);
    this.#version = version || this.#versionAutoSelect();
  }

  get version() {
    return this.#version;
  }

  encode() {
    const dataBytes = this.#prepareDataBytes();
    const blockInfo = getBlockInfo(this.#version, this.#eccLevel);

    const { dataBlocks, eccBlocks } = this.#splitIntoBlocks(
      dataBytes,
      blockInfo,
    );

    const interleavedData = this.#interleaveBlocks(dataBlocks);
    const interleavedEcc = this.#interleaveBlocks(eccBlocks);

    const bitBuffer = new BitBuffer();

    for (const byte of interleavedData) {
      bitBuffer.append(byte, 8);
    }
    for (const byte of interleavedEcc) {
      bitBuffer.append(byte, 8);
    }

    return bitBuffer.bits;
  }

  #splitIntoBlocks(dataBytes, blockInfo) {
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

  #interleaveBlocks(blocks) {
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
    const charCountBits = getCharCountSize(this.#version, MODES.BYTE);

    bitBuffer.append(MODES.BYTE, 4);
    bitBuffer.append(this.#utf8Data.length, charCountBits);

    for (const char of this.#utf8Data) {
      bitBuffer.append(char, 8);
    }

    // Byte terminator
    const bitsLeft = targetCapacity * 8 - bitBuffer.length();
    const terminatorLength = Math.min(4, bitsLeft);
    if (terminatorLength > 0) {
      bitBuffer.append(0, terminatorLength);
    }

    // Byte alignment padding
    if (bitBuffer.length() % 8 !== 0) {
      bitBuffer.append(0, 8 - (bitBuffer.length() % 8));
    }

    const currentBytes = Math.ceil(bitBuffer.length() / 8);

    // Padding bytes
    let paddingByte = 236;
    for (let i = 0; i < targetCapacity - currentBytes; i++) {
      bitBuffer.append(paddingByte, 8);
      paddingByte = paddingByte === 236 ? 17 : 236;
    }

    return bitBuffer.toUint8Array();
  }

  #versionAutoSelect() {
    const modeBits = 4;
    const versionsCount = 40;
    for (let v = 1; v <= versionsCount; v++) {
      const overheadBits = modeBits + getCharCountSize(v, MODES.BYTE);
      const totalBitsNeeded = overheadBits + this.#utf8Data.length * 8;
      const totalBytesNeeded = Math.ceil(totalBitsNeeded / 8);

      if (totalBytesNeeded <= getDataCapacity(v, this.#eccLevel)) {
        return v;
      }
    }

    throw new Error('Data is too large for any QR Code version');
  }
}

module.exports = { QrEncoder };
