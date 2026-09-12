// probe_define_alias.mjs — `define` 作为 `proc` 的文档化超集别名
// 背景：D13 S2 四轮败于模型惯写的 JS 风格 `define spawn_food { ... }`。
// 契约：
//   * define Name { } 与 define Name(args) { } 等价于 proc，可被调用
//   * 形状不符的 define（如宏式 `define X 5`）保持原有响亮报错
//   * 既有 proc / nowarp proc 完全不受影响
import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser, ParseError } from '../../src/parser.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, extra); }
};
const mk = (src) => new Parser(preprocess(lex(src)));
const parseClean = (src) => {
  const p = mk(src);
  try { p.parse(); return { ok: true, diags: p.diagnostics }; }
  catch (e) { return { ok: false, error: e }; }
};

// t1 — S2 实况形态：无参 define + 调用
{
  const r = parseClean('define spawn_food {\n  found = false;\n}\nonflag { spawn_food(); }');
  check('t1 define Name{} parses', r.ok, r.ok ? JSON.stringify(r.diags).slice(0,150) : r.error.message);
  check('t1 no diagnostics', r.ok && (!r.diags || r.diags.length === 0));
}

// t2 — 带参形式
{
  const r = parseClean('define move_to(x, y) { goto(x, y); }\nonflag { move_to(1, 2); }');
  check('t2 define Name(args){} parses', r.ok, r.ok ? '' : r.error.message);
}

// t3 — 回归：proc 原语法不受影响
{
  const r = parseClean('proc walk { move(1); }\nonflag { walk(); }');
  check('t3 proc still works', r.ok, r.ok ? '' : r.error.message);
}

// t4 — 回归：nowarp proc 不受影响
{
  const r = parseClean('nowarp proc tick { move(1); }\nonflag { tick(); }');
  check('t4 nowarp proc still works', r.ok, r.ok ? '' : r.error.message);
}

// t5 — 上游常量宏语义保留：带函数体的 define 走宏路径，不误判为过程
{
  let parsed = false;
  try { mk('define X 5\nonflag { say(X); }').parse(); parsed = true; } catch (e) { parsed = false; }
  check('t5 constant-macro define still works', parsed);
}

// t7 — repeat until 超集（S2 实况同款）
{
  let msg = '';
  try { mk('onflag {\n  repeat until (done) { done = true; }\n}').parse(); }
  catch (e) { msg = e.message; }
  check('t7 repeat until parses', msg === '', msg);
}

// t6 — define 体含完整控制流（S2 body 全形）
{
  const src = [
    'define spawn_food {',
    '  found = false;',
    '  repeat until (found) {',
    '    food_x = random(0, 23);',
    '    overlap = false;',
    '    idx = 1;',
    '    repeat (length of body_x) {',
    '      if (body_x[idx] == food_x and body_y[idx] == food_y) {',
    '        overlap = true;',
    '      }',
    '      idx += 1;',
    '    }',
    '    if (not overlap) {',
    '      found = true;',
    '    }',
    '  }',
    '}'].join('\n');
  const r = parseClean(src + '\nonflag { spawn_food(); }');
  check('t6 full define body parses', r.ok, r.ok ? '' : r.error.message);
}

// t8 — delete ... from ... 超集（S2 实况：delete 1 from dir_queue）
{
  let msg = '';
  try { mk('list dir_queue = [90];\nonflag { delete 1 from dir_queue; }').parse(); }
  catch (e) { msg = e.message; }
  check('t8 delete-from parses', msg === '', msg);
}

// t9 — 回归：既有 delete 形态不受影响
{
  let msg = '';
  try {
    mk('list L = [1, 2];\nonflag { delete item 2 of L; delete L[1]; delete L; }').parse();
  } catch (e) { msg = e.message; }
  check('t9 legacy delete forms intact', msg === '', msg);
}

// t10 — insert ... in ... 超集 + 既有 of 形态回归
{
  let msg = '';
  try {
    mk('list L = [9];\nonflag { insert hx at 1 in L; insert hy at 2 of L; }').parse();
  } catch (e) { msg = e.message; }
  check('t10 insert-in parses', msg === '', msg);
}

