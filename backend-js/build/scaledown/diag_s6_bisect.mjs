// diag_s6_bisect.mjs — 前缀二分定位 code_S6.gs 的解析断点
import { compileSource } from '../../src/server.js';
import fs from 'fs';

const lines = fs.readFileSync('tmp_stress/code_S6.gs', 'utf8').split('\n');
let lo = 1, hi = lines.length, badAt = null;
while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  const src = lines.slice(0, mid).join('\n');
  try { compileSource(src); lo = mid + 1; }
  catch (e) {
    hi = mid - 1;
    if (!badAt || mid < badAt.line) badAt = { line: mid, msg: e.message.slice(0, 140) };
  }
}
console.log('first failing prefix ends near line:', badAt);
