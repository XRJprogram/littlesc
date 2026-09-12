// diag_dupargs_sb3.mjs — 保存对照与复现项目的 sb3，供 tw_check 实机验证
import fs from 'fs';
import path from 'path';
import { compileSource } from '../../src/server.js';

const CASES = {
  'repro_simple': `onflag {\n    say "hi";\n    wait 1;\n}\n`,
  'repro_dupargs': `onflag {\n    dup_test (1 + 2), "3", "4";\n    wait 1;\n}\n\nproc dup_test x, y, x {\n    say $x;\n    wait 1;\n}\n`,
  'repro_uniqargs': `onflag {\n    uniq_test (1 + 2), "3", "4";\n    wait 1;\n}\n\nproc uniq_test x, y, z {\n    say $x;\n    wait 1;\n}\n`,
};
for (const [name, gs] of Object.entries(CASES)) {
  const buf = compileSource(gs);
  const out = path.join(import.meta.dirname, `${name}.sb3`);
  fs.writeFileSync(out, buf);
  console.log('saved', out, buf.length, 'bytes');
}
