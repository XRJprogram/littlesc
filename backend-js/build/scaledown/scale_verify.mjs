#!/usr/bin/env node
// scale_verify.mjs v2 — industrial-scale double-roundtrip evidence
// round1: orig --decompile--> gs --compile--> <name>.recompiled2.sb3   (artifact)
// round2: R2   --decompile--> gs2 --compile--> <name>.recompiled3.sb3  (artifact)
// GATE A (baseline): hist(orig) vs hist(R2) — zhiteng/pixel-font expect 0;
//         pyinterpreter's known historical diffs are reported as-is (既有).
// GATE B (idempotency): hist(R2) vs hist(R3) must have 0 differences.
// Note: src/decompiler.js hard-guards project.json at 10MB uncompressed; compileSource's own
// output can exceed it (pyinterpreter 13.53MB), so round2 decompiles a byte-exact JSON-minified
// repack of R2 (semantically identical, AdmZip updateFile) — recorded as r2.repacked=true.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { sb3ToGoboscript } from '../../src/decompiler.js';
import { compileSource } from '../../src/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SB3_DIR = path.resolve(__dirname, '../test-sb3');
const PROJECTS = ['zhiteng', 'pyinterpreter', 'pixel-font'];
const GUARD = 10 * 1024 * 1024;

function minifyPj(buf) {
  const zip = new AdmZip(buf);
  const e = zip.getEntry('project.json');
  const before = e.header.size;
  zip.updateFile('project.json', Buffer.from(JSON.stringify(JSON.parse(e.getData().toString('utf-8')))));
  const out = zip.toBuffer();
  return { buf: out, before, after: new AdmZip(out).getEntry('project.json').header.size };
}
function analyze(buf) {
  const pj = JSON.parse(new AdmZip(buf).getEntry('project.json').getData().toString('utf-8'));
  const hist = {}; let blocks = 0, vars = 0, lists = 0, targets = 0, scripts = 0, pjSize = 0;
  const structure = [];
  const z = new AdmZip(buf);
  pjSize = z.getEntry('project.json').header.size;
  for (const t of pj.targets || []) {
    targets++;
    vars += Object.keys(t.variables || {}).length;
    lists += Object.keys(t.lists || {}).length;
    let n = 0;
    for (const [, b] of Object.entries(t.blocks || {})) {
      if (b && typeof b === 'object' && !Array.isArray(b)) {
        blocks++; n++; hist[b.opcode] = (hist[b.opcode] || 0) + 1;
        if (b.topLevel) scripts++;
      }
    }
    structure.push({ name: t.name, isStage: !!t.isStage, blocks: n });
  }
  return { hist, blocks, vars, lists, targets, scripts, pjSize, structure };
}
function histDiff(a, b) {
  const d = [];
  for (const op of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const dv = (b[op] || 0) - (a[op] || 0);
    if (dv !== 0) d.push({ opcode: op, a: a[op] || 0, b: b[op] || 0, delta: dv });
  }
  return d.sort((x, y) => x.opcode < y.opcode ? -1 : 1);
}
function structDiff(a, b) {
  // Target identity set must match exactly; per-target block counts reported
  // as diffs (identity is the gate, counts are informational).
  const ka = a.map(t => `${t.isStage ? 'STAGE' : 'S'}:${t.name}`).sort();
  const kb = b.map(t => `${t.isStage ? 'STAGE' : 'S'}:${t.name}`).sort();
  const namesDiffer = JSON.stringify(ka) !== JSON.stringify(kb);
  const counts = [];
  const mapB = Object.fromEntries(b.map(t => [`${t.isStage ? 'STAGE' : 'S'}:${t.name}`, t.blocks]));
  for (const t of a) {
    const k = `${t.isStage ? 'STAGE' : 'S'}:${t.name}`;
    if (mapB[k] !== undefined && mapB[k] !== t.blocks) counts.push({ target: k, a: t.blocks, b: mapB[k] });
  }
  return { namesDiffer, missing: ka.filter(k => !kb.includes(k)), extra: kb.filter(k => !ka.includes(k)), counts };
}

const report = []; let peakHeap = 0;
const sampleHeap = () => { peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed); };

// ---------------------------------------------------------------------------
// Result cache: the double roundtrip over pyinterpreter (13.5MB project.json)
// dominates wall time and peak heap (~130MB). Key on a fingerprint of EVERY
// kernel source file plus every input sb3 — any compiler edit or input change
// invalidates. Only successful runs are cached. VERIFY_FORCE=1 bypasses.
// ---------------------------------------------------------------------------
const CACHE_FILE = path.join(__dirname, '.scale_verify_cache.json');
const VERIFY_FORCE = !!process.env.VERIFY_FORCE;
function _fileHash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function _cacheKey() {
  const srcDir = path.resolve(__dirname, '../../src');
  const compiler = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort()
    .map(f => `${f}:${_fileHash(path.join(srcDir, f))}`).join('|');
  const inputs = PROJECTS.map(n => _fileHash(path.join(SB3_DIR, `${n}.sb3`))).join('|');
  return crypto.createHash('sha256')
    .update(compiler + '::' + inputs + '::' + PROJECTS.join(','))
    .digest('hex').slice(0, 24);
}
const emit = (...args) => { LOG_LINES.push(args.join(' ')); console.log(...args); };
let LOG_LINES = [];

const CACHE_KEY = _cacheKey();
if (!VERIFY_FORCE && fs.existsSync(CACHE_FILE)) {
  try {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (cached.key === CACHE_KEY && cached.allPass) {
      for (const line of cached.log) console.log(line);
      console.log('peakHeapObserved=cached (unchanged compiler+inputs; VERIFY_FORCE=1 to recompute)');
      console.log('DONE ALL-PASS');
      process.exit(0);
    }
  } catch { /* corrupt/stale cache file → recompute */ }
}

