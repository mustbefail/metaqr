'use strict';

const { QrEncoder } = require('./QrEncoder');
const { createQrMatrix } = require('./matrix');
const { toSvg, drawToCanvas, toString } = require('./matrix/render');
const { MODE_INDICATORS } = require('./spec');

/**
 * Generates a QR Code from text.
 * @param {string} text - The text to encode.
 * @param {EncodeOptions} [options] - Configuration options.
 * @returns {EncodedQr} The generated QR Code object containing matrix
 * and render methods.
 */
const encode = (text, options = {}) => {
  /** @type { EncodeOptions } */
  const config = {
    ecc: 'M',
    maskPattern: 'auto',
    mode: 'auto',
    ...options,
  };

  const eccLevel = config.ecc.toUpperCase();
  if (!['L', 'M', 'Q', 'H'].includes(eccLevel)) {
    throw new TypeError(`Invalid ECC level: "${eccLevel}". Use L, M, Q, or H.`);
  }

  /** @type {ModeIndicator | null} */
  let forcedMode = null;
  if (config.mode && config.mode !== 'auto') {
    const m = config.mode.toLowerCase();
    if (m === 'numeric') {
      forcedMode = MODE_INDICATORS.NUMERIC;
    } else if (m === 'alphanumeric') {
      forcedMode = MODE_INDICATORS.ALPHANUMERIC;
    } else if (m === 'byte') {
      forcedMode = MODE_INDICATORS.BYTE;
    } else {
      throw new TypeError(
        `Invalid mode: "${config.mode}". Use auto, numeric,
         alphanumeric, or byte.`,
      );
    }
  }

  const encoder = new QrEncoder({
    text,
    eccLevel,
    version: config.version,
    mode: forcedMode,
  });

  const bitsBuffer = encoder.encode();

  const bits = [...bitsBuffer]

  const { matrix, mask } = createQrMatrix(
    bits,
    encoder.version,
    eccLevel,
    config.maskPattern,
  );

  return {
    matrix,
    version: encoder.version,
    eccLevel,
    maskPattern: mask,
    mode: encoder.mode,

    /**
     * Renders the QR code as SVG string.
     * @param {ToSvgOptions} [svgOptions]
     * @returns {string}
     */
    toSvg: (svgOptions = {}) => {
      const { moduleSize = 10, margin = 4 } = svgOptions;
      return toSvg(matrix, moduleSize, margin);
    },

    /**
     * Draws the QR code to a canvas element.
     * @param {HTMLCanvasElement} canvasElement
     * @param {ToCanvasOptions} [canvasOptions]
     */
    toCanvas: (canvasElement, canvasOptions = {}) => {
      if (typeof drawToCanvas !== 'function') {
        throw new TypeError(
          'Canvas rendering is not supported in this environment',
        );
      }
      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        throw new TypeError('Could not get 2D rendering context from canvas');
      }
      drawToCanvas(matrix, ctx, canvasOptions);
    },

    /**
     * Returns a string representation of the QR code.
     * @returns {string}
     */
    toString: () => toString(matrix),
  };
};

module.exports = {
  encode,
};
