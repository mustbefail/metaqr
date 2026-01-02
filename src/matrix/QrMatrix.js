'use strict';

class QrMatrix {
  #data;
  #reserved;
  #size;

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

  get(x, y) {
    return this.#data[this.#index(x, y)];
  }

  set(x, y, value, reserved = false) {
    const idx = this.#index(x, y);
    if (this.#reserved[idx] && !reserved) return false;
    this.#data[idx] = value;
    if (reserved) this.#reserved[idx] = 1;
    return true;
  }

  isReserved(x, y) {
    return this.#reserved[this.#index(x, y)] === 1;
  }

  toggle(x, y) {
    const idx = this.#index(x, y);
    this.#data[idx] ^= 1;
  }

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
