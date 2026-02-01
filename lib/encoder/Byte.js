'use strict';

const { MODE_INDICATORS } = require('../spec.js');
const { BitBuffer } = require('./BitBuffer.js');

// 8 bits per char

class Byte {
  #content;
  #utf8Data;
  #mode = MODE_INDICATORS.BYTE;

  constructor(content) {
    this.#content = content;
    this.#utf8Data = new TextEncoder().encode(content);
  }

  get mode() {
    return this.#mode;
  }

  get content() {
    return this.#content;
  }

  get charCount() {
    return this.#utf8Data.length;
  }

  get dataBitsLength() {
    return this.#utf8Data.length * 8;
  }

  encode() {
    const bitBuffer = new BitBuffer();
    for (const byte of this.#utf8Data) {
      bitBuffer.append(byte, 8);
    }
    return bitBuffer;
  }
}

module.exports = { Byte };
