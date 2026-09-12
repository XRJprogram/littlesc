import { compileSource } from '../../src/server.js';
import AdmZip from 'adm-zip';
const DQ = String.fromCharCode(34);
const lines = [
'func def_calc(a, b, o) {',
'    if (o == "+") { return a + b; }',
'    if (o == "-") { return a - b; }',
'    if (o == "*") { return a * b; }',
'    if (o == "/") { return a / b; }',
'    return 0;',
'}',
'onflag {',
'    set a to 10;',
'    set b to 5;',
'    set o to "+";',
'    set c to def_calc(a, b, o);',
'    say(c);',
'    set o to "-";',
'    set c to def_calc(a, b, o);',
'    say(c);',
'    set o to "*";',
'    set c to def_calc(a, b, o);',
'    say(c);',
'    set o to "/";',
'    set c to def_calc(a, b, o);',
'    say(c);',
'}'
];
const src = lines.join('\n');
const buf = compileSource(src);
const zip = new AdmZip(buf);
const pj = JSON.parse(zip.readFile('project.json').toString('utf8'));
const sp = pj.targets.find(t => t.name === 'Sprite1');
const opcodes = {};
for (const b of Object.values(sp.blocks)) {
  if (typeof b === 'object' && b.opcode) opcodes[b.opcode] = (opcodes[b.opcode] || 0) + 1;
}
console.log('opcodes:', JSON.stringify(opcodes));
console.log('variables:', JSON.stringify(sp.variables));