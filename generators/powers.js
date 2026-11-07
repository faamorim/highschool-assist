/*
 * Powers and exponent laws (Math 9): negative exponents, product / quotient /
 * power-of-a-power laws, monomials, simple exponential equations.
 * Needs generators/core.js first.
 */
(function (root) {
  'use strict';
  var G = root.Mathwise.generators;
  var M = root.Mathwise.math;
  var pow = M.pow, num = M.num, frac = M.frac, fracTex = M.fracTex, opExp = M.opExp, mono = M.mono;

  // Letters that read clearly next to numbers (no i, l, o, e, s).
  var LETTERS = ['a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'r', 't', 'w', 'x', 'y', 'z'];

  function ipow(b, n) { var r = 1; for (var i = 0; i < n; i++) r *= b; return r; }
  function dfrac(a, b) { return '\\dfrac{' + a + '}{' + b + '}'; }
  function paren(x) { return '(' + x + ')'; }
  function mulExp(a, b) { return a + '\\times' + (b < 0 ? paren(b) : b); }
  function opTex(op) { return op === 'multiply' ? '\\times ' : '\\div '; }

  // Nonzero exponent in [-max, max] (or [1, max] without negatives).
  // Skips +-1 when there is room, so every power shows a real exponent.
  function exponent(rng, max, negatives) {
    var lo = max >= 4 ? 2 : 1;
    var e = rng.int(lo, max);
    return negatives && rng.chance(0.5) ? -e : e;
  }

  // Every way to write v as B^N with N >= 2 (for answers like 1/2^6 = 1/4^3 = 1/8^2).
  function powerForms(v, odd) {
    var out = [];
    for (var b = 2; b <= v; b++) {
      for (var n = 2, p = b * b; p <= v; n++, p *= b) {
        if (p === v && (!odd || n % 2 === 1)) out.push([b, n]);
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.negative-exponent',
    topic: 'Powers',
    title: 'Evaluate powers with negative exponents',
    prompt: 'Evaluate',
    columns: 3,
    workSpace: 1,
    params: [
      { key: 'forms', label: 'Forms', type: 'set', default: ['basic', 'ten', 'fraction', 'reciprocal', 'coefficient', 'decimal'],
        values: [
          { value: 'basic', label: 'b⁻ⁿ, like 2⁻³' },
          { value: 'ten', label: '10⁻ⁿ' },
          { value: 'fraction', label: '(1/b)⁻ⁿ' },
          { value: 'reciprocal', label: '1 / b⁻ⁿ' },
          { value: 'coefficient', label: 'k / b⁻ⁿ' },
          { value: 'decimal', label: '(0.5)⁻ⁿ' }
        ] },
      { key: 'maxExponent', label: 'Largest exponent (size)', type: 'number', min: 1, max: 5, default: 3 },
      { key: 'maxValue', label: 'Largest value of bⁿ', type: 'number', min: 4, max: 1000, default: 64 }
    ],
    generate: function (v, rng, ctx) {
      var form = ctx.spread('forms', rng);
      function bn(bases) {
        var n = rng.intWhere(1, v.maxExponent, function (n) { return bases.some(function (b) { return ipow(b, n) <= v.maxValue; }); });
        var b = rng.pick(bases.filter(function (b) { return ipow(b, n) <= v.maxValue; }));
        return { b: b, n: n, V: ipow(b, n) };
      }
      var x;
      switch (form) {
        case 'basic':
          x = bn([2, 3, 4, 5, 6, 7, 8, 9]);
          return { prompt: '$' + pow(x.b, -x.n) + ' =$', steps: ['$= ' + dfrac(1, pow(x.b, x.n)) + '$'], answer: '$' + fracTex(frac(1, x.V)) + '$' };
        case 'ten':
          var n = rng.int(2, Math.min(6, v.maxExponent + 2));
          return { prompt: '$' + pow(10, -n) + ' =$', steps: ['$= ' + dfrac(1, pow(10, n)) + '$'], answer: '$' + fracTex(frac(1, ipow(10, n))) + '$' };
        case 'fraction':
          x = bn([2, 3, 4, 5, 6, 7, 8, 9, 10]);
          return { prompt: '$\\left(' + dfrac(1, x.b) + '\\right)^{' + -x.n + '} =$', steps: ['$= ' + pow(x.b, x.n) + '$'], answer: '$' + num(x.V) + '$' };
        case 'reciprocal':
          x = bn([2, 3, 4, 5, 6, 7, 8, 9]);
          return { prompt: '$' + dfrac(1, pow(x.b, -x.n)) + ' =$', steps: ['$= ' + pow(x.b, x.n) + '$'], answer: '$' + num(x.V) + '$' };
        case 'coefficient':
          x = bn([2, 3, 4, 5, 6]);
          var k = rng.intWhere(2, 5, function (k) { return k !== x.b; });
          var st = ['$= ' + k + '\\times' + pow(x.b, x.n) + '$'];
          if (x.n > 1) st.push('$= ' + k + '\\times' + num(x.V) + '$');
          return { prompt: '$' + dfrac(k, pow(x.b, -x.n)) + ' =$', steps: st, answer: '$' + num(k * x.V) + '$' };
        default: // decimal
          var DEC = { 2: '0.5', 4: '0.25', 5: '0.2', 10: '0.1' };
          x = bn([2, 4, 5, 10]);
          return {
            prompt: '$(' + DEC[x.b] + ')^{' + -x.n + '} =$',
            steps: ['$= \\left(' + dfrac(1, x.b) + '\\right)^{' + -x.n + '}$', '$= ' + pow(x.b, x.n) + '$'],
            answer: '$' + num(x.V) + '$'
          };
      }
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.product-quotient',
    topic: 'Powers',
    title: 'Multiply or divide powers with the same base',
    prompt: 'Simplify',
    columns: 3,
    workSpace: 1.5,
    params: [
      { key: 'bases', label: 'Base', type: 'set', default: ['number'],
        values: [
          { value: 'number', label: 'Positive number, like 7' },
          { value: 'negative', label: 'Negative number, like (−5)' },
          { value: 'variable', label: 'Variable, like p' }
        ] },
      { key: 'operations', label: 'Operations', type: 'set', default: ['multiply', 'divide'],
        values: [{ value: 'multiply', label: '×' }, { value: 'divide', label: '÷' }] },
      { key: 'maxExponent', label: 'Largest exponent (size)', type: 'number', min: 2, max: 30, default: 12 },
      { key: 'negatives', label: 'Negative exponents', type: 'toggle', default: true }
    ],
    generate: function (v, rng, ctx) {
      var kind = ctx.spread('bases', rng);
      var op = rng.pick(v.operations);
      var base = kind === 'variable' ? rng.pick(LETTERS) : kind === 'negative' ? -rng.int(2, 9) : rng.int(2, 9);
      var m, n, r;
      for (var t = 0; t < 200; t++) {
        m = exponent(rng, v.maxExponent, v.negatives);
        n = exponent(rng, v.maxExponent, v.negatives);
        if (v.negatives && m > 0 && n > 0) m = -m;
        r = op === 'multiply' ? m + n : m - n;
        if (r !== 0 && r !== 1) break;
      }
      var steps = ['$= ' + pow(base, opExp(m, op === 'multiply' ? '+' : '-', n)) + '$'];
      if (op === 'divide' && n < 0) steps.push('$= ' + pow(base, m + '+' + -n) + '$');
      return {
        prompt: '$' + pow(base, m) + opTex(op) + pow(base, n) + ' =$',
        steps: steps,
        answer: '$' + pow(base, r) + '$'
      };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.power-of-power',
    topic: 'Powers',
    title: 'Power of a power, then multiply or divide',
    prompt: 'Simplify',
    columns: 2,
    workSpace: 1,
    params: [
      { key: 'bases', label: 'Base', type: 'set', default: ['variable', 'number'],
        values: [{ value: 'variable', label: 'Variable, like y' }, { value: 'number', label: 'Number, like 5' }] },
      { key: 'operations', label: 'Operations', type: 'set', default: ['multiply', 'divide'],
        values: [{ value: 'multiply', label: '×' }, { value: 'divide', label: '÷' }] },
      { key: 'maxExponent', label: 'Largest exponent (size)', type: 'number', min: 2, max: 6, default: 4 },
      { key: 'negatives', label: 'Negative exponents', type: 'toggle', default: true }
    ],
    generate: function (v, rng, ctx) {
      var kind = ctx.spread('bases', rng);
      var base = kind === 'variable' ? rng.pick(LETTERS) : rng.int(2, 9);
      var op = rng.pick(v.operations);
      var a, c, d, e, p, q, r;
      for (var t = 0; t < 200; t++) {
        a = exponent(rng, v.maxExponent, v.negatives); c = exponent(rng, v.maxExponent, v.negatives);
        d = exponent(rng, v.maxExponent, v.negatives); e = exponent(rng, v.maxExponent, v.negatives);
        if (v.negatives && a > 0 && c > 0 && d > 0 && e > 0) d = -d;
        if (a === d && c === e) continue;
        p = a * c; q = d * e; r = op === 'multiply' ? p + q : p - q;
        if (r !== 0) break;
      }
      var sym = op === 'multiply' ? '+' : '-';
      var steps = [
        '$= ' + pow(base, mulExp(a, c)) + opTex(op) + pow(base, mulExp(d, e)) + '$',
        '$= ' + pow(base, p) + opTex(op) + pow(base, q) + '$',
        '$= ' + pow(base, opExp(p, sym, q)) + '$'
      ];
      if (op === 'divide' && q < 0) steps.push('$= ' + pow(base, p + '+' + -q) + '$');
      return {
        prompt: '$' + pow(paren(pow(base, a)), c) + opTex(op) + pow(paren(pow(base, d)), e) + ' =$',
        steps: steps,
        answer: '$' + pow(base, r) + '$'
      };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.monomials',
    topic: 'Powers',
    title: 'Multiply and divide monomials (coefficients and powers)',
    prompt: 'Simplify',
    columns: 2,
    workSpace: 1,
    params: [
      { key: 'terms', label: 'Terms', type: 'choice', default: 2,
        values: [{ value: 2, label: '2 terms, like 12t⁴ ÷ 3t⁻³' }, { value: 3, label: '3 terms, left to right' }] },
      { key: 'operations', label: 'Operations', type: 'set', default: ['divide', 'multiply'],
        values: [{ value: 'divide', label: '÷' }, { value: 'multiply', label: '×' }] },
      { key: 'maxCoefficient', label: 'Largest coefficient factor', type: 'number', min: 2, max: 12, default: 9 },
      { key: 'negativeCoefficients', label: 'Negative coefficients', type: 'toggle', default: true },
      { key: 'maxExponent', label: 'Largest exponent (size)', type: 'number', min: 2, max: 20, default: 12 },
      { key: 'negatives', label: 'Negative exponents', type: 'toggle', default: true }
    ],
    generate: function (v, rng, ctx) {
      var x = rng.pick(LETTERS);
      var nt = v.terms;
      var ops = [];
      for (var i = 1; i < nt; i++) ops.push(nt === 2 ? ctx.spread('operations', rng) : rng.pick(v.operations));
      function sgn() { return v.negativeCoefficients && rng.chance(0.3) ? -1 : 1; }
      var coefs, exps;
      for (var t = 0; t < 300; t++) {
        // Choose the divisors first so every division comes out whole.
        var start = rng.int(nt === 2 ? 2 : 1, v.maxCoefficient);
        coefs = [0];
        for (i = 0; i < ops.length; i++) {
          var f = rng.int(2, v.maxCoefficient) * sgn();
          coefs.push(f);
          if (ops[i] === 'divide') start *= Math.abs(f);
        }
        coefs[0] = start * sgn();
        exps = [];
        for (i = 0; i < nt; i++) exps.push(exponent(rng, v.maxExponent, v.negatives));
        if (v.negatives && exps.every(function (e) { return e > 0; })) exps[1] = -exps[1];
        // Keep numbers friendly: every coefficient along the way at most 99, final at most 72,
        // final exponent at most 20 in size.
        var cc = coefs[0], ee = exps[0], ok = Math.abs(cc) <= 99 && coefs[0] !== coefs[1];
        for (i = 1; i < nt && ok; i++) {
          cc = ops[i - 1] === 'multiply' ? cc * coefs[i] : cc / coefs[i];
          ee = ops[i - 1] === 'multiply' ? ee + exps[i] : ee - exps[i];
          ok = Math.abs(cc) <= 99;
        }
        if (ok && Math.abs(cc) <= 72 && Math.abs(ee) <= 20) break;
      }
      function termTex(i) {
        var s = mono(coefs[i], x, exps[i]);
        if (i === 0) return s;
        var wrap = coefs[i] < 0 || (nt === 2 && ops[i - 1] === 'multiply');
        return opTex(ops[i - 1]) + (wrap ? paren(s) : s);
      }
      // One rule application: coefficients together, exponents together.
      function combine(cA, eA, op, cB, eB) {
        if (op === 'multiply') {
          return { tex: paren(num(cA)) + paren(num(cB)) + '\\,' + pow(x, opExp(eA, '+', eB)), c: cA * cB, e: eA + eB };
        }
        return { tex: '\\frac{' + num(cA) + '}{' + num(cB) + '}\\,' + pow(x, opExp(eA, '-', eB)), c: cA / cB, e: eA - eB };
      }
      var prompt = '';
      for (i = 0; i < nt; i++) prompt += termTex(i);
      var steps = [];
      var c = coefs[0], e = exps[0];
      for (i = 1; i < nt; i++) {
        var rest = '';
        for (var j = i + 1; j < nt; j++) rest += termTex(j);
        var s = combine(c, e, ops[i - 1], coefs[i], exps[i]);
        steps.push('$= ' + s.tex + rest + '$');
        c = s.c; e = s.e;
        if (rest) steps.push('$= ' + mono(c, x, e) + rest + '$');
      }
      if (e === 0) {
        steps.push('$= ' + (c === 1 ? '' : c === -1 ? '-' : num(c)) + x + '^0$');
        steps.push('$= ' + num(c) + '(1)$');
      }
      return { prompt: '$' + prompt + ' =$', steps: steps, answer: '$' + mono(c, x, e) + '$' };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.evaluate-mixed',
    topic: 'Powers',
    title: 'Evaluate expressions with negative exponents',
    prompt: 'Evaluate',
    columns: 2,
    workSpace: 1.5,
    params: [
      { key: 'forms', label: 'Forms', type: 'set', default: ['power-plus-reciprocal', 'power-of-product', 'sum-of-reciprocals', 'power-of-difference'],
        values: [
          { value: 'power-plus-reciprocal', label: 'bᵐ + b⁻¹' },
          { value: 'power-of-product', label: '(a × b)⁻ⁿ' },
          { value: 'sum-of-reciprocals', label: 'b⁻¹ + b⁻²' },
          { value: 'power-of-difference', label: '(a² − c)⁻ⁿ' }
        ] }
    ],
    generate: function (v, rng, ctx) {
      var form = ctx.spread('forms', rng);
      var b, n, V;
      if (form === 'power-plus-reciprocal') {
        b = rng.int(2, 6); n = rng.intWhere(2, 3, function (n) { return ipow(b, n) <= 125; }); V = ipow(b, n);
        return {
          prompt: '$' + pow(b, n) + '+' + pow(b, -1) + ' =$',
          steps: ['$= ' + num(V) + ' + ' + dfrac(1, pow(b, 1)) + '$', '$= ' + num(V) + ' + ' + dfrac(1, b) + '$'],
          answer: '$' + M.mixedTex(frac(V * b + 1, b)) + '$'
        };
      }
      if (form === 'power-of-product') {
        var a = rng.int(2, 5); b = rng.intWhere(2, 5, function (b) { return b !== a; });
        n = a * b <= 10 && rng.chance(0.6) ? 2 : 1; V = ipow(a * b, n);
        return {
          prompt: '$(' + a + '\\times' + b + ')^{' + -n + '} =$',
          steps: ['$= ' + pow(a * b, -n) + '$', '$= ' + dfrac(1, pow(a * b, n)) + '$'],
          answer: '$' + fracTex(frac(1, V)) + '$'
        };
      }
      if (form === 'sum-of-reciprocals') {
        b = rng.int(2, 5); var b2 = b * b;
        return {
          prompt: '$' + pow(b, -1) + '+' + pow(b, -2) + ' =$',
          steps: [
            '$= ' + dfrac(1, b) + ' + ' + dfrac(1, pow(b, 2)) + '$',
            '$= ' + dfrac(1, b) + ' + ' + dfrac(1, b2) + '$',
            '$= ' + dfrac(b, b2) + ' + ' + dfrac(1, b2) + '$'
          ],
          answer: '$' + fracTex(frac(b + 1, b2)) + '$'
        };
      }
      // power-of-difference: (a^2 - c)^-n
      var aa = rng.int(2, 5), d = rng.intWhere(2, 5, function (d) { return d < aa * aa; });
      var cc = aa * aa - d;
      n = rng.int(1, 2); V = ipow(d, n);
      return {
        prompt: '$(' + pow(aa, 2) + '-' + cc + ')^{' + -n + '} =$',
        steps: ['$= (' + aa * aa + '-' + cc + ')^{' + -n + '}$', '$= ' + pow(d, -n) + '$', '$= ' + dfrac(1, pow(d, n)) + '$'],
        answer: '$' + fracTex(frac(1, V)) + '$'
      };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.positive-exponents',
    topic: 'Powers',
    title: 'Write numbers as powers with positive exponents',
    prompt: 'Express as powers with positive exponents',
    columns: 4,
    workSpace: 1,
    params: [
      { key: 'forms', label: 'Forms', type: 'set', default: ['fraction', 'negative', 'decimal'],
        values: [
          { value: 'fraction', label: '1/1000 → 1/10³' },
          { value: 'negative', label: '1/−32 → 1/(−2)⁵' },
          { value: 'decimal', label: '0.25 → 1/2²' }
        ] },
      { key: 'maxValue', label: 'Largest denominator', type: 'number', min: 8, max: 10000, default: 1000 }
    ],
    generate: function (v, rng, ctx) {
      var form = ctx.spread('forms', rng);
      function pickBN(bases, odd) {
        var c = [];
        bases.forEach(function (b) {
          for (var n = 2; ipow(b, n) <= v.maxValue; n++) if (!odd || n % 2) c.push([b, n]);
        });
        return rng.pick(c);
      }
      function answerOf(V, first, neg) {
        var forms = powerForms(V, neg).filter(function (f) { return f[0] !== first[0]; });
        var all = [first].concat(forms).map(function (f) { return '\\frac{1}{' + pow(neg ? -f[0] : f[0], f[1]) + '}'; });
        return '$' + all.join('\\text{ or }') + '$';
      }
      var bn, V;
      if (form === 'negative') {
        bn = pickBN([2, 3, 4, 5], true); V = ipow(bn[0], bn[1]);
        var prod = []; for (var i = 0; i < bn[1]; i++) prod.push('(-' + bn[0] + ')');
        return {
          prompt: '$' + dfrac(1, num(-V)) + ' =$',
          steps: bn[1] <= 5 ? ['$= ' + dfrac(1, prod.join('')) + '$'] : [],
          answer: answerOf(V, bn, true)
        };
      }
      if (form === 'decimal') {
        // At most three decimal places (0.25, 0.125, 0.008), like the paper quizzes.
        do { bn = pickBN([2, 4, 5, 10]); V = ipow(bn[0], bn[1]); } while (1000 % V);
        var k = 1; while (ipow(10, k) % V) k++;
        var top = ipow(10, k) / V;
        var dec = '0.' + String(top).padStart(k, '0');
        var steps = [];
        if (top !== 1) steps.push('$= ' + dfrac(top, num(ipow(10, k))) + '$');
        steps.push('$= ' + dfrac(1, num(V)) + '$');
        return { prompt: '$' + dec + ' =$', steps: steps, answer: answerOf(V, bn) };
      }
      bn = pickBN([2, 3, 5, 6, 7, 10]); V = ipow(bn[0], bn[1]);
      var f = []; for (var j = 0; j < bn[1]; j++) f.push(bn[0]);
      return {
        prompt: '$' + dfrac(1, num(V)) + ' =$',
        steps: bn[1] <= 4 ? ['$= ' + dfrac(1, f.join('\\times')) + '$'] : [],
        answer: answerOf(V, bn)
      };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.order',
    topic: 'Powers',
    title: 'Write as powers of one base and put in order',
    prompt: 'Express as a power, and then arrange in order from least to greatest',
    whole: true,
    workSpace: 3,
    params: [
      { key: 'bases', label: 'Base', type: 'set', default: [2, 3],
        values: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 5, label: '5' }, { value: 10, label: '10' }] },
      { key: 'count', label: 'How many numbers', type: 'number', min: 4, max: 8, default: 6 },
      { key: 'maxValue', label: 'Largest denominator', type: 'number', min: 8, max: 10000, default: 1000 }
    ],
    validate: function (v) {
      var ok = v.bases.some(function (r) { var c = 1; for (var e = 1; ipow(r, e) <= v.maxValue; e++) c += 2; return c >= v.count + 1; });
      return ok ? [] : ['Not enough different powers below the largest denominator: raise it or ask for fewer numbers.'];
    },
    generate: function (v, rng) {
      var r = rng.pick(v.bases.filter(function (r) { return ipow(r, 2) <= v.maxValue; }).concat([]));
      if (r === undefined) r = v.bases[0];
      var cand = [];
      for (var e = -12; e <= 12; e++) if (ipow(r, Math.abs(e)) <= v.maxValue) cand.push(e);
      var picked;
      for (var t = 0; t < 200; t++) {
        picked = rng.shuffle(cand).slice(0, v.count);
        var neg = picked.filter(function (e) { return e < 0; }).length;
        if (picked.some(function (e) { return e > 0; }) && neg >= Math.min(3, v.count - 2)) break;
      }
      function valTex(e) { return e < 0 ? '\\frac{1}{' + num(ipow(r, -e)) + '}' : num(ipow(r, e)); }
      var steps = picked.map(function (e) {
        if (e < 0) return '$' + valTex(e) + ' = \\frac{1}{' + pow(r, -e) + '} = ' + pow(r, e) + '$';
        return '$' + valTex(e) + ' = ' + pow(r, e) + '$';
      });
      steps.push('Same base (bigger than 1): the bigger the exponent, the bigger the number');
      var sorted = picked.slice().sort(function (a, b) { return a - b; });
      return {
        prompt: 'Express as a power of $' + r + '$, and then arrange in order from least to greatest\n$$' +
          picked.map(valTex).join(',\\ ') + '$$',
        steps: steps,
        answer: '$' + sorted.map(function (e) { return pow(r, e); }).join(' < ') + '$'
      };
    }
  });

  // ---------------------------------------------------------------------
  G.register({
    name: 'powers.solve-exponential',
    topic: 'Powers',
    title: 'Solve equations with powers',
    prompt: 'Solve',
    columns: 2,
    workSpace: 3,
    params: [
      { key: 'forms', label: 'Forms', type: 'set',
        default: ['unknown-exponent', 'unknown-base', 'square', 'power-of-ten', 'reciprocal-base', 'common-base'],
        values: [
          { value: 'unknown-exponent', label: '2ˣ = 1/2' },
          { value: 'unknown-base', label: 'x⁻³ = 1/125' },
          { value: 'square', label: 'x² = 1/25' },
          { value: 'power-of-ten', label: '10²⁻ˣ = 0.001' },
          { value: 'reciprocal-base', label: '243 = (1/3)ˣ⁺⁴' },
          { value: 'common-base', label: '9¹⁺ˣ = 27' }
        ] }
    ],
    generate: function (v, rng, ctx) {
      var form = ctx.spread('forms', rng);
      function lin(x, k) { return k === 0 ? x : x + (k > 0 ? '+' : '-') + Math.abs(k); }
      var b, k, n, V;
      switch (form) {
        case 'unknown-exponent':
          b = rng.int(2, 6); k = rng.intWhere(1, 3, function (k) { return ipow(b, k) <= 125; }); V = ipow(b, k);
          var st = [];
          if (k > 1) st.push('$' + b + '^x = ' + dfrac(1, pow(b, k)) + '$');
          st.push('$' + b + '^x = ' + pow(b, -k) + '$', 'Same base, so the exponents are equal');
          return { prompt: '$' + b + '^x = ' + dfrac(1, num(V)) + '$', steps: st, answer: '$x=' + -k + '$' };
        case 'unknown-base':
          n = rng.pick([2, 3, 3]); b = rng.intWhere(2, 9, function (b) { return ipow(b, n) <= 1000; }); V = ipow(b, n);
          return {
            prompt: '$x^{' + -n + '} = ' + dfrac(1, num(V)) + '$',
            steps: ['$' + dfrac(1, 'x^' + n) + ' = ' + dfrac(1, pow(b, n)) + '$', '$x^' + n + ' = ' + pow(b, n) + '$'],
            answer: '$x=' + (n % 2 ? '' : '\\pm') + b + '$'
          };
        case 'square':
          b = rng.int(2, 12);
          return {
            prompt: '$x^2 = ' + dfrac(1, b * b) + '$',
            steps: ['$x^2 = \\left(' + dfrac(1, b) + '\\right)^2$ or $x^2 = \\left(-' + dfrac(1, b) + '\\right)^2$'],
            answer: '$x=\\pm\\frac{1}{' + b + '}$'
          };
        case 'power-of-ten':
          k = rng.int(1, 4); var m = rng.int(2, 5);
          var dec = '0.' + '0'.repeat(m - 1) + '1';
          var flip = rng.chance(0.5);
          var ex = flip ? 'x+' + k : k + '-x';
          var s = ['$10^{' + ex + '} = ' + dfrac(1, num(ipow(10, m))) + ' = ' + dfrac(1, pow(10, m)) + '$', '$10^{' + ex + '} = 10^{' + -m + '}$'];
          if (flip) s.push('$x + ' + k + ' = ' + -m + '$');
          else s.push('$' + k + ' - x = ' + -m + '$', '$-x = ' + (-m - k) + '$');
          return { prompt: '$10^{' + ex + '} = ' + dec + '$', steps: s, answer: '$x=' + (flip ? -m - k : m + k) + '$' };
        case 'reciprocal-base':
          b = rng.pick([2, 3, 5]); var p = rng.intWhere(2, 9, function (p) { return ipow(b, p) >= 8 && ipow(b, p) <= 1000; });
          k = rng.int(1, 4);
          return {
            prompt: '$' + num(ipow(b, p)) + ' = \\left(' + dfrac(1, b) + '\\right)^{x+' + k + '}$',
            steps: [
              '$' + pow(b, p) + ' = \\left(' + pow(b, -1) + '\\right)^{x+' + k + '}$',
              '$' + pow(b, p) + ' = ' + pow(b, '-x-' + k) + '$',
              '$' + p + ' = -x - ' + k + '$',
              '$' + (p + k) + ' = -x$'
            ],
            answer: '$x=' + -(p + k) + '$'
          };
        default: // common-base: (r^a)^(x+j) = r^c
          var pairs = [[2, 2], [2, 3], [3, 2], [5, 2]];
          var pr = rng.pick(pairs), r = pr[0], a = pr[1];
          var c = rng.intWhere(1, 9, function (c) { return ipow(r, c) <= 1000 && c % a !== 0; });
          var j = rng.pick([-2, -1, 1, 2]);
          var aj = a * j;
          var xs = frac(c - aj, a);
          return {
            prompt: '$' + pow(ipow(r, a), lin('x', j)) + ' = ' + num(ipow(r, c)) + '$',
            steps: [
              '$\\left(' + pow(r, a) + '\\right)^{' + lin('x', j) + '} = ' + pow(r, c) + '$',
              '$' + pow(r, lin(a + 'x', aj)) + ' = ' + pow(r, c) + '$',
              '$' + lin(a + 'x', aj) + ' = ' + c + '$',
              '$' + a + 'x = ' + (c - aj) + '$'
            ],
            answer: '$x=' + fracTex(xs) + '$'
          };
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
