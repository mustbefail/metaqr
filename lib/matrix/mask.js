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

const penaltyRule1 = (matrix) => {
  const { size } = matrix;
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
        penalty += 3;
      }
    }
  }

  return penalty;
};

const penaltyRule3 = (matrix) => {
  const { size } = matrix;
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

const penaltyRule4 = (matrix) => {
  const { size } = matrix;
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

const calculatePenalty = (matrix) =>
  penaltyRule1(matrix) +
  penaltyRule2(matrix) +
  penaltyRule3(matrix) +
  penaltyRule4(matrix);

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
