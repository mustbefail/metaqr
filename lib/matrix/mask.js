'use strict';

/**
 * Mask pattern formulas (ISO 18004 Table 10)
 */
const MASK_FUNCTIONS = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

/**
 * Applies a mask pattern to matrix (only non-reserved modules)
 */
const applyMask = (matrix, pattern) => {
  const maskFn = MASK_FUNCTIONS[pattern];
  const size = matrix.size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix.isReserved(x, y) && maskFn(y, x)) {
        matrix.toggle(x, y);
      }
    }
  }
};

// Rule 1: Adjacent modules in row/column with the same color
const penaltyRule1 = (matrix) => {
  const size = matrix.size;
  let penalty = 0;

  for (let y = 0; y < size; y++) {
    let runLength = 1;
    let lastColor = matrix.get(0, y);

    for (let x = 1; x < size; x++) {
      const color = matrix.get(x, y);
      if (color === lastColor) {
        runLength++;
      } else {
        if (runLength >= 5) penalty += runLength - 2;
        runLength = 1;
        lastColor = color;
      }
    }
    if (runLength >= 5) penalty += runLength - 2;
  }

  for (let x = 0; x < size; x++) {
    let runLength = 1;
    let lastColor = matrix.get(x, 0);

    for (let y = 1; y < size; y++) {
      const color = matrix.get(x, y);
      if (color === lastColor) {
        runLength++;
      } else {
        if (runLength >= 5) penalty += runLength - 2;
        runLength = 1;
        lastColor = color;
      }
    }
    if (runLength >= 5) penalty += runLength - 2;
  }

  return penalty;
};

// Rule 2: 2x2 blocks of the same color
const penaltyRule2 = (matrix) => {
  const size = matrix.size;
  let penalty = 0;

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const color = matrix.get(x, y);
      if (
        color === matrix.get(x + 1, y) &&
        color === matrix.get(x, y + 1) &&
        color === matrix.get(x + 1, y + 1)
      ) {
        penalty += 3;
      }
    }
  }

  return penalty;
};

// Rule 3: Finder-like patterns (1:1:3:1:1)
const penaltyRule3 = (matrix) => {
  const size = matrix.size;
  let penalty = 0;
  const pattern1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const pattern2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 10; x++) {
      let match1 = true;
      let match2 = true;
      for (let i = 0; i < 11; i++) {
        if (matrix.get(x + i, y) !== pattern1[i]) match1 = false;
        if (matrix.get(x + i, y) !== pattern2[i]) match2 = false;
      }
      if (match1 || match2) penalty += 40;
    }
  }

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size - 10; y++) {
      let match1 = true;
      let match2 = true;
      for (let i = 0; i < 11; i++) {
        if (matrix.get(x, y + i) !== pattern1[i]) match1 = false;
        if (matrix.get(x, y + i) !== pattern2[i]) match2 = false;
      }
      if (match1 || match2) penalty += 40;
    }
  }

  return penalty;
};

// Rule 4: Proportion of dark modules
const penaltyRule4 = (matrix) => {
  const size = matrix.size;
  let darkCount = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix.get(x, y) === 1) darkCount++;
    }
  }

  const total = size * size;
  const percent = (darkCount * 100) / total;
  const prevFive = Math.floor(percent / 5) * 5;
  const nextFive = prevFive + 5;

  return (
    Math.min(Math.abs(prevFive - 50) / 5, Math.abs(nextFive - 50) / 5) * 10
  );
};

/**
 * Calculates penalty score for a masked matrix (ISO 18004 Section 8.8)
 */
const calculatePenalty = (matrix) =>
  penaltyRule1(matrix) +
  penaltyRule2(matrix) +
  penaltyRule3(matrix) +
  penaltyRule4(matrix);

/**
 * Finds the best mask pattern by trying all 8 and selecting the lowest penalty
 */
const findBestMask = (matrix, applyFormatFn, eccLevel) => {
  let bestMask = 0;
  let lowestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const testMatrix = matrix.clone();
    applyMask(testMatrix, mask);
    applyFormatFn(testMatrix, eccLevel, mask);

    const penalty = calculatePenalty(testMatrix);
    if (penalty < lowestPenalty) {
      lowestPenalty = penalty;
      bestMask = mask;
    }
  }

  return bestMask;
};

module.exports = {
  applyMask,
  calculatePenalty,
  findBestMask,
  MASK_FUNCTIONS,
};
