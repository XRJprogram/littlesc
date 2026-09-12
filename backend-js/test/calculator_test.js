#!/usr/bin/env node
// calculator_test.js — 第二阶段：goboscript 计算器 编译+验收
//
// 流程:
//   1. 读 fixtures/calculator/main.gs（去掉 costumes 行，compileSource 会自动加）
//   2. backend-js 内核编译 → calculator.sb3
//   3. 结构语义检查: ask×3 / answer×3 / forever / 四则 / 除零保护 / 分支结构
//   4. 反编译 → calculator.decompiled.gs
//   5. 重编译 → calculator.recompiled.sb3，opcode 直方图对比（验收标准）
//
// 运行: node test/calculator_test.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

import { sb3ToGoboscript } from '../src/decompiler.js';
import { compileSource } from '../src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CALC_DIR = path.join(__dirname, 'fixtures', 'calculator');
const OUT_DIR = path.join(__dirname, '..', 'build', 'calculator-out');

fs.mkdirSync(OUT_DIR, { recursive: true });

let failures = 0;
function ok(cond, label) {
  console.log(`  ${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// SB3 helpers
// ---------------------------------------------------------------------------

function loadProject(sb3Buffer) {
  const zip = new AdmZip(sb3Buffer);
  const pj = JSON.parse(zip.getEntry('project.json').getData().toString('utf-8'));
  return pj;
}

function opcodeHistogram(pj) {
  const hist = {};
  for (const target of pj.targets || []) {
    for (const bid in target.blocks || {}) {
      const blk = target.blocks[bid];
      if (typeof blk === 'object' && !Array.isArray(blk)) {
        hist[blk.opcode] = (hist[blk.opcode] || 0) + 1;
      }
    }
  }
  return hist;
}

// Extract a readable value from a block input for semantic checks
function inputValue(target, blk, key) {
  const inp = blk.inputs && blk.inputs[key];
  if (!inp) return null;
  // postprocess forms: [1, value], [2/3, value, ...], shadow [1, [4|5|6|7|8|10, v]]
  let v = Array.isArray(inp) ? inp[1] : null;
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    // primitive: [type, value] — 4/5 number, 8 positive/negative?, 10 string
    return { kind: 'primitive', type: v[0], value: String(v[1]) };
  }
  if (typeof v === 'string' && /^\[.+\]$/.test(v)) {
    // literal baked into serialized form
    return { kind: 'literal', value: v };
  }
  if (typeof v === 'number') return { kind: 'primitive', type: 4, value: String(v) };
  // block reference
  const sub = target.blocks[v];
  if (sub && typeof sub === 'object') return { kind: 'block', opcode: sub.opcode, block: sub };
  if (typeof v === 'string') return { kind: 'raw', value: v };
  return null;
}

function fieldOf(blk, key) {
  return blk.fields && blk.fields[key] ? blk.fields[key][0] : undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('='.repeat(70));
console.log('第二阶段验收: goboscript 加减乘除计算器');
console.log('='.repeat(70));

// 1. Load source
const rawSource = fs.readFileSync(path.join(CALC_DIR, 'main.gs'), 'utf-8');
const logicSource = rawSource
  .split('\n')
  .filter(line => !/^\s*costumes\s+"/.test(line))
  .join('\n');
console.log(`\n源文件: ${path.join(CALC_DIR, 'main.gs')} (${rawSource.length} chars)`);

// 2. Compile
let sb3;
try {
  sb3 = compileSource(logicSource);
} catch (e) {
  console.error(`✗ 编译失败: ${e.message}\n${e.stack}`);
  process.exit(1);
}
fs.writeFileSync(path.join(OUT_DIR, 'calculator.sb3'), sb3);
ok(true, `编译成功 → build/calculator-out/calculator.sb3 (${sb3.length} bytes)`);

const pj = loadProject(sb3);
const sprites = pj.targets.filter(t => !t.isStage);
ok(pj.targets.length === 2 && sprites.length === 1,
   `目标数=2（Stage+1 角色），实际 ${pj.targets.length}`);

const sprite = sprites[0];

// 3. Semantic checks on compiled blocks
const hist = opcodeHistogram(pj);

ok((hist.sensing_askandwait || 0) === 3, 'ask 输入 ×3（sensing_askandwait=3）');
ok((hist.sensing_answer || 0) === 3, 'answer 读取 ×3（sensing_answer=3）');
ok((hist.control_forever || 0) === 1, '循环计算（control_forever=1）');
ok((hist.operator_add || 0) === 1, '加法分支（operator_add=1）');
ok((hist.operator_subtract || 0) === 1, '减法分支（operator_subtract=1）');
ok((hist.operator_multiply || 0) === 1, '乘法分支（operator_multiply=1）');
ok((hist.operator_divide || 0) === 1, '除法分支（operator_divide=1）');
ok((hist.operator_equals || 0) >= 5, '条件判断 ≥5（4 个运算符匹配 + 除零保护，实际 '
   + (hist.operator_equals || 0) + '）');
ok((hist.control_if_else || 0) >= 4, 'if/else 分支链 ≥4（实际 '
   + (hist.control_if_else || 0) + '）');
ok((hist.looks_say || 0) >= 7, 'say 反馈 ≥7（结果/错误提示，实际 '
   + (hist.looks_say || 0) + '）');
ok((hist.control_wait || 0) === 1, '每轮停顿 1 秒（control_wait=1）');

// Variables declared
const varNames = Object.values(sprite.variables || {}).map(v => v[0]).sort();
for (const need of ['a', 'b', 'op', 'result']) {
  ok(varNames.includes(need), `变量 "${need}" 已声明`);
}

// Division-by-zero guard: an if/else whose condition is `b == 0`, with the
// operator_divide inside its else-branch (SUBSTACK2 chain).
function condIsBEqZero(target, condBlock) {
  if (!condBlock || condBlock.opcode !== 'operator_equals') return false;
  const sides = [inputValue(target, condBlock, 'OPERAND1'), inputValue(target, condBlock, 'OPERAND2')];
  const isB = s => s && (
    (s.kind === 'primitive' && s.type === 12 && s.value === 'b')
    || (s.kind === 'block' && s.opcode === 'data_variable' && fieldOf(s.block, 'VARIABLE') === 'b'));
  const isZero = s => s && s.kind === 'primitive' && Number(s.value) === 0;
  return (isB(sides[0]) && isZero(sides[1])) || (isB(sides[1]) && isZero(sides[0]));
}

let divGuard = false;
for (const target of pj.targets) {
  for (const bid in target.blocks || {}) {
    const blk = target.blocks[bid];
    if (typeof blk !== 'object' || blk.opcode !== 'control_if_else') continue;
    const condRef = blk.inputs && blk.inputs.CONDITION ? blk.inputs.CONDITION[1] : null;
    const condBlock = typeof condRef === 'string' ? target.blocks[condRef] : null;
    if (!condIsBEqZero(target, condBlock)) continue;
    // Collect every block reachable from the else branch: statements link via
    // `next`, but expression blocks hang off `inputs`.
    const seen = new Set();
    const stack = [];
    const startRef = blk.inputs.SUBSTACK2 ? blk.inputs.SUBSTACK2[1] : null;
    if (typeof startRef === 'string') stack.push(startRef);
    while (stack.length > 0) {
      const id = stack.pop();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const cur = target.blocks[id];
      if (!cur || typeof cur !== 'object') continue;
      if (cur.opcode === 'operator_divide') divGuard = true;
      if (cur.next) stack.push(cur.next);
      for (const inp of Object.values(cur.inputs || {})) {
        for (const slot of inp.slice(1)) {
          if (typeof slot === 'string') stack.push(slot);
        }
      }
    }
  }
}
ok(divGuard, '除零保护: b == 0 的 else 分支中执行除法');

// Forever loop contains the whole interaction: walk down from control_forever SUBSTACK
let foreverHasAsk = false;
for (const target of pj.targets) {
  for (const bid in target.blocks || {}) {
    const blk = target.blocks[bid];
    if (typeof blk !== 'object' || blk.opcode !== 'control_forever') continue;
    let cur = blk.inputs && blk.inputs.SUBSTACK ? target.blocks[blk.inputs.SUBSTACK[1]] : null;
    while (cur) {
      if (cur.opcode === 'sensing_askandwait') foreverHasAsk = true;
      cur = cur.next ? target.blocks[cur.next] : null;
    }
  }
}
ok(foreverHasAsk, '循环计算: forever 循环体内包含 ask 交互链');

// 4. Decompile
const dec = sb3ToGoboscript(sb3);
fs.writeFileSync(path.join(OUT_DIR, 'calculator.decompiled.gs'), dec.source);
ok(true, `反编译成功 (${dec.source.length} chars) → calculator.decompiled.gs`);

// Decompiled source must preserve all four features
const dsrc = dec.source;
ok(/forever\s*\{/.test(dsrc), '反编译保留 forever');
ok((dsrc.match(/^\s*ask /gm) || []).length === 3, '反编译保留 ask ×3');
ok(/answer\(\)/.test(dsrc), '反编译保留 answer()');
ok(dsrc.includes('op == "+"') && dsrc.includes('op == "-"')
   && dsrc.includes('op == "*"') && dsrc.includes('op == "/"'),
   '反编译保留四则分支');
ok(/b\s*==\s*0/.test(dsrc), '反编译保留除零保护 b == 0');

// 5. Recompile & histogram compare
let sb3b;
try {
  sb3b = compileSource(dec.source);
} catch (e) {
  console.error(`✗ 重编译失败: ${e.message}\n${e.stack}`);
  process.exit(1);
}
fs.writeFileSync(path.join(OUT_DIR, 'calculator.recompiled.sb3'), sb3b);
ok(true, `重编译成功 (${sb3b.length} bytes) → calculator.recompiled.sb3`);

const histA = hist;
const histB = opcodeHistogram(loadProject(sb3b));
const diffs = [];
for (const op of new Set([...Object.keys(histA), ...Object.keys(histB)])) {
  const x = histA[op] || 0, y = histB[op] || 0;
  if (x !== y) diffs.push({ op, x, y });
}
if (diffs.length === 0) {
  ok(true, 'opcode 直方图对比: 完全一致 ✓');
} else {
  ok(false, `opcode 直方图差异 ${diffs.length} 处:`);
  for (const d of diffs) console.log(`      ${d.op}: ${d.x} -> ${d.y}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('计算器编译验收: 全部通过 ✓');
  process.exit(0);
} else {
  console.log(`计算器编译验收: ${failures} 项未通过 ✗`);
  process.exit(1);
}
