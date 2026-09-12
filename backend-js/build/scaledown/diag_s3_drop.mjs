import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3.gs', 'utf8');
const p = new Parser(preprocess(lex(src)));
try { p.parse(); } catch (e) { console.log('throw:', e.message); }
const NL = String.fromCharCode(10);
for (const d of (p.diagnostics || [])) {
  const upto = Math.max(0, d.span ? d.span[0] : 0);
  const line = src.slice(0, upto).split(NL).length;
  console.log('diag L' + line, d.kind, d.message);
  console.log('  ctx:', JSON.stringify(src.slice(Math.max(0, upto - 80), upto + 60)));
}
