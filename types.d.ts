export interface ModeIndicators {
  readonly NUMERIC: 0b0001;
  readonly ALPHANUMERIC: 0b0010;
  readonly BYTE: 0b0100;
}

export interface EccCapacity {
  L: number;
  M: number;
  Q: number;
  H: number;
}

export interface VersionCapacity {
  total: number;
  ecc: EccCapacity;
}

export interface CapacityTable {
  [version: number]: VersionCapacity;
}

export interface BlockInfo {
  count: number;
  dataWords: number;
  eccWords: number;
}

export type BlockInfoMap = Record<EccLevel, BlockInfo[]>;

export type BlockInfoTable = Record<number, BlockInfoMap>;

export type AlignmentPatternPositions = Record<number, number[]>;

export type FormatInfoTable = Record<EccLevel, number[]>;

export type VersionInfoTable = number[];

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export type Bit = 0 | 1;

export type ModeIndicator = 0b0001 | 0b0010 | 0b0100;

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
  mode: ModeIndicator | null;
  toSvg(options?: ToSvgOptions): string;
  toCanvas(canvasElement: HTMLCanvasElement, options?: ToCanvasOptions): void;
  toString(): string;
}

export function encode(text: string, options?: EncodeOptions): EncodedQr;

export class BitBuffer implements Iterable<Bit> {
  constructor(initialBytes?: number);

  length(): number;

  append(value: number, length: number): void;

  getBit(index: number): Bit;

  getBytes(): Uint8Array;

  [Symbol.iterator](): Iterator<Bit>;
}

export interface QrEncoderConfig {
  text: string;
  eccLevel: EccLevel;
  version?: number;
  mode?: ModeIndicator | null;
}

export class QrEncoder {
  constructor(config: QrEncoderConfig);

  readonly version: number;

  readonly mode: ModeIndicator;

  encode(): BitBuffer;
}
