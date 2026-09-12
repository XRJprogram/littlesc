import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser } from '../../src/parser.js';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3.gs', 'utf8');
console.log('file chars:', src.length, 'lines:', src.split('\n').length);
const p = new Parser(preprocess(lex(src)));
try {
  const ast = p.parse();
  console.log('parsed OK');
} catch (e) {
  console.log('name:', e.name);
  console.log('msg:', e.message);
  console.log('pos:', e.pos);
  console.log('stack:');
  console.log(String(e.stack).split('\n').slice(0, 10).join('\n'));
}
