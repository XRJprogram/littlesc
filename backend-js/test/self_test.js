#!/usr/bin/env node
// self_test.js — 12-test self-test for InstanceScratch backend-js
// Ported from backend/self_test.py (1:1 alignment)
// Starts the server on a temp port, runs 12 tests, shuts down.

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = '18790';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_TIMEOUT = 15000;

// ── Helper: make an HTTP request ──────────────────────────────────
function makeRequest(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let bodyData = null;
    if (body !== null && body !== undefined) {
      if (Buffer.isBuffer(body)) {
        bodyData = body;
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/octet-stream';
        }
        options.headers['Content-Length'] = bodyData.length;
      } else {
        bodyData = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body), 'utf-8');
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
        options.headers['Content-Length'] = bodyData.length;
      }
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
          json() {
            return JSON.parse(this.body.toString('utf-8'));
          },
          text() {
            return this.body.toString('utf-8');
          },
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy(new Error('Request timeout'));
    });

    if (bodyData) req.write(bodyData);
    req.end();
  });
}

// ── Helper: wait for server to be ready ───────────────────────────
async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await makeRequest('GET', '/health');
      if (res.status === 200) return;
    } catch {
      // server not ready yet
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server did not become ready after ${maxRetries} retries`);
}

// ── Tests ─────────────────────────────────────────────────────────
const results = [];

async function runTests() {
  // ── Start server ────────────────────────────────────────────────
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  const proc = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT,
      MODEL_PROVIDER: 'mock',
      ALLOW_SERVER_KEY: 'false',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  proc.stdout.on('data', (data) => { serverOutput += data.toString(); });
  proc.stderr.on('data', (data) => { serverOutput += data.toString(); });

  try {
    await waitForServer();
    console.log('✓ Server started');

    // ── Test 1: /health ───────────────────────────────────────────
    try {
      const res = await makeRequest('GET', '/health');
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.status === 'ok', `Expected status=ok, got ${data.status}`);
      assert(data.goboscript_version !== undefined, 'Missing goboscript_version');
      console.log(`✓ /health: status=${data.status}, version=${data.goboscript_version}`);
      results.push(['health', true]);
    } catch (e) {
      console.log(`✗ /health failed: ${e.message}`);
      results.push(['health', false]);
    }

    // ── Test 2: /ai/chat (mock) ──────────────────────────────────
    let ai_goboscript = '';
    try {
      const res = await makeRequest('POST', '/ai/chat', {
        messages: [{ role: 'user', content: '让小猫移动10步' }],
      });
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.goboscript !== undefined, 'Missing goboscript field');
      assert(data.explanation !== undefined, 'Missing explanation field');
      ai_goboscript = data.goboscript;
      console.log(`✓ /ai/chat (mock): goboscript="${ai_goboscript.slice(0, 50)}..."`);
      results.push(['ai_chat_mock', true]);
    } catch (e) {
      console.log(`✗ /ai/chat (mock) failed: ${e.message}`);
      results.push(['ai_chat_mock', false]);
    }

    // ── Test 3: /compile ─────────────────────────────────────────
    let compiled_sb3 = null;
    let block_count = 0;
    try {
      const res = await makeRequest('POST', '/compile', {
        source: ai_goboscript || 'onflag { move(10); }',
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.headers['content-type']?.includes('application/octet-stream') ||
             res.headers['content-type']?.includes('application/zip') ||
             res.headers['content-type']?.includes('application/sb3'),
             `Unexpected content-type: ${res.headers['content-type']}`);
      compiled_sb3 = res.body;
      block_count = parseInt(res.headers['x-block-count'] || '0', 10);
      assert(block_count >= 2, `Expected >= 2 blocks, got ${block_count}`);
      console.log(`✓ /compile: ${compiled_sb3.length} bytes, ${block_count} blocks`);
      results.push(['compile', true]);
    } catch (e) {
      console.log(`✗ /compile failed: ${e.message}`);
      results.push(['compile', false]);
    }

    // ── Test 4: /compile result is a valid zip ───────────────────
    try {
      assert(compiled_sb3 !== null, 'No compiled SB3 from previous test');
      const zip = new AdmZip(compiled_sb3);
      const pjEntry = zip.getEntry('project.json');
      assert(pjEntry !== null, 'Missing project.json in SB3');
      const pj = JSON.parse(pjEntry.getData().toString('utf-8'));
      assert(pj.targets !== undefined, 'project.json has no targets');
      assert(pj.targets.length >= 2, `Expected >= 2 targets, got ${pj.targets.length}`);
      console.log(`✓ /compile result is valid SB3: ${pj.targets.length} targets`);
      results.push(['compile_valid_sb3', true]);
    } catch (e) {
      console.log(`✗ /compile valid SB3 check failed: ${e.message}`);
      results.push(['compile_valid_sb3', false]);
    }

    // ── Test 5: /decompile ───────────────────────────────────────
    try {
      assert(compiled_sb3 !== null, 'No compiled SB3 to decompile');
      const res = await makeRequest('POST', '/decompile', compiled_sb3, {
        'Content-Type': 'application/octet-stream',
      });
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.source !== undefined, 'Missing source field');
      assert(data.source.includes('onflag') || data.source.includes('move'),
             `Decompiled source doesn't contain expected content: ${data.source.slice(0, 100)}`);
      console.log(`✓ /decompile: ${data.source.length} chars, contains "onflag"/"move"`);
      results.push(['decompile', true]);
    } catch (e) {
      console.log(`✗ /decompile failed: ${e.message}`);
      results.push(['decompile', false]);
    }

    // ── Test 6: /ai/chat with project_context ────────────────────
    try {
      const res = await makeRequest('POST', '/ai/chat', {
        messages: [{ role: 'user', content: '画正方形' }],
        project_context: 'onflag event already exists',
      });
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.goboscript !== undefined, 'Missing goboscript');
      assert(data.goboscript.length > 0, 'Empty goboscript');
      console.log(`✓ /ai/chat (context): goboscript="${data.goboscript.slice(0, 50)}..."`);
      results.push(['ai_chat_context', true]);
    } catch (e) {
      console.log(`✗ /ai/chat (context) failed: ${e.message}`);
      results.push(['ai_chat_context', false]);
    }

    // ── Test 7: /validate (valid) ────────────────────────────────
    try {
      const res = await makeRequest('POST', '/validate', {
        source: 'onflag { move(10); }',
      });
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.success === true, `Expected success=true, got ${data.success}`);
      console.log(`✓ /validate (valid): success=${data.success}`);
      results.push(['validate_valid', true]);
    } catch (e) {
      console.log(`✗ /validate (valid) failed: ${e.message}`);
      results.push(['validate_valid', false]);
    }

    // ── Test 8: /validate (invalid) ──────────────────────────────
    try {
      const res = await makeRequest('POST', '/validate', {
        source: 'onflag { move(10) }', // missing semicolon — should error
      });
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.success === false, `Expected success=false, got ${data.success}`);
      assert(Array.isArray(data.errors) && data.errors.length > 0, 'Expected non-empty errors array');
      console.log(`✓ /validate (invalid): ${data.errors.length} errors`);
      results.push(['validate_invalid', true]);
    } catch (e) {
      console.log(`✗ /validate (invalid) failed: ${e.message}`);
      results.push(['validate_invalid', false]);
    }

    // ── Test 9: /schema ──────────────────────────────────────────
    try {
      const res = await makeRequest('GET', '/schema');
      const data = res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.keywords !== undefined, 'Missing keywords');
      assert(data.blocks !== undefined, 'Missing blocks');
      assert(Object.keys(data.keywords).length >= 30, `Expected >= 30 keywords, got ${Object.keys(data.keywords).length}`);
      assert(data.blocks.length >= 50, `Expected >= 50 blocks, got ${data.blocks.length}`);
      console.log(`✓ /schema: ${Object.keys(data.keywords).length} keywords, ${data.blocks.length} blocks`);
      results.push(['schema', true]);
    } catch (e) {
      console.log(`✗ /schema failed: ${e.message}`);
      results.push(['schema', false]);
    }

    // ── Test 10: /ai/chat bad role ───────────────────────────────
    // NOTE: role:'system' from clients is ALLOWED by design (the AI
    // self-repair loop posts its retry guidance as system messages; see
    // handleAiChat). Only truly invalid roles must be rejected with 422.
    try {
      const res = await makeRequest('POST', '/ai/chat', {
        messages: [{ role: 'tool', content: 'invalid role' }],
      });
      assert(res.status === 422, `Expected 422, got ${res.status}`);
      console.log(`✓ /ai/chat (bad role): rejected with ${res.status}`);
      results.push(['ai_chat_bad_role', true]);
    } catch (e) {
      console.log(`✗ /ai/chat (bad role) failed: ${e.message}`);
      results.push(['ai_chat_bad_role', false]);
    }

    // ── Test 11: /decompile empty body ───────────────────────────
    try {
      const res = await makeRequest('POST', '/decompile', Buffer.alloc(0), {
        'Content-Type': 'application/octet-stream',
      });
      assert(res.status === 422, `Expected 422, got ${res.status}`);
      console.log(`✓ /decompile (empty): rejected with ${res.status}`);
      results.push(['decompile_empty', true]);
    } catch (e) {
      console.log(`✗ /decompile (empty) failed: ${e.message}`);
      results.push(['decompile_empty', false]);
    }

    // ── Test 12: /ai/chat SSRF attempt ───────────────────────────
    try {
      const res = await makeRequest('POST', '/ai/chat', {
        messages: [{ role: 'user', content: 'test' }],
        api_key: 'test-key',
        base_url: 'http://169.254.169.254/latest/meta-data/',
        model: 'test-model',
      });
      assert(res.status === 422, `Expected 422, got ${res.status}`);
      console.log(`✓ /ai/chat (SSRF): rejected with ${res.status}`);
      results.push(['ai_chat_ssrf', true]);
    } catch (e) {
      console.log(`✗ /ai/chat (SSRF) failed: ${e.message}`);
      results.push(['ai_chat_ssrf', false]);
    }

    // ── Test 13: Multi-script top-level block coordinates ────────
    // Compiles a goboscript with 3 distinct event hats, unzips the
    // SB3, and asserts each top-level block has distinct, non-overlapping
    // (x, y) coordinates.
    try {
      const multiSource = [
        'onflag { move(10); }',
        'onkey "space" { say("hi", 2); }',
        'onclick { turn_right(15); }',
      ].join('\n');
      const res = await makeRequest('POST', '/compile', { source: multiSource });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const zip = new AdmZip(res.body);
      const pjEntry = zip.getEntry('project.json');
      assert(pjEntry !== null, 'Missing project.json');
      const pj = JSON.parse(pjEntry.getData().toString('utf-8'));

      // Collect all topLevel blocks across non-stage targets
      const topLevelBlocks = [];
      for (const target of pj.targets) {
        if (target.isStage) continue;
        for (const [bid, blk] of Object.entries(target.blocks || {})) {
          if (blk && typeof blk === 'object' && blk.topLevel) {
            topLevelBlocks.push({ id: bid, x: blk.x, y: blk.y, opcode: blk.opcode });
          }
        }
      }

      assert(topLevelBlocks.length >= 3,
        `Expected >= 3 top-level blocks, got ${topLevelBlocks.length}`);

      // Assert all (x, y) pairs are distinct
      const coords = topLevelBlocks.map(b => `${b.x},${b.y}`);
      const uniqueCoords = new Set(coords);
      assert(uniqueCoords.size === coords.length,
        `Duplicate coordinates found: ${JSON.stringify(topLevelBlocks)}`);

      // Assert minimum spacing (no overlap): each pair must differ by >= 100
      // in at least one axis (blocks are typically ~80px wide/tall)
      for (let i = 0; i < topLevelBlocks.length; i++) {
        for (let j = i + 1; j < topLevelBlocks.length; j++) {
          const dx = Math.abs(topLevelBlocks[i].x - topLevelBlocks[j].x);
          const dy = Math.abs(topLevelBlocks[i].y - topLevelBlocks[j].y);
          assert(dx >= 100 || dy >= 100,
            `Blocks ${i} and ${j} too close: dx=${dx}, dy=${dy}`);
        }
      }

      const coordStr = topLevelBlocks.map(b => `(${b.x}, ${b.y})`).join(', ');
      console.log(`✓ Multi-script coords: ${topLevelBlocks.length} blocks at ${coordStr}`);
      results.push(['multi_script_coords', true]);
    } catch (e) {
      console.log(`✗ Multi-script coords failed: ${e.message}`);
      results.push(['multi_script_coords', false]);
    }

  } finally {
    // ── Shutdown ────────────────────────────────────────────────
    proc.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 500));
    console.log('\n✓ Server shut down');
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  let passed = 0;
  for (const [name, ok] of results) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}`);
    if (ok) passed++;
  }
  const total = results.length;
  console.log(`\n${passed}/${total} tests passed`);
  if (passed === total) {
    console.log('ALL TESTS PASSED ✓');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED ✗');
    process.exit(1);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

runTests().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
