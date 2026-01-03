const { encode } = require('../lib/qrEncoder');
const QRCode = require('qrcode');
const fs = require('fs');

const qr = encode('12345',
  {
    ecc: 'M',
    version: 1,
    maskPattern: 0,
    mode: 'byte'
  }
);

try{
  fs.writeFileSync('qr.svg', qr.toSvg());
}
catch (err) {
  console.error('Error writing QR code:', err);
}


const segments = [{ data: '12345', mode: 'byte' }];

QRCode.toFile(
  'qr-reference.svg',
  segments,
  {
    version: 1,
    errorCorrectionLevel: 'M',
    maskPattern: 0,
    type: 'svg',
    margin: 4,
    scale: 10,
  },
  (err) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('✅ Reference QR saved to qr-reference.svg');
    }
  },
);
