import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3.gs', 'utf8');
const NL = String.fromCharCode(10);
const lineCol = (off) => {
  const upto = src.slice(0, Math.max(0, off));
  const ls = upto.split(NL);
  return `L${ls.length}:${ls[ls.length - 1].length + 1}`;
};

const origDecl = Parser.prototype.declaration;
Parser.prototype.declaration = function () {
  try {
    return origDecl.call(this);
  } catch (e) {
    if (e && e.name === 'ParseError') {
      const off = e.pos ?? this.peek().start ?? 0;
      console.log('DROP @', lineCol(off), '|', e.message);
      console.log('   ctx:', JSON.stringify(src.slice(Math.max(0, off - 70), off + 50)));
    }
    throw e;
  }
};

const p = new Parser(preprocess(lex(src)));
try { p.parse(); } catch (e) { console.log('fatal:', e.message); }
