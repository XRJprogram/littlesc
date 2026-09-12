import AdmZip from 'adm-zip';
import { compileSource } from '../../src/server.js';
import { sb3ToGoboscript } from '../../src/decompiler.js';

const NL = String.fromCharCode(10);
let pass = true;
function check(label, cond) { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + label); if (!cond) pass = false; }

// 1. ternary → syntax sugar: control_if_else statements + hidden __tern_N var
//    (scratch-vm has NO if/else reporter; operator_ifelse would be undefined)
{
  const src = ['onflag {', '  var x = 5;', '  say(x > 3 ? "big" : "small");', '}'].join(NL);
  const pj = JSON.parse(new AdmZip(compileSource(src)).getEntry('project.json').getData().toString('utf-8'));
  const ops = [];
  let ternVar = false;
  for (const t of pj.targets) {
    const store = t.blocks._blocks || t.blocks;
    for (const b of Object.values(store)) if (b && b.opcode && !b.shadow) ops.push(b.opcode);
    for (const v of Object.values(t.variables || {})) {
      const vn = Array.isArray(v) ? v[0] : v.name;
      if (String(vn).startsWith('__tern_')) ternVar = true;
    }
  }
  check('ternary -> NO invented operator_ifelse opcode', !ops.includes('operator_ifelse'));
  check('ternary -> control_if_else present', ops.includes('control_if_else'));
  check('ternary -> sprite-private __tern_N var declared', ternVar);
}

// 2. array literal + index → hidden list + data_itemoflist
{
  const src = ['onclone {', '  var hx = [-120, 0, 120][random(1, 3)];', '  goto(hx, 0);', '}'].join(NL);
  const zip = new AdmZip(compileSource(src));
  const pj = JSON.parse(zip.getEntry('project.json').getData().toString('utf-8'));
  const t = pj.targets.find(x => !x.isStage);
  const arr = Object.values(t.lists).find(l => Array.isArray(l) ? l[0].startsWith('__arr_') : l.name.startsWith('__arr_'));
  check('hidden __arr_N list exists', !!arr);
  const val = Array.isArray(arr) ? arr[1] : arr.value;
  check('hidden list value = [-120,0,120]', JSON.stringify(val) === '[-120,0,120]');
  const ops = [];
  for (const b of Object.values(t.blocks._blocks || t.blocks)) if (b && b.opcode && !b.shadow) ops.push(b.opcode);
  check('indexing -> data_itemoflist', ops.includes('data_itemoflist'));
}

// 3. round-trip: compile ternary src -> decompile -> recompile -> same opcodes
{
  const src = ['onflag {', '  var x = 5;', '  say(x > 3 ? "big" : "small");', '}'].join(NL);
  const sb3a = compileSource(src);
  const dec = sb3ToGoboscript(sb3a);
  const gsText = typeof dec === 'string' ? dec : dec.source;
  // Ternary lowers to temp-var + if/else sugar, so the decompiled form uses
  // plain `if ... else` (and must NOT contain an unparseable invented op).
  check('decompiled uses if/else sugar form', /if\s*\(/.test(gsText) && !/operator_ifelse/.test(gsText));
  const sb3b = compileSource(gsText);
  const hist = (buf) => {
    const pj = JSON.parse(new AdmZip(buf).getEntry('project.json').getData().toString('utf-8'));
    const h = {};
    for (const t of pj.targets) for (const b of Object.values(t.blocks._blocks || t.blocks))
      if (b && b.opcode && !b.shadow) h[b.opcode] = (h[b.opcode] || 0) + 1;
    return h;
  };
  const ha = hist(sb3a), hb = hist(sb3b);
  let diff = false;
  for (const k of new Set([...Object.keys(ha), ...Object.keys(hb)]))
    if ((ha[k] || 0) !== (hb[k] || 0)) { diff = true; console.log('  diff:', k, ha[k], hb[k]); }
  check('roundtrip opcode histogram identical', !diff);
}

console.log(pass ? 'TERNARY/ARR SEMANTICS PASS' : 'SEMANTICS FAIL');
process.exit(pass ? 0 : 1);
