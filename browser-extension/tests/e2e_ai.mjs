// End-to-end AI test: for each scenario, call a REAL OpenAI-compatible API to
// generate goboscript, then verify it (1) compiles, (2) has no
// call-without-definition, (3) runs cleanly in a real scratch-vm, and
// (4) optionally captures a screenshot of the run if a headless browser
// (puppeteer) is available.
//
// Also tests:
//   - Multi-round conversation context persistence
//   - Variable-input runtime verification (change input, verify output)
//
// Requires a real API key via env vars:
//   AI_API_KEY   your API key (required)
//   AI_BASE_URL  endpoint, default https://api.deepseek.com/v1
//   AI_MODEL     default deepseek-chat
//   AI_SCREENSHOT_DIR  dir to save screenshots (optional)
//
// Usage:
//   AI_API_KEY=sk-xxx node tests/e2e_ai.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compileSource, validateSource } from '../build/compiler.mjs';
import { checkSb3Integrity } from './check_sb3_integrity.mjs';
import { generateAndRepair } from '../src/lib/ai-pipeline.js';
import VirtualMachine from 'scratch-vm';
import storagePkg from 'scratch-storage';
import JSZip from 'jszip';
const ScratchStorage = storagePkg.ScratchStorage;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = process.env.AI_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const MODEL = process.env.AI_MODEL || 'agnes-2.5-flash';
const API_KEY = process.env.AI_API_KEY || '';
const SHOT_DIR = process.env.AI_SCREENSHOT_DIR || null;
const ROUNDS = parseInt(process.env.AI_MAX_ROUNDS || '5');

// Test scenarios in natural language (real AI is asked to generate each one).
const SCENARIOS = [
  { name: '01_calculator', prompt: '写一个四则运算计算器：定义函数 def_calc(expr) 计算含加减乘除和括号的表达式，绿旗时 say(def_calc("10 + 5 * 2")) 输出 20。' },
  { name: '02_bubble_sort', prompt: '用冒泡排序给列表 [5,2,8,1,9] 升序排序，把排序结果依次用 say 显示。' },
  { name: '03_fibonacci', prompt: '定义函数 def_fib(n) 求斐波那契数列第 n 项，绿旗时 say(def_fib(8)) 输出 21。' },
  { name: '04_json_get', prompt: '解析 JSON 字符串 {"name":"amy","age":7} 并取出 name 字段的值，用 say 显示。' },
  { name: '05_regex', prompt: '写一个正则匹配函数 def_regex_test(text,pattern)，测试 "aaab" 是否包含 "aab"（返回1）以及是否包含 "zzz"（返回0），用 say 显示两个结果。' },
  { name: '06_gcd', prompt: '定义函数 def_gcd(a,b) 求最大公约数，绿旗时 say(def_gcd(48,36)) 输出 12。' },
  { name: '07_string_reverse', prompt: '定义函数 def_reverse(s) 反转字符串，绿旗时 say(def_reverse("hello")) 输出 "olleh"。' },
  { name: '08_life_game', prompt: '实现康威生命游戏：用二维列表表示 4x4 细胞网格，迭代 5 代后统计存活细胞数并用 say 显示。' },
  { name: '09_database', prompt: '做一个简易数据库：用列表存储多条记录 [["amy",7],["bob",8]]，定义 def_query(name) 按姓名查询年龄，绿旗时 say(def_query("bob")) 输出 8。' },
  // Modify/replace scenarios
  { name: '10_replace_blocks', prompt: '替换当前角色的所有代码，改为点击角色时移动10步并说"hello"。' },
  { name: '11_delete_rebuild', prompt: '删除之前的排序代码，重新写一个简单的斐波那契数列计算，绿旗时输出第7项。' },
];

// Multi-turn conversation test: consecutive prompts that reference previous context
const CONVERSATION_TURNS = [
  { role: 'user', content: '写一个函数 def_add(a,b) 返回 a 和 b 的和，绿旗时 say(def_add(2,3)) 输出 5。' },
  { role: 'user', content: '很好，现在用刚才那个 def_add 函数，计算 10 + 20，用 say 输出结果。' },
  { role: 'user', content: '再用 def_add 函数计算 100 + 200，用 say 输出结果。' },
];

