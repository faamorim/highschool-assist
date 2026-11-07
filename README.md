# Mathwise

Small, server-free math tools for the high-school classroom: a teacher side for building
worksheets and quizzes, and (coming later) a student side with practice apps. Everything runs in the
browser and works on GitHub Pages; your files stay on your computer.

## Worksheet & quiz editor

[`worksheets/`](worksheets/) — build worksheets and quizzes, then print them or save as PDF.

* **Open / Save** a `.json` file (in Chrome and Edge, *Save* writes back to the same file;
  other browsers download a copy). Your current work is also kept in the browser between visits.
* **Edit** the header (name, date, period, block, grade blank with automatic total, custom
  fields) and the body: headings, rich text, worked examples, questions with parts in 1–4
  columns, tables with blank cells, images and page breaks.
* **Math** is written in LaTeX between `$…$` and previewed live (KaTeX, bundled in `vendor/`).
* **Print handout** gives the title on every page and `1 out of N` page numbers, optionally with
  an answers page for students. **Print key** prints the teacher key as its own document
  (final answers or worked solutions), so you can print 30 handouts and one key.
  *Show answers* gives a teacher copy of the handout with answers in red.
* The **JSON** tab shows the raw file, for quick bulk edits or pasting generated content.

The file format is documented in [`docs/worksheet-format.md`](docs/worksheet-format.md) and
defined by [`schema/worksheet.schema.json`](schema/worksheet.schema.json). Two examples,
recreated from real Math 9 handouts, are in [`examples/`](examples/) and in the editor's
*Examples…* menu.

## Running it

* **Online:** enable GitHub Pages for this repository (Settings → Pages → Deploy from the
  `main` branch, `/ (root)`), then open `https://<user>.github.io/mathwise/`.
* **Locally:** run `python3 -m http.server` in this folder and open
  <http://localhost:8000/>. Opening `worksheets/index.html` straight from disk also works,
  except for the *Examples…* menu.

Checks: `node tests/check-examples.js` (example files), `node tests/check-generators.js`
(generators), `node tests/check-contract.js` (the [generator API](docs/generator-api.md)).

## Coming later

Problem generators for worksheets and quizzes, and student practice apps built on them.
