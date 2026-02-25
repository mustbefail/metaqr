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

// Паттерни Rule 3 як 11-бітні числа для sliding window порівняння.
// P3_PATTERN1 = [1,0,1,1,1,0,1,0,0,0,0] → 0b10111010000 = 1488
// P3_PATTERN2 = [0,0,0,0,1,0,1,1,1,0,1] → 0b00001011101 = 93
const P3_BITS1 = 0b10111010000;
const P3_BITS2 = 0b00001011101;
const P3_MASK  = (1 << 11) - 1;

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

/**
 * Обчислює penalty за всіма 4 правилами за 2 проходи (B).
 *
 * Горизонтальний прохід: Rule 1H + Rule 2 + Rule 3H + Rule 4
 * Вертикальний прохід:   Rule 1V + Rule 3V
 *
 * Кожна клітина матриці читається через matrix.get() рівно один раз
 * у flat Uint8Array, далі всі правила працюють лише з flat.
 */

const calculatePenalty = (matrix) => {
  const { size } = matrix;

  const flat = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      flat[y * size + x] = matrix.get(x, y);
    }
  }

  let p1 = 0, p2 = 0, p3 = 0, p4 = 0;

  // Горизонтальний прохід: R1H + R2 + R3H + R4
  for (let y = 0; y < size; y++) {
    const base = y * size;
    let run = 1;
    let last = flat[base];
    let window = last;
    p4 += last;

    for (let x = 1; x < size; x++) {
      const c = flat[base + x];
      p4 += c;

      // R1H: run-length
      if (c === last) {
        run++;
      } else {
        if (run >= 5) p1 += 3 + run - 5;
        run = 1;
        last = c;
      }

      // R3H: sliding window
      window = ((window << 1) | c) & P3_MASK;
      if (x >= 10 && (window === P3_BITS1 || window === P3_BITS2)) p3 += 40;
    }
    if (run >= 5) p1 += 3 + run - 5;

    // R2: 2×2 блоки між поточним і наступним рядком
    if (y < size - 1) {
      const nextBase = base + size;
      for (let x = 0; x < size - 1; x++) {
        const c = flat[base + x];
        if (
          c === flat[base + x + 1] &&
          c === flat[nextBase + x] &&
          c === flat[nextBase + x + 1]
        ) p2 += 3;
      }
    }
  }

  // Вертикальний прохід: R1V + R3V
  for (let x = 0; x < size; x++) {
    let run = 1;
    let last = flat[x];
    let window = last;

    for (let y = 1; y < size; y++) {
      const c = flat[y * size + x];

      // R1V: run-length
      if (c === last) {
        run++;
      } else {
        if (run >= 5) p1 += 3 + run - 5;
        run = 1;
        last = c;
      }

      // R3V: sliding window
      window = ((window << 1) | c) & P3_MASK;
      if (y >= 10 && (window === P3_BITS1 || window === P3_BITS2)) p3 += 40;
    }
    if (run >= 5) p1 += 3 + run - 5;
  }

  // R4: відхилення від 50% темних клітин
  const percent = (p4 * 100) / (size * size);
  p4 = Math.floor(Math.abs(percent - 50) / 5) * PENALTY_WEIGHTS.RATIO;

  return p1 + p2 + p3 + p4;
};

// A: координати format bit клітин (30 позицій).
// Повинні точно відповідати тому що записує applyFormatInfo.
const getFormatPositions = (size) => {
  const positions = [];
  for (let i = 0; i < 6; i++) positions.push([8, i]);
  positions.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) positions.push([14 - i, 8]);
  for (let i = 0; i < 7; i++) positions.push([8, size - 1 - i]);
  for (let i = 0; i < 8; i++) positions.push([size - 8 + i, 8]);
  return positions;
};

// C: для кожного з 8 масок — список (x, y) незарезервованих клітин
// де maskFn = true. Обраховується один раз до циклу масок.
const precomputeMaskCells = (matrix) => {
  const { size } = matrix;
  const allYs = [];
  const allXs = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix.isReserved(x, y)) {
        allYs.push(y);
        allXs.push(x);
      }
    }
  }

  return MASK_FUNCTIONS.map((maskFn) => {
    const ys = [];
    const xs = [];
    for (let i = 0; i < allYs.length; i++) {
      if (maskFn(allYs[i], allXs[i])) {
        ys.push(allYs[i]);
        xs.push(allXs[i]);
      }
    }
    // Uint8Array: max QR size = 177 < 256
    return { ys: new Uint8Array(ys), xs: new Uint8Array(xs) };
  });
};

/**
 * Finds the best mask pattern (lowest penalty).
 *
 * A: без клонування матриці — toggle двічі = revert, зберігаємо
 *    і відновлюємо лише 30 format bit клітин.
 * B: calculatePenalty робить 2 проходи замість 6.
 * C: precomputeMaskCells — apply/revert маски без isReserved і maskFn
 *    у циклі, лише ітерація по готовому списку індексів.
 */

const findBestMask = (matrix, applyFormatFn, eccLevel) => {
  const { size } = matrix;
  let bestMask = 0;
  let lowestPenalty = Infinity;

  const maskCells = precomputeMaskCells(matrix);                          // C
  const formatPositions = getFormatPositions(size);                       // A
  const savedFormatValues = formatPositions.map(             // A
    ([x, y]) => matrix.get(x, y),
  );

  for (let mask = 0; mask < 8; mask++) {
    const { ys, xs } = maskCells[mask];

    for (let i = 0; i < ys.length; i++) matrix.toggle(xs[i], ys[i]);    // C
    applyFormatFn(matrix, eccLevel, mask);

    const penalty = calculatePenalty(matrix);                             // B

    for (let i = 0; i < ys.length; i++) matrix.toggle(xs[i], ys[i]);    // A
    for (let i = 0; i < formatPositions.length; i++) {                   // A
      const [x, y] = formatPositions[i];
      matrix.set(x, y, savedFormatValues[i], true);
    }

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
