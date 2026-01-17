// https://www.arscreatio.com/repositorio/images/n_23/SC031-N-1915-18004Text.pdf
// ISO/IEC CD 18004

'use strict';

/**
 * QR Code Encoding Modes
 *
 * These 4-bit indicators are placed at the very beginning of the data stream
 * to tell the decoder how to interpret the following bits.
 * - NUMERIC: Only digits 0-9. Most efficient (10 bits per 3 digits).
 * - ALPHANUMERIC: 0-9, A-Z, and some symbols. (11 bits per 2 chars).
 * - BYTE: Raw 8-bit bytes (ISO-8859-1 or UTF-8). Least efficient but universal.
 */
const MODES = {
  NUMERIC: 0b0001,
  ALPHANUMERIC: 0b0010,
  BYTE: 0b0100,
};

/**
 * Full Capacity table for Versions 1-40
 *
 * This table defines the storage capacity and structure for every QR version.
 * - total: The total number of codewords (bytes) the matrix can hold.
 * - ecc: The number of codewords reserved for Error Correction for each level.
 *
 * The remaining space (total - ecc) is what is available for user data.
 * This is "hardcoded" because these are physical limits determined by the
 * matrix size (21x21, 25x25, etc.) minus the function patterns.
 */
const CAPACITIES = {
  1: { total: 26, ecc: { L: 7, M: 10, Q: 13, H: 17 } },
  2: { total: 44, ecc: { L: 10, M: 16, Q: 22, H: 28 } },
  3: { total: 70, ecc: { L: 15, M: 26, Q: 36, H: 44 } },
  4: { total: 100, ecc: { L: 20, M: 36, Q: 52, H: 64 } },
  5: { total: 134, ecc: { L: 26, M: 48, Q: 72, H: 88 } },
  6: { total: 172, ecc: { L: 36, M: 64, Q: 96, H: 112 } },
  7: { total: 196, ecc: { L: 40, M: 72, Q: 108, H: 130 } },
  8: { total: 242, ecc: { L: 48, M: 88, Q: 132, H: 156 } },
  9: { total: 292, ecc: { L: 60, M: 110, Q: 160, H: 192 } },
  10: { total: 346, ecc: { L: 72, M: 130, Q: 192, H: 224 } },
  11: { total: 404, ecc: { L: 80, M: 150, Q: 224, H: 264 } },
  12: { total: 466, ecc: { L: 96, M: 176, Q: 260, H: 308 } },
  13: { total: 532, ecc: { L: 104, M: 198, Q: 288, H: 352 } },
  14: { total: 581, ecc: { L: 120, M: 216, Q: 320, H: 384 } },
  15: { total: 655, ecc: { L: 132, M: 240, Q: 360, H: 432 } },
  16: { total: 733, ecc: { L: 144, M: 280, Q: 408, H: 480 } },
  17: { total: 815, ecc: { L: 168, M: 308, Q: 448, H: 532 } },
  18: { total: 901, ecc: { L: 180, M: 338, Q: 504, H: 588 } },
  19: { total: 991, ecc: { L: 196, M: 364, Q: 546, H: 650 } },
  20: { total: 1085, ecc: { L: 224, M: 416, Q: 600, H: 700 } },
  21: { total: 1156, ecc: { L: 224, M: 442, Q: 644, H: 750 } },
  22: { total: 1258, ecc: { L: 252, M: 476, Q: 690, H: 816 } },
  23: { total: 1364, ecc: { L: 270, M: 504, Q: 750, H: 900 } },
  24: { total: 1474, ecc: { L: 300, M: 560, Q: 810, H: 960 } },
  25: { total: 1588, ecc: { L: 312, M: 588, Q: 870, H: 1050 } },
  26: { total: 1706, ecc: { L: 336, M: 644, Q: 952, H: 1140 } },
  27: { total: 1828, ecc: { L: 360, M: 700, Q: 1020, H: 1200 } },
  28: { total: 1921, ecc: { L: 390, M: 728, Q: 1050, H: 1260 } },
  29: { total: 2051, ecc: { L: 420, M: 784, Q: 1140, H: 1350 } },
  30: { total: 2185, ecc: { L: 450, M: 812, Q: 1200, H: 1440 } },
  31: { total: 2323, ecc: { L: 480, M: 868, Q: 1290, H: 1530 } },
  32: { total: 2465, ecc: { L: 510, M: 924, Q: 1350, H: 1620 } },
  33: { total: 2611, ecc: { L: 540, M: 980, Q: 1440, H: 1710 } },
  34: { total: 2761, ecc: { L: 570, M: 1036, Q: 1530, H: 1800 } },
  35: { total: 2876, ecc: { L: 570, M: 1064, Q: 1590, H: 1890 } },
  36: { total: 3034, ecc: { L: 600, M: 1120, Q: 1680, H: 1980 } },
  37: { total: 3196, ecc: { L: 630, M: 1204, Q: 1770, H: 2100 } },
  38: { total: 3362, ecc: { L: 660, M: 1260, Q: 1860, H: 2220 } },
  39: { total: 3532, ecc: { L: 720, M: 1316, Q: 1950, H: 2310 } },
  40: { total: 3706, ecc: { L: 750, M: 1372, Q: 2040, H: 2430 } },
};

