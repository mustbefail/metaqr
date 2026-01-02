'use strict';

import { encode } from '../metaqr.mjs';

const form = document.querySelector('#form');
const input = document.querySelector('#text-input');
const eccSelect = document.querySelector('#ecc-select');
const canvas = document.querySelector('#qr-canvas');
const resultArea = document.querySelector('#result-area');

const infoVersion = document.querySelector('#info-version');
const infoEcc = document.querySelector('#info-ecc');
const infoMask = document.querySelector('#info-mask');
const infoSize = document.querySelector('#info-size');

const generateQR = () => {
  const text = input.value;
  const ecc = eccSelect.value;

  if (!text) return;

  try {
    const qr = encode(text, { ecc });

    qr.toCanvas(canvas, {
      cellSize: 8,
      margin: 4,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    });

    infoVersion.textContent = qr.version;
    infoEcc.textContent = qr.eccLevel;
    infoMask.textContent = qr.maskPattern;
    const size = qr.matrix.size;
    infoSize.textContent = `${size}x${size}`;

    resultArea.classList.add('active');
  } catch (error) {
    console.error(error);
    alert('Error: ' + error.message);
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  generateQR();
});

generateQR();
