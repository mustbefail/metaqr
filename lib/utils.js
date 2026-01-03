const { BLOCK_INFO, CAPACITIES, FORMAT_INFO, VERSION_INFO, MODES, ALIGNMENT_POSITIONS } = require('./spec')

const getBlockInfo = (version, eccLevel) => {
  const info = BLOCK_INFO[version];
  if (!info) throw new Error(`Block info not available for version ${version}`);
  return info[eccLevel] || [];
};

const getNsym = (version, eccLevel) => CAPACITIES[version].ecc[eccLevel];

const getCharCountSize = (version, mode) => {
  if (mode === MODES.BYTE) {
    return version < 10 ? 8 : 16;
  }
  if (mode === MODES.NUMERIC) {
    if (version <= 9) return 10;
    if (version <= 26) return 12;
    return 14;
  }
  if (mode === MODES.ALPHANUMERIC) {
    if (version <= 9) return 9;
    if (version <= 26) return 11;
    return 13;
  }
  throw new Error(`Mode ${mode} is not supported yet`);
};

const getDataCapacity = (version, eccLevel) => {
  const spec = CAPACITIES[version];
  if (!spec) throw new Error(`Version ${version} is out of range (1-40)`);
  return spec.total - spec.ecc[eccLevel];
};

const getMatrixSize = (version) => (version - 1) * 4 + 21;

const getAlignmentPatternPositions = (version) =>
  ALIGNMENT_POSITIONS[version] || [];

const getFormatInfo = (eccLevel, maskPattern) =>
  FORMAT_INFO[(eccLevel << 3) | maskPattern];

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
