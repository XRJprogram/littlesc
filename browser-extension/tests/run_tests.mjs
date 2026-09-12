// Test runner: validates all 64 goboscript test programs.
// Ensures each: (1) compiles, (2) has no call-without-definition,
// (3) has at most one onflag block. Reports pass/fail.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compileSource, validateSource } from '../build/compiler.mjs';
import { checkSb3Integrity } from './check_sb3_integrity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '64programs');

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

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.gs')).sort();
let pass = 0, fail = 0;
const fails = [];
for (const f of files) {
  const code = fs.readFileSync(path.join(dir, f), 'utf8');
  const errs = validateSource(code);
  const missing = hasCallWithoutDefinition(code);
  const nflag = (code.match(/^onflag\s*\{/gm) || []).length;
  let ok = errs.length === 0 && missing.length === 0 && nflag <= 1;
  if (ok) {
    try {
      const buf = await compileSource(code);
      if (!(new Uint8Array(buf)[0] === 0x50)) ok = false;
      else {
        const issues = await checkSb3Integrity(buf);
        if (issues.length > 0) { ok = false; errs.push({ message: 'SB3 结构不完整: ' + issues.join('; ') }); }
      }
    } catch (e) {
      ok = false;
      errs.push({ message: 'compile: ' + e.message });
    }
  }
  if (ok) { pass++; console.log('  ✓', f); }
  else {
    fail++;
    fails.push({ file: f, errs, missing, nflag });
    console.log('  ✗', f, errs.length ? errs.map(e=>`L${e.line}:${e.message}`).join('; ') : (missing.length?('missing '+missing):'nflag='+nflag));
  }
}
console.log(`\n== ${pass}/${files.length} passed, ${fail} failed ==`);
if (fails.length) process.exitCode = 1;
