/*
 * Rich-text markup used in every text field of a worksheet / quiz.
 *
 *   **bold**   *italic*   __underline__
 *   $x^2$            inline math (KaTeX)
 *   $$\frac{a}{b}$$  display math (own line, centred)
 *   - item           bullet list (also "* item")
 *   1. item          numbered list
 *   blank line       new paragraph; a single newline is a line break
 *   [[box]]          fill-in box             [[box: 1.2]]  box with its answer
 *   [[line]]         answer line             [[line: 3 \times 10^5]]
 *   size suffixes:   [[box-s]] [[box-l]] [[line-s]] [[line-l]] [[box-sup]] (raised, for exponents)
 *   \$               a literal dollar sign
 *
 * Answers inside [[...]] are themselves markup, so they can contain $math$.
 */
(function (WS) {
  'use strict';

  var BLANK_RE = /^\s*(box|line)(?:-(s|m|l|sup))?\s*(?::([\s\S]*))?$/;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMath(tex, display) {
    if (window.katex) {
      try {
        return window.katex.renderToString(tex, {
          displayMode: !!display,
          throwOnError: false,
          strict: 'ignore',
          trust: false
        });
      } catch (e) {
        /* fall through */
      }
    }
    return '<code class="math-raw">' + escapeHtml(tex) + '</code>';
  }

  // Split source into protected tokens (math / blanks) and plain text.
  function tokenize(src) {
    var out = [];
    var i = 0;
    var text = '';
    var n = src.length;
    function flush() {
      if (text) { out.push({ t: 'text', v: text }); text = ''; }
    }
    while (i < n) {
      var c = src[i];
      if (c === '\\' && src[i + 1] === '$') { text += '$'; i += 2; continue; }
      if (c === '$') {
        var display = src[i + 1] === '$';
        var open = display ? 2 : 1;
        var close = display ? src.indexOf('$$', i + 2) : findClosingDollar(src, i + 1);
        if (close > i) {
          flush();
          out.push({ t: 'math', v: src.slice(i + open, close), display: display });
          i = close + open;
          continue;
        }
      }
      if (c === '[' && src[i + 1] === '[') {
        var end = src.indexOf(']]', i + 2);
        if (end > i) {
          var m = BLANK_RE.exec(src.slice(i + 2, end));
          if (m) {
            flush();
            out.push({ t: 'blank', kind: m[1], size: m[2] || 'm', answer: (m[3] || '').trim() });
            i = end + 2;
            continue;
          }
        }
      }
      text += c;
      i++;
    }
    flush();
    return out;
  }

  function findClosingDollar(src, from) {
    for (var j = from; j < src.length; j++) {
      if (src[j] === '\\') { j++; continue; }
      if (src[j] === '$') return j;
      if (src[j] === '\n' && src[j + 1] === '\n') return -1;
    }
    return -1;
  }

  function renderBlank(tok, opts) {
    var cls = 'blank blank-' + tok.kind + ' blank-' + tok.size;
    var inner = '';
    var answer = tok.answer;
    // opts.fill: {answer} used for the first blank that has no answer of its own
    if (!answer && opts.fill && opts.fill.answer) { answer = opts.fill.answer; opts.fill.answer = ''; }
    if (opts.showAnswers && answer) {
      inner = '<span class="ans">' + inline(answer, { showAnswers: false }) + '</span>';
      cls += ' has-ans';
    }
    return '<span class="' + cls + '">' + inner + '</span>';
  }

  function emphasis(s) {
    return s
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
      .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>');
  }

  // Inline-only rendering (no paragraphs / lists). Newlines become <br>.
  function inline(src, opts) {
    opts = opts || {};
    var store = [];
    var tokens = tokenize(String(src == null ? '' : src));
    var s = '';
    tokens.forEach(function (tok) {
      if (tok.t === 'text') { s += escapeHtml(tok.v); return; }
      var html = tok.t === 'math' ? renderMath(tok.v, tok.display) : renderBlank(tok, opts);
      store.push(html);
      s += '\u0000' + (store.length - 1) + '\u0000';
    });
    s = emphasis(s).replace(/\n/g, '<br>');
    return restore(s, store);
  }

  function restore(s, store) {
    return s.replace(/\u0000(\d+)\u0000/g, function (_, k) { return store[+k]; });
  }

  // Block rendering: returns an array of top-level HTML chunks (paragraphs,
  // lists, display math). Splitting into chunks lets the paginator break
  // long text between paragraphs.
  function blocks(src, opts) {
    opts = opts || {};
    var store = [];
    var tokens = tokenize(String(src == null ? '' : src));
    var s = '';
    tokens.forEach(function (tok) {
      if (tok.t === 'text') { s += escapeHtml(tok.v); return; }
      var html;
      if (tok.t === 'math') {
        html = renderMath(tok.v, tok.display);
        if (tok.display) {
          store.push(html);
          // display math becomes its own block-level chunk
          s += '\n\n\u0001' + (store.length - 1) + '\u0001\n\n';
          return;
        }
      } else {
        html = renderBlank(tok, opts);
      }
      store.push(html);
      s += '\u0000' + (store.length - 1) + '\u0000';
    });

    var chunks = [];
    var lines = s.split('\n');
    var para = [];
    var list = null; // {tag, items}

    function flushPara() {
      if (para.length) {
        chunks.push('<p>' + emphasis(para.join('\n')).replace(/\n/g, '<br>') + '</p>');
        para = [];
      }
    }
    function flushList() {
      if (list) {
        chunks.push('<' + list.tag + '>' + list.items.map(function (it) {
          return '<li>' + emphasis(it) + '</li>';
        }).join('') + '</' + list.tag + '>');
        list = null;
      }
    }

    lines.forEach(function (line) {
      var disp = /^\s*\u0001(\d+)\u0001\s*$/.exec(line);
      var bullet = /^\s*[-*]\s+(.*)$/.exec(line);
      var num = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      if (disp) {
        flushPara(); flushList();
        chunks.push('<div class="math-display">' + store[+disp[1]] + '</div>');
      } else if (!line.trim()) {
        flushPara(); flushList();
      } else if (bullet || num) {
        flushPara();
        var tag = bullet ? 'ul' : 'ol';
        if (!list || list.tag !== tag) { flushList(); list = { tag: tag, items: [] }; }
        list.items.push((bullet || num)[1]);
      } else if (list && /^\s{2,}/.test(line)) {
        list.items[list.items.length - 1] += '<br>' + line.trim();
      } else {
        flushList();
        para.push(line);
      }
    });
    flushPara(); flushList();
    return chunks.map(function (c) { return restore(c, store); });
  }

  // All answers written inside [[box: ...]] / [[line: ...]] blanks.
  function blankAnswers(src) {
    return tokenize(String(src == null ? '' : src))
      .filter(function (t) { return t.t === 'blank' && t.answer; })
      .map(function (t) { return t.answer; });
  }

  WS.markup = {
    inline: inline,
    blocks: blocks,
    html: function (src, opts) { return blocks(src, opts).join(''); },
    blankAnswers: blankAnswers,
    escapeHtml: escapeHtml
  };
})(window.WS = window.WS || {});
