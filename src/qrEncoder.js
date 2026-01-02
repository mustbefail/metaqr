'use strict';

const { QrEncoder } = require('./encoder');
const {
  createQrMatrix,
  toSvg,
  toString,
  drawToCanvas,
} = require('./matrix');
const { ECC_LEVELS } = require('./spec');

/**
 * Public API for QR Code generation
 */
const encode = (text, options = {}) => {
  const config = {
    ecc: 'M',
    maskPattern: 'auto',
    ...options,
  };

  const eccLevel = ECC_LEVELS[config.ecc.toUpperCase()];
  if (eccLevel === undefined) {
    throw new Error(`Invalid ECC level: "${config.ecc}". Use L, M, Q, or H.`);
  }

  const encoder = new QrEncoder({
    text,
    eccLevel,
    version: config.version,
  });

  const bits = encoder.encode();

  const { matrix, mask } = createQrMatrix(
    bits,
    encoder.version,
    eccLevel,
    config.maskPattern,
  );

  return {
    matrix,
    version: encoder.version,
    eccLevel: config.ecc.toUpperCase(),
    maskPattern: mask,

    toSvg: (options = {}) => {
      const { moduleSize = 10, margin = 4 } = options;
      return toSvg(matrix, moduleSize, margin);
    },

    toCanvas: (canvasElement, options = {}) => {
      if (typeof drawToCanvas !== 'function') {
        throw new Error(
          'Canvas rendering is not supported in this environment',
        );
      }
      const ctx = canvasElement.getContext('2d');
      drawToCanvas(matrix, ctx, options);
    },

    toString: () => toString(matrix),
  };
};

module.exports = {
  encode,
};
