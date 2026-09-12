import { compileSource } from '../../src/server.js';
import AdmZip from 'adm-zip';
import fs from 'fs';

const src = fs.readFileSync('tmp_stress/code_S3_R2.gs', 'utf8');
let buf;
try {
  buf = compileSource(src);
} catch (e) {
  console.log('compile threw:', e.message.slice(0, 300));
  process.exit(0);
}
const pj = JSON.parse(new AdmZip(buf).readAsText('project.json'));
console.log('sb3 bytes:', buf.length);
for (const t of pj.targets) {
  const blocks = t.blocks || {};
  const n = Object.keys(blocks).filter(k => typeof blocks[k] === 'object').length;
  console.log('target:', t.name, 'blocks:', n, 'vars:', (t.variables || []).length, 'lists:', (t.lists || []).length);
}
