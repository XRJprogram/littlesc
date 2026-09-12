import AdmZip from 'adm-zip';
import fs from 'fs';
const pj = JSON.parse(new AdmZip(fs.readFileSync('build/scaledown/zhiteng.recompiled2.sb3')).getEntry('project.json').getData().toString('utf-8'));
for (const t of pj.targets) {
  for (const [id, b] of Object.entries(t.blocks || {})) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    if (b.opcode === 'motion_setx' && b.topLevel) {
      console.log(`=== target=${t.name} id=${id} topLevel=${b.topLevel} parent=${JSON.stringify(b.parent)}`);
      let cur = b, n = 0;
      while (cur && n < 6) {
        console.log(`  ${cur.opcode} id=${n === 0 ? id : cur._id || '?'} inputs=${JSON.stringify(cur.inputs).slice(0, 260)}`);
        cur = cur.next ? { ...t.blocks[cur.next], _id: cur.next } : null;
        n++;
      }
    }
  }
}
