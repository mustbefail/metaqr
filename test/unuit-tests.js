const { QrEncoder } = require('../src/encoder');
const { calculateECC } = require('../src/reedsolomon');

const encoder = new QrEncoder({ text: '12345', eccLevel: 0, version: 1 });
const bits = encoder.encode();
const totalBits = bits.length;
console.log(`Data bits count: ${totalBits}`);
console.assert(totalBits === 208, `Expected 208 bits, got ${totalBits}`);

const testData = new Uint8Array([
  0x40, 0x53, 0x13, 0x23, 0x33, 0x43, 0x50, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
  0xec, 0x11, 0xec,
]);
const ecc = calculateECC(testData, 10);
console.log(
  'ECC:',
  Array.from(ecc)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' '),
);

console.log('✅ Unit tests passed!');
