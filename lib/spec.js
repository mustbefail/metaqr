// https://www.arscreatio.com/repositorio/images/n_23/SC031-N-1915-18004Text.pdf
// ISO/IEC CD 18004

'use strict';

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

module.exports = {
  ECC_LEVELS,
  MODES,
  CAPACITIES,
  ALIGNMENT_POSITIONS,
  FORMAT_INFO,
  VERSION_INFO,
  BLOCK_INFO,
};
