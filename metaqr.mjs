// undefined
// Version 1.0.0 metaqr MIT LicenseCopyright (c) 2017-2025 Metarhia contributors (full list in AUTHORS file)Permission is hereby granted, free of charge, to any person obtaining a copyof this software and associated documentation files (the "Software"), to dealin the Software without restriction, including without limitation the rightsto use, copy, modify, merge, publish, distribute, sublicense, and/or sellcopies of the Software, and to permit persons to whom the Software isfurnished to do so, subject to the following conditions:The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS ORIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THEAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THESOFTWARE.

// spec.js

// https://www.arscreatio.com/repositorio/images/n_23/SC031-N-1915-18004Text.pdf
// ISO/IEC CD 18004

/**
 * QR Code Error Correction Levels
 * Values match the standard bit representation in the Format Information.
 */
const ECC_LEVELS = {
  L: 1, // Low (7%)
  M: 0, // Medium (15%)
  Q: 3, // Quartile (25%)
  H: 2, // High (30%)
};

/**
 * QR Code Encoding Modes
 */
const MODES = {
  NUMERIC: 0b0001,
  ALPHANUMERIC: 0b0010,
  BYTE: 0b0100,
};

/**
 * Full Capacity table for Versions 1-40
 * total: Total number of codewords (bytes)
 * ecc: Number of ECC codewords for levels [L, M, Q, H] (mapped to 1, 0, 3, 2)
 */
const CAPACITIES = {
  1: { total: 26, ecc: { 1: 7, 0: 10, 3: 13, 2: 17 } },
  2: { total: 44, ecc: { 1: 10, 0: 16, 3: 22, 2: 28 } },
  3: { total: 70, ecc: { 1: 15, 0: 26, 3: 36, 2: 44 } },
  4: { total: 100, ecc: { 1: 20, 0: 36, 3: 52, 2: 64 } },
  5: { total: 134, ecc: { 1: 26, 0: 48, 3: 72, 2: 88 } },
  6: { total: 172, ecc: { 1: 36, 0: 64, 3: 96, 2: 112 } },
  7: { total: 196, ecc: { 1: 40, 0: 72, 3: 108, 2: 130 } },
  8: { total: 242, ecc: { 1: 48, 0: 88, 3: 132, 2: 156 } },
  9: { total: 292, ecc: { 1: 60, 0: 110, 3: 160, 2: 192 } },
  10: { total: 346, ecc: { 1: 72, 0: 130, 3: 192, 2: 224 } },
  11: { total: 404, ecc: { 1: 80, 0: 150, 3: 224, 2: 264 } },
  12: { total: 466, ecc: { 1: 96, 0: 176, 3: 260, 2: 308 } },
  13: { total: 532, ecc: { 1: 104, 0: 198, 3: 288, 2: 352 } },
  14: { total: 581, ecc: { 1: 120, 0: 216, 3: 320, 2: 384 } },
  15: { total: 655, ecc: { 1: 132, 0: 240, 3: 360, 2: 432 } },
  16: { total: 733, ecc: { 1: 144, 0: 280, 3: 408, 2: 480 } },
  17: { total: 815, ecc: { 1: 168, 0: 308, 3: 448, 2: 532 } },
  18: { total: 901, ecc: { 1: 180, 0: 338, 3: 504, 2: 588 } },
  19: { total: 991, ecc: { 1: 196, 0: 364, 3: 546, 2: 650 } },
  20: { total: 1085, ecc: { 1: 224, 0: 416, 3: 600, 2: 700 } },
  21: { total: 1156, ecc: { 1: 224, 0: 442, 3: 644, 2: 750 } },
  22: { total: 1258, ecc: { 1: 252, 0: 476, 3: 690, 2: 816 } },
  23: { total: 1364, ecc: { 1: 270, 0: 504, 3: 750, 2: 900 } },
  24: { total: 1474, ecc: { 1: 300, 0: 560, 3: 810, 2: 960 } },
  25: { total: 1588, ecc: { 1: 312, 0: 588, 3: 870, 2: 1050 } },
  26: { total: 1706, ecc: { 1: 336, 0: 644, 3: 952, 2: 1140 } },
  27: { total: 1828, ecc: { 1: 360, 0: 700, 3: 1020, 2: 1200 } },
  28: { total: 1921, ecc: { 1: 390, 0: 728, 3: 1050, 2: 1260 } },
  29: { total: 2051, ecc: { 1: 420, 0: 784, 3: 1140, 2: 1350 } },
  30: { total: 2185, ecc: { 1: 450, 0: 812, 3: 1200, 2: 1440 } },
  31: { total: 2323, ecc: { 1: 480, 0: 868, 3: 1290, 2: 1530 } },
  32: { total: 2465, ecc: { 1: 510, 0: 924, 3: 1350, 2: 1620 } },
  33: { total: 2611, ecc: { 1: 540, 0: 980, 3: 1440, 2: 1710 } },
  34: { total: 2761, ecc: { 1: 570, 0: 1036, 3: 1530, 2: 1800 } },
  35: { total: 2876, ecc: { 1: 570, 0: 1064, 3: 1590, 2: 1890 } },
  36: { total: 3034, ecc: { 1: 600, 0: 1120, 3: 1680, 2: 1980 } },
  37: { total: 3196, ecc: { 1: 630, 0: 1204, 3: 1770, 2: 2100 } },
  38: { total: 3362, ecc: { 1: 660, 0: 1260, 3: 1860, 2: 2220 } },
  39: { total: 3532, ecc: { 1: 720, 0: 1316, 3: 1950, 2: 2310 } },
  40: { total: 3706, ecc: { 1: 750, 0: 1372, 3: 2040, 2: 2430 } },
};

