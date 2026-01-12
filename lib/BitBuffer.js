'use strict';

/**
 * Buffer for bit-level manipulations.
 */
class BitBuffer {
  constructor() {
    this.bits = [];
  }

  /**
   * Appends bits to the buffer.
   * @param {number} value - The value to append.
   * @param {number} length - The number of bits to use.
   */
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

  /**
   * Returns the length of the buffer in bits.
   * @returns {number}
   */
  length() {
    return this.bits.length;
  }

  /**
   * Converts the bit buffer to a Uint8Array.
   * @returns {Uint8Array}
   */
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
