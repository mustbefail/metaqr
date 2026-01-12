'use strict';

/**
 * Represents a QR Code matrix (grid of modules).
 */
class QrMatrix {
  #data;
  #reserved;
  #size;

  /**
   * @param {number} size - Matrix width/height.
   */
  constructor(size) {
    this.#size = size;
    this.#data = new Uint8Array(size * size);
    this.#reserved = new Uint8Array(size * size);
  }

  get size() {
    return this.#size;
  }

  #index(x, y) {
    if (x < 0 || y < 0 || x >= this.#size || y >= this.#size) {
      throw new Error(`Out of bounds: (${x}, ${y})`);
    }
    return y * this.#size + x;
  }

  /**
   * Gets the module value at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {number} 1 (dark) or 0 (light).
   */
  get(x, y) {
    return this.#data[this.#index(x, y)];
  }

  /**
   * Sets the module value.
   * @param {number} x
   * @param {number} y
   * @param {number} value
   * @param {boolean} [reserved=false] -
   *   Whether this module is reserved (cannot be masked/overwritten).
   * @returns {boolean} True if set successfully, false if previously reserved.
   */
  set(x, y, value, reserved = false) {
    const idx = this.#index(x, y);
    if (this.#reserved[idx] && !reserved) return false;
    this.#data[idx] = value;
    if (reserved) this.#reserved[idx] = 1;
    return true;
  }

  /**
   * Checks if the module is reserved.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isReserved(x, y) {
    return this.#reserved[this.#index(x, y)] === 1;
  }

  /**
   * Toggles the value of the module (0 -> 1, 1 -> 0).
   * @param {number} x
   * @param {number} y
   */
  toggle(x, y) {
    const idx = this.#index(x, y);
    this.#data[idx] ^= 1;
  }

  /**
   * Creates a deep copy of the matrix.
   * @returns {QrMatrix}
   */
  clone() {
    const copy = new QrMatrix(this.#size);
    for (let y = 0; y < this.#size; y++) {
      for (let x = 0; x < this.#size; x++) {
        const value = this.get(x, y);
        const reserved = this.isReserved(x, y);
        copy.set(x, y, value, reserved);
      }
    }
    return copy;
  }
}

module.exports = { QrMatrix };
