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
['list', 'get', 'defaults', 'validate', 'generate', 'fillBlock', 'fillDocument', 'blockSeed',
  'isTemplate', 'varApplies', 'checkVars', 'pick', 'render', 'placeholders', 'unlink'].forEach((f) =>
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

  // Question template: variables + pick + render, with generate = render(pick()).
  check(G.isTemplate(gen), where('must be a template (variables, pick, render)'));
  if (!G.isTemplate(gen)) return;
  const vkeys = {};
  check(Array.isArray(gen.variables) && gen.variables.length > 0, where('variables missing'));
  (gen.variables || []).forEach((d) => {
    const vw = (m) => where('variable ' + d.key + ': ' + m);
    check(isStr(d.key) && !vkeys[d.key], vw('key missing or repeated')); vkeys[d.key] = true;
    check(isStr(d.label), vw('label missing'));
    check(G.varKinds.includes(d.kind), vw('kind must be one of ' + G.varKinds.join(', ')));
    if (d.kind === 'list') check(d.of && G.varKinds.includes(d.of.kind) && d.of.kind !== 'list', vw('list needs of: { kind } (not a list)'));
    if (d.kind === 'choice') check(Array.isArray(d.values) && d.values.every((o) => o.value !== undefined && isStr(o.label)), vw('values must be [{ value, label }]'));
    if (d.when) check(Object.keys(d.when).every((k) => Array.isArray(d.when[k])), vw('when must map keys to lists'));
  });
  for (let i = 0; i < 20; i++) {
    const seed = 'contract' + i;
    const vars = G.pick(n, {}, seed, { index: i % 3, count: 3 });
    const json = JSON.parse(JSON.stringify(vars));
    check(JSON.stringify(json) === JSON.stringify(vars), where('vars must be plain JSON'));
    check(Object.keys(vars).every((k) => vkeys[k]), where('pick returned a var not in variables: ' + Object.keys(vars).join(', ')));
    const errs = G.checkVars(gen, json);
    check(errs.length === 0, where('picked vars fail checkVars: ' + errs.join(' ')));
    if (errs.length) continue;
    const r = G.render(n, json);
    const g = G.generate(n, {}, seed, { index: i % 3, count: 3 });
    check(JSON.stringify(r) === JSON.stringify(g), where('render(pick()) differs from generate()'));
  }
  // Unlinked block shows the same questions; overrides with placeholders win.
  const stored2 = { kind: 'question', generator: { name: n, params: {}, count: 3, seed: 'u' } };
  const un = G.unlink(stored2);
  check(!un.generator && un.template && un.template.name === n && Array.isArray(un.template.items), where('unlink must give template { name, items }'));
  const refilled = G.fillBlock(un);
  const filled = G.fillBlock(stored2);
  check(JSON.stringify(refilled.parts || refilled.answer) === JSON.stringify(filled.parts || filled.answer), where('unlinked block differs from the generated one'));
  const it = un.template.items[0];
  const key = Object.keys(it.vars).find((k) => typeof it.vars[k] !== 'object');
  it.overrides = { answer: 'is %' + key + '% (100%%)' };
  const ov = G.fillBlock(un);
  check((ov.parts ? ov.parts[0] : ov).answer === 'is ' + it.vars[key] + ' (100%)', where('override placeholders not filled'));
  check(G.placeholders(n, it.vars).includes(key), where('placeholders() misses ' + key));
});

if (fail.length) {
  console.error('Generator API v1 broken:\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('Generator API v1 OK: ' + gens.length + ' generators.');
