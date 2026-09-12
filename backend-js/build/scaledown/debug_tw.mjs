import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
const LOG = 'E:/FileCX/InstanceScratch-js/InstanceScratch/backend-js/build/scaledown/tw_debug.log';
const say = m => { fs.appendFileSync(LOG, m + '\n'); };
fs.writeFileSync(LOG, '');
process.on('uncaughtException', e => { say('UNCAUGHT: ' + (e && e.stack)); process.exit(3); });
process.on('unhandledRejection', e => { say('UNHANDLED-REJECTION: ' + (e && (e.stack || e))); });

const TW = 'E:\\FileCX\\InstanceScratch-js\\tw-verify';
const require = createRequire(pathToFileURL(path.join(TW, 'tw_verify.mjs')));
const VirtualMachine = require('scratch-vm');

for (const f of process.argv.slice(2)) {
  const vm = new VirtualMachine();
  vm.setTurboMode(true);
  try { vm.attachStorage(new (require('scratch-storage').ScratchStorage)()); } catch (e) { say('storage attach failed: ' + e.message); }
  vm.on('PROJECT_LOAD_ERROR', (...a) => say(`[${path.basename(f)}] PROJECT_LOAD_ERROR event: ${a.map(String).join(' ')}`));
  let r, err;
  try { r = await vm.loadProject(fs.readFileSync(f)); } catch (e) { err = e && (e.stack || e.message || String(e)); }
  say(`[${path.basename(f)}] resolved=${JSON.stringify(r)} threw=${err ? String(err).slice(0, 500) : 'no'} targets=${vm.runtime.targets.length} names=${JSON.stringify(vm.runtime.targets.map(t => t.getName ? t.getName() : t.name))}`);
  try { vm.quit(); } catch (e) { say('quit threw: ' + e.message); }
}
say('DEBUG-DONE');
