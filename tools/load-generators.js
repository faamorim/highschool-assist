// Loads the browser generator library into node (no dependencies): returns window.Mathwise.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILES = ['generators/core.js', 'generators/powers.js', 'generators/sci-notation.js'];

module.exports = function loadGenerators() {
  const root = path.join(__dirname, '..');
  const ctx = { window: {} };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return ctx.window.Mathwise;
};
module.exports.FILES = FILES;
