// Checks for the generator library: run with `node tests/check-generators.js`.
// - every generator is deterministic for a seed and never throws on its defaults
// - every prompt, step and answer is valid KaTeX
// - numbers agree: each worked step and the answer have the prompt's value
//   (or solve its equation), checked numerically by tests/tex-check.js
// - the example quizzes pass the same numeric check
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const katex = require('../vendor/katex/katex.min.js');
const { checkItem } = require('./tex-check');
const MW = require('../tools/load-generators')();
const G = MW.generators;

function mathOf(s) { return String(s || '').split(/\$\$?/).filter((_, i) => i % 2 === 1); }
function katexOk(s, where) {
  mathOf(s).forEach((m) => {
    try { katex.renderToString(m, { throwOnError: true }); }
    catch (e) { throw new Error(where + ': bad TeX "' + m + '": ' + e.message); }
  });
}

// Extra parameter sets beyond the defaults, to reach every option.
const VARIANTS = {
  'powers.product-quotient': [{ bases: ['variable'] }, { bases: ['negative'], negatives: false }],
  'powers.monomials': [{ terms: 3 }, { negativeCoefficients: false, negatives: false }],
  'powers.power-of-power': [{ bases: ['number'], operations: ['divide'] }],
  'powers.order': [{ bases: [5, 10], count: 4 }]
};

let items = 0, checked = 0;
const fails = [];
for (const gen of G.list()) {
  assert.strictEqual(G.validate(gen, {}).length, 0, gen.name + ' defaults are valid');
  for (const params of [{}].concat(VARIANTS[gen.name] || [])) {
    for (let seed = 0; seed < 150; seed++) {
      const block = { kind: 'question', generator: { name: gen.name, params, seed: 's' + seed, count: gen.whole ? 1 : 6 } };
      const a = G.fillBlock(block), b = G.fillBlock(block);
      assert.strictEqual(JSON.stringify(a), JSON.stringify(b), gen.name + ' is deterministic');
      for (const it of a.parts || [a]) {
        items++;
        ['prompt', 'answer', 'solution'].forEach((k) => katexOk(it[k], gen.name + ' ' + k));
        assert.ok(it.prompt && it.answer, gen.name + ' gives prompt and answer');
        const r = checkItem(it);
        if (r) { checked++; if (r.length) fails.push(gen.name + ' ' + JSON.stringify(params) + ' seed s' + seed + ': ' + it.prompt + '\n    ' + r.join('\n    ')); }
      }
    }
  }
}

// Friendly validation errors.
const pq = G.get('powers.product-quotient');
assert.ok(G.validate(pq, { maxExponent: 99 })[0].includes('from 2 to 30'));
assert.ok(G.validate(pq, { bases: [] })[0].includes('at least one'));

// Hand-made and generated example quizzes pass the same numeric check.
for (const f of fs.readdirSync(path.join(__dirname, '..', 'examples')).filter((f) => f.includes('powers'))) {
  const doc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'examples', f), 'utf8'));
  doc.blocks.filter((b) => b.kind === 'question').forEach((b, bi) => {
    // "Evaluate each expression for $a=-3,\ b=2,\ c=-1$": use those values.
    const given = {};
    const m = /for \$([^$]*)\$/.exec(b.prompt || '');
    if (m) m[1].split(/,\\ |,/).forEach((kv) => { const [k, v] = kv.split('='); given[k.trim()] = Number(v); });
    for (const it of b.parts || [b]) {
      const r = checkItem(it, given);
      if (r && r.length) fails.push(f + ' block ' + bi + ': ' + it.prompt + '\n    ' + r.join('\n    '));
    }
  });
}

if (fails.length) { console.error(fails.slice(0, 30).join('\n')); console.error(fails.length + ' problems'); process.exit(1); }
console.log('Generators OK: ' + items + ' items, ' + checked + ' checked numerically.');
