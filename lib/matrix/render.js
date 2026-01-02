'use strict';

/**
 * Renders matrix to SVG string
 */
const toSvg = (matrix, moduleSize = 10, quietZone = 4) => {
  const qz = quietZone * moduleSize;
  const totalSize = matrix.size * moduleSize + qz * 2;

  const rects = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.get(x, y) === 1) {
        const px = qz + x * moduleSize;
        const py = qz + y * moduleSize;
        rects.push(
          `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}"/>`,
        );
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
    `<g fill="black">${rects.join('')}</g>`,
    '</svg>',
  ].join('');
};

/**
 * Renders matrix to string (console output)
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
 * Draws the QR matrix to a generic Canvas context
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