// Alignment pattern positions for all versions (1-40)
const ALIGNMENT_POSITIONS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94],
  22: [6, 26, 50, 74, 98],
  23: [6, 30, 54, 78, 102],
  24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110],
  26: [6, 30, 58, 86, 114],
  27: [6, 34, 62, 90, 118],
  28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126],
  30: [6, 26, 52, 78, 104, 130],
  31: [6, 30, 56, 82, 108, 134],
  32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142],
  34: [6, 34, 62, 90, 118, 146],
  35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154],
  37: [6, 28, 54, 80, 106, 132, 158],
  38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166],
  40: [6, 30, 58, 86, 114, 142, 170],
};

// Format info lookup table (ECC + mask -> 15-bit BCH encoded value)
const FORMAT_INFO = [
  0x5412,
  0x5125,
  0x5e7c,
  0x5b4b,
  0x45f9,
  0x40ce,
  0x4f97,
  0x4aa0, // M 0-7
  0x77c4,
  0x72f3,
  0x7daa,
  0x789d,
  0x662f,
  0x6318,
  0x6c41,
  0x6976, // L 0-7
  0x1689,
  0x13be,
  0x1ce7,
  0x19d0,
  0x0762,
  0x0255,
  0x0d0c,
  0x083b, // H 0-7
  0x355f,
  0x3068,
  0x3f31,
  0x3a06,
  0x24b4,
  0x2183,
  0x2eda,
  0x2bed, // Q 0-7
];

// Version info for versions 7-40 (18-bit BCH encoded)
const VERSION_INFO = [
  0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d,
  0x0f928, 0x10b78, 0x1145d, 0x12a17, 0x13532, 0x149a6, 0x15683, 0x168c9,
  0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a, 0x1d33f, 0x1ed75,
  0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b, 0x2542e, 0x26a64,
  0x27541, 0x28c69,
];

const getNsym = (version, eccLevel) => CAPACITIES[version].ecc[eccLevel];

