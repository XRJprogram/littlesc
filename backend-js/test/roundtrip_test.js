#!/usr/bin/env node
// roundtrip_test.js — Real SB3 decompile → recompile → compare pipeline
// Tests 3 real Scratch projects to find decompiler/codegen bugs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

import { sb3ToGoboscript } from '../src/decompiler.js';
import { compileSource } from '../src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SB3_DIR = path.join(__dirname, '..', 'build', 'test-sb3');

// Large projects carry thousands of generated variable names; keep warnings readable.
const namePreview = (names, max = 12) =>
  names.length > max ? `${names.slice(0, max).join(',')},...(+${names.length - max} more)` : names.join(',');
const OUT_DIR = path.join(__dirname, '..', 'build', 'roundtrip-out');

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Block structure extraction & comparison
// ---------------------------------------------------------------------------

function extractBlockStructure(sb3Buffer) {
  const zip = new AdmZip(sb3Buffer);
  const pjEntry = zip.getEntry('project.json');
  if (!pjEntry) throw new Error('Missing project.json');
  const pj = JSON.parse(pjEntry.getData().toString('utf-8'));

  const result = {
    targets: [],
    broadcasts: pj.broadcasts || {},
  };

  for (const target of (pj.targets || [])) {
    const t = {
      name: target.name,
      isStage: target.isStage,
      variables: {},
      lists: {},
      blocks: [],
      blockCount: 0,
    };
    for (const [vid, vinfo] of Object.entries(target.variables || {})) {
      t.variables[vinfo[0]] = vinfo.slice(1);
    }
    for (const [lid, linfo] of Object.entries(target.lists || {})) {
      t.lists[linfo[0]] = linfo.slice(1);
    }
    for (const [bid, blk] of Object.entries(target.blocks || {})) {
      if (typeof blk === 'object' && !Array.isArray(blk)) {
        t.blocks.push({
          id: bid,
          opcode: blk.opcode,
          parent: blk.parent,
          next: blk.next,
          topLevel: blk.topLevel,
          inputs: blk.inputs ? Object.keys(blk.inputs).sort() : [],
          fields: blk.fields ? Object.fromEntries(
            Object.entries(blk.fields).map(([k, v]) => [k, v[0]])
          ) : {},
          mutation: blk.mutation ? {
            proccode: blk.mutation.proccode,
            argumentids: blk.mutation.argumentids,
            warp: blk.mutation.warp,
          } : null,
        });
        t.blockCount++;
      }
    }
    // Sort blocks by a canonical key for comparison
    t.blocks.sort((a, b) => {
      // Canonical: opcode + field values
      const ka = a.opcode + JSON.stringify(a.fields) + JSON.stringify(a.mutation || {});
      const kb = b.opcode + JSON.stringify(b.fields) + JSON.stringify(b.mutation || {});
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    result.targets.push(t);
  }
  return result;
}

function opcodeHistogram(structure) {
  const hist = {};
  for (const target of structure.targets) {
    for (const blk of target.blocks) {
      hist[blk.opcode] = (hist[blk.opcode] || 0) + 1;
    }
  }
  return hist;
}

function compareHistograms(origHist, recompiledHist) {
  const allOpcodes = new Set([...Object.keys(origHist), ...Object.keys(recompiledHist)]);
  const diffs = [];
  for (const op of allOpcodes) {
    const a = origHist[op] || 0;
    const b = recompiledHist[op] || 0;
    if (a !== b) {
      diffs.push({ opcode: op, original: a, recompiled: b, delta: b - a });
    }
  }
  return diffs;
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------

const TEST_FILES = ['pyinterpreter.sb3', 'zhiteng.sb3', 'pixel-font.sb3'];
const results = [];

console.log('='.repeat(70));
console.log('REAL SB3 ROUND-TRIP TEST: decompile → recompile → compare');
console.log('='.repeat(70));

for (const sb3File of TEST_FILES) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Testing: ${sb3File}`);
  console.log('─'.repeat(70));

  const result = { name: sb3File, passed: false, errors: [], warnings: [], diffs: [] };

  // 1. Read original SB3
  const sb3Path = path.join(SB3_DIR, sb3File);
  const origSb3 = fs.readFileSync(sb3Path);
  console.log(`  Original SB3: ${origSb3.length} bytes`);

  // 2. Extract original block structure
  let origStruct;
  try {
    origStruct = extractBlockStructure(origSb3);
  } catch (e) {
    result.errors.push(`Failed to extract original structure: ${e.message}`);
    console.log(`  ✗ Failed to extract original structure: ${e.message}`);
    results.push(result);
    continue;
  }

  const origHist = opcodeHistogram(origStruct);
  const origBlockCount = origStruct.targets.reduce((s, t) => s + t.blockCount, 0);
  console.log(`  Original: ${origStruct.targets.length} targets, ${origBlockCount} blocks`);
  for (const t of origStruct.targets) {
    const varCount = Object.keys(t.variables).length;
    const listCount = Object.keys(t.lists).length;
    console.log(`    ${t.isStage ? '_STAGE_' : t.name}: ${t.blockCount} blocks, ${varCount} vars, ${listCount} lists`);
  }
  console.log(`  Original opcode histogram:`);
  for (const [op, count] of Object.entries(origHist).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${op}: ${count}`);
  }

  // 3. Decompile
  let decompiled;
  try {
    decompiled = sb3ToGoboscript(origSb3);
  } catch (e) {
    result.errors.push(`Decompile failed: ${e.message}`);
    console.log(`  ✗ Decompile failed: ${e.message}`);
    results.push(result);
    continue;
  }
  console.log(`  Decompiled source length: ${decompiled.source.length} chars`);
  // Save decompiled source
  const srcPath = path.join(OUT_DIR, sb3File.replace('.sb3', '.gs'));
  fs.writeFileSync(srcPath, decompiled.source);
  console.log(`  Saved decompiled source to: ${srcPath}`);

  // Print first 500 chars of decompiled source
  console.log(`  --- Decompiled source (first 500 chars) ---`);
  console.log(decompiled.source.slice(0, 500));
  console.log(`  --- end preview ---`);

  // 4. Recompile
  let recompiledSb3;
  try {
    recompiledSb3 = compileSource(decompiled.source);
  } catch (e) {
    result.errors.push(`Recompile failed: ${e.message}`);
    console.log(`  ✗ Recompile failed: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    results.push(result);
    continue;
  }
  console.log(`  Recompiled SB3: ${recompiledSb3.length} bytes`);

  // Save recompiled SB3
  const outSb3Path = path.join(OUT_DIR, sb3File.replace('.sb3', '.recompiled.sb3'));
  fs.writeFileSync(outSb3Path, recompiledSb3);

  // 5. Compare block structures
  let recompStruct;
  try {
    recompStruct = extractBlockStructure(recompiledSb3);
  } catch (e) {
    result.errors.push(`Failed to extract recompiled structure: ${e.message}`);
    console.log(`  ✗ Failed to extract recompiled structure: ${e.message}`);
    results.push(result);
    continue;
  }

  const recompHist = opcodeHistogram(recompStruct);
  const recompBlockCount = recompStruct.targets.reduce((s, t) => s + t.blockCount, 0);
  console.log(`  Recompiled: ${recompStruct.targets.length} targets, ${recompBlockCount} blocks`);

  const diffs = compareHistograms(origHist, recompHist);
  result.diffs = diffs;

  if (diffs.length === 0) {
    console.log(`  ✓ Block opcode histogram: PERFECT MATCH`);
    result.passed = true;
  } else {
    console.log(`  ✗ Block opcode histogram differences (${diffs.length}):`);
    for (const d of diffs) {
      const sign = d.delta > 0 ? '+' : '';
      console.log(`    ${d.opcode}: original=${d.original}, recompiled=${d.recompiled} (${sign}${d.delta})`);
    }
    result.passed = false;
  }

  // Also compare variable/list names
  for (let i = 0; i < Math.min(origStruct.targets.length, recompStruct.targets.length); i++) {
    const origT = origStruct.targets[i];
    const recompT = recompStruct.targets[i];
    const origVars = Object.keys(origT.variables).sort();
    const recompVars = Object.keys(recompT.variables).sort();
    if (JSON.stringify(origVars) !== JSON.stringify(recompVars)) {
      result.warnings.push(`Target "${origT.name}" variable names differ: orig=[${namePreview(origVars)}] recomp=[${namePreview(recompVars)}]`);
    }
    const origLists = Object.keys(origT.lists).sort();
    const recompLists = Object.keys(recompT.lists).sort();
    if (JSON.stringify(origLists) !== JSON.stringify(recompLists)) {
      result.warnings.push(`Target "${origT.name}" list names differ: orig=[${namePreview(origLists)}] recomp=[${namePreview(recompLists)}]`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`  Warnings:`);
    for (const w of result.warnings) {
      console.log(`    ⚠ ${w}`);
    }
  }

  results.push(result);
}

// ── Summary ─────────────────────────────────────────────────────
console.log(`\n${'='.repeat(70)}`);
console.log('SUMMARY');
console.log('='.repeat(70));
let passCount = 0;
for (const r of results) {
  const status = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${status} ${r.name}: ${r.errors.length} errors, ${r.diffs.length} opcode diffs, ${r.warnings.length} warnings`);
  if (r.passed) passCount++;
}
console.log(`\n${passCount}/${results.length} round-trips passed`);
if (passCount === results.length) {
  console.log('ALL ROUND-TRIP TESTS PASSED ✓');
  process.exit(0);
} else {
  console.log('SOME ROUND-TRIP TESTS FAILED ✗');
  process.exit(1);
}
