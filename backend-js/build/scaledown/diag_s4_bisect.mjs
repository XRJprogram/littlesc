// diag_s4_bisect.mjs — S4 零块问题二分定位
import { compileSource } from '../../src/server.js';
import AdmZip from 'adm-zip';

const count = (label, code) => {
  try {
    const buf = compileSource(code);
    const pj = JSON.parse(new AdmZip(buf).readAsText('project.json'));
    let n = 0;
    for (const t of pj.targets || []) for (const b of Object.values(t.blocks || {})) if (typeof b === 'object' && !Array.isArray(b)) n++;
    console.log(label, '=>', n);
  } catch (e) {
    console.log(label, '=> ERR:', e.message.slice(0, 150).replace(/\n/g, ' | '));
  }
};

count('T1 onflag{var scores=[]; add 85 to scores;}',
  'onflag {\n    var scores = [];\n    add 85 to scores;\n}\n');
count('T2 onflag{add 85 to scores;} only',
  'onflag {\n    add 85 to scores;\n}\n');
count('T3 top var=[] + add in body',
  'var scores = [];\nonflag {\n    add 85 to scores;\n}\n');
count('T4 list decl + add',
  'list scores;\nonflag {\n    add 85 to scores;\n}\n');
count('T5 baseline say',
  'onflag {\n    say "hi";\n}\n');
count('T6 var[] empty literal only',
  'onflag {\n    var scores = [];\n    say "hi";\n}\n');
count('T7 var[] then set',
  'onflag {\n    var scores = [];\n    total = 0;\n}\n'.replace('total', 'scores'));
