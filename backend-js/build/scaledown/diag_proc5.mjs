import AdmZip from 'adm-zip';
import fs from 'fs';
const pj = JSON.parse(new AdmZip(fs.readFileSync('build/scaledown/zhiteng.recompiled2.sb3')).getEntry('project.json').getData().toString('utf-8'));
const t = pj.targets[1];
for (const [id, b] of Object.entries(t.blocks)) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
  if (b.opcode === 'procedures_prototype' && String(b.mutation.proccode).startsWith('_____________5')) {
    console.log('proto', id, 'names=', b.mutation.argumentnames, 'ids=', b.mutation.argumentids);
  }
}
// one call site: show raw inputs keys
let n = 0;
for (const [id, b] of Object.entries(t.blocks)) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
  if (b.opcode === 'procedures_call' && String(b.mutation.proccode).startsWith('_____________5')) {
    console.log('call', id, 'argids=', b.mutation.argumentids, 'inputKeys=', Object.keys(b.inputs), 'inputs=', JSON.stringify(b.inputs).slice(0, 220));
    if (++n >= 2) break;
  }
}
