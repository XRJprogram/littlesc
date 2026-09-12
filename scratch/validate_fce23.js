const AdmZip = require('../backend-js/node_modules/adm-zip');

const zip = new AdmZip('project/resource/FCE2.3.sb3');
const pj = JSON.parse(zip.readAsText('project.json'));

let totalBlocks = 0;
let errors = 0;

for (const target of pj.targets) {
  const blocks = target.blocks;
  const blockIds = new Set(Object.keys(blocks));
  totalBlocks += blockIds.size;

  for (const [id, b] of Object.entries(blocks)) {
    // 1. Parent checks
    if (b.parent) {
      if (!blockIds.has(b.parent)) {
        console.error(target.name + ': block ' + id + ' has non-existent parent ' + b.parent);
        errors++;
      } else {
        const p = blocks[b.parent];
        let found = (p.next === id);
        if (!found && p.inputs) {
          for (const inp of Object.values(p.inputs)) {
            if (Array.isArray(inp) && (inp[1] === id || inp[2] === id)) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          console.error(target.name + ': block ' + id + ' claims parent ' + b.parent + ', but parent does not reference it!');
          errors++;
        }
      }
    }

    // 2. Next checks
    if (b.next) {
      if (!blockIds.has(b.next)) {
        console.error(target.name + ': block ' + id + ' has non-existent next ' + b.next);
        errors++;
      } else {
        const n = blocks[b.next];
        if (n.parent !== id) {
          console.error(target.name + ': block ' + id + ' next is ' + b.next + ', but child parent is ' + n.parent);
          errors++;
        }
      }
    }

    // 3. Inputs checks
    if (b.inputs) {
      for (const [inputName, inp] of Object.entries(b.inputs)) {
        if (Array.isArray(inp)) {
          if (inp[0] === 1 || inp[0] === 2 || inp[0] === 3) {
            if (typeof inp[1] === 'string' && !blockIds.has(inp[1])) {
              console.error(target.name + ': block ' + id + ' input ' + inputName + ' references non-existent block ' + inp[1]);
              errors++;
            }
            if (inp[2] && typeof inp[2] === 'string' && !blockIds.has(inp[2])) {
              console.error(target.name + ': block ' + id + ' input ' + inputName + ' shadow references non-existent block ' + inp[2]);
              errors++;
            }
          }
        }
      }
    }

    // 4. TopLevel consistency
    if (b.topLevel) {
      if (b.parent !== null && b.parent !== undefined) {
        console.error(target.name + ': block ' + id + ' has topLevel=true but parent=' + b.parent);
        errors++;
      }
    } else {
      if (b.parent === null || b.parent === undefined) {
        console.error(target.name + ': block ' + id + ' has topLevel=false but parent is null!');
        errors++;
      }
    }
  }
}

console.log('=== COMPREHENSIVE VALIDATION FOR FCE2.3.sb3 ===');
console.log('Total targets:', pj.targets.length);
console.log('Total blocks:', totalBlocks);
console.log('Total errors:', errors);

const main = pj.targets.find(t => t.name === 'Main');
console.log('Main blocks count:', Object.keys(main.blocks).length);
const text = pj.targets.find(t => t.name === 'Text');
console.log('Text blocks count:', Object.keys(text.blocks).length);
console.log('Text costumes count:', text.costumes.length);
const card = pj.targets.find(t => t.name === 'Card');
console.log('Card blocks count (unchanged):', Object.keys(card.blocks).length);
