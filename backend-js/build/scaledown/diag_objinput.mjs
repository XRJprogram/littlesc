import AdmZip from 'adm-zip';
import fs from 'fs';
const pj = JSON.parse(new AdmZip(fs.readFileSync('build/scaledown/zhiteng.recompiled2.sb3')).getEntry('project.json').getData().toString('utf-8'));
console.log('sample ids:', Object.keys(pj.targets[1].blocks).slice(0, 6).join(','));
let hits = 0;
for (const t of pj.targets) {
  for (const [id, b] of Object.entries(t.blocks || {})) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    if (!['motion_setx', 'motion_sety', 'looks_setsizeto'].includes(b.opcode)) continue;
    const bad = Object.entries(b.inputs).filter(([, v]) => JSON.stringify(v).includes('"id"') || JSON.stringify(v).includes('{'));
    if (bad.length) {
      hits++;
      if (hits <= 6) console.log(t.name, b.opcode, id, JSON.stringify(b.inputs).slice(0, 300), 'parent=', JSON.stringify(b.parent));
    }
  }
}
console.log('total object-input motion/size blocks:', hits);
// also: what does block "187286" look like, if present?
const t1blocks = pj.targets[1].blocks;
if (t1blocks['187286']) console.log('block 187286:', JSON.stringify(t1blocks['187286']).slice(0, 300));
else console.log('no block id 187286 in targets[1]');
