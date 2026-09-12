// diag_py_threads.mjs — 对比 orig vs recompiled pyinterpreter 的绿旗线程行为
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const TW_DIR = 'E:\\FileCX\\InstanceScratch-js\\tw-verify';
const require = createRequire(pathToFileURL(path.join(TW_DIR, 'tw_verify.mjs')));
const VirtualMachine = require('scratch-vm');

const file = process.argv[2];
const vm = new VirtualMachine();
vm.setTurboMode(true);
vm.attachStorage(new (require('scratch-storage').ScratchStorage)());
await vm.loadProject(fs.readFileSync(file));

let threadErrors = [];
try { vm.runtime.on('THREAD_ERROR', (t, e) => threadErrors.push(String((e && e.message) || e).slice(0, 120))); } catch {}

for (const t of vm.runtime.targets) {
  const store = t.blocks && t.blocks._blocks;
  if (!store) continue;
  const flags = Object.values(store).filter(b => b && b.opcode === 'event_whenflagclicked');
  for (const h of flags) {
    console.log(`hat in [${t.getName()}] id-next=${h.next}`);
    let cur = h.next, n = 0;
    while (cur && n < 5) { const b = store[cur]; console.log('   ->', b.opcode); cur = b.next; n++; }
  }
}

vm.start();
vm.greenFlag();
for (let f = 0; f < 30; f++) {
  vm.runtime._step();
  const alive = vm.runtime.threads.length;
  if (f < 6 || f % 10 === 9) {
    console.log(`frame ${f}: threads=${alive}`);
  }
}
console.log('THREAD_ERROR events:', threadErrors.length);
for (const e of [...new Set(threadErrors)].slice(0, 6)) console.log('  ', e);
vm.quit();
