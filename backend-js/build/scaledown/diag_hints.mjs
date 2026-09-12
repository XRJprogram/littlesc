import { Parser } from '../../src/parser.js';
import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
const cases = [
  ['when green flag clicked', 'when-hat'],
  ['onflag { forever { onclick { move(1); } } }', 'loop-at-top... nested-onclick-in-forever'],
  ['forever { onclone {} }', 'top-level-loop-wrapping-event'],
];
for (const [src, label] of cases) {
  try {
    const toks = lex(src);
    const pre = preprocess(toks);
    new Parser(pre).parse();
    console.log(label, '-> PARSED (unexpected)');
  } catch (e) {
    console.log(label, '->', e.message.slice(0, 150));
  }
}
