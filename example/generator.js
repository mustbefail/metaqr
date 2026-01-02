const { encode } = require('../src/qrEncoder.js');

const form = document.querySelector('#form');
const input = document.querySelector('#text-input');
const canvas = document.querySelector('#qr-canvas');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;

  if (!text) return;

  try {
    console.log('Generating QR for:', text);

    const qr = encode(text, { ecc: 'M' });

    console.log('Version:', qr.version);

    qr.toCanvas(canvas, {
      cellSize: 10,
      margin: 4,
    });
  } catch (error) {
    console.error(error);
    alert('Error: ' + error.message);
  }
});