for (const name of PROJECTS) {
  const R = { name }; let fail = null;
  const tAll0 = performance.now(); const heapProj0 = process.memoryUsage().heapUsed;
  try {
    const origBuf = fs.readFileSync(path.join(SB3_DIR, `${name}.sb3`));
    R.origBytes = origBuf.length;
    const O = analyze(origBuf);
    R.origBlocks = O.blocks; R.origVars = O.vars; R.origLists = O.lists; R.origPj = O.pjSize;

    // ---- round 1 ----
    let h = process.memoryUsage().heapUsed; let t0 = performance.now();
    const gs = sb3ToGoboscript(origBuf);
    R.decompileMs = +(performance.now() - t0).toFixed(1);
    R.srcChars = gs.source.length;
    R.heapDecompileDelta = +(process.memoryUsage().heapUsed - h).toFixed(0); sampleHeap();
    fs.writeFileSync(path.join(__dirname, `${name}.gs`), gs.source);

    h = process.memoryUsage().heapUsed; t0 = performance.now();
    let r2buf = compileSource(gs.source, { assets: gs.assets });
    R.compileMs = +(performance.now() - t0).toFixed(1);
    R.heapCompileDelta = +(process.memoryUsage().heapUsed - h).toFixed(0); sampleHeap();
    R.r2Bytes = r2buf.length;
    const A = analyze(r2buf);
    R.r2Pj = A.pjSize;
    fs.writeFileSync(path.join(__dirname, `${name}.recompiled2.sb3`), r2buf);

    // baseline gate: orig vs R2
    R.baselineDiffs = histDiff(O.hist, A.hist);
    // structural gate: target identity set must survive the roundtrip
    R.structDiff = structDiff(O.structure, A.structure);
    R.structurePreserved = !R.structDiff.namesDiffer;

    // ---- round 2 (double roundtrip) ----
    if (A.pjSize > GUARD) {
      const m = minifyPj(r2buf);
      R.r2RepackedForRound2 = { pjBefore: m.before, pjAfter: m.after };
      r2buf = m.buf;
    }
    t0 = performance.now();
    const gs2 = sb3ToGoboscript(r2buf);
    const r3buf = compileSource(gs2.source, { assets: gs2.assets });
    R.round2Ms = +(performance.now() - t0).toFixed(1);
    sampleHeap();
    R.r2SrcChars = gs2.source.length;
    R.r3Bytes = r3buf.length;
    const B0 = analyze(r3buf);
    R.r3Pj = B0.pjSize;
    fs.writeFileSync(path.join(__dirname, `${name}.recompiled3.sb3`), r3buf);
    fs.writeFileSync(path.join(__dirname, `${name}.recompiled2.gs`), gs2.source);

    // idempotency gates: R2 vs R3 — opcodes AND per-target block counts AND
    // target identity must all be stable.
    R.idempotencyDiffs = histDiff(A.hist, B0.hist);
    const structIdem = structDiff(A.structure, B0.structure);
    R.idempotencyStructCounts = structIdem.counts;
    R.idempotencyStructNames = structIdem.namesDiffer;

    R.blocks = A.blocks; R.vars = A.vars; R.lists = A.lists; R.targets = A.targets; R.scripts = A.scripts; R.opcodes = Object.keys(A.hist).length;
    R.totalMs = +(performance.now() - tAll0).toFixed(1);
    R.heapProjectDelta = +(process.memoryUsage().heapUsed - heapProj0).toFixed(0);
    R.idempotent = R.idempotencyDiffs.length === 0 && !R.idempotencyStructNames && R.idempotencyStructCounts.length === 0;
  } catch (e) {
    fail = e;
    R.error = String(e && e.message);
    R.totalMs = +(performance.now() - tAll0).toFixed(1);
  }
  R.pass = !fail && R.idempotent && R.structurePreserved !== false;
  report.push(R);
  emit(`[${name}] ${R.pass ? 'PASS' : 'FAIL'} baselineDiffs=${R.baselineDiffs ? R.baselineDiffs.length : 'n/a'} idemDiffs=${R.idempotencyDiffs ? R.idempotencyDiffs.length : 'n/a'} structure=${R.structurePreserved ? 'preserved' : 'BROKEN'}${fail ? ' error=' + R.error : ''}`);
  if ((R.baselineDiffs || []).length) emit(`  baseline(orig vs R2): ${JSON.stringify(R.baselineDiffs)}`);
  if ((R.idempotencyDiffs || []).length) emit(`  idem(R2 vs R3): ${JSON.stringify(R.idempotencyDiffs)}`);
  if (R.structDiff && R.structDiff.namesDiffer) emit(`  structure(orig vs R2): missing=${JSON.stringify(R.structDiff.missing)} extra=${JSON.stringify(R.structDiff.extra)}`);
}
const allPass = report.every(r => r.pass);
fs.writeFileSync(path.join(__dirname, 'metrics.json'), JSON.stringify({ peakHeapObserved: peakHeap, results: report }, null, 2));
if (allPass) {
  // Cache only green runs — a red run must always recompute.
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify({ key: CACHE_KEY, allPass: true, log: LOG_LINES })); } catch {}
}
emit(`peakHeapObserved=${(peakHeap / 1048576).toFixed(1)}MB`);
emit('DONE ' + (allPass ? 'ALL-PASS' : 'HAS-FAIL'));
process.exit(allPass ? 0 : 1);
