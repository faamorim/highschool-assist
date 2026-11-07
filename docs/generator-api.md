# Generator API (v1)

This is the contract between the **generator library** (`generators/`) and everything
that uses it: the worksheet & quiz editor (`worksheets/`), the command-line tools, and
later the student practice page. Pages may rely on what is written here and on nothing
else; generators may change anything not written here.

`Mathwise.generators.apiVersion` is `1`. Checked by `node tests/check-contract.js`.

## Who owns what

| Path | Owner |
| --- | --- |
| `generators/` (every file), `tests/check-generators.js`, `tests/tex-check.js`, `tools/generate.js`, `examples/recipes/` | Generator work |
| `worksheets/` (including `js/generated.js`, the editor's only door into the library), `schema/` except the `generator` field, `docs/worksheet-format.md` | Editor work |
| This file, the `generator` field of `schema/worksheet.schema.json`, the functions listed below, `tests/check-contract.js` | Shared: change only with the owner's OK |

**Changing the contract.** Adding a generator, or adding an *optional* field that old
pages can ignore, is free and stays v1. Renaming or removing anything below, or changing
the seed rule, is a new version: it needs the owner's OK and lands together with the
matching change on the other side.

## Loading

Pages load one file, `generators/index.js`, which loads `core.js` and every generator
file, in order, before the next script tag (works from `file://` too). Node tools use
`tools/load-generators.js`, which reads the same list. A new generator file is added to
the list in `generators/index.js` and nowhere else.

## 1. Describe: `list()`, `get(name)`

Each returns generator descriptors (`get` throws on an unknown name). Pages may read:

| Field | Meaning |
| --- | --- |
| `name` | Stable id stored in files, `<topic>.<what>` (`powers.monomials`). Never renamed once used. |
| `title` | Shown to the teacher ("Evaluate powers with negative exponents"). |
| `topic` | Groups generators in a picker ("Powers", "Scientific notation"). |
| `prompt` | Default instruction for a block ("Simplify"). |
| `whole` | `true`: one generated item is the whole question (no parts). |
| `columns`, `workSpace` | Layout suggestions: parts per row, work lines per part. |
| `params` | The settings, below. |

Parameters show real values, never "easy/hard":

```
{ key, label, type: 'number', min, max, default }                 // whole numbers
{ key, label, type: 'choice', values: [{ value, label }], default }
{ key, label, type: 'set',    values: [{ value, label }], default: [...] }   // pick at least one
{ key, label, type: 'toggle', default: true }
```

A page builds its controls from these four types only. A new type is a contract change.
`defaults(gen)` gives the default values.

## 2. Check: `validate(gen, values)`

Returns a list of friendly messages (empty when the values are fine). Missing values take
their defaults.

## 3. Generate: `generate(name, values, seed, { output, index, count })`

Returns one item:

```json
{ "prompt": "$12t^4\\div 3t^{-3}$", "answer": "$4t^{7}$",
  "steps": ["$=\\frac{12}{3}t^{4-(-3)}$", "$=4t^{7}$"], "workSpace": 1.5 }
```

- `output`: `steps` (default), `answer` (no `steps`), `none` (no `answer` either).
- Text is worksheet markup: math is LaTeX inside `$…$`, `\$` is a literal dollar.
- `steps`: one line each, one rule applied per line (granular, for teaching the method).
- **Deterministic:** same name + values + seed = same item. No clock, no `Math.random`.
- `index` / `count`: the part's position in its block (lets a block spread its forms).
- Items may later carry extra optional fields (see *Planned*); pages ignore what they
  do not know.

## 4. Fill a block: `fillBlock(block, { docSeed, blockNumber, output })`, `fillDocument(doc)`

`fillBlock` turns a stored question block into a block with `parts` (each with `prompt`,
`answer`, `solution` = steps joined by new lines), or, for a `whole` generator, the
block's own `prompt`, `answer`, `solution`. It fills `prompt`, `columns` and `space` from
the descriptor when the block has none. It returns a new block; its `generator` field is
kept exactly as given. `fillDocument` does this for every generator block of a document.

**The seed rule** lives only in `blockSeed(generator, docSeed, blockNumber)`: the block's
own `generator.seed` wins; otherwise `"<doc seed>/<block number>"` (block numbers from 1,
`mathwise` when the document has no seed). Part *i* of a block uses `"<block seed>:<i>"`.
Changing any of this changes the numbers of every saved quiz.

## 5. Stored form (shared part of the worksheet schema)

```json
{ "kind": "question", "generator": { "name": "powers.monomials", "params": { "terms": 2 }, "seed": "unit3/8", "count": 4 } }
```

`params` hold real parameter values only (never slider positions, difficulty or aspect
names), so saved files keep working when presets are retuned. `seed` is optional.

## Planned (not built yet, agreed 2026-11-07)

These will be added to this contract when they are built:

- **Question templates (v2).** Each generator splits into `variables` (name, kind,
  label), `pick(values, rng)` → variables, and `render(variables)` → `{ prompt, answer,
  steps }`, with `generate = render(pick(…))`, checked by the contract test. The editor can
  then *unlink* a generated question: it keeps the template name and its variables but no
  seed (`template: { name, vars, overrides }`); the teacher edits a value, a function or a
  letter and the answer and steps re-render; text typed over by hand stays.
- **Difficulty presets:** `presets` on the heat scale (mild, medium, spicy, extra spicy),
  each a set of parameter values; aspects and `sliceOrder` for thin slicing.
- **Graphs:** an optional `graph` object on items, in the format of a shared
  `docs/graph-format.md`. Generators only describe graphs; pages draw them.
- **Practice:** optional `check(item, studentAnswer)` and per-step `hints`, and a
  `method` setting for guided steps (e.g. cross method for factoring).
- **Written-question data:** real data sets with sources in `generators/data/` for word
  problems built on templates.
