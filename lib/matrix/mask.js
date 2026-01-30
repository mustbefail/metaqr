'use strict';

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

const PENALTY_WEIGHTS = {
  LINE: 3,
  BLOCK: 3,
  PATTERN: 40,
  RATIO: 10,
};

const P3_PATTERN1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
const P3_PATTERN2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

const applyMask = (matrix, pattern) => {
  const maskFn = MASK_FUNCTIONS[pattern];
  const { size } = matrix;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix.isReserved(x, y) && maskFn(y, x)) {
        matrix.toggle(x, y);
      }
    }
  }
};

const isMatch = (matrix, baseX, baseY, deltaX, deltaY, pattern) => {
  for (let i = 0; i < pattern.length; i++) {
    if (matrix.get(baseX + i * deltaX, baseY + i * deltaY) !== pattern[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Rule 1: Penalty for consecutive modules of the same color.
 * (5 consecutive = 3 points, each additional = 1 point)
 */

const calculateLinePenalty1 = (getModuleFn, size) => {
  const penaltyGoal = 5;
  let localPenalty = 0;

  for (let i = 0; i < size; i++) {
    let runLength = 1;
    let lastColor = getModuleFn(i, 0);

    for (let j = 1; j < size; j++) {
      const color = getModuleFn(i, j);
      if (color === lastColor) {
        runLength++;
      } else {
        if (runLength >= penaltyGoal) {
          localPenalty += PENALTY_WEIGHTS.LINE + (runLength - penaltyGoal);
        }
        runLength = 1;
        lastColor = color;
      }
    }
    if (runLength >= penaltyGoal) {
      localPenalty += PENALTY_WEIGHTS.LINE + (runLength - penaltyGoal);
    }
  }
  return localPenalty;
};

const penaltyRule1 = (matrix) => {
  const { size } = matrix;
  let penalty = 0;

  penalty += calculateLinePenalty1((y, x) => matrix.get(x, y), size);
  penalty += calculateLinePenalty1((x, y) => matrix.get(x, y), size);

  return penalty;
};

/**
 * Rule 2: Penalty for 2x2 blocks of the same color.
 * (3 points per block)
 */

const penaltyRule2 = (matrix) => {
  const { size } = matrix;
  let penalty = 0;

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const color = matrix.get(x, y);
      if (
        color === matrix.get(x + 1, y) &&
        color === matrix.get(x, y + 1) &&
        color === matrix.get(x + 1, y + 1)
      ) {
        penalty += PENALTY_WEIGHTS.BLOCK;
      }
    }
  }

  return penalty;
};

/**
 * Rule 3: Penalty for patterns looking like finder patterns (1:1:3:1:1).
 * (40 points per pattern)
 */

const penaltyRule3 = (matrix) => {
  const { size } = matrix;
  let penalty = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check Horizontal Row
      if (
        x + 10 < size &&
        (isMatch(matrix, x, y, 1, 0, P3_PATTERN1) ||
          isMatch(matrix, x, y, 1, 0, P3_PATTERN2))
      ) {
        penalty += PENALTY_WEIGHTS.PATTERN;
      }

      // Check Vertical Column
      if (
        y + 10 < size &&
        (isMatch(matrix, x, y, 0, 1, P3_PATTERN1) ||
          isMatch(matrix, x, y, 0, 1, P3_PATTERN2))
      ) {
        penalty += PENALTY_WEIGHTS.PATTERN;
      }
    }
  }

  return penalty;
};

/**
 * Rule 4: Penalty based on ratio of dark modules.
 * (10 points for every 5% deviation from 50%)
 */

const penaltyRule4 = (matrix) => {
  const { size } = matrix;
  let darkCellsCount = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix.get(x, y) === 1) darkCellsCount++;
    }
  }

  const total = size * size;
  const percent = (darkCellsCount * 100) / total;

  // Calculate deviation from 50%
  const deviation = Math.abs(percent - 50);
  const rating = Math.floor(deviation / 5);

  return rating * PENALTY_WEIGHTS.RATIO;
};

const calculatePenalty = (matrix) =>
  penaltyRule1(matrix) +
  penaltyRule2(matrix) +
  penaltyRule3(matrix) +
  penaltyRule4(matrix);

/**
 * Finds the best mask pattern (lowest penalty).
 */

const findBestMask = (matrix, applyFormatFn, eccLevel) => {
  let bestMask = 0;
  let lowestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    // Clone is expensive but necessary as masking is mutable
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
