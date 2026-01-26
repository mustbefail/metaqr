'use strict';

const { mul, EXP } = require('./galois');

// Cache to store already calculated generator polynomials
// to avoid recalculating them for every QR code with the same parameters.
const POLY_CACHE = {};

/**
 * Multiplies two polynomials in Galois Field GF(2^8).
 * Uses coefficient convolution with field
 * arithmetic (XOR for addition, mul for multiplication).
 */

const polyMul = (p1, p2) => {
  const len = p1.length + p2.length - 1;
  const res = new Uint8Array(len);

  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= mul(p1[i], p2[j]);
    }
  }
  return res;
};

/**
 * Generates a generator polynomial for a given number of correction symbols.
 * Mathematically this is the product:
 * (x - a^0) * (x - a^1) * ... * (x - a^(n-1))
 */

const generatorPoly = (nsym) => {
  if (POLY_CACHE[nsym]) return POLY_CACHE[nsym];

  let poly = new Uint8Array([1]);

  for (let i = 0; i < nsym; i++) {
    // Multiply current polynomial by (x - 2^i)
    // in galois field, (x - a) is the same as (x ^= a), [1, EXP[i]]
    poly = polyMul(poly, new Uint8Array([1, EXP[i]]));
  }

  POLY_CACHE[nsym] = poly;
  return poly;
};

/**
 * Calculates Reed-Solomon Error Correction Codes (ECC).
 * This function performs polynomial division of the data
 * polynomial by the generator polynomial.
 * The result is the remainder of the division,
 * which becomes the error correction codes.
 */

const calculateECC = (data, nsym) => {
  const generator = generatorPoly(nsym);

  const result = new Uint8Array(data.length + nsym);
  result.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < generator.length; j++) {
        result[i + j] ^= mul(generator[j], coef);
      }
    }
  }

  return result.slice(data.length);
};

module.exports = {
  calculateECC,
};
