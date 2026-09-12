const AdmZip = require('../backend-js/node_modules/adm-zip');

const zip2 = new AdmZip('project/resource/FCE2.2.sb3');
const pj2 = JSON.parse(zip2.readAsText('project.json'));

const zip3 = new AdmZip('project/resource/FCE2.3.sb3');
const pj3 = JSON.parse(zip3.readAsText('project.json'));

const main2 = pj2.targets.find(t => t.name === 'Main');
const main3 = pj3.targets.find(t => t.name === 'Main');

console.log('Main2 blocks:', Object.keys(main2.blocks).length);
console.log('Main3 blocks:', Object.keys(main3.blocks).length);

// Check new blocks in Main3 that weren't in Main2
const newBlocks = Object.keys(main3.blocks).filter(id => !main2.blocks[id]);
console.log('New blocks in Main3:', newBlocks.length);

// Check modified blocks
const modifiedBlocks = Object.keys(main3.blocks).filter(id => {
  if (!main2.blocks[id]) return false;
  return JSON.stringify(main3.blocks[id]) !== JSON.stringify(main2.blocks[id]);
});
console.log('Modified blocks in Main3:', modifiedBlocks);
for (const id of modifiedBlocks) {
  console.log('Block', id);
  console.log('  old:', main2.blocks[id]);
  console.log('  new:', main3.blocks[id]);
}

// Check other targets
for (const target of pj3.targets) {
  if (target.name === 'Main') continue;
  const t2 = pj2.targets.find(t => t.name === target.name);
  if (t2) {
    const diff = Object.keys(target.blocks).filter(id => !t2.blocks[id]);
    const mod = Object.keys(target.blocks).filter(id => t2.blocks[id] && JSON.stringify(target.blocks[id]) !== JSON.stringify(t2.blocks[id]));
    if (diff.length || mod.length) {
      console.log('Target', target.name, 'new:', diff, 'mod:', mod);
    }
  }
}
