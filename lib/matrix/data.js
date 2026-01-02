'use strict';

/**
 * Fills data bits into the matrix using a zigzag pattern
 */
const fillData = (matrix, bits) => {
  const size = matrix.size;
  let bitIndex = 0;
  let x = size - 1;
  let upward = true;

  while (x >= 0) {
    // skip timing pattern column
    if (x === 6) x--;

    for (let i = 0; i < size; i++) {
      const y = upward ? size - 1 - i : i;

      for (let col = 0; col < 2; col++) {
        const currentX = x - col;
        if (matrix.isReserved(currentX, y)) continue;

        if (bitIndex < bits.length) {
          matrix.set(currentX, y, bits[bitIndex++]);
        }
      }
    }

    x -= 2;
    upward = !upward;
  }
};

module.exports = { fillData };
