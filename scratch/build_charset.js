const fs = require('fs');
const path = require('path');
const AdmZip = require('../backend-js/node_modules/adm-zip');

const zip = new AdmZip('project/resource/FCE2.2.sb3');
const pj = JSON.parse(zip.readAsText('project.json'));

const story = fs.readFileSync('project/fcestory.txt', 'utf8');

const charSet = new Set();

// 1. Text from fcestory.txt
for (const ch of story) {
  if (ch !== '\r' && ch !== '\n' && ch !== '\t' && ch !== ' ') {
    charSet.add(ch);
  }
}

// 2. Text from project lists and variables
for (const target of pj.targets) {
  if (target.lists) {
    for (const [id, [name, items]] of Object.entries(target.lists)) {
      for (const item of items) {
        if (typeof item === 'string') {
          for (const ch of item) {
            if (ch !== '\r' && ch !== '\n' && ch !== '\t' && ch !== ' ') {
              charSet.add(ch);
            }
          }
        }
      }
    }
  }
}

// 3. AddText strings in Main
const main = pj.targets.find(t => t.name === 'Main');
for (const [id, b] of Object.entries(main.blocks)) {
  if (b.opcode === 'procedures_call' && b.mutation && b.mutation.proccode.includes('AddText')) {
    const argIds = JSON.parse(b.mutation.argumentids);
    const inp = b.inputs[argIds[0]];
    if (inp && inp[1]) {
      let val = null;
      if (Array.isArray(inp[1])) val = inp[1][1];
      else if (typeof inp[1] === 'string') val = inp[1];
      if (val) {
        for (const ch of val) {
          if (ch !== '\r' && ch !== '\n' && ch !== '\t' && ch !== ' ') {
            charSet.add(ch);
          }
        }
      }
    }
  }
}

// 4. Basic ASCII printable characters (excluding space)
for (let i = 33; i <= 126; i++) {
  charSet.add(String.fromCharCode(i));
}

// 5. Common Chinese punctuation
const cnPunc = '，。！？：；“”‘’（）【】《》、…—～·『』「」';
for (const ch of cnPunc) {
  charSet.add(ch);
}

const sorted = Array.from(charSet).sort();
console.log('Total characters in comprehensive charset:', sorted.length);

// Save to project/charset.txt: one line with all characters, plus list
fs.writeFileSync('project/charset.txt', sorted.join(''), 'utf8');
console.log('Saved characters to project/charset.txt');
