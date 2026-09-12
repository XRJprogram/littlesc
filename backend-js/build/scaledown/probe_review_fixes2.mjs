// probe_review_fixes2.mjs — 审查修复探针（第二部分）
import { compileSource, _validateSource } from '../../src/server.js';
import { sb3ToGoboscript } from '../../src/decompiler.js';
import AdmZip from 'adm-zip';

let pass = 0, fail = 0;
const ck = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('OK ', name); }
  else { fail++; console.log('XX ', name, detail); }
};
const pjOf = (buf) => JSON.parse(new AdmZip(buf).readAsText('project.json'));
const blocksOf = (buf) => {
  const pj = pjOf(buf);
  const out = [];
  for (const t of pj.targets || []) for (const b of Object.values(t.blocks || {})) {
    if (typeof b === 'object' && !Array.isArray(b)) out.push(b);
  }
  return out;
};

// B4 反编译保留列表内容 → 双往返稳定
{
  const gs1 = 'list q = [1, 2, "hello", -7];\nonflag {\n    add 99 to q;\n}\n';
  const s1 = compileSource(gs1);
  const g2 = sb3ToGoboscript(s1).source;
  const hasInit = /list\s+\w+\s*=\s*\[/.test(g2);
  const s2 = compileSource(g2);
  const g3 = sb3ToGoboscript(s2).source;
  ck('B4a 反编译输出列表初值', hasInit, g2.split('\n')[0]);
  const l2 = Object.values(pjOf(s2).targets.find(t => !t.isStage).lists)[0][1];
  const l3 = Object.values(pjOf(compileSource(g3)).targets.find(t => !t.isStage).lists)[0][1];
  ck('B4b 列表内容双往返稳定', JSON.stringify(l2) === JSON.stringify(l3),
    JSON.stringify(l2) + ' vs ' + JSON.stringify(l3));
}

// B5 validate 与 compile 对体内错误报告一致（单条）
{
  const bad = 'onflag {\n    move 10;\n    set_x ;\n    say "hi";\n}\n';
  const errs = _validateSource(bad);
  let compileMsg = '';
  try { compileSource(bad); } catch (e) { compileMsg = e.message; }
  ck('B5 validate 单条体内错误', errs.length === 1,
    'errs=' + JSON.stringify(errs.map(e => e.line + ':' + e.column + ' ' + e.message.slice(0, 40))));
  ck('B5b compile 拒绝并带行号', /L\d+:\d+/.test(compileMsg), compileMsg.slice(0, 60));
}

// B6 枚举常量在 var/list 初值中求值
try {
  const gs = 'enum Color {\n    RED,\n    GREEN = 5,\n    BLUE,\n}\nvar c = Color.GREEN;\nlist L = [Color.RED, Color.BLUE, 9];\nonflag {\n    say c;\n}\n';
  const t = pjOf(compileSource(gs)).targets.find(x => !x.isStage);
  const cv = Object.entries(t.variables).find(([, v]) => v[0] === 'c')[1][1];
  const lv = Object.values(t.lists)[0][1];
  // Upstream pass0.rs visit_enum semantics: explicit numeric value RESETS
  // the counter WITHOUT bumping it ⇒ RED=0, GREEN=5, BLUE=5(implicit), then
  // list literal 9. JS visitor.js:36-48 replicates this 1:1.
  ck('B6 枚举初值求值（上游语义）', cv === 5 && JSON.stringify(lv) === '[0,5,9]',
    'c=' + JSON.stringify(cv) + ' L=' + JSON.stringify(lv));
} catch (e) { ck('B6', false, e.message.slice(0, 140)); }

// R5 else\nif 跨行链式
try {
  const buf = compileSource('onflag {\n    if (1 > 2) {\n        say "a";\n    }\n    else\n    if (2 > 2) {\n        say "b";\n    }\n    else {\n        say "c";\n    }\n}\n');
  const ops = blocksOf(buf).map(b => b.opcode);
  ck('R5 else\\nif 链式', ops.includes('control_if_else'), JSON.stringify(ops));
} catch (e) { ck('R5', false, e.message.slice(0, 120)); }

// A7 空体 until → wait_until；非空体仍为 repeat_until
{
  const opsE = blocksOf(compileSource('onflag {\n    until (x > 3) { }\n}\n')).map(b => b.opcode);
  ck('A7a 空体 until→wait_until', opsE.includes('control_wait_until'), JSON.stringify(opsE));
  const opsN = blocksOf(compileSource('onflag {\n    until (x > 3) {\n        x += 1;\n    }\n}\n')).map(b => b.opcode);
  ck('A7b 非空体仍 repeat_until', opsN.includes('control_repeat_until'), JSON.stringify(opsN));
}

// A6 内建 log 的 warp 字节对齐上游 false（call 式调用）
{
  const buf = compileSource('onflag {\n    log("boom");\n}\n');
  const call = blocksOf(buf).find(b => b.opcode === 'procedures_call');
  ck('A6 zwsp builtin warp=false', call && call.mutation && call.mutation.warp === 'false',
    call ? JSON.stringify(call.mutation && call.mutation.warp) : 'no call');
}

// A11 copy list 自拷贝不清空数据
{
  const gs = 'list a = [1, 2, 3];\nonflag {\n    copy list a to a;\n    say length(a);\n}\n';
  const g2 = sb3ToGoboscript(compileSource(gs)).source;
  const lv = Object.values(pjOf(compileSource(g2)).targets.find(t => !t.isStage).lists)[0][1];
  ck('A11 自拷贝不清空数据', JSON.stringify(lv) === '[1,2,3]', JSON.stringify(lv));
}

// R2 range 括号内换行
try {
  const buf = compileSource('onflag {\n    for i in range(\n        1,\n        3) {\n        say i;\n    }\n}\n');
  ck('R2 range 多行参数', blocksOf(buf).length >= 2);
} catch (e) { ck('R2', false, e.message.slice(0, 120)); }

console.log(`[part2] pass=${pass} fail=${fail}`);
