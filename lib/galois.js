'use strict';

/**
 * Galois Field GF(2^8) Arithmetic
 *
 * This module implements arithmetic operations over a finite field of
 * 256 elements.
 * It is the mathematical foundation for Reed-Solomon error correction
 * used in QR Codes.
 *
 * The specific field is defined by the primitive polynomial:
 * x^8 + x^4 + x^3 + x^2 + 1 (0x11D in binary).
 *
 * To optimize performance, multiplication is implemented using lookup
 * tables (Log/Anti-Log),
 * transforming complex polynomial multiplication into simple integer addition:
 * a * b = antiLog(log(a) + log(b))
 */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;

  x <<= 1;
  if (x & 0x100) {
    x ^= 0x11d;
  }
}

for (let i = 255; i < 512; i++) {
  EXP[i] = EXP[i - 255];
}

/**
 * Multiplies two numbers in GF(2^8).
 *
 * @param {number} a - First number (0-255).
 * @param {number} b - Second number (0-255).
 * @returns {number} The product in the Galois Field.
 */

const mul = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
};

module.exports = {
  EXP,
  LOG,
  mul,
};
