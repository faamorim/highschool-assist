# Worksheet & quiz file format

Worksheets and quizzes are the same kind of file: one `.json` file per document.
The formal definition is [`schema/worksheet.schema.json`](../schema/worksheet.schema.json);
this page explains it with examples. Full examples live in [`examples/`](../examples).

```json
{
  "schemaVersion": 1,
  "type": "quiz",
  "title": "(5+) Math 9  Powers Quiz",
  "header": {
    "fields": ["name"],
    "showGrade": true,
    "gradeLabel": "Quiz",
    "custom": [{ "label": "Group", "width": "s" }],
    "repeat": true
  },
  "footer": { "pageNumbers": true },
  "defaultMarks": 0.5,
  "answerKey": "separate",
  "paper": "letter",
  "blocks": [
    { "kind": "text", "content": "Each question is 0.5 mark. Good luck ☺" },
    { "kind": "question", "prompt": "Evaluate", "columns": 3, "space": 1,
      "parts": [
        { "prompt": "$5^{-1} =$", "answer": "$\\frac{1}{5}$" },
        { "prompt": "$2^{-3} =$", "answer": "$\\frac{1}{8}$" }
      ] }
  ]
}
```

## Document

| Property | Meaning |
|---|---|
| `type` | `"worksheet"` or `"quiz"`. Only changes defaults (grade label, repeating header). |
| `title` | Printed at the top of every page. |
| `header.fields` | Any of `name`, `date`, `period`, `block`, in that order. |
| `header.showGrade` | Adds `Quiz: ____ / 28`. The total is **calculated** from the marks. |
| `header.gradeLabel` | Text before the grade blank (default `Quiz` / `Mark`). |
| `header.gradeTotal` | Optional fixed total instead of the calculated one. |
| `header.custom` | Extra blanks: `{ "label": "Group", "width": "s" }` (`s`, `m`, `l`). |
| `header.repeat` | Repeat the blanks on every page (the title always repeats). |
| `footer.pageNumbers` | `1 out of 3` at the bottom of each page. |
| `defaultMarks` | Marks for any question / part that doesn't set its own. |
| `showMarks` | Print `[2 marks]` next to each question. |
| `answerKey` | `"separate"`: an answer key on its own pages, **not** counted in "1 out of N" and left out of the student printout (print it with *Print key*). Default for quizzes. `"included"`: answers page is part of the handout (practice copies). `"none"`: no key (default for worksheets). |
| `paper` | `"letter"` or `"a4"`. |

## Blocks

`blocks` is the ordered body. Each block has a `kind`:

| kind | Properties |
|---|---|
| `heading` | `text`, `size` (`s`/`m`/`l`), `align` |
| `text` | `content` (rich text, see below), `align` |
| `question` | `prompt`, `marks`, `space`, `answer`, `parts`, `columns`, `boxed`, `table`, `label`, `numbered` |
| `example` | Same as a question, labelled EX1, EX2… and never marked. |
| `table` | `header`, `rows`, `rowLabels`, `widths`, `rowSpace` |
| `image` | `src` (embedded `data:` URL), `width` (% of page), `align`, `caption` |
| `pageBreak` | Starts a new page. |

### Questions

* Questions are numbered `1)`, `2)`… automatically. `label` overrides it, `"numbered": false` hides it.
* `space` is the work space in **lines** (≈ 8 mm each). With parts, it is the space under *each* part.
* `parts` are lettered a), b), c)… and laid out in a grid of `columns` (1–4).
  `"boxed": false` drops the boxes (good for word problems with sub-parts).
  Each part may set its own `answer`, `marks`, `space` and `label`.
* **Marks**: a question without parts is worth `marks`. With parts (or blank table cells),
  `marks` is the value of *each* part / blank cell. Anything unset uses `defaultMarks`.
* A question can carry a `table` (same shape as a table block) whose blank cells students fill in.
* Long question groups and tables continue on the next page, row by row.

### Tables

```json
{ "kind": "table", "rowLabels": true, "widths": [5, 3, 3],
  "header": ["Physical quantity", "Decimal notation", "Scientific notation"],
  "rows": [["Mass of an electron", { "blank": true, "answer": "0.000…92 g" }, "$9.2\\times10^{-28}$ g"]] }
```

A cell is either text, or `{ "blank": true, "answer": "…" }` for a cell students fill in.

## Rich text (every text field)

| Write | Get |
|---|---|
| `**bold**`, `*italic*`, `__underline__` | formatting |
| `$x^2$` | inline math (LaTeX, rendered with KaTeX) |
| `$$\frac{a}{b}$$` | math on its own line |
| `- item` / `1. item` | bullet / numbered list |
| blank line | new paragraph (a single newline is a line break) |
| `[[box]]`, `[[box: 1.2]]` | fill-in box, optionally storing its answer |
| `[[box-sup: 11]]` | small raised box, for an exponent |
| `[[line]]`, `[[line-s]]`, `[[line-l]]`, `[[line: answer]]` | answer line (medium / short / long) |
| `\$` | a literal dollar sign |

Answers stored in blanks go into the answer key, and appear in red when
"Show answers" is ticked (teacher copy). If a part has an `answer` and its prompt
has an empty blank, the answer is shown in that blank.

## For problem generators (later)

Any block may carry an `id` and a `generator` object
(`{ "name": "…", "params": {…}, "seed": 42 }`) recording how it was produced,
so a generator can rebuild or vary it. The editor keeps unknown properties as they are.
