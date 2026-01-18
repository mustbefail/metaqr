'use strict';

const { getFormatInfo, getVersionInfo } = require('../utils');

/**
 * @typedef {import('../../types').QrMatrix} QrMatrix
 * @typedef {import('../../types').EccLevel} EccLevel
 */

/**
 * Applies format information to the QR matrix.
 *
 * Format info is a 15-bit sequence encoding ECC level and mask pattern,
 * protected by BCH error correction. It's written twice for redundancy:
 * 1. Around the top-left finder pattern
 * 2. Split between bottom-left and top-right areas
 *
 * @param {QrMatrix} matrix - The QR matrix to modify.
 * @param {EccLevel} eccLevel - Error correction level ('L', 'M', 'Q', 'H').
 * @param {number} maskPattern - Mask pattern index (0-7).
 */
const applyFormatInfo = (matrix, eccLevel, maskPattern) => {
  const formatBits = getFormatInfo(eccLevel, maskPattern);
  const size = matrix.size;

  // First copy: around the top-left finder
  for (let i = 0; i < 6; i++) {
    matrix.set(8, i, (formatBits >> i) & 1, true);
  }
  matrix.set(8, 7, (formatBits >> 6) & 1, true);
  matrix.set(8, 8, (formatBits >> 7) & 1, true);
  matrix.set(7, 8, (formatBits >> 8) & 1, true);

  for (let i = 9; i < 15; i++) {
    matrix.set(14 - i, 8, (formatBits >> i) & 1, true);
  }

  // Second copy: bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix.set(8, size - 1 - i, (formatBits >> i) & 1, true);
  }

  for (let i = 0; i < 8; i++) {
    matrix.set(size - 8 + i, 8, (formatBits >> (7 + i)) & 1, true);
  }
};

/**
 * Applies version information to the QR matrix.
 *
 * Version info is required for QR codes version 7 and higher.
 * It's an 18-bit sequence encoding the version number, protected by BCH.
 * Written in two 6x3 blocks:
 * 1. Top-right, adjacent to the top-right finder
 * 2. Bottom-left, adjacent to the bottom-left finder
 *
 * @param {QrMatrix} matrix - The QR matrix to modify.
 * @param {number} version - QR code version (1-40). No-op for versions < 7.
 */
const applyVersionInfo = (matrix, version) => {
  if (version < 7) return;

  const versionBits = getVersionInfo(version);
  const size = matrix.size;

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      const bitIndex = i * 3 + j; // 0..17
      const bit = (versionBits >> bitIndex) & 1;

      // Top-right (3x6)
      matrix.set(size - 11 + j, i, bit, true);

      // Bottom-left (6x3)
      matrix.set(i, size - 11 + j, bit, true);
    }
  }
};

module.exports = {
  applyFormatInfo,
  applyVersionInfo,
};
