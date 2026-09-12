import AdmZip from 'adm-zip';
import fs from 'fs';
const file = process.argv[2];
const pj = JSON.parse(new AdmZip(fs.readFileSync(file)).getEntry('project.json').getData().toString('utf-8'));
for (const t of pj.targets) {
  const blocks = t.blocks || {};
  // map reporter -> enclosing proc (walk parents to procedures_definition)
  const procOf = {};
  for (const [id, b] of Object.entries(blocks)) {
    if (!b || typeof b !== 'object' || Array.isArray(b) || b.opcode !== 'procedures_definition') continue;
    const protoId = b.inputs.custom_block && b.inputs.custom_block[1];
    const pc = protoId && blocks[protoId] && blocks[protoId].mutation ? blocks[protoId].mutation.proccode : '?';
    // collect subtree
    const stack = [b.next].filter(Boolean);
    const visit = x => { if (!x) return; stack.push(x); };
    // BFS over inputs SUBSTACK etc.
    const walk = bid => {
      if (!bid || !blocks[bid]) return;
      procOf[bid] = pc;
      const blk = blocks[bid];
      for (const [, iv] of Object.entries(blk.inputs || {})) {
        for (const el of (Array.isArray(iv) ? iv : [])) if (typeof el === 'string' && blocks[el]) walk(el);
      }
      if (blk.next) { procOf[blk.next] = pc; }
    };
    walk(b.next);
    // also walk substacks recursively via inputs of stacked blocks
    let changed = true;
    while (changed) { changed = false;
      for (const [bid, pcval] of Object.entries(procOf)) {
        const blk = blocks[bid]; if (!blk) continue;
        for (const [, iv] of Object.entries(blk.inputs || {})) {
          for (const el of (Array.isArray(iv) ? iv : [])) if (typeof el === 'string' && blocks[el] && !(el in procOf)) { procOf[el] = pcval; changed = true; }
        }
      }
    }
  }
  let shown = 0;
  for (const [id, b] of Object.entries(blocks)) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    if (!b.opcode || !b.opcode.startsWith('argument_reporter')) continue;
    if (b.fields.VALUE[0] !== 'w') continue;
    if (shown < 4) {
      const chain = []; let cur = b.parent, hops = 0;
      while (cur && hops < 12) { const pb = blocks[cur]; if (!pb) { chain.push('?' + cur); break; } chain.push(pb.opcode + (pb.mutation ? '(' + String(pb.mutation.proccode).slice(0, 24) + ')' : '')); cur = pb.parent; hops++; }
      console.log(`${t.name} reporter id=${id} inProc=${procOf[id] || 'UNKNOWN/ORPHAN'} chain=${chain.join('<-')}`);
    }
    shown++;
  }
  console.log(`${t.name}: total VALUE="w" reporters=${shown}`);
}
