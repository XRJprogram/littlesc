import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
const src = 'when green flag clicked';
const t = lex(src);
const toks = Array.isArray(t) ? t : (t.tokens || []);
console.log('shape:', Array.isArray(t) ? 'array' : Object.keys(t || {}));
console.log('tokens:', toks.map(x => x.type + ':' + String(x.value).slice(0, 12)).join(' | '));
try {
  const pre = preprocess(toks.length ? toks : t);
  const res = new Parser(pre).parse();
  console.log('parsed OK; top-level nodes:',
      (res && (res.statements || res.body || []).length) ?? '?');
} catch (e) {
  console.log('parse error:', e.message.slice(0, 140));
}
