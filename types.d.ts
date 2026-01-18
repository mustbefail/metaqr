/**
 * QR Code encoding mode indicator values (4-bit, from ISO 18004).
 */
export interface ModeIndicators {
  readonly NUMERIC: 0b0001;
  readonly ALPHANUMERIC: 0b0010;
  readonly BYTE: 0b0100;
}

/**
 * ECC codewords per level.
 */
export interface EccCapacity {
  L: number;
  M: number;
  Q: number;
  H: number;
}

/**
 * Version capacity info.
 */
export interface VersionCapacity {
  total: number;
  ecc: EccCapacity;
}

/**
 * QR Code version info.
 */
export interface CapacityTable {
  [version: number]: VersionCapacity;
}

/**
 * Block structure for RS error correction.
 */
export interface BlockInfo {
  count: number;
  dataWords: number;
  eccWords: number;
}

export type BlockInfoMap = Record<EccLevel, BlockInfo[]>;

/**
 * Data block info per version.
 */
export type BlockInfoTable = Record<number, BlockInfoMap>;

/**
 * Alignment pattern positions per version.
 *  */
export type AlignmentPatternPositions = Record<number, number[]>;

/**
 * Format information block info per version.
 *  */

export type FormatInfoTable = Record<EccLevel, number[]>;

/**
 * Version info table
 * */

export type VersionInfoTable = number[];

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export type Bit = 0 | 1;

/**
 * QR Code encoding mode indicators (4-bit values from spec).
 * - NUMERIC: 0b0001 (1)
 * - ALPHANUMERIC: 0b0010 (2)
 * - BYTE: 0b0100 (4)
 */
export type ModeIndicator = 0b0001 | 0b0010 | 0b0100;

/**
 * User-facing encoding mode option for public API.
 */
export type EncodingMode = 'numeric' | 'alphanumeric' | 'byte' | 'auto';

export interface EncodeOptions {
  ecc?: EccLevel;
  maskPattern?: number | 'auto';
  version?: number;
  mode?: EncodingMode;
}

export interface ToSvgOptions {
  moduleSize?: number;
  margin?: number;
}

export interface ToCanvasOptions {
  cellSize?: number;
  margin?: number;
  colorDark?: string;
  colorLight?: string;
}

export interface QrMatrix {
  readonly size: number;
  get(x: number, y: number): Bit;
  set(x: number, y: number, value: number, reserved?: boolean): boolean;
  isReserved(x: number, y: number): boolean;
  toggle(x: number, y: number): void;
  clone(): QrMatrix;
}

export interface EncodedQr {
  matrix: QrMatrix;
  version: number;
  eccLevel: EccLevel;
  maskPattern: number | 'auto';
  mode: ModeIndicator;
  toSvg(options?: ToSvgOptions): string;
  toCanvas(canvasElement: HTMLCanvasElement, options?: ToCanvasOptions): void;
  toString(): string;
}

export function encode(text: string, options?: EncodeOptions): EncodedQr;

export class BitBuffer implements Iterable<Bit> {
  constructor(initialBytes?: number);

  /**
   * Returns the number of bits in the buffer.
   */
  length(): number;

  /**
   * Appends bits from a value to the buffer.
   * @param value - The integer value to extract bits from.
   * @param length - Number of bits to append (from least significant).
   */
  append(value: number, length: number): void;

  /**
   * Returns the bit at the specified index.
   * @param index - Zero-based bit index.
   * @throws {RangeError} If index is out of bounds.
   */
  getBit(index: number): Bit;

  /**
   * Returns a copy of the internal byte array (trimmed to actual data).
   */
  getBytes(): Uint8Array;

  [Symbol.iterator](): Iterator<Bit>;
}

export interface QrEncoderConfig {
  /** Text to encode */
  text: string;
  /** Error correction level */
  eccLevel: EccLevel;
  /** Explicit QR version (1-40) or undefined for auto-detection */
  version?: number;
  /** Explicit encoding mode indicator or null for auto-detection */
  mode?: ModeIndicator | null;
}

export class QrEncoder {
  constructor(config: QrEncoderConfig);

  /** QR Code version (1-40) */
  readonly version: number;

  /** Encoding mode indicator */
  readonly mode: ModeIndicator;

  /**
   * Encodes the text into a BitBuffer containing data and ECC codewords.
   */
  encode(): BitBuffer;
}
