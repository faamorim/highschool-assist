// Builds Option B: a shorter, mixed practice quiz (fixed seed, so it can be rebuilt).
const fs = require('fs');
const MW = require('./load-generators')();
const G = MW.generators;
const SEED = 'practice-mixed-2026-11';
function part(name, params, tag, opts) {
  const r = G.generate(name, params, SEED + '/' + tag, Object.assign({ output: 'steps' }, opts || {}));
  const p = { prompt: r.prompt, answer: r.answer };
  if (r.steps && r.steps.length) p.solution = r.steps.join('\n');
  return p;
}
const Q = (prompt, o) => Object.assign({ kind: 'question', prompt }, o);
const doc = {
  schemaVersion: 1, type: 'quiz', title: '(5+) Math 9  Powers Practice Quiz (mixed)',
  header: { fields: ['name'], showGrade: true, gradeLabel: 'Quiz', custom: [], repeat: true },
  footer: { pageNumbers: true }, defaultMarks: 0.5, showMarks: true,
  answers: { handout: 'none', key: 'worked' }, paper: 'letter', seed: SEED,
  blocks: [
    { kind: 'text', content: 'Practice quiz. Show your work. Questions get a little harder as you go: do what you can, then ask for help.' },
    { kind: 'heading', text: 'Negative exponents' },
    Q('Evaluate', { columns: 4, space: 1, generator: { name: 'powers.negative-exponent', params: { forms: ['basic', 'fraction', 'coefficient', 'decimal'] }, seed: SEED + '/1c', count: 4 } }),
    Q('Which is greater? Show how you know.', { columns: 2, space: 2, marks: 1, parts: [
      { prompt: '$2^{-3}$ or $3^{-2}$', answer: '$2^{-3}$', solution: '$2^{-3} = \\dfrac{1}{2^3} = \\dfrac{1}{8}$ and $3^{-2} = \\dfrac{1}{3^2} = \\dfrac{1}{9}$\n$\\dfrac{1}{8} > \\dfrac{1}{9}$ (same numerator, smaller denominator)' },
      { prompt: '$\\left(\\dfrac{1}{2}\\right)^{-2}$ or $2^{-2}$', answer: '$\\left(\\frac{1}{2}\\right)^{-2}$', solution: '$\\left(\\dfrac{1}{2}\\right)^{-2} = 2^2 = 4$ and $2^{-2} = \\dfrac{1}{2^2} = \\dfrac{1}{4}$\n$4 > \\dfrac{1}{4}$' }
    ] }),
    { kind: 'heading', text: 'Exponent laws' },
    Q('Simplify. Write each answer as a single power.', { columns: 2, space: 1.5, parts: [
      part('powers.product-quotient', { bases: ['number'], operations: ['multiply'] }, 'pq1'),
      part('powers.product-quotient', { bases: ['variable'], operations: ['divide'] }, 'pq2'),
      part('powers.power-of-power', { bases: ['variable'], operations: ['multiply'] }, 'pp1'),
      part('powers.power-of-power', { bases: ['number'], operations: ['divide'] }, 'pp2')
    ] }),
    Q('Each answer has a mistake. Find it, explain it, and write the correct answer.', { columns: 1, space: 2, marks: 1, parts: [
      { prompt: '$3^4\\times3^2 = 9^6$', answer: '$3^6$', solution: 'Same base: keep the base and add the exponents. The base does not get multiplied.\n$3^4\\times3^2 = 3^{4+2}$' },
      { prompt: '$\\dfrac{x^{-2}}{x^5} = x^3$', answer: '$x^{-7}$', solution: 'Dividing: subtract the exponents, top minus bottom.\n$= x^{-2-5}$' },
      { prompt: '$4^{-2} = -16$', answer: '$\\frac{1}{16}$', solution: 'A negative exponent means reciprocal, not a negative number.\n$= \\dfrac{1}{4^2}$' }
    ] }),
    Q('Simplify', { columns: 1, space: 1.5, parts: [
      part('powers.monomials', { terms: 2, operations: ['divide'] }, 'm1'),
      part('powers.monomials', { terms: 2, operations: ['multiply'] }, 'm2'),
      part('powers.monomials', { terms: 3 }, 'm3')
    ] }),
    Q('Solve', { columns: 3, space: 3, generator: { name: 'powers.solve-exponential', params: { forms: ['unknown-exponent', 'power-of-ten', 'reciprocal-base'] }, seed: SEED + '/2', count: 3 } }),
    { kind: 'heading', text: 'Scientific notation' },
    Q('Write in scientific notation', { columns: 1, space: 1, parts: [
      { prompt: 'Distance from Earth to the Sun: $150\\,000\\,000$ km', answer: '$1.5\\times10^8$ km', solution: 'The decimal point moves 8 places left, so the exponent is $8$' },
      { prompt: 'Diameter of a red blood cell: $0.0000075$ m', answer: '$7.5\\times10^{-6}$ m', solution: 'The decimal point moves 6 places right, so the exponent is $-6$' },
      part('sci.normalize', { shifts: ['too-big'] }, 'n1')
    ] }),
    Q('Calculate. Write each answer in scientific notation.', { columns: 3, space: 2, parts: [
      { prompt: '$(3\\times10^4)(2\\times10^5) =$', answer: '$6\\times10^9$', solution: '$= (3\\times2)\\times(10^4\\times10^5)$\n$= 6\\times10^{4+5}$' },
      { prompt: '$\\dfrac{8\\times10^{-3}}{2\\times10^5} =$', answer: '$4\\times10^{-8}$', solution: '$= \\dfrac{8}{2}\\times\\dfrac{10^{-3}}{10^5}$\n$= 4\\times10^{-3-5}$' },
      { prompt: '$(5\\times10^3)(4\\times10^6) =$', answer: '$2\\times10^{10}$', solution: '$= (5\\times4)\\times10^{3+6}$\n$= 20\\times10^9$\n$= 2\\times10^1\\times10^9$' }
    ] }),
    Q('Light travels about $3\\times10^5$ km every second. Sunlight takes about $5\\times10^2$ seconds to reach Earth. About how far away is the Sun? Write your answer in scientific notation.', {
      space: 3, marks: 1, answer: '$1.5\\times10^8$ km',
      solution: 'distance = speed × time\n$= (3\\times10^5)(5\\times10^2)$\n$= 15\\times10^7$\n$= 1.5\\times10^1\\times10^7$\nIt matches the Earth–Sun distance in the scientific notation question!' })
  ]
};
const out = G.fillDocument(doc);
fs.writeFileSync(require('path').join(__dirname, '..', 'examples', 'math9-powers-practice-quiz-mixed.json'), JSON.stringify(out, null, 2) + '\n');
let n = 0;
out.blocks.forEach((b) => { if (b.kind !== 'question') return; const ps = b.parts || [b]; n += ps.length;
  console.log('##', b.prompt.slice(0, 60)); ps.forEach((p) => console.log('   ', p.prompt.slice(0, 70), ' -> ', p.answer)); });
console.log('parts', n);
