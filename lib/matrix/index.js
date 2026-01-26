'use strict';

const { QrMatrix } = require('./QrMatrix');
const { setupPatterns } = require('./patterns');
const { applyMask, findBestMask } = require('./mask');
const { applyFormatInfo, applyVersionInfo } = require('./format');
const { fillData } = require('./data');
const { getMatrixSize } = require('../utils');

const createQrMatrix = (bits, version, eccLevel, maskPattern = 'auto') => {
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
