'use strict';

class BitBuffer {
  #bytes;
  #bitLength;

  constructor(initialBytes = 32) {
    this.#bytes = new Uint8Array(initialBytes);
    this.#bitLength = 0;
  }

  length() {
    return this.#bitLength;
  }

  #extendCapacity(requiredBits) {
    const requiredBytes = Math.ceil(requiredBits / 8);

    if (requiredBytes <= this.#bytes.length) {
      return;
    }

    const newSize = Math.max(this.#bytes.length * 2, requiredBytes);
    const newBuffer = new Uint8Array(newSize);
    newBuffer.set(this.#bytes);
    this.#bytes = newBuffer;
  }

  append(value, length) {
    if (value === undefined) throw new TypeError('Value is required');
    if (length === undefined) throw new TypeError('Length is required');

    this.#extendCapacity(this.#bitLength + length);

    for (let i = length - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      if (bit === 1) {
        const byteIndex = Math.floor(this.#bitLength / 8);
        const bitPosition = 7 - (this.#bitLength % 8);
        this.#bytes[byteIndex] |= 1 << bitPosition;
      }
      this.#bitLength++;
    }
  }

  getBit(index) {
    if (index < 0 || index >= this.#bitLength) {
      throw new RangeError(
        `Bit index ${index} out of range [0, ${this.#bitLength})`,
      );
    }
    const byteIndex = Math.floor(index / 8);
    const bitPosition = 7 - (index % 8);
    return (this.#bytes[byteIndex] >> bitPosition) & 1;
  }

  getBytes() {
    return this.#bytes.slice(0, Math.ceil(this.#bitLength / 8));
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.#bitLength; i++) {
      yield this.getBit(i);
    }
  }
}

module.exports = { BitBuffer };
