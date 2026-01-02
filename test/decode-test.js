// test/decode-test.js
const { encode } = require('../lib/qrEncoder');
const jsQR = require('jsqr');
const { createCanvas } = require('canvas');
const fs = require('fs');

const text = '12345';
const qr = encode(text, { ecc: 'M' });

const size = qr.matrix.size;
const scale = 10;
const margin = 4;
const totalSize = (size + margin * 2) * scale;

const canvas = createCanvas(totalSize, totalSize);
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, totalSize, totalSize);

ctx.fillStyle = 'black';
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    if (qr.matrix.get(x, y) === 1) {
      ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
    }
  }
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test-qr.png', buffer);
console.log('Saved test-qr.png - check if it scans with your phone');

const imageData = ctx.getImageData(0, 0, totalSize, totalSize);
console.log('Image size:', totalSize, 'x', totalSize);
console.log('Matrix size:', size);
console.log('ImageData length:', imageData.data.length);

const result = jsQR(imageData.data, totalSize, totalSize);
console.log('jsQR result:', result);

if (result && result.data === text) {
  console.log(`✅ "${text}"`);
} else {
  console.error(`❌ "${text}" -> decoded: "${result?.data}"`);
}
