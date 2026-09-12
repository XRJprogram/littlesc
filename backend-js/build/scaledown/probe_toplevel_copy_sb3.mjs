import AdmZip from 'adm-zip';
import { compileSource } from '../../src/server.js';

const NL = String.fromCharCode(10);
const src = [
  'var scores = [90, 85];',
  'list backup;',
  'copy list scores to backup;',
  'var total = 0;',
  'onflag { for item in backup { total += item; } say(total); }',
].join(NL);

const sb3 = compileSource(src);
const pj = JSON.parse(new AdmZip(sb3).getEntry('project.json').getData().toString('utf-8'));
let pass = true;
for (const t of pj.targets) {
  if (t.isStage) continue;
  for (const [, l] of Object.entries(t.lists || {})) {
    const [lname, lval] = Array.isArray(l) ? l : [l.name, l.value];
    console.log(`list ${lname} =`, JSON.stringify(lval));
    if (lname === 'backup' && JSON.stringify(lval) !== '[90,85]') pass = false;
    if (lname === 'scores' && JSON.stringify(lval) !== '[90,85]') pass = false;
  }
  const blocks = Object.values(t.blocks._blocks || t.blocks).filter(b => b && b.opcode && !b.shadow);
  console.log(`target ${t.name}: ${blocks.length} blocks, opcodes=`, [...new Set(blocks.map(b => b.opcode))].sort().join(','));
}
console.log(pass ? 'FOLD-SEMANTICS PASS' : 'FOLD-SEMANTICS FAIL');
process.exit(pass ? 0 : 1);
