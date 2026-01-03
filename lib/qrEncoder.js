'use strict';

const { QrEncoder } = require('./encoder');
const { createQrMatrix } = require('./matrix');
const { toSvg, drawToCanvas, toString } = require('./matrix/render');
const { ECC_LEVELS } = require('./spec');

/**
 * Public API for QR Code generation
 */
const encode = (text, options = {}) => {
  const config = {
    ecc: 'M',
    maskPattern: 'auto',
    mode: 'auto',
    ...options,
  };

  const eccLevel = ECC_LEVELS[config.ecc.toUpperCase()];
  if (eccLevel === undefined) {
    throw new Error(`Invalid ECC level: "${config.ecc}". Use L, M, Q, or H.`);
  }

  let forcedMode = null;
  if (config.mode && config.mode !== 'auto') {
    const m = config.mode.toLowerCase();
    if (m === 'numeric') forcedMode = MODES.NUMERIC;
    else if (m === 'alphanumeric') forcedMode = MODES.ALPHANUMERIC;
    else if (m === 'byte') forcedMode = MODES.BYTE;
    else {
      throw new Error(
        `Invalid mode: "${config.mode}". Use auto, numeric, alphanumeric, or byte.`
      );
    }
  }

  const encoder = new QrEncoder({
    text,
    eccLevel,
    version: config.version,
    mode: forcedMode,
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
    mode: encoder.mode,
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
