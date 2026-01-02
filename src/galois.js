'use strict';

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

// Initialize Galois field tables (GF(2^8) with polynomial 0x11D)
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;

  x <<= 1;
  if (x & 0x100) {
    // If the 9th bit is set (overflow beyond 255)
    x ^= 0x11d;
  }
}

// Duplicate the EXP table to simplify multiplication (to avoid doing % 255)
for (let i = 255; i < 512; i++) {
  EXP[i] = EXP[i - 255];
}

const mul = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
};

module.exports = {
  EXP,
  LOG,
  mul,
};
