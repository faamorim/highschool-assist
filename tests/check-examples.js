// Sanity checks for the example files: run with `node tests/check-examples.js`.
// Loads the browser model code in a minimal fake window (no dependencies).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
for (const f of ['worksheets/js/markup.js', 'worksheets/js/model.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const WS = ctx.window.WS;
const load = (f) => WS.model.normalize(JSON.parse(fs.readFileSync(path.join(root, 'examples', f), 'utf8')));

// Quiz: 56 parts x 0.5 marks = 28, like the paper original.
const quiz = load('math9-powers-quiz.json');
assert.strictEqual(WS.model.totalMarks(quiz), 28, 'quiz total');
assert.strictEqual(WS.model.labels(quiz).filter(Boolean).length, 14, 'quiz has 14 questions');
assert.strictEqual(quiz.answerKey, 'separate', 'quiz key is separate by default');
assert.strictEqual(WS.model.normalize({ type: 'quiz', title: '', blocks: [] }).answerKey, 'separate');
assert.strictEqual(WS.model.normalize({ type: 'worksheet', title: '', blocks: [], answerKey: true }).answerKey, 'separate');
const key = WS.model.answerKey(quiz);
assert.strictEqual(key.length, 14, 'every quiz question has answers');

// Worksheet: every homework question has answers, including table blanks and inline blanks.
const ws = load('math9-scientific-notation-notes.json');
const wkey = WS.model.answerKey(ws);
assert.strictEqual(wkey.length, 7, 'worksheet homework answers');
const q3 = wkey.find((q) => q.label === '3)');
assert.strictEqual(q3.items.length, 9, 'Q3 table: one answer per row');

// Markup basics.
const M = WS.markup;
assert.strictEqual(JSON.stringify(M.blankAnswers('a [[box: 1.2]] b [[line]] [[box-sup: 11]]')), '["1.2","11"]');
assert.ok(M.inline('**b** __u__ *i*').includes('<strong>b</strong> <u>u</u> <em>i</em>'));
assert.strictEqual(M.blocks('- a\n- b\n\npara').length, 2);
assert.ok(M.inline('<script>').includes('&lt;script&gt;'), 'HTML is escaped');

console.log('All checks passed.');
