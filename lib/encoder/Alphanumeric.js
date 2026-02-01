'use strict';

const { MODE_INDICATORS } = require('../spec.js');
const { BitBuffer } = require('./BitBuffer.js');

const ALPHANUMERICCHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const ALPHANUMERIC_REGEXP = /^[0-9A-Z $%*+\-./:]+$/;

// 11 bits per 2 chars

class Alphanumeric {
  #content;
  #mode = MODE_INDICATORS.ALPHANUMERIC;

  constructor(content) {
    if (!ALPHANUMERIC_REGEXP.test(content)) {
      throw new Error(
        'Alphanumeric mode supports only: 0-9, A-Z, space, $%*+-./:',
      );
    }
    this.#content = content;
  }

  static matches(content) {
    return ALPHANUMERIC_REGEXP.test(content);
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
    const pairs = Math.floor(length / 2);
    const bits = pairs * 11;
    const remaining = length % 2;
    return remaining === 0 ? bits : bits + remaining * 5 + 1;
  }

  static #getValue(char) {
    const idx = ALPHANUMERICCHARSET.indexOf(char);

    if (idx === -1) throw new Error(`Invalid character: ${char}`);

    return idx;
  }

  encode() {
    const bitBuffer = new BitBuffer();
    const groups = this.#content.match(/.{1,2}/g) || [];

    for (const group of groups) {
      const head = Alphanumeric.#getValue(group[0]);
      let value = head;

      if (group.length === 2) {
        const tail = Alphanumeric.#getValue(group[1]);
        // base45
        value = head * 45 + tail;
      }

      // 1 - 6 bits, 2 - 11 bits
      // length * 5 + 1
      const bitLength = group.length * 5 + 1;

      bitBuffer.append(value, bitLength);
    }

    return bitBuffer;
  }
}

module.exports = { Alphanumeric };