const getCharCountSize = (version, mode) => {
  if (mode === MODES.BYTE) {
    return version < 10 ? 8 : 16;
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

// Block structure for each version and ECC level
// Format: { blocks: [{count, dataWords, eccWords}...] }
const BLOCK_INFO = {
  1: {
    0: [{ count: 1, dataWords: 16, eccWords: 10 }], // M
    1: [{ count: 1, dataWords: 19, eccWords: 7 }], // L
    2: [{ count: 1, dataWords: 9, eccWords: 17 }], // H
    3: [{ count: 1, dataWords: 13, eccWords: 13 }], // Q
  },
  2: {
    0: [{ count: 1, dataWords: 28, eccWords: 16 }],
    1: [{ count: 1, dataWords: 34, eccWords: 10 }],
    2: [{ count: 1, dataWords: 16, eccWords: 28 }],
    3: [{ count: 1, dataWords: 22, eccWords: 22 }],
  },
  3: {
    0: [{ count: 1, dataWords: 44, eccWords: 26 }],
    1: [{ count: 1, dataWords: 55, eccWords: 15 }],
    2: [{ count: 2, dataWords: 13, eccWords: 22 }],
    3: [{ count: 2, dataWords: 17, eccWords: 18 }],
  },
  4: {
    0: [{ count: 2, dataWords: 32, eccWords: 18 }],
    1: [{ count: 1, dataWords: 80, eccWords: 20 }],
    2: [{ count: 4, dataWords: 9, eccWords: 16 }],
    3: [{ count: 2, dataWords: 24, eccWords: 26 }],
  },
  5: {
    0: [{ count: 2, dataWords: 43, eccWords: 24 }],
    1: [{ count: 1, dataWords: 108, eccWords: 26 }],
    2: [
      { count: 2, dataWords: 11, eccWords: 22 },
      { count: 2, dataWords: 12, eccWords: 22 },
    ],
    3: [
      { count: 2, dataWords: 15, eccWords: 18 },
      { count: 2, dataWords: 16, eccWords: 18 },
    ],
  },
  6: {
    0: [{ count: 4, dataWords: 27, eccWords: 16 }],
    1: [{ count: 2, dataWords: 68, eccWords: 18 }],
    2: [{ count: 4, dataWords: 15, eccWords: 28 }],
    3: [{ count: 4, dataWords: 19, eccWords: 24 }],
  },
  7: {
    0: [{ count: 4, dataWords: 31, eccWords: 18 }],
    1: [{ count: 2, dataWords: 78, eccWords: 20 }],
    2: [
      { count: 4, dataWords: 13, eccWords: 26 },
      { count: 1, dataWords: 14, eccWords: 26 },
    ],
    3: [
      { count: 2, dataWords: 14, eccWords: 18 },
      { count: 4, dataWords: 15, eccWords: 18 },
    ],
  },
  8: {
    0: [
      { count: 2, dataWords: 38, eccWords: 22 },
      { count: 2, dataWords: 39, eccWords: 22 },
    ],
    1: [{ count: 2, dataWords: 97, eccWords: 24 }],
    2: [
      { count: 4, dataWords: 14, eccWords: 26 },
      { count: 2, dataWords: 15, eccWords: 26 },
    ],
    3: [
      { count: 4, dataWords: 18, eccWords: 22 },
      { count: 2, dataWords: 19, eccWords: 22 },
    ],
  },
  9: {
    0: [
      { count: 3, dataWords: 36, eccWords: 22 },
      { count: 2, dataWords: 37, eccWords: 22 },
    ],
    1: [{ count: 2, dataWords: 116, eccWords: 30 }],
    2: [
      { count: 4, dataWords: 12, eccWords: 24 },
      { count: 4, dataWords: 13, eccWords: 24 },
    ],
    3: [
      { count: 4, dataWords: 16, eccWords: 20 },
      { count: 4, dataWords: 17, eccWords: 20 },
    ],
  },
  10: {
    0: [
      { count: 4, dataWords: 43, eccWords: 26 },
      { count: 1, dataWords: 44, eccWords: 26 },
    ],
    1: [
      { count: 2, dataWords: 68, eccWords: 18 },
      { count: 2, dataWords: 69, eccWords: 18 },
    ],
    2: [
      { count: 6, dataWords: 15, eccWords: 28 },
      { count: 2, dataWords: 16, eccWords: 28 },
    ],
    3: [
      { count: 6, dataWords: 19, eccWords: 24 },
      { count: 2, dataWords: 20, eccWords: 24 },
    ],
  },
  11: {
    0: [
      { count: 1, dataWords: 50, eccWords: 30 },
      { count: 4, dataWords: 51, eccWords: 30 },
    ],
    1: [{ count: 4, dataWords: 81, eccWords: 20 }],
    2: [
      { count: 3, dataWords: 12, eccWords: 24 },
      { count: 8, dataWords: 13, eccWords: 24 },
    ],
    3: [
      { count: 4, dataWords: 22, eccWords: 28 },
      { count: 4, dataWords: 23, eccWords: 28 },
    ],
  },
  12: {
    0: [
      { count: 6, dataWords: 36, eccWords: 22 },
      { count: 2, dataWords: 37, eccWords: 22 },
    ],
    1: [
      { count: 2, dataWords: 92, eccWords: 24 },
      { count: 2, dataWords: 93, eccWords: 24 },
    ],
    2: [
      { count: 7, dataWords: 14, eccWords: 26 },
      { count: 4, dataWords: 15, eccWords: 26 },
    ],
    3: [
      { count: 4, dataWords: 20, eccWords: 26 },
      { count: 6, dataWords: 21, eccWords: 26 },
    ],
  },
  13: {
    0: [
      { count: 8, dataWords: 37, eccWords: 22 },
      { count: 1, dataWords: 38, eccWords: 22 },
    ],
    1: [{ count: 4, dataWords: 107, eccWords: 26 }],
    2: [
      { count: 12, dataWords: 11, eccWords: 22 },
      { count: 4, dataWords: 12, eccWords: 22 },
    ],
    3: [
      { count: 8, dataWords: 20, eccWords: 24 },
      { count: 4, dataWords: 21, eccWords: 24 },
    ],
  },
  14: {
    0: [
      { count: 4, dataWords: 40, eccWords: 24 },
      { count: 5, dataWords: 41, eccWords: 24 },
    ],
    1: [
      { count: 3, dataWords: 115, eccWords: 30 },
      { count: 1, dataWords: 116, eccWords: 30 },
    ],
    2: [
      { count: 11, dataWords: 12, eccWords: 24 },
      { count: 5, dataWords: 13, eccWords: 24 },
    ],
    3: [
      { count: 11, dataWords: 16, eccWords: 20 },
      { count: 5, dataWords: 17, eccWords: 20 },
    ],
  },
  15: {
    0: [
      { count: 5, dataWords: 41, eccWords: 24 },
      { count: 5, dataWords: 42, eccWords: 24 },
    ],
    1: [
      { count: 5, dataWords: 87, eccWords: 22 },
      { count: 1, dataWords: 88, eccWords: 22 },
    ],
    2: [
      { count: 11, dataWords: 12, eccWords: 24 },
      { count: 7, dataWords: 13, eccWords: 24 },
    ],
    3: [
      { count: 5, dataWords: 24, eccWords: 30 },
      { count: 7, dataWords: 25, eccWords: 30 },
    ],
  },
  16: {
    0: [
      { count: 7, dataWords: 45, eccWords: 28 },
      { count: 3, dataWords: 46, eccWords: 28 },
    ],
    1: [
      { count: 5, dataWords: 98, eccWords: 24 },
      { count: 1, dataWords: 99, eccWords: 24 },
    ],
    2: [
      { count: 3, dataWords: 15, eccWords: 30 },
      { count: 13, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 15, dataWords: 19, eccWords: 24 },
      { count: 2, dataWords: 20, eccWords: 24 },
    ],
  },
  17: {
    0: [
      { count: 10, dataWords: 46, eccWords: 28 },
      { count: 1, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 1, dataWords: 107, eccWords: 28 },
      { count: 5, dataWords: 108, eccWords: 28 },
    ],
    2: [
      { count: 2, dataWords: 14, eccWords: 28 },
      { count: 17, dataWords: 15, eccWords: 28 },
    ],
    3: [
      { count: 1, dataWords: 22, eccWords: 28 },
      { count: 15, dataWords: 23, eccWords: 28 },
    ],
  },
  18: {
    0: [
      { count: 9, dataWords: 43, eccWords: 26 },
      { count: 4, dataWords: 44, eccWords: 26 },
    ],
    1: [
      { count: 5, dataWords: 120, eccWords: 30 },
      { count: 1, dataWords: 121, eccWords: 30 },
    ],
    2: [
      { count: 2, dataWords: 14, eccWords: 28 },
      { count: 19, dataWords: 15, eccWords: 28 },
    ],
    3: [
      { count: 17, dataWords: 22, eccWords: 28 },
      { count: 1, dataWords: 23, eccWords: 28 },
    ],
  },
  19: {
    0: [
      { count: 3, dataWords: 44, eccWords: 26 },
      { count: 11, dataWords: 45, eccWords: 26 },
    ],
    1: [
      { count: 3, dataWords: 113, eccWords: 28 },
      { count: 4, dataWords: 114, eccWords: 28 },
    ],
    2: [
      { count: 9, dataWords: 13, eccWords: 26 },
      { count: 16, dataWords: 14, eccWords: 26 },
    ],
    3: [
      { count: 17, dataWords: 21, eccWords: 26 },
      { count: 4, dataWords: 22, eccWords: 26 },
    ],
  },
  20: {
    0: [
      { count: 3, dataWords: 41, eccWords: 26 },
      { count: 13, dataWords: 42, eccWords: 26 },
    ],
    1: [
      { count: 3, dataWords: 107, eccWords: 28 },
      { count: 5, dataWords: 108, eccWords: 28 },
    ],
    2: [
      { count: 15, dataWords: 15, eccWords: 30 },
      { count: 10, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 15, dataWords: 24, eccWords: 30 },
      { count: 5, dataWords: 25, eccWords: 30 },
    ],
  },
  21: {
    0: [{ count: 17, dataWords: 42, eccWords: 26 }],
    1: [
      { count: 4, dataWords: 116, eccWords: 28 },
      { count: 4, dataWords: 117, eccWords: 28 },
    ],
    2: [
      { count: 19, dataWords: 16, eccWords: 30 },
      { count: 6, dataWords: 17, eccWords: 30 },
    ],
    3: [
      { count: 17, dataWords: 22, eccWords: 28 },
      { count: 6, dataWords: 23, eccWords: 28 },
    ],
  },
  22: {
    0: [{ count: 17, dataWords: 46, eccWords: 28 }],
    1: [
      { count: 2, dataWords: 111, eccWords: 28 },
      { count: 7, dataWords: 112, eccWords: 28 },
    ],
    2: [{ count: 34, dataWords: 13, eccWords: 24 }],
    3: [
      { count: 7, dataWords: 24, eccWords: 30 },
      { count: 16, dataWords: 25, eccWords: 30 },
    ],
  },
  23: {
    0: [
      { count: 4, dataWords: 47, eccWords: 28 },
      { count: 14, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 4, dataWords: 121, eccWords: 30 },
      { count: 5, dataWords: 122, eccWords: 30 },
    ],
    2: [
      { count: 16, dataWords: 15, eccWords: 30 },
      { count: 14, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 11, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  24: {
    0: [
      { count: 6, dataWords: 45, eccWords: 28 },
      { count: 14, dataWords: 46, eccWords: 28 },
    ],
    1: [
      { count: 6, dataWords: 117, eccWords: 30 },
      { count: 4, dataWords: 118, eccWords: 30 },
    ],
    2: [
      { count: 30, dataWords: 16, eccWords: 30 },
      { count: 2, dataWords: 17, eccWords: 30 },
    ],
    3: [
      { count: 11, dataWords: 24, eccWords: 30 },
      { count: 16, dataWords: 25, eccWords: 30 },
    ],
  },
  25: {
    0: [
      { count: 8, dataWords: 47, eccWords: 28 },
      { count: 13, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 8, dataWords: 106, eccWords: 26 },
      { count: 4, dataWords: 107, eccWords: 26 },
    ],
    2: [
      { count: 22, dataWords: 15, eccWords: 30 },
      { count: 13, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 7, dataWords: 24, eccWords: 30 },
      { count: 22, dataWords: 25, eccWords: 30 },
    ],
  },
  26: {
    0: [
      { count: 19, dataWords: 46, eccWords: 28 },
      { count: 4, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 10, dataWords: 114, eccWords: 28 },
      { count: 2, dataWords: 115, eccWords: 28 },
    ],
    2: [
      { count: 33, dataWords: 15, eccWords: 30 },
      { count: 5, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 28, dataWords: 22, eccWords: 28 },
      { count: 6, dataWords: 23, eccWords: 28 },
    ],
  },
  27: {
    0: [
      { count: 22, dataWords: 45, eccWords: 28 },
      { count: 3, dataWords: 46, eccWords: 28 },
    ],
    1: [
      { count: 8, dataWords: 122, eccWords: 30 },
      { count: 4, dataWords: 123, eccWords: 30 },
    ],
    2: [
      { count: 12, dataWords: 15, eccWords: 30 },
      { count: 28, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 8, dataWords: 23, eccWords: 30 },
      { count: 26, dataWords: 24, eccWords: 30 },
    ],
  },
  28: {
    0: [
      { count: 3, dataWords: 45, eccWords: 28 },
      { count: 23, dataWords: 46, eccWords: 28 },
    ],
    1: [
      { count: 3, dataWords: 117, eccWords: 30 },
      { count: 10, dataWords: 118, eccWords: 30 },
    ],
    2: [
      { count: 11, dataWords: 15, eccWords: 30 },
      { count: 31, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 4, dataWords: 24, eccWords: 30 },
      { count: 31, dataWords: 25, eccWords: 30 },
    ],
  },
  29: {
    0: [
      { count: 21, dataWords: 45, eccWords: 28 },
      { count: 7, dataWords: 46, eccWords: 28 },
    ],
    1: [
      { count: 7, dataWords: 116, eccWords: 30 },
      { count: 7, dataWords: 117, eccWords: 30 },
    ],
    2: [
      { count: 19, dataWords: 15, eccWords: 30 },
      { count: 26, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 1, dataWords: 23, eccWords: 30 },
      { count: 37, dataWords: 24, eccWords: 30 },
    ],
  },
  30: {
    0: [
      { count: 19, dataWords: 47, eccWords: 28 },
      { count: 10, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 5, dataWords: 115, eccWords: 30 },
      { count: 10, dataWords: 116, eccWords: 30 },
    ],
    2: [
      { count: 23, dataWords: 15, eccWords: 30 },
      { count: 25, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 15, dataWords: 24, eccWords: 30 },
      { count: 25, dataWords: 25, eccWords: 30 },
    ],
  },
  31: {
    0: [
      { count: 2, dataWords: 46, eccWords: 28 },
      { count: 29, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 13, dataWords: 115, eccWords: 30 },
      { count: 3, dataWords: 116, eccWords: 30 },
    ],
    2: [
      { count: 23, dataWords: 15, eccWords: 30 },
      { count: 28, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 42, dataWords: 24, eccWords: 30 },
      { count: 1, dataWords: 25, eccWords: 30 },
    ],
  },
  32: {
    0: [
      { count: 10, dataWords: 46, eccWords: 28 },
      { count: 23, dataWords: 47, eccWords: 28 },
    ],
    1: [{ count: 17, dataWords: 115, eccWords: 30 }],
    2: [
      { count: 19, dataWords: 15, eccWords: 30 },
      { count: 35, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 10, dataWords: 24, eccWords: 30 },
      { count: 35, dataWords: 25, eccWords: 30 },
    ],
  },
  33: {
    0: [
      { count: 14, dataWords: 46, eccWords: 28 },
      { count: 21, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 17, dataWords: 115, eccWords: 30 },
      { count: 1, dataWords: 116, eccWords: 30 },
    ],
    2: [
      { count: 11, dataWords: 15, eccWords: 30 },
      { count: 46, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 29, dataWords: 24, eccWords: 30 },
      { count: 19, dataWords: 25, eccWords: 30 },
    ],
  },
  34: {
    0: [
      { count: 14, dataWords: 46, eccWords: 28 },
      { count: 23, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 13, dataWords: 115, eccWords: 30 },
      { count: 6, dataWords: 116, eccWords: 30 },
    ],
    2: [
      { count: 59, dataWords: 16, eccWords: 30 },
      { count: 1, dataWords: 17, eccWords: 30 },
    ],
    3: [
      { count: 44, dataWords: 24, eccWords: 30 },
      { count: 7, dataWords: 25, eccWords: 30 },
    ],
  },
  35: {
    0: [
      { count: 12, dataWords: 47, eccWords: 28 },
      { count: 26, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 12, dataWords: 121, eccWords: 30 },
      { count: 7, dataWords: 122, eccWords: 30 },
    ],
    2: [
      { count: 22, dataWords: 15, eccWords: 30 },
      { count: 41, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 39, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  36: {
    0: [
      { count: 6, dataWords: 47, eccWords: 28 },
      { count: 34, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 6, dataWords: 121, eccWords: 30 },
      { count: 14, dataWords: 122, eccWords: 30 },
    ],
    2: [
      { count: 2, dataWords: 15, eccWords: 30 },
      { count: 64, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 46, dataWords: 24, eccWords: 30 },
      { count: 10, dataWords: 25, eccWords: 30 },
    ],
  },
  37: {
    0: [
      { count: 29, dataWords: 46, eccWords: 28 },
      { count: 14, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 17, dataWords: 122, eccWords: 30 },
      { count: 4, dataWords: 123, eccWords: 30 },
    ],
    2: [
      { count: 24, dataWords: 15, eccWords: 30 },
      { count: 46, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 49, dataWords: 24, eccWords: 30 },
      { count: 10, dataWords: 25, eccWords: 30 },
    ],
  },
  38: {
    0: [
      { count: 13, dataWords: 46, eccWords: 28 },
      { count: 32, dataWords: 47, eccWords: 28 },
    ],
    1: [
      { count: 4, dataWords: 122, eccWords: 30 },
      { count: 18, dataWords: 123, eccWords: 30 },
    ],
    2: [
      { count: 42, dataWords: 15, eccWords: 30 },
      { count: 32, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 48, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  39: {
    0: [
      { count: 40, dataWords: 47, eccWords: 28 },
      { count: 7, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 20, dataWords: 117, eccWords: 30 },
      { count: 4, dataWords: 118, eccWords: 30 },
    ],
    2: [
      { count: 10, dataWords: 15, eccWords: 30 },
      { count: 67, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 43, dataWords: 24, eccWords: 30 },
      { count: 22, dataWords: 25, eccWords: 30 },
    ],
  },
  40: {
    0: [
      { count: 18, dataWords: 47, eccWords: 28 },
      { count: 31, dataWords: 48, eccWords: 28 },
    ],
    1: [
      { count: 19, dataWords: 118, eccWords: 30 },
      { count: 6, dataWords: 119, eccWords: 30 },
    ],
    2: [
      { count: 20, dataWords: 15, eccWords: 30 },
      { count: 61, dataWords: 16, eccWords: 30 },
    ],
    3: [
      { count: 34, dataWords: 24, eccWords: 30 },
      { count: 34, dataWords: 25, eccWords: 30 },
    ],
  },
};

const getBlockInfo = (version, eccLevel) => {
  const info = BLOCK_INFO[version];
  if (!info) throw new Error(`Block info not available for version ${version}`);
  return info[eccLevel] || [];
};

export {
  ECC_LEVELS,
  MODES,
  CAPACITIES,
  ALIGNMENT_POSITIONS,
  FORMAT_INFO,
  VERSION_INFO,
  BLOCK_INFO,
  getNsym,
  getCharCountSize,
  getDataCapacity,
  getMatrixSize,
  getAlignmentPatternPositions,
  getFormatInfo,
  getVersionInfo,
  getBlockInfo,
};

// matrix/data.js

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

export { fillData };

// matrix/format.js

const applyFormatInfo = (matrix, eccLevel, maskPattern) => {
  const formatBits = getFormatInfo(eccLevel, maskPattern);
  const size = matrix.size;

  // First copy: around the top-left finder
  for (let i = 0; i < 6; i++) {
    matrix.set(8, i, (formatBits >> i) & 1, true);
  }
  matrix.set(8, 7, (formatBits >> 6) & 1, true);
  matrix.set(8, 8, (formatBits >> 7) & 1, true);
  matrix.set(7, 8, (formatBits >> 8) & 1, true);

  for (let i = 9; i < 15; i++) {
    matrix.set(14 - i, 8, (formatBits >> i) & 1, true);
  }

  // Second copy: bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix.set(8, size - 1 - i, (formatBits >> i) & 1, true);
  }

  for (let i = 0; i < 8; i++) {
    matrix.set(size - 8 + i, 8, (formatBits >> (7 + i)) & 1, true);
  }
};

const applyVersionInfo = (matrix, version) => {
  if (version < 7) return;

  const versionBits = getVersionInfo(version);
  const size = matrix.size;

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      const bitIndex = i * 3 + j; // 0..17
      const bit = (versionBits >> bitIndex) & 1;

      // Top-right (3x6)
      matrix.set(size - 11 + j, i, bit, true);

      // Bottom-left (6x3)
      matrix.set(i, size - 11 + j, bit, true);
    }
  }
};

export {
  applyFormatInfo,
  applyVersionInfo,
};

// matrix/mask.js

/**
 * Mask pattern formulas (ISO 18004 Table 10)
 */
const MASK_FUNCTIONS = [
  (i, j) => (i + j) % 2 === 0,
  (i, _) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

/**
 * Applies a mask pattern to matrix (only non-reserved modules)
 */
const applyMask = (matrix, pattern) => {
  const maskFn = MASK_FUNCTIONS[pattern];
  const size = matrix.size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix.isReserved(x, y) && maskFn(y, x)) {
        matrix.toggle(x, y);
      }
    }
  }
};

/**
 * Calculates penalty score for a masked matrix (ISO 18004 Section 8.8)
 */
const calculatePenalty = (matrix) =>
  penaltyRule1(matrix) +
  penaltyRule2(matrix) +
  penaltyRule3(matrix) +
  penaltyRule4(matrix);
// Rule 1: Adjacent modules in row/column with the same color
const penaltyRule1 = (matrix) => {
  const size = matrix.size;
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

// Rule 2: 2x2 blocks of the same color
const penaltyRule2 = (matrix) => {
  const size = matrix.size;
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

// Rule 3: Finder-like patterns (1:1:3:1:1)
const penaltyRule3 = (matrix) => {
  const size = matrix.size;
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

// Rule 4: Proportion of dark modules
const penaltyRule4 = (matrix) => {
  const size = matrix.size;
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

/**
 * Finds the best mask pattern by trying all 8 and selecting the lowest penalty
 */
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

export {
  applyMask,
  calculatePenalty,
  findBestMask,
  MASK_FUNCTIONS,
};

// matrix/patterns.js

/**
 * Places a finder pattern at a given position
 */
const placeFinderPattern = (matrix, originX, originY) => {
  // Separator (white border)
  const sepX = originX === 0 ? 0 : originX - 1;
  const sepY = originY === 0 ? 0 : originY - 1;

  fillRect(matrix, sepX, sepY, 8, 8, 0, true);
  // Outer black square
  fillRect(matrix, originX, originY, 7, 7, 1, true);
  // Inner white square
  fillRect(matrix, originX + 1, originY + 1, 5, 5, 0, true);
  // Center black square
  fillRect(matrix, originX + 2, originY + 2, 3, 3, 1, true);
};

/**
 * Places alignment pattern centered at given position
 *
 * IMPORTANT: Cannot decide "place/not place" based on matrix.isReserved(centerX, centerY),
 * because timing/format/other reserved areas may mark the center as reserved.
 * According to the standard, we only skip 3 corners that overlap with finder patterns.
 */
const placeAlignmentPattern = (matrix, centerX, centerY) => {
  const size = matrix.size;

  const overlapsTopLeftFinder = centerX === 6 && centerY === 6;
  const overlapsTopRightFinder = centerX === size - 7 && centerY === 6;
  const overlapsBottomLeftFinder = centerX === 6 && centerY === size - 7;

  if (
    overlapsTopLeftFinder ||
    overlapsTopRightFinder ||
    overlapsBottomLeftFinder
  ) { return; }

  // black 5x5
  fillRect(matrix, centerX - 2, centerY - 2, 5, 5, 1, true);
  // white 3x3
  fillRect(matrix, centerX - 1, centerY - 1, 3, 3, 0, true);
  // black center
  matrix.set(centerX, centerY, 1, true);
};

/**
 * Places timing patterns (horizontal and vertical)
 */
const placeTimingPatterns = (matrix, version) => {
  const size = matrix.size;

  // Horizontal timing (row 6)
  for (let x = 8; x < size - 8; x++) {
    matrix.set(x, 6, x % 2 === 0 ? 1 : 0, true);
  }

  // Vertical timing (column 6)
  for (let y = 8; y < size - 8; y++) {
    matrix.set(6, y, y % 2 === 0 ? 1 : 0, true);
  }

  // Dark module
  matrix.set(8, 4 * version + 9, 1, true);
};

/**
 * Reserves space for format and version info (to be filled later)
 */
const reserveInfoAreas = (matrix, version) => {
  const size = matrix.size;

  // Format info around the top-left finder
  for (let i = 0; i < 9; i++) {
    if (!matrix.isReserved(8, i)) matrix.set(8, i, 0, true);
    if (!matrix.isReserved(i, 8)) matrix.set(i, 8, 0, true);
  }

  // Format info near the bottom-left and top-right finders
  for (let i = 0; i < 8; i++) {
    if (!matrix.isReserved(8, size - 1 - i)) { matrix.set(8, size - 1 - i, 0, true); }
    if (!matrix.isReserved(size - 1 - i, 8)) { matrix.set(size - 1 - i, 8, 0, true); }
  }

  // Version info (versions 7+)
  if (version >= 7) {
    fillRect(matrix, 0, size - 11, 6, 3, 0, true);
    fillRect(matrix, size - 11, 0, 3, 6, 0, true);
  }
};

/**
 * Sets up all static patterns on the matrix
 */
const setupPatterns = (matrix, version) => {
  const size = matrix.size;

  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, size - 7, 0);
  placeFinderPattern(matrix, 0, size - 7);

  placeTimingPatterns(matrix, version);

  const positions = getAlignmentPatternPositions(version);
  for (const x of positions) {
    for (const y of positions) {
      placeAlignmentPattern(matrix, x, y);
    }
  }

  reserveInfoAreas(matrix, version);
};

/**
 * Helper to fill rectangle
 */
const fillRect = (matrix, x, y, width, height, value, reserved) => {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      matrix.set(x + dx, y + dy, value, reserved);
    }
  }
};

export {
  setupPatterns,
  placeFinderPattern,
  placeAlignmentPattern,
  placeTimingPatterns,
  reserveInfoAreas,
  fillRect,
};

// matrix/QrMatrix.js

class QrMatrix {
  #data;
  #reserved;
  #size;

  constructor(size) {
    this.#size = size;
    this.#data = new Uint8Array(size * size);
    this.#reserved = new Uint8Array(size * size);
  }

  get size() {
    return this.#size;
  }

  #index(x, y) {
    if (x < 0 || y < 0 || x >= this.#size || y >= this.#size) {
      throw new Error(`Out of bounds: (${x}, ${y})`);
    }
    return y * this.#size + x;
  }

  get(x, y) {
    return this.#data[this.#index(x, y)];
  }

  set(x, y, value, reserved = false) {
    const idx = this.#index(x, y);
    if (this.#reserved[idx] && !reserved) return false;
    this.#data[idx] = value;
    if (reserved) this.#reserved[idx] = 1;
    return true;
  }

  isReserved(x, y) {
    return this.#reserved[this.#index(x, y)] === 1;
  }

  toggle(x, y) {
    const idx = this.#index(x, y);
    this.#data[idx] ^= 1;
  }

  clone() {
    const copy = new QrMatrix(this.#size);
    for (let y = 0; y < this.#size; y++) {
      for (let x = 0; x < this.#size; x++) {
        const value = this.get(x, y);
        const reserved = this.isReserved(x, y);
        copy.set(x, y, value, reserved);
      }
    }
    return copy;
  }
}

export { QrMatrix };

// matrix/render.js

/**
 * Renders matrix to SVG string
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

export {
  toSvg,
  toString,
  drawToCanvas,
};

// matrix/index.js

/**
 * Creates a complete QR matrix from encoded bits
 * Facade pattern - provides simple interface for a complex subsystem
 */
const createQrMatrix = (bits, version, eccLevel, maskPattern = 'auto') => {
  const size = getMatrixSize(version);
  const matrix = new QrMatrix(size);

  setupPatterns(matrix, version);
  fillData(matrix, bits);

  const mask =
    maskPattern === 'auto'
      ? findBestMask(matrix, applyFormatInfo, eccLevel)
      : maskPattern;

  applyMask(matrix, mask);

  applyFormatInfo(matrix, eccLevel, mask);
  applyVersionInfo(matrix, version);

  return { matrix, mask };
};

export { createQrMatrix };

// BitBuffer.js

class BitBuffer {
  constructor() {
    this.bits = [];
  }

  append(value, length) {
    if (value === undefined) {
      throw new Error('Value is required');
    }
    if (length === undefined) {
      throw new Error('Length is required');
    }

    for (let i = length - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.bits.push(bit);
    }
  }

  length() {
    return this.bits.length;
  }

  toUint8Array() {
    const bufferLength = this.length();
    const bytesCount = Math.ceil(bufferLength / 8);
    const bytes = new Uint8Array(bytesCount);
    for (let i = 0; i < bufferLength; i++) {
      if (this.bits[i] === 1) {
        const byteIndex = Math.floor(i / 8);
        const bitPosition = 7 - (i % 8);
        bytes[byteIndex] |= 1 << bitPosition;
      }
    }
    return bytes;
  }
}

export { BitBuffer };

// encoder.js

class QrEncoder {
  #text = '';
  #eccLevel = 0;
  #version = 1;
  #utf8Data = new Uint8Array();

  constructor({ text, eccLevel, version }) {
    this.#text = text;
    this.#eccLevel = eccLevel;
    this.#utf8Data = new TextEncoder().encode(this.#text);
    this.#version = version || this.#versionAutoSelect();
  }

  get version() {
    return this.#version;
  }

  encode() {
    const dataBytes = this.#prepareDataBytes();
    const blockInfo = getBlockInfo(this.#version, this.#eccLevel);

    const { dataBlocks, eccBlocks } = this.#splitIntoBlocks(
      dataBytes,
      blockInfo,
    );

    const interleavedData = this.#interleaveBlocks(dataBlocks);
    const interleavedEcc = this.#interleaveBlocks(eccBlocks);

    const bitBuffer = new BitBuffer();

    for (const byte of interleavedData) {
      bitBuffer.append(byte, 8);
    }
    for (const byte of interleavedEcc) {
      bitBuffer.append(byte, 8);
    }

    return bitBuffer.bits;
  }

  #splitIntoBlocks(dataBytes, blockInfo) {
    const dataBlocks = [];
    const eccBlocks = [];
    let dataIndex = 0;

    for (const group of blockInfo) {
      for (let i = 0; i < group.count; i++) {
        const blockData = dataBytes.slice(
          dataIndex,
          dataIndex + group.dataWords,
        );
        dataIndex += group.dataWords;

        const eccBytes = calculateECC(blockData, group.eccWords);

        dataBlocks.push(blockData);
        eccBlocks.push(eccBytes);
      }
    }

    return { dataBlocks, eccBlocks };
  }

  #interleaveBlocks(blocks) {
    const result = [];
    const maxLength = Math.max(...blocks.map((b) => b.length));

    for (let i = 0; i < maxLength; i++) {
      for (const block of blocks) {
        if (i < block.length) {
          result.push(block[i]);
        }
      }
    }

    return result;
  }

  #prepareDataBytes() {
    const bitBuffer = new BitBuffer();
    const targetCapacity = getDataCapacity(this.#version, this.#eccLevel);
    const charCountBits = getCharCountSize(this.#version, MODES.BYTE);

    bitBuffer.append(MODES.BYTE, 4);
    bitBuffer.append(this.#utf8Data.length, charCountBits);

    for (const char of this.#utf8Data) {
      bitBuffer.append(char, 8);
    }

    // Byte terminator
    const bitsLeft = targetCapacity * 8 - bitBuffer.length();
    const terminatorLength = Math.min(4, bitsLeft);
    if (terminatorLength > 0) {
      bitBuffer.append(0, terminatorLength);
    }

    // Byte alignment padding
    if (bitBuffer.length() % 8 !== 0) {
      bitBuffer.append(0, 8 - (bitBuffer.length() % 8));
    }

    const currentBytes = Math.ceil(bitBuffer.length() / 8);

    // Padding bytes
    let paddingByte = 236;
    for (let i = 0; i < targetCapacity - currentBytes; i++) {
      bitBuffer.append(paddingByte, 8);
      paddingByte = paddingByte === 236 ? 17 : 236;
    }

    return bitBuffer.toUint8Array();
  }

  #versionAutoSelect() {
    const modeBits = 4;
    const versionsCount = 40;
    for (let v = 1; v <= versionsCount; v++) {
      const overheadBits = modeBits + getCharCountSize(v, MODES.BYTE);
      const totalBitsNeeded = overheadBits + this.#utf8Data.length * 8;
      const totalBytesNeeded = Math.ceil(totalBitsNeeded / 8);

      if (totalBytesNeeded <= getDataCapacity(v, this.#eccLevel)) {
        return v;
      }
    }

    throw new Error('Data is too large for any QR Code version');
  }
}

export { QrEncoder };

// galois.js

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

// Initialize Galois field tables (GF(2^8) with polynomial 0x11D)
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;

  x <<= 1;
  if (x & 0x100) {
    // If the 9th bit is set (overflow beyond 255)
    x ^= 0x11d;
  }
}

// Duplicate the EXP table to simplify multiplication (to avoid doing % 255)
for (let i = 255; i < 512; i++) {
  EXP[i] = EXP[i - 255];
}

const mul = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
};

export {
  EXP,
  LOG,
  mul,
};

// reedsolomon.js

const calculateECC = (data, nsym) => {
  const generator = generatorPoly(nsym);

  const result = new Uint8Array(data.length + nsym);
  result.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < generator.length; j++) {
        result[i + j] ^= mul(generator[j], coef);
      }
    }
  }

  return result.slice(data.length);
};

const POLY_CACHE = {};

const generatorPoly = (nsym) => {
  if (POLY_CACHE[nsym]) return POLY_CACHE[nsym];

  let poly = new Uint8Array([1]);

  for (let i = 0; i < nsym; i++) {
    poly = polyMul(poly, new Uint8Array([1, EXP[i]]));
  }

  POLY_CACHE[nsym] = poly;
  return poly;
};

const polyMul = (p1, p2) => {
  const len = p1.length + p2.length - 1;
  const res = new Uint8Array(len);

  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= mul(p1[i], p2[j]);
    }
  }
  return res;
};

export { calculateECC };

// qrEncoder.js

/**
 * Public API for QR Code generation
 */
const encode = (text, options = {}) => {
  const config = {
    ecc: 'M',
    maskPattern: 'auto',
    ...options,
  };

  const eccLevel = ECC_LEVELS[config.ecc.toUpperCase()];
  if (eccLevel === undefined) {
    throw new Error(`Invalid ECC level: "${config.ecc}". Use L, M, Q, or H.`);
  }

  const encoder = new QrEncoder({
    text,
    eccLevel,
    version: config.version,
  });

  const bits = encoder.encode();

  const { matrix, mask } = createQrMatrix(
    bits,
    encoder.version,
    eccLevel,
    config.maskPattern,
  );

  return {
    matrix,
    version: encoder.version,
    eccLevel: config.ecc.toUpperCase(),
    maskPattern: mask,

    toSvg: (options = {}) => {
      const { moduleSize = 10, margin = 4 } = options;
      return toSvg(matrix, moduleSize, margin);
    },

    toCanvas: (canvasElement, options = {}) => {
      if (typeof drawToCanvas !== 'function') {
        throw new Error(
          'Canvas rendering is not supported in this environment',
        );
      }
      const ctx = canvasElement.getContext('2d');
      drawToCanvas(matrix, ctx, options);
    },

    toString: () => toString(matrix),
  };
};

export { encode };
