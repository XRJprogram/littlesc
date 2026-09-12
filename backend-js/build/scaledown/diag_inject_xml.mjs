// Diagnose issue#4 v2
import VM from 'scratch-vm';

async function compile(srcText) {
  const res = await fetch('http://localhost:8000/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: srcText })
  });
  if (!res.ok) { throw new Error('compile ' + res.status + ': ' + await res.text()); }
  return Buffer.from(await res.arrayBuffer());
}

const BASE = ['onflag {', '  move(5);', '}'].join('\n');
const NEW = ['onflag {', '  say("hello");', '  move(10);', '}'].join('\n');

const JSZipMod = await import('@turbowarp/jszip');
const JSZip = JSZipMod.default || JSZipMod;
const sb3mod = await import('scratch-vm/src/serialization/sb3.js');
const deserializeBlocks = sb3mod.deserializeBlocks || (sb3mod.default && sb3mod.default.deserializeBlocks);

const vm = new VM();
await new Promise(r => setTimeout(r, 300));

// load a base project so editingTarget exists (like the GUI default cat)
const baseBuf = await compile(BASE);
await vm.loadProject(baseBuf);
console.log('loaded base; targets:', vm.runtime.targets.map(t => t.getName() + '=' + Object.keys(t.blocks._blocks).length).join(' | '));
const target = vm.editingTarget || vm.runtime.targets.find(t => !t.isStage);
console.log('editingTarget:', target.getName());

const buf = await compile(NEW);
const zip = await JSZip.loadAsync(buf);
const proj = JSON.parse(await zip.file('project.json').async('string'));
const sprite = proj.targets.find(t => !t.isStage && t.blocks && Object.keys(t.blocks).length > 0);
console.log('injecting sprite:', sprite.name, '| blocks:', Object.keys(sprite.blocks).length);

const newBlocks = JSON.parse(JSON.stringify(sprite.blocks));
try {
  deserializeBlocks(newBlocks);
  const tl = Object.entries(newBlocks).filter(([, b]) => b.topLevel);
  console.log('deserialize OK; total:', Object.keys(newBlocks).length, '| topLevel:', tl.length,
    '| sample topLevel:', JSON.stringify(tl[0] && [tl[0][0], { op: tl[0][1].opcode, x: tl[0][1].x, y: tl[0][1].y }]));
} catch (e) {
  console.log('deserialize THREW:', e.message);
  process.exit(1);
}

let i = 0;
for (const id of Object.keys(newBlocks)) {
  const b = newBlocks[id];
  if (b.topLevel) { if (b.x == null) b.x = 50 + (i * 40); if (b.y == null) b.y = 50; i++; }
}
target.blocks._blocks = {};
target.blocks._scripts = [];
Object.assign(target.blocks._blocks, newBlocks);
target.blocks._scripts = Object.keys(newBlocks).filter(id2 => newBlocks[id2].topLevel);

let captured = null;
vm.on('workspaceUpdate', d => { captured = d.xml; });
try {
  vm.emitWorkspaceUpdate();
  console.log('emitWorkspaceUpdate OK');
} catch (e) {
  console.log('emitWorkspaceUpdate THREW:', e.stack.split('\n').slice(0, 3).join(' | '));
  process.exit(1);
}
if (!captured) { console.log('NO workspaceUpdate EVENT EMITTED'); process.exit(1); }
console.log('xml length:', captured.length, '| <block> count:', (captured.match(/<block/g) || []).length,
  '| <field> count:', (captured.match(/<field/g) || []).length);
console.log('--- xml ---');
console.log(captured.slice(0, 900));
