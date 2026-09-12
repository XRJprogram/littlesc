// repro_dupargs.mjs — 最小复现：重名参数导致二次往返丢块
import fs from 'fs';
import AdmZip from 'adm-zip';
import { compileSource } from '../../src/server.js';
import { sb3ToGoboscript } from '../../src/decompiler.js';
const GS = `onflag {
    dup_test (1 + 2), "3", "4";
}

proc dup_test x, y, x {
    say $x;
}
`;
const histOf = buf => {
  const pj = JSON.parse(new AdmZip(buf).getEntry('project.json').getData().toString('utf8'));
  const h = {};
  for (const t of pj.targets) for (const b of Object.values(t.blocks || {}))
    if (b && typeof b === 'object' && !Array.isArray(b)) h[b.opcode] = (h[b.opcode] || 0) + 1;
  return h;
};
const s1 = compileSource(GS);
const gs2 = sb3ToGoboscript(s1).source;
const s2 = compileSource(gs2);
console.log('round1 hist:', JSON.stringify(histOf(s1)));
console.log('round2 src :', JSON.stringify(gs2.match(/dup_test[^;]*;/)[0]));
console.log('round2 hist:', JSON.stringify(histOf(s2)));
