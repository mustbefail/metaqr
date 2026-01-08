'use strict';

const init = require('eslint-config-metarhia');

module.exports = [
  ...init,
  {
    files: ['*.mjs'], // or use your specific package name
    languageOptions: {
      sourceType: 'module',
    },
  },
];
