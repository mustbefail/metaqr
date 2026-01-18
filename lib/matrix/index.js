'use strict';

const { QrMatrix } = require('./QrMatrix');
const { setupPatterns } = require('./patterns');
const { applyMask, findBestMask } = require('./mask');
const { applyFormatInfo, applyVersionInfo } = require('./format');
const { fillData } = require('./data');
const { getMatrixSize } = require('../utils');

/**
 * Creates a complete QR matrix from encoded bits
 * Facade pattern - provides simple interface for a complex subsystem
 * @param {Bit[]} bits - Array of bits to write into the matrix.
 * @param {number} version - QR Code version. Must be in range 1..40.
 * @param {EccLevel} eccLevel - Error correction level.
 * @param {number| 'auto'} [maskPattern='auto'] - Mask pattern, either
 * number from 0 to 7 or 'auto'.
 * If not specified, will be selected automatically.
 * @returns {Object} Object with generated matrix and used mask pattern.
 * @property {QrMatrix} matrix - QR Code matrix.
 * @property {number | "auto"} mask - Used mask pattern, either number
 * from 0 to 7 or -1 if no mask was applied.
 */
const createQrMatrix = (
  bits,
  version,
  eccLevel,
  maskPattern = 'auto',
) => {
  const size = getMatrixSize(version);
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);
  fillData(matrix, bits);

  const mask =
    maskPattern === 'auto'
      ? findBestMask(matrix, applyFormatInfo, eccLevel)
      : maskPattern;

  applyMask(matrix, mask);

  applyFormatInfo(matrix, eccLevel, mask);
  applyVersionInfo(matrix, version);

  return { matrix, mask };
};

module.exports = { createQrMatrix };
