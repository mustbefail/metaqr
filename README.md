# QR code generation and reading

- We need generation ASAP (it is not a comlex task)
- Reading is not so critical because any phone with camera has integrated app to capture and detect QR to URL so we can get control by intercepting URL schema or just open app by URL

## A. Core + spec modeling

1. Define data structures
  * Bit buffer abstraction
  * Immutable QR matrix abstraction
  * GF(256) + Reed–Solomon algebra interfaces
2. Model QR spec constants
  * Versions, ECC levels, modes
  * Per-version capacity, ECC per block, mask patterns

## B. Encoding pipeline (text to matrix)

3. Payload preparation
  * Text to bytes
  * Mode selection (start with byte mode only)
  * Length fields & terminator bits
  * Padding to full data codewords
4. ECC generation
  * Split into blocks (later)
  * RS parity computation per block
5. Matrix construction
  * Place finder/timing/alignment/format/version patterns
  * Data bit placement (zig-zag)
  * Apply 8 masks, score, choose best
6. Public encoder API
  * One entry point for text `QrEncodeResult`
  * Configurable version & ECC, but with auto mode

## C. Rendering (matrix to canvas/SVG)

7. Canvas renderer
  * Draw matrix to a provided `<canvas>`
  * Configurable module size and margins
8. SVG renderer
  * Generate minimal `<svg>` string for given matrix

## D. Decoding pipeline (ImageData to text)

9. Image preprocessing
  * Grayscale, binarization (global threshold first)
10. Finder pattern detection
  * 1:1:3:1:1 scanlines, clustering, orientation
11. Sampling
  * Compute perspective transform
  * Sample to N×N binary matrix
12. Matrix decoding
  * Read format/version
  * Unmask, extract codewords
  * RS error correction
  * Parse modes, length, bytes to text
13. Public decoder API
  * One entry point `ImageData` to `QrDecodeResult | null`

## E. Browser integration & tools

14. Video frame capture
 * Helper for `MediaStream` to `ImageData` frames
15. **Convenience helpers**
  * “Encode text and draw to canvas”
  * “Scan from current video frame”

## F. Testing & validation

16. Golden vectors
  * Compare known payloads vs reference QR images (pre-generated with an external tool)
17. Property tests
  * `decode(encode(text)) === text` for randomized payloads