/**
 * Alignment pattern positions for all versions (1-40)
 *
 * Alignment patterns are small 5x5 structures
 * used to correct improved distortion
 * in larger QR codes (curved surfaces, perspective skew).
 *
 * The standard defines specific coordinates for the center of these patterns.
 * As the version increases, more patterns are added in a grid-like fashion
 * to ensure the scanner can always find a nearby reference point.
 */
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

/**
 * Format info lookup table (ECC + mask -> 15-bit BCH encoded value)
 *
 * Why pre-calculated?
 * The Format Information string is a critical 15-bit sequence that tells the
 * scanner the ECC level and Mask Pattern used.
 * It is protected by BCH error correction.
 * Since there are only 4 ECC levels * 8 Masks = 32 combinations,
 * it is much faster and safer to pre-calculate these values
 * than to implement the BCH encoding logic at runtime.
 */

const FORMAT_INFO = {
  M: [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
  L: [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
  H: [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b],
  Q: [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
};

/**
 * Version info for versions 7-40 (18-bit BCH encoded)
 *
 * Versions 1-6 are small enough that the scanner can determine the version
 * just by counting modules. For Version 7 and larger, two extra blocks of
 * information (6x3) are added to explicitly state the version number.
 * Like Format Info, these are protected by BCH codes
 * and are pre-calculated here.
 */

const VERSION_INFO = [
  0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d,
  0x0f928, 0x10b78, 0x1145d, 0x12a17, 0x13532, 0x149a6, 0x15683, 0x168c9,
  0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a, 0x1d33f, 0x1ed75,
  0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b, 0x2542e, 0x26a64,
  0x27541, 0x28c69,
];

/**
 * Block structure for each version and ECC level
 * Format: { blocks: [{count, dataWords, eccWords}...] }
 *
 * Reed-Solomon error correction operates on finite fields (GF(2^8)), which
 * limits the message block size to 255 bytes. Large QR codes contain much more
 * data than this (up to ~3KB).
 *
 * Therefore, data must be split into multiple smaller "RS Blocks". Each block
 * is error-corrected independently, and then they are interleaved (mixed)
 * to better resist burst errors (like a stain covering a spot on the code).
 *
 * This table defines exactly how to split the data for every Version/ECC combo.
 * e.g., "Split into 2 blocks of 15 bytes and 3 blocks of 16 bytes".
 */
const BLOCK_INFO = {
  1: {
    M: [{ count: 1, dataWords: 16, eccWords: 10 }],
    L: [{ count: 1, dataWords: 19, eccWords: 7 }],
    H: [{ count: 1, dataWords: 9, eccWords: 17 }],
    Q: [{ count: 1, dataWords: 13, eccWords: 13 }],
  },
  2: {
    M: [{ count: 1, dataWords: 28, eccWords: 16 }],
    L: [{ count: 1, dataWords: 34, eccWords: 10 }],
    H: [{ count: 1, dataWords: 16, eccWords: 28 }],
    Q: [{ count: 1, dataWords: 22, eccWords: 22 }],
  },
  3: {
    M: [{ count: 1, dataWords: 44, eccWords: 26 }],
    L: [{ count: 1, dataWords: 55, eccWords: 15 }],
    H: [{ count: 2, dataWords: 13, eccWords: 22 }],
    Q: [{ count: 2, dataWords: 17, eccWords: 18 }],
  },
  4: {
    M: [{ count: 2, dataWords: 32, eccWords: 18 }],
    L: [{ count: 1, dataWords: 80, eccWords: 20 }],
    H: [{ count: 4, dataWords: 9, eccWords: 16 }],
    Q: [{ count: 2, dataWords: 24, eccWords: 26 }],
  },
  5: {
    M: [{ count: 2, dataWords: 43, eccWords: 24 }],
    L: [{ count: 1, dataWords: 108, eccWords: 26 }],
    H: [
      { count: 2, dataWords: 11, eccWords: 22 },
      { count: 2, dataWords: 12, eccWords: 22 },
    ],
    Q: [
      { count: 2, dataWords: 15, eccWords: 18 },
      { count: 2, dataWords: 16, eccWords: 18 },
    ],
  },
  6: {
    M: [{ count: 4, dataWords: 27, eccWords: 16 }],
    L: [{ count: 2, dataWords: 68, eccWords: 18 }],
    H: [{ count: 4, dataWords: 15, eccWords: 28 }],
    Q: [{ count: 4, dataWords: 19, eccWords: 24 }],
  },
  7: {
    M: [{ count: 4, dataWords: 31, eccWords: 18 }],
    L: [{ count: 2, dataWords: 78, eccWords: 20 }],
    H: [
      { count: 4, dataWords: 13, eccWords: 26 },
      { count: 1, dataWords: 14, eccWords: 26 },
    ],
    Q: [
      { count: 2, dataWords: 14, eccWords: 18 },
      { count: 4, dataWords: 15, eccWords: 18 },
    ],
  },
  8: {
    M: [
      { count: 2, dataWords: 38, eccWords: 22 },
      { count: 2, dataWords: 39, eccWords: 22 },
    ],
    L: [{ count: 2, dataWords: 97, eccWords: 24 }],
    H: [
      { count: 4, dataWords: 14, eccWords: 26 },
      { count: 2, dataWords: 15, eccWords: 26 },
    ],
    Q: [
      { count: 4, dataWords: 18, eccWords: 22 },
      { count: 2, dataWords: 19, eccWords: 22 },
    ],
  },
  9: {
    M: [
      { count: 3, dataWords: 36, eccWords: 22 },
      { count: 2, dataWords: 37, eccWords: 22 },
    ],
    L: [{ count: 2, dataWords: 116, eccWords: 30 }],
    H: [
      { count: 4, dataWords: 12, eccWords: 24 },
      { count: 4, dataWords: 13, eccWords: 24 },
    ],
    Q: [
      { count: 4, dataWords: 16, eccWords: 20 },
      { count: 4, dataWords: 17, eccWords: 20 },
    ],
  },
  10: {
    M: [
      { count: 4, dataWords: 43, eccWords: 26 },
      { count: 1, dataWords: 44, eccWords: 26 },
    ],
    L: [
      { count: 2, dataWords: 68, eccWords: 18 },
      { count: 2, dataWords: 69, eccWords: 18 },
    ],
    H: [
      { count: 6, dataWords: 15, eccWords: 28 },
      { count: 2, dataWords: 16, eccWords: 28 },
    ],
    Q: [
      { count: 6, dataWords: 19, eccWords: 24 },
      { count: 2, dataWords: 20, eccWords: 24 },
    ],
  },
  11: {
    M: [
      { count: 1, dataWords: 50, eccWords: 30 },
      { count: 4, dataWords: 51, eccWords: 30 },
    ],
    L: [{ count: 4, dataWords: 81, eccWords: 20 }],
    H: [
      { count: 3, dataWords: 12, eccWords: 24 },
      { count: 8, dataWords: 13, eccWords: 24 },
    ],
    Q: [
      { count: 4, dataWords: 22, eccWords: 28 },
      { count: 4, dataWords: 23, eccWords: 28 },
    ],
  },
  12: {
    M: [
      { count: 6, dataWords: 36, eccWords: 22 },
      { count: 2, dataWords: 37, eccWords: 22 },
    ],
    L: [
      { count: 2, dataWords: 92, eccWords: 24 },
      { count: 2, dataWords: 93, eccWords: 24 },
    ],
    H: [
      { count: 7, dataWords: 14, eccWords: 26 },
      { count: 4, dataWords: 15, eccWords: 26 },
    ],
    Q: [
      { count: 4, dataWords: 20, eccWords: 26 },
      { count: 6, dataWords: 21, eccWords: 26 },
    ],
  },
  13: {
    M: [
      { count: 8, dataWords: 37, eccWords: 22 },
      { count: 1, dataWords: 38, eccWords: 22 },
    ],
    L: [{ count: 4, dataWords: 107, eccWords: 26 }],
    H: [
      { count: 12, dataWords: 11, eccWords: 22 },
      { count: 4, dataWords: 12, eccWords: 22 },
    ],
    Q: [
      { count: 8, dataWords: 20, eccWords: 24 },
      { count: 4, dataWords: 21, eccWords: 24 },
    ],
  },
  14: {
    M: [
      { count: 4, dataWords: 40, eccWords: 24 },
      { count: 5, dataWords: 41, eccWords: 24 },
    ],
    L: [
      { count: 3, dataWords: 115, eccWords: 30 },
      { count: 1, dataWords: 116, eccWords: 30 },
    ],
    H: [
      { count: 11, dataWords: 12, eccWords: 24 },
      { count: 5, dataWords: 13, eccWords: 24 },
    ],
    Q: [
      { count: 11, dataWords: 16, eccWords: 20 },
      { count: 5, dataWords: 17, eccWords: 20 },
    ],
  },
  15: {
    M: [
      { count: 5, dataWords: 41, eccWords: 24 },
      { count: 5, dataWords: 42, eccWords: 24 },
    ],
    L: [
      { count: 5, dataWords: 87, eccWords: 22 },
      { count: 1, dataWords: 88, eccWords: 22 },
    ],
    H: [
      { count: 11, dataWords: 12, eccWords: 24 },
      { count: 7, dataWords: 13, eccWords: 24 },
    ],
    Q: [
      { count: 5, dataWords: 24, eccWords: 30 },
      { count: 7, dataWords: 25, eccWords: 30 },
    ],
  },
  16: {
    M: [
      { count: 7, dataWords: 45, eccWords: 28 },
      { count: 3, dataWords: 46, eccWords: 28 },
    ],
    L: [
      { count: 5, dataWords: 98, eccWords: 24 },
      { count: 1, dataWords: 99, eccWords: 24 },
    ],
    H: [
      { count: 3, dataWords: 15, eccWords: 30 },
      { count: 13, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 15, dataWords: 19, eccWords: 24 },
      { count: 2, dataWords: 20, eccWords: 24 },
    ],
  },
  17: {
    M: [
      { count: 10, dataWords: 46, eccWords: 28 },
      { count: 1, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 1, dataWords: 107, eccWords: 28 },
      { count: 5, dataWords: 108, eccWords: 28 },
    ],
    H: [
      { count: 2, dataWords: 14, eccWords: 28 },
      { count: 17, dataWords: 15, eccWords: 28 },
    ],
    Q: [
      { count: 1, dataWords: 22, eccWords: 28 },
      { count: 15, dataWords: 23, eccWords: 28 },
    ],
  },
  18: {
    M: [
      { count: 9, dataWords: 43, eccWords: 26 },
      { count: 4, dataWords: 44, eccWords: 26 },
    ],
    L: [
      { count: 5, dataWords: 120, eccWords: 30 },
      { count: 1, dataWords: 121, eccWords: 30 },
    ],
    H: [
      { count: 2, dataWords: 14, eccWords: 28 },
      { count: 19, dataWords: 15, eccWords: 28 },
    ],
    Q: [
      { count: 17, dataWords: 22, eccWords: 28 },
      { count: 1, dataWords: 23, eccWords: 28 },
    ],
  },
  19: {
    M: [
      { count: 3, dataWords: 44, eccWords: 26 },
      { count: 11, dataWords: 45, eccWords: 26 },
    ],
    L: [
      { count: 3, dataWords: 113, eccWords: 28 },
      { count: 4, dataWords: 114, eccWords: 28 },
    ],
    H: [
      { count: 9, dataWords: 13, eccWords: 26 },
      { count: 16, dataWords: 14, eccWords: 26 },
    ],
    Q: [
      { count: 17, dataWords: 21, eccWords: 26 },
      { count: 4, dataWords: 22, eccWords: 26 },
    ],
  },
  20: {
    M: [
      { count: 3, dataWords: 41, eccWords: 26 },
      { count: 13, dataWords: 42, eccWords: 26 },
    ],
    L: [
      { count: 3, dataWords: 107, eccWords: 28 },
      { count: 5, dataWords: 108, eccWords: 28 },
    ],
    H: [
      { count: 15, dataWords: 15, eccWords: 30 },
      { count: 10, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 15, dataWords: 24, eccWords: 30 },
      { count: 5, dataWords: 25, eccWords: 30 },
    ],
  },
  21: {
    M: [{ count: 17, dataWords: 42, eccWords: 26 }],
    L: [
      { count: 4, dataWords: 116, eccWords: 28 },
      { count: 4, dataWords: 117, eccWords: 28 },
    ],
    H: [
      { count: 19, dataWords: 16, eccWords: 30 },
      { count: 6, dataWords: 17, eccWords: 30 },
    ],
    Q: [
      { count: 17, dataWords: 22, eccWords: 28 },
      { count: 6, dataWords: 23, eccWords: 28 },
    ],
  },
  22: {
    M: [{ count: 17, dataWords: 46, eccWords: 28 }],
    L: [
      { count: 2, dataWords: 111, eccWords: 28 },
      { count: 7, dataWords: 112, eccWords: 28 },
    ],
    H: [{ count: 34, dataWords: 13, eccWords: 24 }],
    Q: [
      { count: 7, dataWords: 24, eccWords: 30 },
      { count: 16, dataWords: 25, eccWords: 30 },
    ],
  },
  23: {
    M: [
      { count: 4, dataWords: 47, eccWords: 28 },
      { count: 14, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 4, dataWords: 121, eccWords: 30 },
      { count: 5, dataWords: 122, eccWords: 30 },
    ],
    H: [
      { count: 16, dataWords: 15, eccWords: 30 },
      { count: 14, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 11, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  24: {
    M: [
      { count: 6, dataWords: 45, eccWords: 28 },
      { count: 14, dataWords: 46, eccWords: 28 },
    ],
    L: [
      { count: 6, dataWords: 117, eccWords: 30 },
      { count: 4, dataWords: 118, eccWords: 30 },
    ],
    H: [
      { count: 30, dataWords: 16, eccWords: 30 },
      { count: 2, dataWords: 17, eccWords: 30 },
    ],
    Q: [
      { count: 11, dataWords: 24, eccWords: 30 },
      { count: 16, dataWords: 25, eccWords: 30 },
    ],
  },
  25: {
    M: [
      { count: 8, dataWords: 47, eccWords: 28 },
      { count: 13, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 8, dataWords: 106, eccWords: 26 },
      { count: 4, dataWords: 107, eccWords: 26 },
    ],
    H: [
      { count: 22, dataWords: 15, eccWords: 30 },
      { count: 13, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 7, dataWords: 24, eccWords: 30 },
      { count: 22, dataWords: 25, eccWords: 30 },
    ],
  },
  26: {
    M: [
      { count: 19, dataWords: 46, eccWords: 28 },
      { count: 4, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 10, dataWords: 114, eccWords: 28 },
      { count: 2, dataWords: 115, eccWords: 28 },
    ],
    H: [
      { count: 33, dataWords: 15, eccWords: 30 },
      { count: 5, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 28, dataWords: 22, eccWords: 28 },
      { count: 6, dataWords: 23, eccWords: 28 },
    ],
  },
  27: {
    M: [
      { count: 22, dataWords: 45, eccWords: 28 },
      { count: 3, dataWords: 46, eccWords: 28 },
    ],
    L: [
      { count: 8, dataWords: 122, eccWords: 30 },
      { count: 4, dataWords: 123, eccWords: 30 },
    ],
    H: [
      { count: 12, dataWords: 15, eccWords: 30 },
      { count: 28, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 8, dataWords: 23, eccWords: 30 },
      { count: 26, dataWords: 24, eccWords: 30 },
    ],
  },
  28: {
    M: [
      { count: 3, dataWords: 45, eccWords: 28 },
      { count: 23, dataWords: 46, eccWords: 28 },
    ],
    L: [
      { count: 3, dataWords: 117, eccWords: 30 },
      { count: 10, dataWords: 118, eccWords: 30 },
    ],
    H: [
      { count: 11, dataWords: 15, eccWords: 30 },
      { count: 31, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 4, dataWords: 24, eccWords: 30 },
      { count: 31, dataWords: 25, eccWords: 30 },
    ],
  },
  29: {
    M: [
      { count: 21, dataWords: 45, eccWords: 28 },
      { count: 7, dataWords: 46, eccWords: 28 },
    ],
    L: [
      { count: 7, dataWords: 116, eccWords: 30 },
      { count: 7, dataWords: 117, eccWords: 30 },
    ],
    H: [
      { count: 19, dataWords: 15, eccWords: 30 },
      { count: 26, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 1, dataWords: 23, eccWords: 30 },
      { count: 37, dataWords: 24, eccWords: 30 },
    ],
  },
  30: {
    M: [
      { count: 19, dataWords: 47, eccWords: 28 },
      { count: 10, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 5, dataWords: 115, eccWords: 30 },
      { count: 10, dataWords: 116, eccWords: 30 },
    ],
    H: [
      { count: 23, dataWords: 15, eccWords: 30 },
      { count: 25, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 15, dataWords: 24, eccWords: 30 },
      { count: 25, dataWords: 25, eccWords: 30 },
    ],
  },
  31: {
    M: [
      { count: 2, dataWords: 46, eccWords: 28 },
      { count: 29, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 13, dataWords: 115, eccWords: 30 },
      { count: 3, dataWords: 116, eccWords: 30 },
    ],
    H: [
      { count: 23, dataWords: 15, eccWords: 30 },
      { count: 28, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 42, dataWords: 24, eccWords: 30 },
      { count: 1, dataWords: 25, eccWords: 30 },
    ],
  },
  32: {
    M: [
      { count: 10, dataWords: 46, eccWords: 28 },
      { count: 23, dataWords: 47, eccWords: 28 },
    ],
    L: [{ count: 17, dataWords: 115, eccWords: 30 }],
    H: [
      { count: 19, dataWords: 15, eccWords: 30 },
      { count: 35, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 10, dataWords: 24, eccWords: 30 },
      { count: 35, dataWords: 25, eccWords: 30 },
    ],
  },
  33: {
    M: [
      { count: 14, dataWords: 46, eccWords: 28 },
      { count: 21, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 17, dataWords: 115, eccWords: 30 },
      { count: 1, dataWords: 116, eccWords: 30 },
    ],
    H: [
      { count: 11, dataWords: 15, eccWords: 30 },
      { count: 46, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 29, dataWords: 24, eccWords: 30 },
      { count: 19, dataWords: 25, eccWords: 30 },
    ],
  },
  34: {
    M: [
      { count: 14, dataWords: 46, eccWords: 28 },
      { count: 23, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 13, dataWords: 115, eccWords: 30 },
      { count: 6, dataWords: 116, eccWords: 30 },
    ],
    H: [
      { count: 59, dataWords: 16, eccWords: 30 },
      { count: 1, dataWords: 17, eccWords: 30 },
    ],
    Q: [
      { count: 44, dataWords: 24, eccWords: 30 },
      { count: 7, dataWords: 25, eccWords: 30 },
    ],
  },
  35: {
    M: [
      { count: 12, dataWords: 47, eccWords: 28 },
      { count: 26, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 12, dataWords: 121, eccWords: 30 },
      { count: 7, dataWords: 122, eccWords: 30 },
    ],
    H: [
      { count: 22, dataWords: 15, eccWords: 30 },
      { count: 41, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 39, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  36: {
    M: [
      { count: 6, dataWords: 47, eccWords: 28 },
      { count: 34, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 6, dataWords: 121, eccWords: 30 },
      { count: 14, dataWords: 122, eccWords: 30 },
    ],
    H: [
      { count: 2, dataWords: 15, eccWords: 30 },
      { count: 64, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 46, dataWords: 24, eccWords: 30 },
      { count: 10, dataWords: 25, eccWords: 30 },
    ],
  },
  37: {
    M: [
      { count: 29, dataWords: 46, eccWords: 28 },
      { count: 14, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 17, dataWords: 122, eccWords: 30 },
      { count: 4, dataWords: 123, eccWords: 30 },
    ],
    H: [
      { count: 24, dataWords: 15, eccWords: 30 },
      { count: 46, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 49, dataWords: 24, eccWords: 30 },
      { count: 10, dataWords: 25, eccWords: 30 },
    ],
  },
  38: {
    M: [
      { count: 13, dataWords: 46, eccWords: 28 },
      { count: 32, dataWords: 47, eccWords: 28 },
    ],
    L: [
      { count: 4, dataWords: 122, eccWords: 30 },
      { count: 18, dataWords: 123, eccWords: 30 },
    ],
    H: [
      { count: 42, dataWords: 15, eccWords: 30 },
      { count: 32, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 48, dataWords: 24, eccWords: 30 },
      { count: 14, dataWords: 25, eccWords: 30 },
    ],
  },
  39: {
    M: [
      { count: 40, dataWords: 47, eccWords: 28 },
      { count: 7, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 20, dataWords: 117, eccWords: 30 },
      { count: 4, dataWords: 118, eccWords: 30 },
    ],
    H: [
      { count: 10, dataWords: 15, eccWords: 30 },
      { count: 67, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 43, dataWords: 24, eccWords: 30 },
      { count: 22, dataWords: 25, eccWords: 30 },
    ],
  },
  40: {
    M: [
      { count: 18, dataWords: 47, eccWords: 28 },
      { count: 31, dataWords: 48, eccWords: 28 },
    ],
    L: [
      { count: 19, dataWords: 118, eccWords: 30 },
      { count: 6, dataWords: 119, eccWords: 30 },
    ],
    H: [
      { count: 20, dataWords: 15, eccWords: 30 },
      { count: 61, dataWords: 16, eccWords: 30 },
    ],
    Q: [
      { count: 34, dataWords: 24, eccWords: 30 },
      { count: 34, dataWords: 25, eccWords: 30 },
    ],
  },
};

module.exports = {
  MODES,
  CAPACITIES,
  ALIGNMENT_POSITIONS,
  FORMAT_INFO,
  VERSION_INFO,
  BLOCK_INFO,
};
