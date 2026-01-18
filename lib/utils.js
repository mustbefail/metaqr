'use strict';

const {
  BLOCK_INFO,
  CAPACITIES,
  FORMAT_INFO,
  VERSION_INFO,
  MODE_INDICATORS,
  ALIGNMENT_POSITIONS,
} = require('./spec');

/**
 * @param {number} version - QR code version (1-40).
 * @param {EccLevel} eccLevel - Error correction level ('L', 'M', 'Q', 'H').
 * @returns {BlockInfo} - Block information for the given version and ECC level.
 */
const getBlockInfo = (version, eccLevel) => {
  const info = BLOCK_INFO[version];

  if (!info) {
    throw new TypeError(`Block info not available for version ${version}`);
  }

  const blocks = info[eccLevel];

  if (!blocks) {
    throw new TypeError(
      `ECC level ${eccLevel} not available for version ${version}`,
    );
  }

  return blocks;
};

/**
 * @param {number} version - QR code version (1-40).
 * @param {EccLevel} eccLevel - Error correction level ('L', 'M', 'Q', 'H').
 * @returns {number} - Capacity per eccLevel.
 */
const getNsym = (version, eccLevel) => {
  const cap = CAPACITIES[version];
  if (!cap) {
    throw new TypeError(`Version ${version} is out of range (1-40)`);
  }

  return cap.ecc[eccLevel];
};

/**
 *
 * @param {number} version - QR code version (1-40).
 * @param {ModeIndicator} mode - Data mode ('Byte', 'Numeric', 'Alphanumeric').
 * @returns {number|number} - Number of characters in a block of the given mode.
 */
const getCharCountSize = (version, mode) => {
  if (mode === MODE_INDICATORS.BYTE) {
    return version < 10 ? 8 : 16;
  }
  if (mode === MODE_INDICATORS.NUMERIC) {
    if (version <= 9) return 10;
    if (version <= 26) return 12;
    return 14;
  }
  if (mode === MODE_INDICATORS.ALPHANUMERIC) {
    if (version <= 9) return 9;
    if (version <= 26) return 11;
    return 13;
  }
  throw new Error(`Mode ${mode} is not supported yet`);
};

/**
 * @param {number} version - QR code version (1-40).
 * @param {EccLevel} eccLevel - Error correction level ('L', 'M', 'Q', 'H').
 * @returns {number} - Number of data codewords per block.
 */

const getDataCapacity = (version, eccLevel) => {
  const spec = CAPACITIES[version];
  if (!spec) {
    throw new TypeError(`Version ${version} is out of range (1-40)`);
  }
  return spec.total - spec.ecc[eccLevel];
};

/**
 * @param {number} version - QR code version (1-40).
 * @returns {number} - Size of the QR code matrix in pixels.
 */
const getMatrixSize = (version) => (version - 1) * 4 + 21;

/**
 * @param {number} version - QR code version (1-40).
 * @returns {number[]} - Positions of alignment patterns in the QR code matrix.
 */
const getAlignmentPatternPositions = (version) =>
  ALIGNMENT_POSITIONS[version] || [];

/**
 * @param {EccLevel} eccLevel - Error correction level ('L', 'M', 'Q', 'H').
 * @param {number} maskPattern - Mask pattern index (0-7).
 * @returns {number} - Format information bits for the given ECC
 *  level and mask pattern.
 */
const getFormatInfo = (eccLevel, maskPattern) => {
  const group = FORMAT_INFO[eccLevel];

  if (!group) {
    throw new TypeError(`ECC level ${eccLevel} is out of range (0-3)`);
  }
  if (maskPattern < 0 || maskPattern >= group.length) {
    throw new TypeError(`Invalid mask pattern: ${maskPattern}`);
  }

  return group[maskPattern];
};

/**
 * @param {number} version - QR code version (1-40).
 * @returns {number[]|null} - Version information bits, or null if version < 7.
 */
const getVersionInfo = (version) =>
  version >= 7 ? VERSION_INFO[version - 7] : null;

module.exports = {
  getBlockInfo,
  getNsym,
  getCharCountSize,
  getDataCapacity,
  getMatrixSize,
  getAlignmentPatternPositions,
  getFormatInfo,
  getVersionInfo,
};
