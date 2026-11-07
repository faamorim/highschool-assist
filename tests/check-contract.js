// Checks that every generator keeps the Generator API v1 (docs/generator-api.md):
// run with `node tests/check-contract.js`. The editor relies on exactly these things.
'use strict';
const assert = require('assert');
const MW = require('../tools/load-generators')();
const G = MW.generators;

const fail = [];
function check(ok, msg) { if (!ok) fail.push(msg); }
const isStr = (x) => typeof x === 'string' && x.length > 0;

// The public API.
check(G.apiVersion === 1, 'apiVersion must be 1');
['list', 'get', 'defaults', 'validate', 'generate', 'fillBlock', 'fillDocument', 'blockSeed'].forEach((f) =>
  check(typeof G[f] === 'function', 'missing API function ' + f));

// The seed rule.
assert.strictEqual(G.blockSeed({ seed: 'own' }, 'doc', 3), 'own');
assert.strictEqual(G.blockSeed({}, 'doc', 3), 'doc/3');
assert.strictEqual(G.blockSeed({ seed: '' }, '', 1), 'mathwise/1');
assert.strictEqual(G.blockSeed({}, undefined, 2), 'mathwise/2');

const TYPES = ['number', 'choice', 'set', 'toggle'];
const names = {};
const gens = G.list();
check(gens.length > 0, 'no generators loaded');

gens.forEach((gen) => {
  const n = gen.name;
  const where = (m) => n + ': ' + m;
  check(/^[a-z0-9-]+\.[a-z0-9-]+$/.test(n), where('name must look like topic.what'));
  check(!names[n], where('duplicate name')); names[n] = true;
  check(G.get(n) === gen, where('get() does not return it'));
  check(isStr(gen.title), where('title missing'));
  check(isStr(gen.topic), where('topic missing'));
  check(isStr(gen.prompt), where('prompt missing'));
  if (gen.whole != null) check(typeof gen.whole === 'boolean', where('whole must be true/false'));
  if (gen.columns != null) check(Number.isInteger(gen.columns) && gen.columns >= 1 && gen.columns <= 4, where('columns 1-4'));
  if (gen.workSpace != null) check(typeof gen.workSpace === 'number' && gen.workSpace >= 0, where('workSpace must be a number'));

  const keys = {};
  (gen.params || []).forEach((p) => {
    const pw = (m) => where('param ' + p.key + ': ' + m);
    check(isStr(p.key) && !keys[p.key], pw('key missing or repeated')); keys[p.key] = true;
    check(isStr(p.label), pw('label missing'));
    check(TYPES.includes(p.type), pw('type must be one of ' + TYPES.join(', ')));
    if (p.type === 'number') check(Number.isInteger(p.min) && Number.isInteger(p.max) && p.min <= p.max, pw('min/max'));
    if (p.type === 'choice' || p.type === 'set') {
      check(Array.isArray(p.values) && p.values.length > 0 && p.values.every((o) => o.value !== undefined && isStr(o.label)),
        pw('values must be [{ value, label }]'));
    }
  });
  check(G.validate(gen, {}).length === 0, where('defaults do not validate: ' + G.validate(gen, {}).join(' ')));
  check(G.validate(gen, G.defaults(gen)).length === 0, where('defaults() do not validate'));

  // One item, three output levels, deterministic.
  const a = G.generate(n, {}, 'contract', { output: 'steps' });
  const b = G.generate(n, {}, 'contract', { output: 'steps' });
  check(JSON.stringify(a) === JSON.stringify(b), where('not deterministic'));
  check(isStr(a.prompt) && isStr(a.answer), where('item needs prompt and answer'));
  check(Array.isArray(a.steps) && a.steps.every((s) => typeof s === 'string'), where('steps must be strings'));
  check(typeof a.workSpace === 'number', where('item workSpace must be a number'));
  const ans = G.generate(n, {}, 'contract', { output: 'answer' });
  check(ans.steps === undefined && isStr(ans.answer), where("output 'answer' must drop steps only"));
  const none = G.generate(n, {}, 'contract', { output: 'none' });
  check(none.answer === undefined && isStr(none.prompt), where("output 'none' must give the prompt only"));

  // A stored block fills, keeps its generator field, and follows the seed rule.
  const stored = { kind: 'question', generator: { name: n, params: {}, count: 3 } };
  const f = G.fillBlock(stored, { docSeed: 'doc', blockNumber: 2 });
  check(JSON.stringify(f.generator) === JSON.stringify(stored.generator), where('fillBlock changed the generator field'));
  check(stored.parts === undefined, where('fillBlock changed its input'));
  const same = G.fillBlock({ kind: 'question', generator: { name: n, params: {}, count: 3, seed: 'doc/2' } });
  check(JSON.stringify(f.parts || f.answer) === JSON.stringify(same.parts || same.answer), where('fillBlock ignores the seed rule'));
  if (gen.whole) check(isStr(f.prompt) && isStr(f.answer) && !f.parts, where('whole block needs prompt + answer, no parts'));
  else check(Array.isArray(f.parts) && f.parts.length === 3 && f.parts.every((p) => isStr(p.prompt) && isStr(p.answer)),
    where('block must have count parts with prompt and answer'));
});

if (fail.length) {
  console.error('Generator API v1 broken:\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('Generator API v1 OK: ' + gens.length + ' generators.');
