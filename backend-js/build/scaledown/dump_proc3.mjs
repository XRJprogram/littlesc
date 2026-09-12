import AdmZip from 'adm-zip';
import fs from 'fs';
const pj = JSON.parse(new AdmZip(fs.readFileSync(process.argv[2] || 'build/scaledown/zhiteng.recompiled2.sb3')).getEntry('project.json').getData().toString('utf-8'));
for (const t of pj.targets) {
  const blocks = t.blocks || {};
  for (const [id, b] of Object.entries(blocks)) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    if (b.opcode !== 'procedures_definition') continue;
    const protoId = b.inputs.custom_block && b.inputs.custom_block[1];
    const proto = protoId && blocks[protoId];
    const pc = proto && proto.mutation && proto.mutation.proccode || '';
    if (!pc.includes('zj')) continue;
    console.log(`=== ${t.name} def id=${id} proccode=${JSON.stringify(pc)} names=${proto.mutation.argumentnames} ids=${proto.mutation.argumentids}`);
    let cur = b.next ? { ...blocks[b.next], __id: b.next } : null;
    let n = 0;
    while (cur && n < 12) {
      const brief = o => JSON.stringify(o, (k, v) => v === undefined ? '?' : v).slice(0, 240);
      console.log(` [${n}] ${cur.opcode} fields=${JSON.stringify(cur.fields || {})} inputs=${brief(cur.inputs || {})}`);
      cur = cur.next ? { ...blocks[cur.next], __id: cur.next } : null;
      n++;
    }
  }
}
