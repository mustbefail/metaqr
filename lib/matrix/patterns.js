'use strict';

const { getAlignmentPatternPositions } = require('../utils');

/**
 * Helper to fill rectangle
 */
const fillRect = (matrix, x, y, width, height, value, reserved) => {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      matrix.set(x + dx, y + dy, value, reserved);
    }
  }
};

/**
 * Places a finder pattern at a given position
 */
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

/**
 * Places alignment pattern centered at given position
 *
 * IMPORTANT: Cannot decide "place/not place" based on
 * matrix.isReserved(centerX, centerY),
 * because timing/format/other reserved areas may mark the center as reserved.
 * According to the standard, we only skip 3 corners that overlap with
 * finder patterns.
 */
const placeAlignmentPattern = (matrix, centerX, centerY) => {
  const size = matrix.size;

  const overlapsTopLeftFinder = centerX === 6 && centerY === 6;
  const overlapsTopRightFinder = centerX === size - 7 && centerY === 6;
  const overlapsBottomLeftFinder = centerX === 6 && centerY === size - 7;

  if (
    overlapsTopLeftFinder ||
    overlapsTopRightFinder ||
    overlapsBottomLeftFinder
  ) {
    return;
  }

  // black 5x5
  fillRect(matrix, centerX - 2, centerY - 2, 5, 5, 1, true);
  // white 3x3
  fillRect(matrix, centerX - 1, centerY - 1, 3, 3, 0, true);
  // black center
  matrix.set(centerX, centerY, 1, true);
};

/**
 * Places timing patterns (horizontal and vertical)
 */
const placeTimingPatterns = (matrix, version) => {
  const size = matrix.size;

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

/**
 * Reserves space for format and version info (to be filled later)
 */
const reserveInfoAreas = (matrix, version) => {
  const size = matrix.size;

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

/**
 * Sets up all static patterns on the matrix
 */
const setupPatterns = (matrix, version) => {
  const size = matrix.size;

  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, size - 7, 0);
  placeFinderPattern(matrix, 0, size - 7);

  placeTimingPatterns(matrix, version);

  const positions = getAlignmentPatternPositions(version);
  for (const x of positions) {
    for (const y of positions) {
      placeAlignmentPattern(matrix, x, y);
    }
  }

  reserveInfoAreas(matrix, version);
};

module.exports = {
  setupPatterns,
};
