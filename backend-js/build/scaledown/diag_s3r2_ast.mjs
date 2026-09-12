import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3_R2.gs', 'utf8');
const p = new Parser(preprocess(lex(src)));
try {
  p.parse();
  console.log('parsed OK, diagnostics:', (p.diagnostics || []).length);
} catch (e) {
  console.log('threw:', e.message);
}
const stat = (sp, label) => {
  console.log(label, 'name=' + sp.name,
    'events=' + (sp.events || []).length,
    'vars=' + Object.keys(sp.vars || sp.variables || {}).length,
    'lists=' + Object.keys(sp.lists || {}).length,
    'procs=' + Object.keys(sp.procs || {}).length);
};
stat(p.sprite, 'main:');
for (const e of p.extraTargets || []) stat(e.sprite, 'extra:');
// token scan: how many 'sprite'-headed blocks does the lexer see?
const toks = preprocess(lex(src));
let n = 0;
for (let i = 0; i < toks.length - 2; i++) {
  const t = toks[i];
  if (t.type === 'Name' && t.value === 'sprite') {
    console.log('sprite-head at offset', t.start, 'next:', toks[i + 1].type, toks[i + 2].type);
    n++;
    if (n > 8) break;
  }
}
console.log('sprite heads seen:', n);
