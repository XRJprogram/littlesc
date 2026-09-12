import AdmZip from 'adm-zip';
import { compileSource } from '../../src/server.js';

const NL = String.fromCharCode(10);
const src = [
  'list boss_hp = [100, 60];',
  'var phase = 1;',
  'var cur = boss_hp[phase];',
  'var doubled = cur * 2;',   // second init depends on first — order must hold
  'onflag { say(doubled); }',
].join(NL);

const sb3 = compileSource(src);
const pj = JSON.parse(new AdmZip(sb3).getEntry('project.json').getData().toString('utf-8'));
let pass = true;
function check(label, cond) { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + label); if (!cond) pass = false; }

const t = pj.targets.find(x => !x.isStage);
check('var cur declared', Object.values(t.variables).some(v => Array.isArray(v) ? v[0] === 'cur' : v.name === 'cur'));
const store = t.blocks._blocks || t.blocks;
const blocks = Object.values(store).filter(b => b && b.opcode && !b.shadow);

// find the onflag script; first two statements must be the injected inits
// (hats chain their statements via `next`, reporters ride along as inputs)
const hat = blocks.find(b => b.opcode === 'event_whenflagclicked');
check('onflag exists', !!hat);
const first = hat.next ? store[hat.next] : null;
check('first stmt is setvar cur=boss_hp[phase]', first && first.opcode === 'data_setvariableto' &&
  JSON.stringify(first.fields.VARIABLE) === JSON.stringify(['cur', 'cur']));
const second = first && first.next ? store[first.next] : null;
check('second stmt is setvar doubled', second && second.opcode === 'data_setvariableto' &&
  JSON.stringify(second.fields.VARIABLE) === JSON.stringify(['doubled', 'doubled']));
check('no pending inits left unflushed', !t._pendingTopLevelInits);

console.log(pass ? 'TOP-RUNTIME-INIT PASS' : 'FAIL');
process.exit(pass ? 0 : 1);
