'use strict';

const { getAlignmentPatternPositions } = require('../utils');

const FINDER_PATTERN_SIZE = 7;
const FINDER_ZONE = 8;
const ALIGNMENT_RADIUS = 2;

const isOverlapping = (size, cx, cy) => {
  const left = cx - ALIGNMENT_RADIUS;
  const top = cy - ALIGNMENT_RADIUS;
  const right = cx + ALIGNMENT_RADIUS;
  const bottom = cy + ALIGNMENT_RADIUS;

  const inTL = left < FINDER_ZONE && top < FINDER_ZONE;
  const inTR = right >= size - FINDER_ZONE && top < FINDER_ZONE;
  const inBL = left < FINDER_ZONE && bottom >= size - FINDER_ZONE;

  return inTL || inTR || inBL;
};

const fillRect = (matrix, x, y, width, height, value, reserved) => {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      matrix.set(x + dx, y + dy, value, reserved);
    }
  }
};

const placeFinderPattern = (matrix, originX, originY) => {
  // Separator (white border)
  const sepX = originX === 0 ? 0 : originX - 1;
  const sepY = originY === 0 ? 0 : originY - 1;

  fillRect(matrix, sepX, sepY, 8, 8, 0, true);
  // Outer black square
  fillRect(matrix, originX, originY, 7, 7, 1, true);
  // Inner white square
  fillRect(matrix, originX + 1, originY + 1, 5, 5, 0, true);
  // Center black square
  fillRect(matrix, originX + 2, originY + 2, 3, 3, 1, true);
};

const placeAlignmentPattern = (matrix, centerX, centerY) => {
  // black 5x5
  fillRect(matrix, centerX - 2, centerY - 2, 5, 5, 1, true);
  // white 3x3
  fillRect(matrix, centerX - 1, centerY - 1, 3, 3, 0, true);
  // black center
  matrix.set(centerX, centerY, 1, true);
};

const placeTimingPatterns = (matrix, version) => {
  const { size } = matrix;

  // Horizontal timing (row 6)
  for (let x = 8; x < size - 8; x++) {
    matrix.set(x, 6, x % 2 === 0 ? 1 : 0, true);
  }

  // Vertical timing (column 6)
  for (let y = 8; y < size - 8; y++) {
    matrix.set(6, y, y % 2 === 0 ? 1 : 0, true);
  }

  // Dark module
  matrix.set(8, 4 * version + 9, 1, true);
};

const reserveInfoAreas = (matrix, version) => {
  const { size } = matrix;

  // Format info around the top-left finder
  for (let i = 0; i < 9; i++) {
    if (!matrix.isReserved(8, i)) matrix.set(8, i, 0, true);
    if (!matrix.isReserved(i, 8)) matrix.set(i, 8, 0, true);
  }

  // Format info near the bottom-left and top-right finders
  for (let i = 0; i < 8; i++) {
    if (!matrix.isReserved(8, size - 1 - i)) {
      matrix.set(8, size - 1 - i, 0, true);
    }
    if (!matrix.isReserved(size - 1 - i, 8)) {
      matrix.set(size - 1 - i, 8, 0, true);
    }
  }

  // Version info (versions 7+)
  if (version >= 7) {
    fillRect(matrix, 0, size - 11, 6, 3, 0, true);
    fillRect(matrix, size - 11, 0, 3, 6, 0, true);
  }
};

const setupPatterns = (matrix, version) => {
  const { size } = matrix;

  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, size - FINDER_PATTERN_SIZE, 0);
  placeFinderPattern(matrix, 0, size - FINDER_PATTERN_SIZE);

  placeTimingPatterns(matrix, version);

  const positions = getAlignmentPatternPositions(version);

  for (const x of positions) {
    for (const y of positions) {
      if (!isOverlapping(size, x, y)) {
        placeAlignmentPattern(matrix, x, y);
      }
    }
  }

  reserveInfoAreas(matrix, version);
};

module.exports = {
  setupPatterns,
};
