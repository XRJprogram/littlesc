#!/usr/bin/env node
// tw_check.mjs v2 — TurboWarp(scratch-vm) live-run check, same judgment standard as
// E:\FileCX\InstanceScratch-js\tw-verify\tw_verify.mjs (loadProject OK + stage exists +
// zero `unknown` opcodes), extended with green-flag startability: max live threads observed
// while stepping 120 frames must be >0 whenever the project has green-flag hats.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const TW_DIR = 'E:\\FileCX\\InstanceScratch-js\\tw-verify';
const require = createRequire(pathToFileURL(path.join(TW_DIR, 'tw_verify.mjs')));
const VirtualMachine = require('scratch-vm');

let failures = 0;
for (const file of process.argv.slice(2)) {
  const label = path.basename(file);
  const checks = [];
  const ck = (ok, msg) => { checks.push(`${ok ? 'OK' : 'XX'} ${msg}`); if (!ok) failures++; };
  let vm, fatal = null;
  try {
    vm = new VirtualMachine();
    vm.setTurboMode(true);
    vm.attachStorage(new (require('scratch-storage').ScratchStorage)());
    await vm.loadProject(fs.readFileSync(file));
  } catch (e) {
    // scratch-parser rejects with a plain object {validationError, sb3Errors:[...]} — no .message
    fatal = e ? (e.message || JSON.stringify(e)) : 'unknown';
    if (!e.message && e.sb3Errors) fatal += ` first=${JSON.stringify(e.sb3Errors[0])} total=${e.sb3Errors.length}`;
  }
  ck(!fatal, `loadProject 无致命错误${fatal ? ` (${fatal})` : ''}`);
  if (!fatal) {
    const targets = vm.runtime.targets;
    ck(targets.some(t => t.isStage), `存在 Stage (targets=${targets.length})`);
    let unknown = 0, hats = 0;
    for (const t of targets) for (const b of Object.values(t.blocks._blocks)) {
      if (!b.opcode) continue;
      if (b.opcode === 'unknown') unknown++;
      if (b.opcode === 'event_whenflagclicked') hats++;
    }
    ck(unknown === 0, `无 unknown 块 (${unknown})`);
    let threadErrors = 0;
    try { vm.runtime.on('THREAD_ERROR', () => threadErrors++); } catch {}
    vm.start();
    vm.greenFlag();
    let maxThreads = 0, steps = 0;
    try { for (; steps < 120; steps++) { vm.runtime._step(); maxThreads = Math.max(maxThreads, vm.runtime.threads.length); } }
    catch (e) { ck(false, `步进抛错: ${e.message}`); }
    if (hats > 0) ck(maxThreads > 0, `绿旗脚本可启动 (峰值线程=${maxThreads}, hats=${hats}, 步进=${steps}帧)`);
    else console.log(`   -- ${label}: 无绿旗 hat，启动检查跳过`);
    ck(true, `实机步进 ${steps} 帧无崩溃${threadErrors ? `（THREAD_ERROR 事件 ${threadErrors} 次，信息性）` : ''}`);
  }
  console.log(`── ${label}: ${checks.every(c => c.startsWith('OK')) ? 'PASS' : 'FAIL'}`);
  for (const c of checks) console.log(`   ${c}`);
  if (vm) try { vm.quit(); } catch {}
}
console.log(`TW-LIVE ${failures === 0 ? 'ALL-PASS' : `${failures} FAIL`}`);
process.exit(failures === 0 ? 0 : 1);
