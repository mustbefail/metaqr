'use strict';

const { MODE_INDICATORS } = require('../spec.js');
const { BitBuffer } = require('./BitBuffer.js');

const numericRe = /^[0-9]+$/;

//10 bits per 3 chars

class Numeric {
  #content;
  #mode = MODE_INDICATORS.NUMERIC;

  constructor(content) {
    if (!numericRe.test(content)) {
      throw new Error('Numeric mode supports only digits 0-9');
    }
    this.#content = content;
  }

  static matches(content) {
    return numericRe.test(content);
  }

  get mode() {
    return this.#mode;
  }

  get content() {
    return this.#content;
  }

  get charCount() {
    return this.#content.length;
  }

  get dataBitsLength() {
    const length = this.#content.length;
    const groupsOf3 = Math.floor(length / 3);
    const remaining = length % 3;
    const bits = groupsOf3 * 10;
    return remaining === 0 ? bits : bits + remaining * 3 + 1;
  }

  encode() {
    const bitBuffer = new BitBuffer();
    const groups = this.#content.match(/.{1,3}/g) || [];

    for (const group of groups) {
      const value = parseInt(group, 10);
      const bitLength = group.length * 3 + 1;
      bitBuffer.append(value, bitLength);
    }

    return bitBuffer;
  }
}

module.exports = { Numeric };
