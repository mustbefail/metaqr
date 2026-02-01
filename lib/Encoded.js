'use strict';

const { createQrMatrix } = require('./matrix');
const { toSvg, drawToCanvas, toString } = require('./matrix/render');

class Encoded {
  #matrix;
  #version;
  #eccLevel;
  #maskPattern;
  #mode;

  constructor({ bits, version, eccLevel, maskPattern = 'auto', mode = null }) {
    if (bits.length === 0) {
      throw new TypeError('No data to encode');
    }

    const { matrix, mask } = createQrMatrix(
      bits,
      version,
      eccLevel,
      maskPattern,
    );

    this.#matrix = matrix;
    this.#version = version;
    this.#eccLevel = eccLevel;
    this.#maskPattern = mask;
    this.#mode = mode === null ? 'mixed' : mode;
  }

  get matrix() {
    return this.#matrix;
  }

  get version() {
    return this.#version;
  }

  get eccLevel() {
    return this.#eccLevel;
  }

  get mode() {
    return this.#mode;
  }

  get maskPattern() {
    return this.#maskPattern;
  }

  toSvg(svgOptions = {}) {
    const { moduleSize = 10, margin = 4 } = svgOptions;
    return toSvg(this.#matrix, moduleSize, margin);
  }

  toCanvas(canvasElement, canvasOptions = {}) {
    if (typeof drawToCanvas !== 'function') {
      throw new TypeError(
        'Canvas rendering is not supported in this environment',
      );
    }
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      throw new TypeError('Could not get 2D rendering context from canvas');
    }
    drawToCanvas(this.#matrix, ctx, canvasOptions);
  }

  toString() {
    return toString(this.#matrix);
  }
}

module.exports = { Encoded };