// t11 — clear list 超集（S2 实况：clear list body_x;）
{
  let msg = '';
  try {
    mk('list body_x = [1];\nonflag { clear list body_x; }').parse();
  } catch (e) { msg = e.message; }
  check('t11 clear-list parses', msg === '', msg);
}

// t12 — delete last [item] of 超集（D13 S2 实况）
{
  let msg = '';
  try {
    mk('list L = [1, 2];\nonflag { delete last item of L; }').parse();
  } catch (e) { msg = e.message; }
  check('t12 delete-last-item parses', msg === '', msg);
}
{
  let msg = '';
  try {
    mk('list L = [1, 2];\nonflag { delete last from L; }').parse();
  } catch (e) { msg = e.message; }
  check('t13 delete-last-from parses', msg === '', msg);
}

// t14 — replace item N of L with V 超集 + 上游 L[i]=x 回归
{
  let msg = '';
  try {
    mk('list L = [1, 2];\nonflag { replace item 1 of L with 9; replace item 2 in L with 8; L[1] = 7; }').parse();
  } catch (e) { msg = e.message; }
  check('t14 replace-item parses', msg === '', msg);
}

// t15 — item-of 记者块超集（S2 实况：new_dir = item 1 of dir_queue;）
{
  let msg = '';
  try {
    mk('list L = [7];\nonflag { new_dir = item 1 of L; }').parse();
  } catch (e) { msg = e.message; }
  check('t15 item-of reporter parses', msg === '', msg);
}

// t16 — 翻转参数序 insert 超集（S2 实况：insert 1 hx into body_x;）
{
  let msg = '';
  try {
    mk('list L = [9];\nonflag { insert 1 hx into L; }').parse();
  } catch (e) { msg = e.message; }
  check('t16 swapped insert parses', msg === '', msg);
}

// t17 — 块状多角色超集（D13-final S3 实况）
{
  let msg = '';
  let p2 = null;
  const src = [
    'sprite "Player" {',
    '  var lives = 3;',
    '  onflag { goto(0, 0); }',
    '}',
    '',
    'sprite "Enemy" {',
    '  onflag { move(1); }',
    '}',
    '',
    'onflag { say("go"); }',
  ].join('\n');
  try { p2 = mk(src); p2.parse(); } catch (e) { msg = e.message; }
  check('t17 sprite blocks parse', msg === '', msg);
  check('t17 two extra targets created', !!p2 && Array.isArray(p2.extraTargets) && p2.extraTargets.length === 2,
    p2 ? JSON.stringify((p2.extraTargets || []).map(t => t.name)) : 'no ast');
}

// t18 — stage 形式 + 指令形式回归
{
  let msg = '';
  try {
    mk('sprite stage { onflag { say("s"); } }\ntarget "A";\nonflag { move(1); }').parse();
  } catch (e) { msg = e.message; }
  check('t18 stage block + target directive', msg === '', msg);
}

// t19 — sprite 体语法错误保持致命
{
  let threw = false;
  try {
    mk('sprite "B" {\n  onflag { say(1 + }\n}').parse();
  } catch (e) { threw = true; }
  check('t19 sprite body error fatal', threw);
}

// t20 — C 风格 for 超集（S3 实况：for (j = 0; j < n; j++)）
{
  let msg = '';
  try {
    mk([
      'onflag {',
      '  temp = 0;',
      '  level = 3;',
      '  for (j = 0; j < level - 1; j++) {',
      '    temp += level_platforms[j];',
      '  }',
      '}',
    ].join('\n')).parse();
  } catch (e) { msg = e.message; }
  check('t20 c-style for parses', msg === '', msg);
}

// t21 — 回归：canonical for-in 不受影响
{
  let msg = '';
  try {
    mk(['list L = [1, 2];', 'onflag {', '  for item in L { say(item); }', '}'].join('\n')).parse();
  } catch (e) { msg = e.message; }
  check('t21 for-in still works', msg === '', msg);
}

console.log('');
console.log('=== define-alias probe:', pass, 'passed,', fail, 'failed ===');
process.exit(fail ? 1 : 0);
