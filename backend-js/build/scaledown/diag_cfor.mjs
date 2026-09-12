import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser, ParseError } from '../../src/parser.js';

const src = [
  'onflag {',
  '  temp = 0;',
  '  level = 3;',
  '  for (j = 0; j < level - 1; j++) {',
  '    temp += level_platforms[j];',
  '  }',
  '}',
].join('\n');

const toks = preprocess(lex(src));
console.log('token types:', toks.map(t => t.type + (t.value !== null && t.value !== undefined ? ':' + t.value : '')).join(' '));

const P = Parser.prototype;
const origLook = P._looksLikeCStyleFor;
P._looksLikeCStyleFor = function () {
  const r = origLook.call(this);
  console.log('_looksLikeCStyleFor ->', r, '| peek0:', this.peek().type, this.peek().value);
  return r;
};

const p = new Parser(toks);
try { p.parse(); console.log('OK'); }
catch (e) { console.log('threw:', e.message); }
