#!/usr/bin/env node
// diag_idem.mjs — locate exactly which blocks vanish between recompiled2 and recompiled3
import fs from 'fs';
import AdmZip from 'adm-zip';

const [fA, fB] = process.argv.slice(2);
const load = f => JSON.parse(new AdmZip(fs.readFileSync(f)).getEntry('project.json').getData().toString('utf-8'));
const A = load(fA), B = load(fB);

for (let i = 0; i < Math.max(A.targets.length, B.targets.length); i++) {
  const ta = A.targets[i], tb = B.targets[i];
  const hist = m => { const h = {}; for (const b of Object.values(m.blocks || {})) if (b && typeof b === 'object' && !Array.isArray(b)) h[b.opcode] = (h[b.opcode] || 0) + 1; return h; };
  const ha = hist(ta), hb = hist(tb);
  const ops = new Set([...Object.keys(ha), ...Object.keys(hb)]);
  const bad = [...ops].filter(op => (ha[op] || 0) !== (hb[op] || 0));
  if (!bad.length) continue;
  console.log(`target[${i}] ${ta.name}: ${bad.map(op => `${op} ${ha[op] || 0}->${hb[op] || 0}`).join(', ')}`);
  // multiset match by canonical signature to find surplus-in-A signatures
  const sig = b => JSON.stringify([b.opcode, b.fields || {}, b.mutation ? { p: b.mutation.proccode, w: b.mutation.warp } : null]);
  const countA = {}, countB = {};
  for (const b of Object.values(ta.blocks || {})) if (b && b.opcode && bad.includes(b.opcode)) { const s = sig(b); (countA[s] = countA[s] || []).push(b); }
  for (const b of Object.values(tb.blocks || {})) if (b && b.opcode && bad.includes(b.opcode)) { const s = sig(b); (countB[s] = countB[s] || []).push(b); }
  for (const [s, arr] of Object.entries(countA)) {
    const nB = (countB[s] || []).length;
    if (arr.length !== nB) {
      console.log(`  surplus in A: x${arr.length - nB} sig=${s.slice(0, 220)}`);
      const b = arr[0];
      const parent = b.parent ? ta.blocks[b.parent] : null;
      console.log(`    sample block parent=${parent ? parent.opcode : b.parent} topLevel=${b.topLevel}`);
      if (parent && parent.mutation) console.log(`    parent proccode=${JSON.stringify(parent.mutation.proccode)}`);
      // walk up to top-level
      let cur = b, hops = 0;
      while (cur && cur.parent && hops < 30) { cur = ta.blocks[cur.parent]; hops++; }
      if (cur && cur.topLevel) console.log(`    top-of-chain opcode=${cur.opcode}`);
    }
  }
}
// proc_defs comparison
const defs = pj => { const out = []; for (const t of pj.targets) for (const b of Object.values(t.blocks || {})) if (b && b.opcode === 'procedures_definition' && b.mutation) out.push(JSON.parse(b.mutation.proccode || '""')); return out; };
console.log('--- proccodes only in A:', defs(A).filter(x => !defs(B).includes(x)).slice(0, 20));
console.log('--- proccodes only in B:', defs(B).filter(x => !defs(A).includes(x)).slice(0, 20));
