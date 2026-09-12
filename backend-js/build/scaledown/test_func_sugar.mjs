// test_func_sugar.mjs — M27-F: func 编译为原生自定义积木（不再内联）
// 契约：def_ 前缀校验不变；产物必须含 procedures_definition；无 @n 临时变量；递归合法化
import { compileSource, _validateSource } from '../../src/server.js';
import AdmZip from 'adm-zip';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, extra); }
};
function opcodesOf(buf) {
  const zip = new AdmZip(buf);
  const pj = JSON.parse(zip.readFile('project.json').toString('utf8'));
  const sp = pj.targets.find(t => t.name === 'Sprite1') || pj.targets[0];
  const ops = {};
  for (const b of Object.values(sp.blocks)) {
    if (typeof b === 'object' && b.opcode) ops[b.opcode] = (ops[b.opcode] || 0) + 1;
  }
  return { ops, vars: Object.keys(sp.variables) };
}
const ORIG = 'func add(a,b){return a+b;} func subtract(a,b){return a-b;} ' +
  'onflag { say(add(2,3)); say(subtract(10,4)); }';
const FIXED = 'func def_add(a,b){return a+b;} func def_subtract(a,b){return a-b;} ' +
  'onflag { say(def_add(2,3)); say(def_subtract(10,4)); }';
{
  const errs = _validateSource(ORIG);
  const naming = errs.filter(e => e.kind === 'NamingError');
  check('t1 flags add & subtract', naming.length >= 2 && naming.some(e => e.message.includes('add')) && naming.some(e => e.message.includes('subtract')));
}
{ const errs = _validateSource(FIXED); check('t2 FIXED validates clean', errs.length === 0); }
{
  try {
    const buf = compileSource(FIXED);
    const { ops, vars } = opcodesOf(buf);
    check('t3 procedures_definition x2', (ops['procedures_definition'] || 0) === 2, JSON.stringify(ops));
    check('t3b procedures_call >=2', (ops['procedures_call'] || 0) >= 2, JSON.stringify(ops));
    check('t3c no @n temp vars', !vars.some(v => v.startsWith('@')), JSON.stringify(vars));
    check('t3d returnedFunc var present', vars.some(v => v.startsWith('returnedFunc:')), JSON.stringify(vars));
    const u8 = new Uint8Array(buf);
    check('t3e zip magic', u8[0] === 0x50 && u8[1] === 0x4b);
  } catch (e) { check('t3 compile', false, e.message.slice(0, 200)); }
}
{
  try {
    const buf = compileSource('func def_safe_div(a,b){ if (b == 0) { return 0; } return a/b; } onflag { say(def_safe_div(9,0)); }');
    const { ops } = opcodesOf(buf);
    check('t4 early-return keeps definition', (ops['procedures_definition'] || 0) === 1);
  } catch (e) { check('t4 early-return', false, e.message.slice(0, 160)); }
}
{
  try {
    const buf = compileSource('func def_double(n){ return n*2; } func def_quad(n){ return def_double(def_double(n)); } onflag { say(def_quad(3)); }');
    const { ops } = opcodesOf(buf);
    check('t5 nested calls to procs', (ops['procedures_definition'] || 0) === 2 && (ops['procedures_call'] || 0) >= 2, JSON.stringify(ops));
  } catch (e) { check('t5 nested calls', false, e.message.slice(0, 160)); }
}
{
  let threw = '';
  try { compileSource('func def_fact(n){ if (n <= 1) { return 1; } return n * def_fact(n - 1); } onflag { say(def_fact(5)); }'); }
  catch (e) { threw = String(e.message); }
  check('t6 recursion compiles (runtime-legal)', threw === '', threw.slice(0, 140));
}
{
  const errs = _validateSource('proc walk { move(10); } onflag { walk(); }');
  check('t7 bare proc flagged', errs.some(e => e.kind === 'NamingError' && e.message.includes('walk')));
}
console.log('---');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);