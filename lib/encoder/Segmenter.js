'use strict';

const { MODE_INDICATORS } = require('../spec');
const { Numeric } = require('./Numeric');
const { Alphanumeric } = require('./Alphanumeric');
const { Byte } = require('./Byte');

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const ALPHANUMERIC_SET = new Set(ALPHANUMERIC_CHARS.split(''));

const SEGMENT_TYPES = {
  NUMERIC: 'numeric',
  ALPHANUMERIC: 'alphanumeric',
  BYTE: 'byte',
};

const MODE_TO_SEGMENT_TYPE = {
  [MODE_INDICATORS.NUMERIC]: SEGMENT_TYPES.NUMERIC,
  [MODE_INDICATORS.ALPHANUMERIC]: SEGMENT_TYPES.ALPHANUMERIC,
  [MODE_INDICATORS.BYTE]: SEGMENT_TYPES.BYTE,
};

const SEGMENTS_FACTORIES = {
  [SEGMENT_TYPES.NUMERIC]: (text) => new Numeric(text),
  [SEGMENT_TYPES.ALPHANUMERIC]: (text) => new Alphanumeric(text),
  [SEGMENT_TYPES.BYTE]: (text) => new Byte(text),
};

// Thresholds
// why such numbers?
// switching modes is not free and costs
// (for versions less than 10 - more popular):
// 13 bits for alphanumeric
// 14 bits for numerics
// 12 bits for byte modes
//
// therefore the sum of switching plus the sum of bits in a particular mode
// must be less than the previous or next mode. for numbers and alphanumerics
// it is 4 and 6 - optimal length

const THRESHOLD_NUMERIC = 4;
const THRESHOLD_ALPHANUMERIC = 6;

const PROMOTION_RULES = [
  {
    from: SEGMENT_TYPES.NUMERIC,
    to: SEGMENT_TYPES.ALPHANUMERIC,
    threshold: THRESHOLD_NUMERIC,
  },
  {
    from: SEGMENT_TYPES.ALPHANUMERIC,
    to: SEGMENT_TYPES.BYTE,
    threshold: THRESHOLD_ALPHANUMERIC,
  },
];

const isDigit = (char) => char >= '0' && char <= '9';
const isAlphanumericChar = (char) => ALPHANUMERIC_SET.has(char);

const getCharMode = (char) => {
  if (isDigit(char)) return SEGMENT_TYPES.NUMERIC;
  if (isAlphanumericChar(char)) return SEGMENT_TYPES.ALPHANUMERIC;
  return SEGMENT_TYPES.BYTE;
};

const promoteShortSegments = (segments, fromType, toType, threshold) =>
  segments.map((segment) =>
    segment.type === fromType && segment.text.length < threshold
      ? { ...segment, type: toType }
      : segment,
  );

class Segmenter {
  static segment(text, mode = null) {
    if (text === null || text === undefined) {
      throw new TypeError('Text is required');
    }

    return mode === null
      ? Segmenter.#segmentAuto(text)
      : Segmenter.#segmentWithMode(text, mode);
  }

  static #segmentWithMode(text, mode) {
    const segmentType = MODE_TO_SEGMENT_TYPE[mode];
    if (!segmentType) throw new TypeError(`Unsupported mode: "${mode}"`);
    return [SEGMENTS_FACTORIES[segmentType](text)];
  }

  static #segmentAuto(text) {
    if (!text.length) return [];

    const rawSegments = [];
    let start = 0;
    let currentType = getCharMode(text[0]);

    for (let i = 1; i < text.length; i++) {
      const charType = getCharMode(text[i]);
      if (charType !== currentType) {
        rawSegments.push({ type: currentType, text: text.slice(start, i) });
        start = i;
        currentType = charType;
      }
    }
    rawSegments.push({ type: currentType, text: text.slice(start) });

    // Numeric > Alphanumeric > Byte
    let optimized = rawSegments;
    for (const { from, to, threshold } of PROMOTION_RULES) {
      optimized = Segmenter.#mergeAdjacent(
        promoteShortSegments(optimized, from, to, threshold),
      );
    }

    return optimized.map(({ type, text }) => SEGMENTS_FACTORIES[type](text));
  }

  static #mergeAdjacent(segments) {
    const merged = [];
    for (const segment of segments) {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === segment.type) {
        prev.text += segment.text;
      } else {
        merged.push({ ...segment });
      }
    }
    return merged;
  }
}

module.exports = { Segmenter };
