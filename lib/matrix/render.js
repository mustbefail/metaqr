'use strict';

/**
 * @typedef {import('../../types').QrMatrix} QrMatrix
 */

/**
 * Renders matrix to SVG string.
 * @param {QrMatrix} matrix
 * @param {number} [moduleSize=10]
 * @param {number} [quietZone=4]
 * @returns {string} SVG content.
 */
const toSvg = (matrix, moduleSize = 10, quietZone = 4) => {
  const qz = quietZone * moduleSize;
  const size = matrix.size;
  const totalSize = size * moduleSize + qz * 2;

  let d = '';

  for (let y = 0; y < size; y++) {
    const py = qz + y * moduleSize;
    for (let x = 0; x < size; x++) {
      if (matrix.get(x, y) === 1) {
        const px = qz + x * moduleSize;
        const x2 = px + moduleSize;
        const y2 = py + moduleSize;
        d += `M${px} ${py}H${x2}V${y2}H${px}Z`;
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<path d="${d}" fill="#000000"/>`,
    `</svg>`,
  ].join('');
};

/**
 * Renders matrix to string (console output).
 * @param {QrMatrix} matrix
 * @returns {string}
 */
const toString = (matrix) => {
  let result = '';
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      result += matrix.get(x, y) === 1 ? '██' : '  ';
    }
    result += '\n';
  }
  return result;
};

/**
 * Draws the QR matrix to a generic Canvas context.
 * @param {QrMatrix} matrix
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} [options]
 * @param {number} [options.cellSize=10]
 * @param {number} [options.margin=4]
 * @param {string} [options.colorDark='#000000']
 * @param {string} [options.colorLight='#ffffff']
 */
const drawToCanvas = (matrix, ctx, options = {}) => {
  const {
    cellSize = 10,
    margin = 4,
    colorDark = '#000000',
    colorLight = '#ffffff',
  } = options;

  const size = matrix.size;
  const quietZone = margin * cellSize;
  const totalSize = size * cellSize + quietZone * 2;

  if (ctx.canvas) {
    ctx.canvas.width = totalSize;
    ctx.canvas.height = totalSize;
  }

  ctx.fillStyle = colorLight;
  ctx.fillRect(0, 0, totalSize, totalSize);

  ctx.fillStyle = colorDark;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix.get(x, y) === 1) {
        const px = quietZone + x * cellSize;
        const py = quietZone + y * cellSize;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }
  }
};

module.exports = {
  toSvg,
  toString,
  drawToCanvas,
};
