'use strict';

const { mul, EXP } = require('./galois');

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

const POLY_CACHE = {};

const generatorPoly = (nsym) => {
  if (POLY_CACHE[nsym]) return POLY_CACHE[nsym];

  let poly = new Uint8Array([1]);

  for (let i = 0; i < nsym; i++) {
    poly = polyMul(poly, new Uint8Array([1, EXP[i]]));
  }

  POLY_CACHE[nsym] = poly;
  return poly;
};

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

module.exports = {
  calculateECC,
};
