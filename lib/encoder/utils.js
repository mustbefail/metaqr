'use strict';

const { getCharCountSize } = require('../utils');

const calculateNeededBits = (segments, version) => {
  const modeBits = 4;
  let totalBitsNeeded = 0;

  for (const segment of segments) {
    const charCountBits = getCharCountSize(version, segment.mode);
    totalBitsNeeded += modeBits + charCountBits + segment.dataBitsLength;
  }
  return totalBitsNeeded;
};

module.exports = { calculateNeededBits };
