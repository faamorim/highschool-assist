// Loads the browser generator library into node (no dependencies): returns window.Mathwise.
// The file list comes from generators/index.js, the same list the pages use.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function run(ctx, f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}

module.exports = function loadGenerators() {
  const ctx = { window: {} };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  run(ctx, 'generators/index.js');
  for (const f of ctx.window.Mathwise.generatorFiles) run(ctx, 'generators/' + f);
  return ctx.window.Mathwise;
};
