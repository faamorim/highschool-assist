#!/usr/bin/env node
// Fill every `generator` block of a worksheet/quiz file and write a document
// the editor can open:
//
//   node tools/generate.js examples/recipes/math9-powers-practice-quiz.json out.json [--seed new-seed]
//
// --seed replaces each block's seed with "<new-seed>/<block number>", giving a
// fresh version of the same quiz (same question types, new numbers).
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
if (seed != null) doc.blocks.forEach((b, i) => { if (b.generator) b.generator.seed = seed + '/' + (i + 1); });
const out = MW.generators.fillDocument(doc);
fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
console.log('Wrote ' + output);
