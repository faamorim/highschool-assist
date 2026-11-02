# Problem generators

Generators live in `generators/` as classic scripts (no build, work from `file://`):
`core.js` first, then any generator files (`powers.js`, `sci-notation.js`).
They register on `window.Mathwise.generators`.

## Using one

```js
const G = Mathwise.generators;
G.generate('powers.product-quotient', { bases: ['variable'] }, 'my-seed', { output: 'steps' });
// -> { prompt: '$p^{-7}\\div p^2 =$', answer: '$p^{-9}$', steps: ['$= p^{-7-2}$'], workSpace: 1.5 }
```

- `output`: `steps` (default), `answer`, or `none` (question only).
- The seed is always passed in. Same name + params + seed = same question.
- Math is LaTeX inside `$…$`. Steps are one line each, one rule per line.

## In a worksheet or quiz

A question block can carry a generator instead of hand-written parts:

```json
{ "kind": "question", "prompt": "Simplify",
  "generator": { "name": "powers.monomials", "params": { "terms": 2 }, "seed": "unit3/8", "count": 4 } }
```

`node tools/generate.js recipe.json out.json` fills every such block (parts get
`prompt`, `answer` and the worked `solution`), keeping the `generator` field so the
block can be rebuilt. `--seed something-new` gives a fresh version with new numbers.
Part *i* is built from seed `"<seed>:<i>"`; repeated prompts in a block are re-rolled.
Forms chosen in a `set` parameter are spread across the parts in the listed order.

Example: `examples/recipes/math9-powers-practice-quiz.json` ->
`examples/math9-powers-practice-quiz-generated.json`.

## Generators

| Name | Makes | Main parameters |
| --- | --- | --- |
| `powers.negative-exponent` | Evaluate $2^{-3}$, $10^{-4}$, $(\frac14)^{-2}$, $\frac{3}{4^{-2}}$, $(0.5)^{-2}$ | forms, largest exponent, largest value |
| `powers.product-quotient` | $7^{-8}\div7^2$, $p^{-7}\div p^2$ | base (number / negative / variable), ×÷, exponent size, negatives |
| `powers.power-of-power` | $(y^4)^2\times(y^{-2})^3$ | base, ×÷, exponent size, negatives |
| `powers.monomials` | $12t^4\div3t^{-3}$, 3-term chains | terms, ×÷, coefficient size, negative coefficients, exponent size |
| `powers.evaluate-mixed` | $5^2+5^{-1}$, $(2\times3)^{-2}$, $3^{-1}+3^{-2}$, $(2^2-1)^{-2}$ | forms |
| `powers.positive-exponents` | $\frac{1}{100}$, $\frac{1}{-32}$, $0.125$ as powers | forms, largest denominator |
| `powers.order` | Write as powers of one base, put in order (whole question) | base, how many, largest denominator |
| `powers.solve-exponential` | $2^x=\frac12$, $x^{-3}=\frac1{125}$, $10^{2-x}=0.001$, $9^{1+x}=27$ | forms |
| `sci.to-scientific` | $3700000$, $0.0000001$ | large/small, digits, exponent size |
| `sci.normalize` | $247\times10^8$, $0.087\times10^3$ | too big/too small, digits, exponent size |
| `sci.find-exponent` | $0.0000563=5.63\times10^n$ | large/small, digits, exponent size |

Parameters show real values and accepted values (`params` on each generator;
`G.validate(gen, values)` returns friendly messages). Difficulty presets and
aspect bands (see the generator design doc) are the next layer on top.

## Checks

`node tests/check-generators.js` runs every generator for many seeds: deterministic,
valid KaTeX, and every worked step and answer checked numerically against the
prompt (equations are checked by substituting the answer). The example quizzes get
the same numeric check.
