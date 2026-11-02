#!/usr/bin/env node
// Fill every `generator` block of a worksheet/quiz file and write a document
// the editor can open:
//
//   node tools/generate.js examples/recipes/math9-powers-practice-quiz.json out.json [--seed new-seed]
//
// Blocks without their own seed use the document's `seed` plus their position.
// --seed sets a new document seed and clears the block seeds, giving a fresh
// version of the same quiz (same question types, new numbers).
'use strict';
const fs = require('fs');
const MW = require('./load-generators')();

const args = process.argv.slice(2);
const si = args.indexOf('--seed');
const seed = si >= 0 ? args.splice(si, 2)[1] : null;
const [input, output] = args;
if (!input || !output) {
  console.error('Usage: node tools/generate.js <recipe.json> <out.json> [--seed <seed>]');
  process.exit(2);
}
const doc = JSON.parse(fs.readFileSync(input, 'utf8'));
if (seed != null) {
  doc.seed = seed;
  doc.blocks.forEach((b) => { if (b.generator) delete b.generator.seed; });
}
const out = MW.generators.fillDocument(doc);
fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
console.log('Wrote ' + output);
