'use strict';

/**
 * Fills data bits into the matrix using a zigzag pattern
 * Starts from bottom-right, moves upwards in 2-column wide strips,
 * then downwards, skipping reserved areas (finder patterns, timing lines).
 *
 * @param {QrMatrix} matrix - The matrix to fill
 *                            (must have static patterns placed).
 * @param {BitBuffer} bitsBuffer - BitBuffer containing data and ECC bits.
 */

const TIMING_COLUMN = 6;
const DATA_COLUMNS_COUNT = 2;

const fillData = (matrix, bitsBuffer) => {
  const size = matrix.size;
  const totalBits = bitsBuffer.length();
  let bitIndex = 0;
  let rightCol = size - 1;
  let movingUp = true;

  while (rightCol > 0) {
    if (rightCol === TIMING_COLUMN) rightCol--;

    const leftCol = rightCol - 1;

    for (let rowStep = 0; rowStep < size; rowStep++) {
      const row = movingUp ? size - 1 - rowStep : rowStep;
      const cols = [rightCol, leftCol];

      for (const col of cols) {
        if (matrix.isReserved(col, row)) continue;

        if (bitIndex < totalBits) {
          matrix.set(col, row, bitsBuffer.getBit(bitIndex++));
        }
      }
    }

    rightCol -= DATA_COLUMNS_COUNT;
    movingUp = !movingUp;
  }
};

module.exports = { fillData };
