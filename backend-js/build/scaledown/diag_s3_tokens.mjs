import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3.gs', 'utf8');
const P = Parser.prototype;
const orig = P._parseTerm;
P._parseTerm = function (...a) {
  try {
    return orig.apply(this, a);
  } catch (e) {
    if (String(e.message).includes('Unexpected token')) {
      const toks = this.tokens || this._tokens || [];
      const i = this.pos;
      console.log('FAIL at token idx', i, 'of', toks.length);
      const lo = Math.max(0, i - 8);
      for (let k = lo; k < Math.min(toks.length, i + 6); k++) {
        const t = toks[k];
        console.log((k === i ? '>>' : '  '), k, JSON.stringify(t));
      }
      const off = (toks[i] && toks[i].start) || -1;
      console.log('src ctx:', JSON.stringify(src.slice(Math.max(0, off - 100), off + 60)));
      // also show previous raw source line
      const before = src.slice(0, Math.max(0, off));
      const nl = before.lastIndexOf('\n');
      console.log('prev line(s):', JSON.stringify(src.slice(Math.max(0, nl - 160), nl + 1)));
    }
    throw e;
  }
};
const p = new Parser(preprocess(lex(src)));
try { p.parse(); console.log('parsed OK'); }
catch (e) { console.log('fatal:', e.message); }
