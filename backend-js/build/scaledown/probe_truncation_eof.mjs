// probe_truncation_eof.mjs — 截断源码的 EOF 诊断质量探针
// 背景：D12 S3 四轮失败于 "L1:1 Unexpected token in expression: Semicolon"，
// 真因是响应在 max_tokens 处截断，末行悬空 `var x =`。peek() 越界返回合成
// Semicolon(pos=-1)，把 EOF 误报成普通语法错，stress 的截断提示分支接不住。
// 本探针锁定修复后的契约：
//   * EOF 处错误必须含 "Unexpected EOF" 且带真实位置(pos>0)
//   * 体内 var 初始化器被截断 → 致命(重抛)；顶层 var 被截断 → 可恢复诊断但保留真话
//   * 非 EOF 的真实 Semicolon 错误文案保持不变；既有合法语法不受影响
import { lex } from '../../src/lexer.js';
import { preprocess } from '../../src/preprocessor.js';
import { Parser, ParseError } from '../../src/parser.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, extra); }
};
const mk = (src) => new Parser(preprocess(lex(src)));

// t1 — D12 S3 原样尾部：体内 var 初始化器悬空
{
  const src = 'onflag {\n  var g = -1;\n  var vy =';
  try {
    mk(src).parse();
    check('t1 truncated body-var throws', false, '(parsed without error)');
  } catch (e) {
    check('t1 throws ParseError', e instanceof ParseError, e.name);
    check('t1 msg has Unexpected EOF', /Unexpected EOF/.test(e.message), e.message);
    check('t1 names the variable', /vy/.test(e.message), e.message);
    check('t1 real position', typeof e.pos === 'number' && e.pos > 0, String(e.pos));
  }
}

// t2 — 表达式中途 EOF（二元运算符右操作数缺失）
{
  const src = 'onflag {\n  say(1 +';
  try {
    mk(src).parse();
    check('t2 truncated expr throws', false, '(parsed without error)');
  } catch (e) {
    check('t2 ParseError', e instanceof ParseError, e.name);
    check('t2 msg has Unexpected EOF', /Unexpected EOF in expression/.test(e.message), e.message);
    check('t2 real position', typeof e.pos === 'number' && e.pos > 0, String(e.pos));
  }
}

// t3 — 顶层 var 初始化器悬空：可恢复诊断但必须说真话
{
  const p = mk('var q =');
  try {
    p.parse();
    const msgs = (p.diagnostics || []).map(d => d.message || '').join(' | ');
    check('t3 recovers at top level', true);
    check('t3 diag says Unexpected EOF', /Unexpected EOF/.test(msgs), msgs.slice(0, 200));
  } catch (e) {
    // 顶层也允许直接抛，只要信息正确
    check('t3 recovers at top level', false, 'threw: ' + e.message);
  }
}

// t4 — 回归：正常初始化 + 使用
{
  const p = mk('var ok = 3;\nonflag { say(ok); }');
  try {
    p.parse();
    check('t4 normal var compiles', (p.diagnostics || []).length === 0,
      JSON.stringify(p.diagnostics || []).slice(0, 200));
  } catch (e) { check('t4 normal var compiles', false, e.message); }
}

// t5 — 回归：真实的 `var a = ;`（非 EOF）仍按原口径报 Semicolon
{
  const src = 'var a = ;';
  let msg = '';
  const p = mk(src);
  try { p.parse(); msg = (p.diagnostics || []).map(d => d.message || '').join('|'); }
  catch (e) { msg = e.message; }
  check('t5 real semicolon still reported', /Semicolon|Expected constant value/.test(msg), msg.slice(0, 200));
}

// t6 — 回归：裸换行续行初始化不受守卫影响
{
  const p = mk('var b =\n4;\nonflag { say(b); }');
  try {
    p.parse();
    check('t6 newline continuation intact', (p.diagnostics || []).length === 0,
      JSON.stringify(p.diagnostics || []).slice(0, 200));
  } catch (e) { check('t6 newline continuation intact', false, e.message); }
}

console.log('\\n=== truncation-eof probe:', pass, 'passed,', fail, 'failed ===');
process.exit(fail ? 1 : 0);
