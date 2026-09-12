import AdmZip from 'adm-zip';
import fs from 'fs';
const raw = new AdmZip(fs.readFileSync('build/scaledown/zhiteng.recompiled2.sb3')).getEntry('project.json').getData().toString('utf-8');
for (const needle of ['187286', '187287', '187296', '187309']) {
  const i = raw.indexOf(needle);
  console.log(needle, 'at', i, i >= 0 ? JSON.stringify(raw.slice(Math.max(0, i - 120), i + 60)) : '');
}
const pj = JSON.parse(raw);
// find any block whose inputs contain value strings like those
for (const t of pj.targets) {
  for (const [id, b] of Object.entries(t.blocks || {})) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    const s = JSON.stringify(b);
    if (s.includes('187286')) {
      let p = b; const chain = [];
      let cur = b, hops = 0;
      while (cur && cur.parent && hops < 40) { cur = t.blocks[cur.parent]; hops++; if (cur) chain.push(cur.opcode); }
      console.log(`hit ${b.opcode} id=${id} target=${t.name} parentChain=${chain.join(' <- ')}`);
    }
  }
}
