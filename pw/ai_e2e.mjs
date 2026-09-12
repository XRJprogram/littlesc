import { chromium } from 'playwright';
import fs from 'fs';

const ART = '/workspace/pw/artifacts';
const BASE = 'http://127.0.0.1:8601/';
fs.mkdirSync(ART, { recursive: true });

const SCENARIOS = [
  {
    id: 'calc', name: '四则运算计算器',
    turns: [
      '写一个四则运算计算器，包含词法分析、语法分析、求值三个阶段，全部包装成为函数',
      '把入口改成用 ask 读取表达式，并且 say 的时候加上「结果=」前缀'
    ]
  },
  {
    id: 'json', name: 'JSON 解析',
    turns: [
      '写一个 JSON 解析，包装成为函数',
      '再加一个函数，支持取嵌套对象和数组下标，比如 a.b[0].c'
    ]
  },
  {
    id: 'regex', name: '正则匹配',
    turns: [
      '写一个正则匹配，包装成为函数，支持 * 和 . 和 ^，全部用自制积木包装',
      '再加一个 + 量词的支持：匹配前一个字符一次或多次',
    ]
  },
];

const arg = (k, d) => {
  const hit = process.argv.find(a => a.startsWith(`--${k}=`));
  return hit ? hit.split('=')[1] : d;
};
const ONLY = arg('only', '');
const MAX_TURNS = parseInt(arg('turns', '99'), 10);

const blockCount = page => page.evaluate(() =>
  document.querySelectorAll('.blocklyDraggable').length);

async function sendTurn (page, text) {
  await page.fill('textarea[class*="ai-chat-textarea"]', text);
  await page.click('button[title="发送"]');
  await page.waitForSelector('button[title="停止生成"]', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('button[title="停止生成"]', { state: 'detached', timeout: 420000 });
  await page.waitForTimeout(2500);
}

async function main () {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', m => {
    if (m.type() === 'error') problems.push('CONSOLE: ' + m.text().slice(0, 200));
  });
  page.on('pageerror', e => problems.push('PAGEERROR: ' + e.message.slice(0, 200)));

  const report = [];
  for (const sc of (ONLY ? SCENARIOS.filter(s => s.id === ONLY) : SCENARIOS)) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea[class*="ai-chat-textarea"]', { timeout: 180000 });
    await page.waitForTimeout(6000);
    const before = await blockCount(page);
    const entry = { id: sc.id, name: sc.name, turns: [] };
    for (let i = 0; i < Math.min(sc.turns.length, MAX_TURNS); i++) {
      const t0 = Date.now();
      try {
        await sendTurn(page, sc.turns[i]);
      } catch (e) {
        entry.turns.push({ n: i + 1, error: String(e.message).slice(0, 160) });
        problems.push(sc.id + ' turn' + (i + 1) + ': ' + String(e.message).slice(0, 160));
        await page.screenshot({ path: `${ART}/${sc.id}-turn${i + 1}-ERROR.png` });
        continue;
      }
      const after = await blockCount(page);
      const shot = `${sc.id}-turn${i + 1}.png`;
      await page.screenshot({ path: `${ART}/${shot}` });
      entry.turns.push({
        n: i + 1,
        prompt: sc.turns[i],
        blocksBefore: before, blocksAfter: after,
        seconds: ((Date.now() - t0) / 1000).toFixed(1),
        shot
      });
      console.log(`[${sc.id}] turn${i + 1}: blocks ${before} -> ${after}  (${entry.turns[entry.turns.length - 1].seconds}s)  shot=${shot}`);
    }
    report.push(entry);
  }
  await page.screenshot({ path: `${ART}/99-收尾.png` });
  await browser.close();

  fs.writeFileSync(`${ART}/report.json`, JSON.stringify({ report, problems }, null, 2));
  console.log('\n=== 页面问题 ===');
  console.log(problems.length ? problems.join('\n') : '(无)');
}

main().catch(e => {
  console.error('FATAL', e.message);
  process.exit(1);
});