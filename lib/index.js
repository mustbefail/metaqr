'use strict';

const { QrEncoder } = require('./encoder/QrEncoder');
const { MODE_INDICATORS } = require('./spec');
const { Segmenter } = require('./encoder/Segmenter');

const modes = {
  numeric: MODE_INDICATORS.NUMERIC,
  alphanumeric: MODE_INDICATORS.ALPHANUMERIC,
  byte: MODE_INDICATORS.BYTE,
};

const encode = (text, options = {}) => {
  const config = {
    ecc: 'M',
    maskPattern: 'auto',
    mode: null,
    ...options,
  };

  const eccLevel = config.ecc.toUpperCase();
  if (!['L', 'M', 'Q', 'H'].includes(eccLevel)) {
    throw new TypeError(`Invalid ECC level: "${eccLevel}". Use L, M, Q, or H.`);
  }

  const selectedMode = config.mode?.toLowerCase();
  if (selectedMode && modes[selectedMode] === undefined) {
    throw new TypeError(
      `Invalid mode: "${selectedMode}". Use numeric, alphanumeric, or byte.`,
    );
  }
  const forcedMode = modes[selectedMode] ?? null;

  const segments = Segmenter.segment(text, forcedMode);

  const encoder = new QrEncoder({
    eccLevel,
    version: config.version,
    maskPattern: config.maskPattern,
  });

  return encoder.encode(...segments);
};

module.exports = {
  encode,
};
