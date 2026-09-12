// diag_py_targets.mjs — 解剖 orig vs R2 的 target 结构
import AdmZip from 'adm-zip';
import fs from 'fs';

for (const p of ['build/test-sb3/pyinterpreter.sb3', 'build/scaledown/pyinterpreter.recompiled2.sb3']) {
  const zip = new AdmZip(fs.readFileSync(p));
  const pj = JSON.parse(zip.readAsText('project.json'));
  console.log('===', p);
  for (const t of pj.targets) {
    let n = 0;
    for (const b of Object.values(t.blocks || {})) if (typeof b === 'object' && !Array.isArray(b)) n++;
    console.log(`  target "${t.name}" isStage=${t.isStage} blocks=${n} vars=${Object.keys(t.variables || {}).length} lists=${Object.keys(t.lists || {}).length}`);
  }
}
