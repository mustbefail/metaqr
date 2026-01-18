'use strict';

/**
 * A buffer for storing and manipulating individual bits,
 * backed by a Uint8Array for memory efficiency.
 * @implements {Iterable<0 | 1>}
 */
class BitBuffer {
  /** @type {Uint8Array} */
  #bytes;
  /** @type {number} */
  #bitLength;

  /**
   * Creates a new BitBuffer.
   * @param {number} [initialBytes=32] - Initial capacity in bytes.
   */
  constructor(initialBytes = 32) {
    this.#bytes = new Uint8Array(initialBytes);
    this.#bitLength = 0;
  }

  /**
   * Returns the number of bits in the buffer.
   * @returns {number}
   */
  length() {
    return this.#bitLength;
  }

  /**
   * Extends internal buffer capacity if needed.
   * @param {number} requiredBits
   */
  #extendCapacity(requiredBits) {
    const requiredBytes = Math.ceil(requiredBits / 8);

    if (requiredBytes <= this.#bytes.length) { return; }

    const newSize = Math.max(this.#bytes.length * 2, requiredBytes);
    const newBuffer = new Uint8Array(newSize);
    newBuffer.set(this.#bytes);
    this.#bytes = newBuffer;
  }

  /**
   * Appends bits from a value to the buffer.
   * @param {number} value - The integer value to extract bits from.
   * @param {number} length - Number of bits to append (from least significant).
   * @throws {TypeError} If value or length is undefined.
   */
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

  /**
   * Returns the bit at the specified index.
   * @param {number} index - Zero-based bit index.
   * @returns {0 | 1}
   * @throws {RangeError} If index is out of bounds.
   */
  getBit(index) {
    if (index < 0 || index >= this.#bitLength) {
      throw new RangeError(
        `Bit index ${index} out of range [0, ${this.#bitLength})`,
      );
    }
    const byteIndex = Math.floor(index / 8);
    const bitPosition = 7 - (index % 8);
    return /** @type {0 | 1} */ (this.#bytes[byteIndex] >> bitPosition) & 1;
  }

  /**
   * Returns a copy of the internal byte array (trimmed to actual data).
   * @returns {Uint8Array}
   */
  getBytes() {
    return this.#bytes.slice(0, Math.ceil(this.#bitLength / 8));
  }

  /**
   * Iterates over all bits in the buffer.
   * @returns {Generator<0 | 1>}
   */
  *[Symbol.iterator]() {
    for (let i = 0; i < this.#bitLength; i++) {
      yield this.getBit(i);
    }
  }
}

module.exports = { BitBuffer };
