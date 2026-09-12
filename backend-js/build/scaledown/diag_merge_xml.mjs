import VM from 'scratch-vm';

const SRC = 'onclick {\n  goto_random_position;\n}';
const JSZipMod = await import('@turbowarp/jszip');
const JSZip = JSZipMod.default || JSZipMod;
const sb3mod = await import('scratch-vm/src/serialization/sb3.js');
const deserializeBlocks = sb3mod.deserializeBlocks;

async function compile(srcText) {
  const res = await fetch('http://localhost:8000/compile', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({source: srcText})});
  if (!res.ok) throw new Error(await res.text());
  return Buffer.from(await res.arrayBuffer());
}

const vm = new VM();
await new Promise(r => setTimeout(r, 300));
const baseBuf = await compile('onflag {\n  say("hi");\n}');
await vm.loadProject(baseBuf);
const target = vm.editingTarget;
console.log('base scripts:', target.blocks._scripts.length);

const buf = await compile(SRC);
const zip = await JSZip.loadAsync(buf);
const proj = JSON.parse(await zip.file('project.json').async('string'));
const sprite = proj.targets.find(t => !t.isStage && t.blocks && Object.keys(t.blocks).length);

const newBlocks = JSON.parse(JSON.stringify(sprite.blocks));
deserializeBlocks(newBlocks);
// --- replicate M8 id-remap exactly ---
const existingIds = new Set(Object.keys(target.blocks._blocks));
let seq = 0;
const freshId = () => { let c; do { c = 'gsinj_' + Date.now().toString(36) + '_' + (seq++); } while (existingIds.has(c)); existingIds.add(c); return c; };
const idMap = {}; const mapped = {};
for (const [bid, blk] of Object.entries(newBlocks)) {
  const nid = freshId(); idMap[bid] = nid;
  mapped[nid] = Object.assign({}, blk, {id: nid});
}
for (const nb of Object.values(mapped)) {
  if (nb.next && idMap[nb.next]) nb.next = idMap[nb.next];
  else if (nb.next && !idMap[nb.next]) nb.next = null;
  if (nb.parent && idMap[nb.parent]) nb.parent = idMap[nb.parent];
  if (nb.inputs) {
    for (const k of Object.keys(nb.inputs)) {
      const v = nb.inputs[k];
      if (Array.isArray(v)) {
        nb.inputs[k] = v.map(el =>
          (typeof el === 'string' && idMap[el]) ? idMap[el] : el);
      } else if (v && typeof v === 'object') {
        // deserialized runtime form: {shadow, block}
        if (v.shadow && idMap[v.shadow]) v.shadow = idMap[v.shadow];
        if (v.block && idMap[v.block]) v.block = idMap[v.block];
      }
    }
  }
}
Object.assign(target.blocks._blocks, mapped);
target.blocks._scripts = [...target.blocks._scripts,
  ...Object.entries(mapped).filter(([, b]) => b.topLevel).map(([id]) => id)];

let xml = null;
vm.on('workspaceUpdate', d => { xml = d.xml; });
vm.emitWorkspaceUpdate();
console.log('xml len:', xml.length);
const i = xml.indexOf('motion_goto');
console.log('--- xml around motion_goto ---');
console.log(xml.slice(Math.max(0, i - 260), i + 420));
// also dump runtime field of the menu
for (const [bid2, b] of Object.entries(target.blocks._blocks)) {
  if (b.opcode && b.opcode.includes('_menu')) {
    console.log('menu block', bid2, JSON.stringify(b.fields), 'sh:', b.shadow);
  }
}
