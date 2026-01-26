import { encode } from '../metaqr.mjs';

const form = document.querySelector('#form');
const input = document.querySelector('#text-input');
const eccSelect = document.querySelector('#ecc-select');
const modeSelect = document.querySelector('#mode-select');
const canvas = document.querySelector('#qr-canvas');
const resultArea = document.querySelector('#result-area');

const infoVersion = document.querySelector('#info-version');
const infoEcc = document.querySelector('#info-ecc');
const infoMask = document.querySelector('#info-mask');
const infoSize = document.querySelector('#info-size');
const infoMode = document.querySelector('#info-mode');

const errorContainer = document.querySelector('#error-text');

const generateQR = () => {
  const text = input.value;
  const ecc = eccSelect.value;
  const mode = modeSelect.value;

  if (!text) return;

  try {
    const qr = encode(text, { ecc, mode });
    errorContainer.textContent = '';

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

    infoMode.textContent = mode === 'auto' ? '(auto)' : mode;

    resultArea.classList.add('active');
  } catch (error) {
    console.error(error);
    errorContainer.textContent = error.message;
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  generateQR();
});

generateQR();
