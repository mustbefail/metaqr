'use strict';

const { getFormatInfo, getVersionInfo } = require('../spec');

/**
 * Writes format information to the matrix
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
 * Writes version information for versions 7+
 * ISO 18004:2015 Section 8.10
 *
 * LSB-first:
 * bitIndex = i * 3 + j (0..17)
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