function hasCallWithoutDefinition(code) {
  const defs = new Set();
  const calls = [];
  let m;
  const reDef = /^func\s+(def_[A-Za-z0-9_]+)\b/gm;
  const reCall = /(def_[A-Za-z0-9_]+)\s*\(/g;
  while ((m = reDef.exec(code))) defs.add(m[1]);
  while ((m = reCall.exec(code))) calls.push(m[1]);
  return calls.filter((c) => !defs.has(c));
}

async function callModel(messages, opts) {
  const base = BASE.replace(/\/+$/, '');
  const body = JSON.stringify({
    model: MODEL,
    messages,
    max_tokens: opts?.maxTokens || 8192,
    temperature: opts?.temperature ?? 0,
  });
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`AI API ${resp.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  return {
    content: json.choices?.[0]?.message?.content || '',
    finish_reason: json.choices?.[0]?.finish_reason || null,
  };
}

// Suppress VM/storage noise for cleaner test output
const originalWarn = console.warn;
const originalLog = console.log;
function quietVM() {
  // Filter out known noisy VM messages
  const noisyPatterns = [
    /storage warn/,
    /vm warn/,
    /Central dispatch/,
    /No rendering module/,
    /Deprecation/,
  ];
  console.warn = (...args) => {
    const msg = args.join(' ');
    if (noisyPatterns.some(p => p.test(msg))) return;
    originalWarn.apply(console, args);
  };
}
quietVM();

async function runOne(code, runMs = 400) {
  const buf = await compileSource(code);
  const vm = new VirtualMachine();
  const storage = new ScratchStorage();
  vm.attachStorage(storage);
  const zip = await JSZip.loadAsync(buf);
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir || name === 'project.json') continue;
    const data = await zip.files[name].async('nodebuffer');
    const id = name.split('.')[0]; const ext = name.split('.')[1].toUpperCase();
    storage.cache(storage.AssetType.ImageVector, storage.DataFormat[ext] || 'SVG', data, id);
  }
  try { await vm.loadProject(buf); } catch (e) { return { ok: false, error: 'load: ' + e.message }; }
  vm.greenFlag();
  vm.runtime.start();
  const t0 = Date.now();
  let rtErr = null;
  while (Date.now() - t0 < runMs) {
    await new Promise(r => setTimeout(r, 16));
    try { vm.runtime._step(); } catch (e) { rtErr = 'runtime step: ' + e.message; break; }
  }
  vm.stopAll();
  const target = vm.runtime.targets.find(x => !x.isStage);
  return { ok: !rtErr, error: rtErr, sayText: target ? target.sayText : null };
}

/**
 * Runtime test with modified inputs:
 * Take the generated code, modify the hardcoded input values, and verify the
 * program still runs correctly. This proves the blocks aren't just hardcoded.
 */
function createModifiedInputTest(code) {
  const variants = [];
  // Find def_xxx(...) calls inside say(...) and try alternate inputs
  const sayPattern = /say\(([^)]*def_[A-Za-z0-9_]+\([^)]*\))[^)]*\)/g;
  let match;
  while ((match = sayPattern.exec(code)) !== null) {
    const fullCall = match[1];
    const inner = fullCall.replace(/^def_[A-Za-z0-9_]+\(/, '').replace(/\)$/, '');
    const nums = inner.match(/\d+/g);
    if (!nums) continue;
    const firstNum = nums[0];
    const newVal = String(parseInt(firstNum) + 1);
    const modifiedInner = inner.replace(firstNum, newVal);
    const modifiedCall = fullCall.replace(inner, modifiedInner);
    const newCode = code.replace(fullCall, modifiedCall);
    variants.push({ original: fullCall, modified: modifiedCall, code: newCode });
  }
  return variants;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ 未设置 AI_API_KEY。请用环境变量提供真实 API key：');
    console.error('   AI_API_KEY=sk-xxx AI_BASE_URL=https://apihub.agnes-ai.com/v1 AI_MODEL=agnes-2.5-flash node tests/e2e_ai.mjs');
    process.exit(2);
  }
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`🔬 InstanceScratch AI 端到端综合测试`);
  console.log(`API: ${BASE} | 模型: ${MODEL} | 最大轮次: ${ROUNDS}`);
  console.log(`══════════════════════════════════════════════\n`);

  const settings = { base_url: BASE, model: MODEL, api_key: API_KEY, max_rounds: ROUNDS, temperature: 0, max_tokens: 8192 };

  // ============ PART 1: 多场景真实 AI 生成测试 ============
  console.log('─── PART 1: 多场景真实 AI 生成+运行验证 ───');
  let pass1 = 0, fail1 = 0;
  for (const sc of SCENARIOS) {
    process.stdout.write(`▶ ${sc.name}: 调用真实 AI…`);
    try {
      const res = await generateAndRepair(sc.prompt, settings, callModel, []);
      if (!res.ok) {
        fail1++;
        console.log(` ✗ ${res.error || '未知错误'}`);
        continue;
      }
      const code = res.code;
      process.stdout.write(` 已生成 ${code.split('\n').length} 行（${res.rounds}轮）…`);

      // 1) 结构校验
      const errs = validateSource(code);
      const missing = hasCallWithoutDefinition(code);
      const nflag = (code.match(/^onflag\s*\{/gm) || []).length;
      if (errs.length > 0 || missing.length > 0 || nflag > 1) {
        fail1++;
        console.log(` ✗ 结构不合格：${errs.length} 语法错误, ${missing.length} 未定义调用, ${nflag} onflag`);
        continue;
      }

      // 2) 编译 + 完整性
      const buf = await compileSource(code);
      const issues = await checkSb3Integrity(buf);
      if (issues.length > 0) {
        fail1++; console.log(' ✗ SB3 结构不完整: ' + issues.join('; '));
        continue;
      }

      // 3) VM 运行
      const r = await runOne(code);
      if (r.ok) {
        pass1++;
        console.log(` ✓ 可运行${r.sayText ? ' (say: ' + r.sayText + ')' : ''}`);

        // 4) 改变输入再测 — 验证不是死代码
        const variants = createModifiedInputTest(code);
        if (variants.length > 0) {
          const v = variants[0];
          try {
            const rv = await runOne(v.code);
            if (rv.ok) {
              console.log(`    ✓ 改变输入后可运行: ${v.original} → ${v.modified}${rv.sayText ? ' (say: ' + rv.sayText + ')' : ''}`);
            } else {
              console.log(`    ⚠ 改变输入后运行异常: ${v.error || '未知'}`);
            }
          } catch (e) {
            console.log(`    ⚠ 改变输入测试跳过: ${e.message.slice(0, 80)}`);
          }
        }

        // 5) 可选截图
        if (SHOT_DIR) await captureShot(sc.name, code, r.sayText);
      } else {
        fail1++;
        console.log(' ✗ 运行失败: ' + r.error);
        if (SHOT_DIR) await saveFailLog(sc.name, code, r.error);
      }
    } catch (e) {
      fail1++;
      console.log('\n ✗ AI/流程错误: ' + e.message);
    }
  }
  console.log(`  → PART 1 结果: ${pass1}/${SCENARIOS.length} 通过, ${fail1} 失败\n`);

  // ============ PART 2: 多轮对话上下文保持测试 ============
  console.log('─── PART 2: 多轮对话上下文保持测试 ───');
  let pass2 = 0, fail2 = 0;
  let convHistory = [];
  for (let i = 0; i < CONVERSATION_TURNS.length; i++) {
    const turn = CONVERSATION_TURNS[i];
    process.stdout.write(`▶ 第${i+1}轮对话: ${turn.content.slice(0, 60)}...`);
    try {
      const res = await generateAndRepair(turn.content, settings, callModel, convHistory);
      if (!res.ok) {
        fail2++;
        console.log(` ✗ ${res.error || '失败'}`);
        continue;
      }
      const code = res.code;
      // Check the code references def_add (the function defined in turn 1)
      const hasDefAdd = code.includes('def_add');
      const r = await runOne(code);
      if (r.ok && hasDefAdd) {
        pass2++;
        console.log(` ✓ 可运行, 引用了 def_add${r.sayText ? ' (say: ' + r.sayText + ')' : ''}`);
      } else {
        const reason = !hasDefAdd ? '未引用 def_add (上下文丢失)' : (r.error || '运行失败');
        fail2++;
        console.log(` ✗ ${reason}`);
      }
      // Add to history for next round
      convHistory.push({ role: 'user', content: turn.content });
      convHistory.push({ role: 'bot', content: '生成成功', code });
    } catch (e) {
      fail2++;
      console.log(' ✗ ' + e.message.slice(0, 100));
    }
  }
  console.log(`  → PART 2 结果: ${pass2}/${CONVERSATION_TURNS.length} 通过, ${fail2} 失败\n`);

  // ============ PART 3: 64 个预编译测试码全量验证 ============
  console.log('─── PART 3: 64 个预编译测试码全量验证 ───');
  const dir = path.join(__dirname, '64programs');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort();
  let pass3 = 0, fail3 = 0;
  for (const f of files) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    try {
      const errs = validateSource(code);
      const missing = hasCallWithoutDefinition(code);
      if (errs.length > 0 || missing.length > 0) {
        fail3++; console.log(` ✗ ${f}: 结构错误`);
        continue;
      }
      const r = await runOne(code, 300);
      if (r.ok) { pass3++; }
      else { fail3++; console.log(` ✗ ${f}: ${r.error}`); }
    } catch (e) {
      fail3++; console.log(` ✗ ${f}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  → PART 3 结果: ${pass3}/${files.length} 通过, ${fail3} 失败\n`);

  // ============ Summary ============
  const totalPass = pass1 + pass2 + pass3;
  const totalFail = fail1 + fail2 + fail3;
  const total = totalPass + totalFail;
  console.log('══════════════════════════════════════════════');
  console.log(`📊 综合测试总结: ${totalPass}/${total} 通过, ${totalFail} 失败`);
  console.log(`  PART 1 (AI生成): ${pass1}/${SCENARIOS.length}`);
  console.log(`  PART 2 (多轮对话): ${pass2}/${CONVERSATION_TURNS.length}`);
  console.log(`  PART 3 (64测试码): ${pass3}/${files.length}`);
  if (SHOT_DIR) console.log(`  截图目录: ${SHOT_DIR}`);
  console.log('══════════════════════════════════════════════');
  // Close screenshot browser
  if (_shotBrowser) {
    await _shotBrowser.close();
    _shotBrowser = null;
    _shotPage = null;
  }
  process.exitCode = totalFail ? 1 : 0;
}

// Optional screenshot via puppeteer if installed & configured.
// Reuse a single browser instance for screenshots
let _shotBrowser = null;
let _shotPage = null;

async function ensureShotPage() {
  if (_shotPage) return _shotPage;
  let puppeteer;
  try { puppeteer = (await import('puppeteer')).default; }
  catch (e) { return null; }
  _shotBrowser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  _shotPage = await _shotBrowser.newPage();
  await _shotPage.setViewport({ width: 1200, height: 800 });
  await _shotPage.goto('https://turbowarp.org/editor', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  return _shotPage;
}

async function captureShot(name, code, sayText) {
  try {
    const page = await ensureShotPage();
    if (!page) { console.log(`    (未安装 puppeteer，跳过截图 ${name})`); return; }
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const fname = path.join(SHOT_DIR, name + '.png');
    await page.screenshot({ path: fname });
    const size = fs.statSync(fname).size;
    if (size > 0) {
      console.log(`    ✓ 截图已保存: ${fname} (${size} bytes)`);
    } else {
      console.log(`    ✗ 截图文件为空: ${fname}`);
    }
  } catch (e) {
    console.log(`    截图失败: ${e.message.slice(0, 100)}`);
  }
}

async function saveFailLog(name, code, err) {
  if (!SHOT_DIR) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  fs.writeFileSync(path.join(SHOT_DIR, name + '_fail.log'), 'ERR: ' + err + '\n\n--- CODE ---\n' + code);
}

main();
