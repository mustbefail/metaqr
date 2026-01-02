'use strict';

class BitBuffer {
  constructor() {
    this.bits = [];
  }

  append(value, length) {
    if (value === undefined) {
      throw new Error('Value is required');
    }
    if (length === undefined) {
      throw new Error('Length is required');
    }

    for (let i = length - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.bits.push(bit);
    }
  }

  length() {
    return this.bits.length;
  }

  toUint8Array() {
    const bufferLength = this.length();
    const bytesCount = Math.ceil(bufferLength / 8);
    const bytes = new Uint8Array(bytesCount);
    for (let i = 0; i < bufferLength; i++) {
      if (this.bits[i] === 1) {
        const byteIndex = Math.floor(i / 8);
        const bitPosition = 7 - (i % 8);
        bytes[byteIndex] |= 1 << bitPosition;
      }
    }
    return bytes;
  }
}

module.exports = { BitBuffer };

// const buf = new BitBuffer();
// buf.append(4,4);
// buf.append(3,8);
// buf.append(72,8);
// buf.append(105,8);
// buf.append(33,8);
// 'Hi!' (mode: 4, length: 3, data: 72, 105, 33)
