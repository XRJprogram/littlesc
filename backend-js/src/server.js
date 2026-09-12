// server.js — Pure Node.js HTTP backend for InstanceScratch
// Ported from backend/main.py (1:1 alignment)
// 6 endpoints: /health /compile /validate /decompile /ai/chat /schema
// Security: CORS, SB3 bomb protection, SSRF prevention, smart mock, 50MB limit

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { URL, fileURLToPath } from 'url';
import dns from 'dns/promises';
import net from 'net';
import AdmZip from 'adm-zip';

import { lex, Lexer, LexError, TokenType, KEYWORDS } from './lexer.js';
import { parseAiResponse } from './ai_response.js';
import { parse, Parser, ParseError } from './parser.js';
import { preprocess, PreProcessorError } from './preprocessor.js';
import { visitProjectPass0, visitProjectPass1, visitProjectPass2, visitProjectDCE } from './visitor.js';
import { CodeGen } from './codegen.js';
import { Config, parseConfig } from './config.js';
import { Sprite, Project, Diagnostic } from './ast_nodes.js';
import * as gs_blocks from './blocks.js';
import { sb3ToScratchblocks as sb3_to_scratchblocks } from './sb3_parser.js';
import { sb3ToGoboscript as sb3_to_goboscript } from './decompiler.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOBOSCRIPT_VERSION = '1.0.0-js';
const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB
const SB3_MAX_TOTAL_UNCOMPRESSED = 100 * 1024 * 1024; // 100MB
const SB3_MAX_PROJECT_JSON = 10 * 1024 * 1024; // 10MB
const SB3_MAX_ENTRIES = 1000;
const AI_MOCK_GOBOSCRIPT = 'onflag { move(10); }';
const AI_MOCK_EXPLANATION = '示例：绿旗点击后移动 10 步（mock 回退，未接真实模型）';
// Single-message cap. The AI self-repair flow echoes the FULL generated
// source back as an assistant message before asking for corrections; large
// projects routinely exceed 32k chars and were bounced with 422, killing
// the repair loop for exactly the scenarios that need it most.
const AI_MAX_MESSAGE_LENGTH = 262144;

// Default asset SVGs (embedded so the server is self-contained)
const _SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const _ASSETS_DIR = path.join(_SERVER_DIR, '..', 'assets');
const DEFAULT_BACKDROP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>`;

function _readAsset(filename) {
  try {
    return fs.readFileSync(path.join(_ASSETS_DIR, filename), 'utf-8');
  } catch {
    return DEFAULT_BACKDROP_SVG;
  }
}

const DANGO_CAT_SVG = _readAsset('dango-cat.svg');
const BACKDROP_SVG = _readAsset('cd21514d0531fdffb22204e0ec5ed84a.svg');

const GOBOSCRIPT_TOML = `no_miscellaneous_limits = false
no_sprite_fencing = false
frame_interpolation = false
high_quality_pen = false
`;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const _envOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const _corsOrigins = _envOrigins.length > 0 ? _envOrigins : [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function _setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', _corsOrigins[0] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Expose custom header so cross-origin deployments can read it
  res.setHeader('Access-Control-Expose-Headers', 'X-Block-Count');
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function _sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': _corsOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // Expose custom header so cross-origin deployments can read it
    'Access-Control-Expose-Headers': 'X-Block-Count',
  });
  res.end(body);
}

function _readBody(req, maxSize = MAX_BODY_SIZE) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

async function _readJsonBody(req, maxSize = MAX_BODY_SIZE) {
  const body = await _readBody(req, maxSize);
  const text = body.toString('utf-8');
  if (!text.trim()) {
    throw new Error('Empty request body');
  }
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Source validation helpers
// ---------------------------------------------------------------------------

function _offsetToLineCol(source, offset) {
  if (offset < 0) return [1, 1];
  let line = 1, col = 1;
  for (let i = 0; i < source.length; i++) {
    if (i >= offset) break;
    if (source[i] === '\n') { line++; col = 1; }
    else col++;
  }
  return [line, col];
}

// Human-readable (and AI-actionable) wording for non-fatal parser
// diagnostics, which carry only a kind and a source span.
const _DIAGNOSTIC_MESSAGES = {
  VariableRedefinition: '重复声明：该名字此前已声明过。变量用 `var 名 = 值;` 只能声明一次，' +
    '之后再赋值请直接写 `名 = 值;`；列表用 `list 名;` 声明，且不能与变量同名。',
  FixedLengthListInvalid: '列表固定长度写法无效：`list 名 = [默认值; 个数]` 的个数必须是正整数常量。',
};

function _validateSource(source) {
  source = _sanitizeSource(source);
  const errors = [];
  // 1. Lex
  let tokens;
  try {
    tokens = lex(source);
  } catch (e) {
    if (e instanceof LexError) {
      const [line, col] = _offsetToLineCol(source, e.offset);
      errors.push({ line, column: col, message: e.message, kind: 'LexError' });
      return errors;
    }
    throw e;
  }
  // 1.5 Preprocess: expand %define/%undef/STRINGIFY/CONCAT macros on the
  // token stream (upstream: PreProcessor::apply before parsing).
  try {
    tokens = preprocess(tokens);
  } catch (e) {
    if (e instanceof PreProcessorError) {
      const [line, col] = _offsetToLineCol(source, e.span ? e.span[0] : 0);
      errors.push({ line, column: col, message: e.message, kind: e.kind });
      return errors;
    }
    throw e;
  }
  // 1.8 Naming convention: func/proc definitions MUST carry the def_ name
  // prefix so they can never collide with reserved words (add/to/delete/
  // insert/at/as are statement keywords). Surfaced through /validate so the
  // AI self-repair loop sees an actionable rename hint.
  {
    const isNoise = (t) => /Whitespace|Newline|Comment/i.test(String(t.type));
    let namingErrors = 0;
    for (let i = 0; i < tokens.length - 1 && namingErrors < 5; i++) {
      const t = tokens[i];
      if (t.type !== TokenType.Func && t.type !== TokenType.Proc) continue;
      let j = i + 1;
      while (j < tokens.length && isNoise(tokens[j])) j++;
      const nameTok = tokens[j];
      if (!nameTok) continue;
      // Accept plain Name tokens AND keywords sitting in the name slot
      // (e.g. `func add(` lexes `add` as TokenType.Add, not Name) — the
      // latter is exactly the reserved-word collision we must diagnose.
      // Keyword tokens carry value=null — recover the spelling from the
      // source span so `func add(` yields 'add'.
      const raw = source.slice(nameTok.start || 0, nameTok.end || 0);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) continue;
      const isNameTok = nameTok.type === TokenType.Name;
      const isKwSlot = !isNameTok &&
        Object.prototype.hasOwnProperty.call(KEYWORDS, raw);
      if (!isNameTok && !isKwSlot) continue;
      if (/^def_/.test(raw)) continue;
      const [ln, cl] = _offsetToLineCol(source, nameTok.start || 0);
      errors.push({
        line: ln,
        column: cl,
        message: '函数名必须以 def 开头（保留字保护）：' + raw +
          ' → def_' + raw,
        kind: 'NamingError',
      });
      namingErrors++;
    }
  }
  // 2. Parse
  const parser = new Parser(tokens);
  parser.skipNoise();
  while (!parser.isAtEnd()) {
    try {
      parser.declaration();
    } catch (e) {
      if (e instanceof ParseError) {
        const [line, col] = _offsetToLineCol(source, e.pos);
        errors.push({ line, column: col, message: e.message, kind: 'ParseError' });
        // Body errors are fatal in the compile path too (Parser.parse
        // rethrows them): stop collecting here so /validate reports the
        // SAME single error /compile fails with, instead of cascading
        // phantom errors from recovery mis-syncing mid-body.
        if (e.inBody) break;
        parser.skipToNextStatement();
        parser.skipNoise();
        continue;
      }
      throw e;
    }
    parser.skipNoise();
  }
  // 2b. Non-fatal parser diagnostics. These never throw — addVar()/addList()
  // push them onto parser.diagnostics — so without this pass they were
  // silently dropped and redefinitions validated as clean.
  for (const d of (parser.diagnostics || [])) {
    const start = d.span ? d.span[0] : 0;
    const end = d.span && d.span.length > 1 ? d.span[1] : start;
    const [line, col] = _offsetToLineCol(source, start);
    const snippet = end > start ? source.slice(start, end).trim() : '';
    const base = _DIAGNOSTIC_MESSAGES[d.kind] || ('编译诊断：' + d.kind);
    errors.push({
      line,
      column: col,
      message: snippet ? `${base}（出错位置：${snippet}）` : base,
      kind: d.kind || 'Diagnostic',
    });
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Compile flow
// ---------------------------------------------------------------------------

// Map a ParseError raised against the augmented sprite source back onto
// user-source coordinates (compileSource prepends a costumes declaration).
function _toUserSourceParseError(userSource, prefixLen, e) {
  const off = Math.max(0, (e.pos || 0) - prefixLen);
  const [line, col] = _offsetToLineCol(userSource, off);
  const err = new Error(`L${line}:${col} ${e.message}`);
  err.line = line;
  err.column = col;
  return err;
}

function _spriteHasContent(s) {
  return (s.costumes.length > 0 || s.sounds.length > 0 ||
    Object.keys(s.vars).length > 0 || Object.keys(s.lists).length > 0 ||
    s.events.length > 0 || Object.keys(s.procs).length > 0 ||
    Object.keys(s.funcs).length > 0 || s.orphanChains.length > 0 ||
    Object.keys(s.enums).length > 0 || Object.keys(s.structs).length > 0);
}

// Strip C0 control characters (except \t \n \r) and DEL — models occasionally
// emit stray NUL/escape bytes that the lexer would reject as "unexpected
// character". Purely defensive: valid sources are byte-identical after this.
function _sanitizeSource(src) {
  return src.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function compileSource(userSource, opts = {}) {
  userSource = _sanitizeSource(userSource);
  // Stage: minimal — just the default backdrop costume
  const stageSource = `costumes "cd21514d0531fdffb22204e0ec5ed84a.svg";\n`;
  // No synthetic prefix: makeSb3 seeds missing per-target costumes, and a
  // zero prefix keeps parse-error offsets equal to user-source offsets.
  const prefix = '';
  const suffix = userSource.endsWith('\n') ? '' : '\n';
  const spriteSource = prefix + userSource + suffix;

  // Parse stage
  const stageTokens = preprocess(lex(stageSource));
  const stageSprite = parse(stageTokens);

  // Parse sprite1 (macros expanded on the token stream before parsing)
  let sprite1;
  try {
    sprite1 = parse(preprocess(lex(spriteSource)));
  } catch (e) {
    if (e instanceof ParseError) throw _toUserSourceParseError(userSource, prefix.length, e);
    throw e;
  }

  // Fatal guard: the parser's top-level recovery loop records skipped
  // statements as ParseError diagnostics instead of aborting. Emitting an
  // sb3 anyway would silently DROP those declarations/events (the AI
  // self-repair loop then saw "compiled OK" with few/zero blocks and no
  // error to react to). Surface them with user-source line numbers.
  const dropped = (sprite1.diagnostics || []).filter(d => d.kind === 'ParseError');
  if (dropped.length > 0) {
    const firstSpan = dropped[0].span || [];
    const off = Math.max(0, (typeof firstSpan[0] === 'number' ? firstSpan[0] : 0) - prefix.length);
    const [line, col] = _offsetToLineCol(userSource, off);
    const firstReason = dropped[0].message ? `：${dropped[0].message}` : '';
    const err = new Error(
      `L${line}:${col} 语法错误，该语句已被跳过（共 ${dropped.length} 处），项目不完整；请修复后重新编译${firstReason}`);
    err.line = line;
    err.column = col;
    err.errorCount = dropped.length;
    err.firstReason = dropped[0].message || null;
    throw err;
  }

  // Multi-target sections (`target ...;` directives — see Parser). Without
  // directives this reduces to the historical single-Sprite1 project.
  const extras = sprite1._extraTargets || [];
  const spritesMap = {};
  if (_spriteHasContent(sprite1) || extras.length === 0) {
    spritesMap[sprite1.name || 'Sprite1'] = sprite1;
  }
  let projectStage = stageSprite;
  for (const ext of extras) {
    ext.sprite.name = ext.isStage ? 'Stage' : ext.name;
    if (ext.isStage) {
      projectStage = ext.sprite;
    } else {
      spritesMap[ext.name] = ext.sprite;
    }
  }
  if (Object.keys(spritesMap).length === 0) {
    spritesMap['Sprite1'] = sprite1;
  }

  // Create project
  const project = new Project(projectStage, spritesMap);

  // Run visitor passes
  visitProjectPass0(project);
  visitProjectPass1(project);
  visitProjectPass2(project);
  visitProjectDCE(project);

  // Generate SB3
  const codegen = new CodeGen();
  codegen.assets = {
    'cd21514d0531fdffb22204e0ec5ed84a.svg': BACKDROP_SVG,
    'dango-cat.svg': DANGO_CAT_SVG,
  };
  // Caller-supplied asset bytes (round-trip of decompiled projects): keyed
  // by `<md5hex>.<ext>` exactly as referenced by costume/sound paths.
  codegen.userAssets = opts.assets || null;
  return codegen.makeSb3(project);
}

function _countBlocks(sb3Buffer) {
  try {
    const zip = new AdmZip(sb3Buffer);
    const pjEntry = zip.getEntry('project.json');
    if (!pjEntry) return 0;
    const pj = JSON.parse(pjEntry.getData().toString('utf-8'));
    let count = 0;
    for (const target of (pj.targets || [])) {
      const blocks = target.blocks || {};
      for (const bid in blocks) {
        if (typeof blocks[bid] === 'object' && !Array.isArray(blocks[bid])) {
          count++;
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// SB3 safety validation (bomb protection)
// ---------------------------------------------------------------------------

const _winDriveRe = /^[a-zA-Z]:[\\/]/;

function _validateSb3Safety(sb3Bytes) {
  if (!Buffer.isBuffer(sb3Bytes)) {
    sb3Bytes = Buffer.from(sb3Bytes);
  }
  if (sb3Bytes.length < 4) {
    throw new Error('SB3 文件过小（不是有效的 zip 文件）');
  }
  // Check PK signature
  if (sb3Bytes[0] !== 0x50 || sb3Bytes[1] !== 0x4b) {
    throw new Error('不是有效的 zip 文件（缺少 PK 签名）');
  }

  let zip;
  try {
    zip = new AdmZip(sb3Bytes);
  } catch (e) {
    throw new Error(`无法读取 zip 文件: ${e.message}`);
  }

  const entries = zip.getEntries();
  if (entries.length === 0) {
    throw new Error('SB3 zip 文件为空');
  }
  if (entries.length > SB3_MAX_ENTRIES) {
    throw new Error(`SB3 包含过多文件（${entries.length} > ${SB3_MAX_ENTRIES} 限制）`);
  }

  let totalUncompressed = 0;
  let projectJsonSize = 0;

  for (const entry of entries) {
    const name = entry.entryName;
    // Reject path traversal
    if (name.includes('..')) {
      throw new Error(`SB3 包含路径穿越文件名: ${name}`);
    }
    // Reject absolute paths
    if (name.startsWith('/')) {
      throw new Error(`SB3 包含绝对路径文件名: ${name}`);
    }
    if (_winDriveRe.test(name)) {
      throw new Error(`SB3 包含绝对路径文件名: ${name}`);
    }

    totalUncompressed += entry.header.size;
    if (totalUncompressed > SB3_MAX_TOTAL_UNCOMPRESSED) {
      throw new Error(
        `SB3 解压后总大小过大（${(totalUncompressed / 1024 / 1024).toFixed(1)}MB > ${SB3_MAX_TOTAL_UNCOMPRESSED / 1024 / 1024}MB 限制）`
      );
    }

    if (name === 'project.json') {
      projectJsonSize = entry.header.size;
    }
  }

  if (projectJsonSize === 0) {
    throw new Error('SB3 缺少 project.json');
  }
  if (projectJsonSize > SB3_MAX_PROJECT_JSON) {
    throw new Error(
      `project.json 过大（${(projectJsonSize / 1024 / 1024).toFixed(1)}MB > ${SB3_MAX_PROJECT_JSON / 1024 / 1024}MB 限制）`
    );
  }

  // Verify project.json is valid JSON
  const pjEntry = zip.getEntry('project.json');
  if (!pjEntry) {
    throw new Error('SB3 缺少 project.json');
  }
  try {
    const pjData = pjEntry.getData().toString('utf-8');
    if (pjData.length > SB3_MAX_PROJECT_JSON) {
      throw new Error(`project.json 实际解压大小过大（${(pjData.length / 1024 / 1024).toFixed(1)}MB）`);
    }
    JSON.parse(pjData);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`project.json 不是有效的 JSON: ${e.message}`);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// SSRF prevention for BYOK base_url
// ---------------------------------------------------------------------------

const _PRIVATE_NETWORKS = [
  '127.0.0.0/8',    // loopback
  '10.0.0.0/8',     // private class A
  '172.16.0.0/12',  // private class B
  '192.168.0.0/16', // private class C
  '169.254.0.0/16', // link-local (AWS metadata)
  '100.64.0.0/10',  // CGNAT
  '0.0.0.0/8',      // current network
];

function _ipInCidr(ip, cidr) {
  const [base, bits] = cidr.split('/');
  const mask = parseInt(bits);
  if (net.isIPv4(ip) && net.isIPv4(base)) {
    const ipParts = ip.split('.').map(Number);
    const baseParts = base.split('.').map(Number);
    let ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    let baseInt = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3];
    const maskInt = bits === '0' ? 0 : (~0 << (32 - mask)) >>> 0;
    return (ipInt & maskInt) === (baseInt & maskInt);
  }
  return false;
}

function _isPrivateIp(ip) {
  for (const cidr of _PRIVATE_NETWORKS) {
    if (_ipInCidr(ip, cidr)) return true;
  }
  // IPv6 loopback and ULA
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
    return true;
  }
  return false;
}

async function _validateByokBaseUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('base_url 不是有效的 URL');
  }

  // 1. Scheme whitelist: only https
  if (parsed.protocol !== 'https:') {
    throw new Error(`base_url 必须使用 https 协议（当前 scheme: ${parsed.protocol.replace(':', '') || '空'}）`);
  }

  // Must have a hostname
  const hostname = parsed.hostname;
  if (!hostname) {
    throw new Error('base_url 缺少有效的主机名');
  }

  // 2. Port must be 443 or unspecified
  const port = parsed.port;
  if (port && port !== '443') {
    throw new Error(`base_url 端口必须为 443 或不指定（当前端口: ${port}）`);
  }

  // 3. If hostname is an IP, check it's not private
  if (net.isIP(hostname)) {
    if (_isPrivateIp(hostname)) {
      throw new Error(`base_url 主机名是内网 IP (${hostname})，不允许`);
    }
    return;
  }

  // 4. DNS resolution check — resolve hostname and verify not private
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (_isPrivateIp(addr)) {
        throw new Error(`base_url 主机名 ${hostname} 解析到内网 IP (${addr})，不允许`);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('不允许')) throw e;
    // DNS resolution failed — allow it (may be a valid hostname that our DNS can't resolve)
    // but log a warning
    console.warn(`[SSRF] DNS resolution failed for ${hostname}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// AI chat: smart mock
// ---------------------------------------------------------------------------

function _smartMockGoboscript(message, projectContext = null) {
  const msg = (message || '').toLowerCase();

  // Extract numbers from the message
  const nums = msg.match(/\d+/g) || [];
  const firstNum = nums[0] || '10';
  const secondNum = nums.length > 1 ? nums[1] : firstNum;

  // Scenario 3: algorithm generation
  if (['冒泡', 'bubble'].some(kw => msg.includes(kw))) {
    return 'onflag {\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n}\n';
  }

  if (['正则', 'regex'].some(kw => msg.includes(kw))) {
    return 'var s = "hello123world";\nvar i = 0;\nvar match = "";\nonflag {\n  repeat(length(s)) {\n    if (letter(s, i) >= "0" and letter(s, i) <= "9") {\n      match = concat(match, letter(s, i));\n    }\n    i = i + 1;\n  }\n  say(match, 2);\n}\n';
  }

  if (['排序', 'sort'].some(kw => msg.includes(kw))) {
    return 'onflag {\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n  move(10);\n  turn_right(15);\n}\n';
  }

  // Scenario 2: incremental modification based on project_context
  if (projectContext && ['添加', '增加', '加', 'fix', '修复', '改', '修改', '增强', 'enhance', 'add'].some(kw => msg.includes(kw))) {
    const ctx = projectContext;
    const lastOnflag = ctx.lastIndexOf('onflag');
    if (lastOnflag !== -1) {
      const braceStart = ctx.indexOf('{', lastOnflag);
      if (braceStart !== -1) {
        let depth = 0, end = -1;
        for (let i = braceStart; i < ctx.length; i++) {
          if (ctx[i] === '{') depth++;
          else if (ctx[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end !== -1) {
          let body = ctx.slice(braceStart + 1, end);
          const insertion = '\n    say("✓ 已增量修改", 1);\n';
          if (body && !body.endsWith('\n')) body += '\n';
          return `onflag {${body}${insertion}}\n`;
        }
      }
    }
  }

  // Keyword detection
  if (['重复', '循环', 'repeat', 'forever', '一直'].some(kw => msg.includes(kw))) {
    if (msg.includes('forever') || msg.includes('一直') || msg.includes('不停')) {
      return 'onflag { forever { move(10); if_on_edge_bounce; } }';
    }
    return `onflag { repeat(${firstNum}) { move(50); turn_right(90); } }`;
  }

  if (['反弹', 'bounce', '碰壁'].some(kw => msg.includes(kw))) {
    return 'onflag { forever { move(10); if_on_edge_bounce; } }';
  }

  if (['说', 'say', 'hello', '你好', 'hi '].some(kw => msg.includes(kw))) {
    const text = (msg.includes('你好') || msg.includes('hello')) ? '你好！' : 'Hello!';
    return `onflag { say("${text}", 2); }`;
  }

  if (['移动', '走', 'move', '步'].some(kw => msg.includes(kw))) {
    return `onflag { move(${firstNum}); }`;
  }

  if (['转', '旋转', 'turn', 'rotate'].some(kw => msg.includes(kw))) {
    if (msg.includes('left') || msg.includes('左')) {
      return `onflag { turn_left(${firstNum}); }`;
    }
    return `onflag { turn_right(${firstNum}); }`;
  }

  if (['声音', 'sound', '播放', 'play'].some(kw => msg.includes(kw))) {
    return 'onflag { play_sound_until_done("meow"); }';
  }

  if (['颜色', 'color', '特效', 'effect'].some(kw => msg.includes(kw))) {
    return 'onflag { set_color_effect(25); }';
  }

  if (['等待', 'wait'].some(kw => msg.includes(kw))) {
    return `onflag { wait(${firstNum}); }`;
  }

  if (['停止', 'stop', '全部'].some(kw => msg.includes(kw))) {
    return 'onflag { stop_all; }';
  }

  // Fallback: default mock
  return AI_MOCK_GOBOSCRIPT;
}
// M19: AI reply parsing moved to src/ai_response.js (pure, unit-tested).
// It strips ALL markdown fences anywhere, lifts EXPLANATION: from any
// position, and drops prose before the first top-level goboscript line.
function _parseAiResponse (raw) {
  return parseAiResponse(raw);
}

function _buildAiSystemPrompt() {
  const schema = getSchema();
  const lines = [
    'You are a goboscript code generator. Output ONLY goboscript code, then a line starting with "EXPLANATION:" followed by a brief explanation. NEVER wrap the code in markdown fences (no backticks) — raw goboscript only.',
    '',
    '## CRITICAL STRUCTURE RULES (violating any of these fails compilation)',
    '1. Hat events (onflag / onkey "space" / onclick / onbackdrop "backdrop1" / onclone / onloudness > 10 / ontimer > 5 / on "message1") must be TOP-LEVEL — never nest one hat inside another block, and never nest one inside loops like forever/repeat. An event keyword written ANYWHERE inside a {...} body is ALWAYS a compile error. NEVER write Scratch-style hats like "when green flag clicked" or "when I receive message" — they are NOT in this language and will be silently ignored; use onflag / on "msg" instead. Correct: "点击角色随机移动" → onclick { goto_random_position; }  (onclick sits at column 0). WRONG: onflag { onclick { ... } } — this exact mistake fails with "Unexpected token in statement: OnClick"; when you see that error, MOVE the event line out to top level instead of nesting it deeper.',

    '2. Variable declarations go at TOP LEVEL only, OUTSIDE every event body: `var score = 0;`. Inside events you may only ASSIGN them: `score = 0;` or `score += 1;`.',
    '3. Sprite properties are plain variables: x, y, size, direction, y_position, x_position… Use `x += 10`, `y -= 5`, `point_in_direction(90)`.',
    '4. Clones: `clone;` clones THIS sprite (top-level statement, not inside an expression); handle copies in `onclone { ... }`; a clone deletes itself with `delete_this_clone;`.',
    '5. Every simple statement ends with `;`. Braces `{ }` wrap bodies. Conditions use parentheses: `if (cond) { ... }`, `until (cond) { ... }`, `repeat (10) { ... }`, `forever { ... }`.',
    '6. Booleans: `and`, `or`, `not`, comparisons `< <= == != >= >`, membership `item in list`.',
    '7. Lists are declared at top level: write ALL known values directly in the initializer — `list scores = [90, 85, 78];`. Do NOT declare an empty list and fill it with many `add x to list;` statements; reserve `add` for values only known at runtime. `fruits[1]` reads item 1.',
    '8. Iteration sugar: `for item in fruits { ... }` — runs the body once per element; the language auto-manages the hidden index pointer and per-item temp cache (do NOT declare `item`).',
    '9. One-statement list clone: `copy list src to dst;` — dst is cleared and receives every element of src. Inside event bodies it runs as a runtime loop; at TOP LEVEL both lists must already be declared and it copies the preset values once at load time (`list src = [1,2]; list dst; copy list src to dst;`).',
    '10. Output budget: the whole program MUST be complete within ONE response (~8000 tokens) — keep it under ~160 lines total. If the requested content does not fit, SIMPLIFY THE DESIGN (fewer levels/items/enemies): running out of space mid-program is FATAL. Skeleton first: make sure every { has its closing } and the program ends cleanly. Stay compact: drive behavior with loops over data lists instead of unrolled repetition; do NOT generate numbered temp variables/temp lists (temp1, temp2, …); fewer than ~30 declared variables/lists total.',
    '11. Big data must be DATA, not code: keep every single list literal under ~12 elements. If the game needs many levels/platforms/enemies/tiles, encode each as a FEW NUMBERS inside short list literals (e.g. 6 numbers per level) and process them with repeat/for-in loops. NEVER write one statement block or one variable per platform/level/item. NEVER write any sentence outside the code.',
    '',
    '## Functions (custom blocks) — USE THESE for any reusable/multi-step logic',
    '- Define: `func def_name(a, b) { ... return value; }` — name MUST start with def_. Call: `def_name(1, 2)`.',
    '- Per-call variables INSIDE a function body MUST use `local`: `local i = 1;` / `local ch = "";`. Never use `var` inside a function body for state that changes across recursive/nested calls — `var` is a SHARED global and recursive calls will clobber it.',
    '- `local` is ONLY valid inside a function body. Top-level shared state uses `var` (e.g. `var g_pos = 1;`).',
    '- String indexing works: `letter_of(i, s)` returns the i-th character of s. Use it for lexers/parsers.',
    '- There are NO to_number/str_to_num/int builtins. Convert a digit-string to a number with multiplication: `n = tok * 1;`.',
    '- There is NO break or continue statement. Control loop exit via the condition: `while (i <= n and not found) { ... if (hit) { found = true; } i += 1; }`.',
    '- `&` joins strings (upstream BinOp::Join). `+` is NUMERIC-ONLY addition: `"a" & "b"` gives "ab", but `"a" + "b"` gives 0.',
    '- Reserved words CANNOT be variable/parameter names: target, answer, timer, key, stop, when, message, list, item, last, of, from, item. Use other names (e.g. `tgt`, `k`).',
    '- Lists are global by name: declare `var tokens = [];` (in-body bracket init gives per-call reset), push with `add x to tokens;`, read `tokens[i]`, size `length(tokens)`.',
    '- Lists are 1-BASED: the LAST/top element is `tokens[length(tokens)]` (NOT length-1).',
    '- Pop the last element with `delete last of tokens;`. WARNING: bare `delete tokens;` DELETES THE ENTIRE LIST — never use it to pop.',
    '- IMPORTANT: `return` can only carry a SCALAR. NEVER return a list from a function — it gets flattened to a string. Instead, have the function WRITE into a top-level list variable and callers read that list by name. Example: `func def_lex(s) { var g_tokens = []; ... add t to g_tokens; }` then caller: `def_lex(expr);` followed by using `g_tokens` directly.',
    '- Do not pass lists as function arguments either — arguments are scalar reporters. Use well-known global list names inside the function bodies instead.',
    '- Recursion between DIFFERENT functions works. WARNING: calling the SAME function again while an earlier call of it is unfinished (self-recursion or mutual cycles like expr→term→expr) shares its `local` variables — values get clobbered. NEVER write a recursive-descent expr/term/factor parser.',
    '- Reference implementation — COMPLETE iterative four-operation evaluator with parentheses (COPY THIS STRUCTURE, fill in details):',
    '```',
    'var g_tokens = [];',
    'var g_vals = [];',
    'var g_ops = [];',
    'func def_apply_top() {',
    '    local op = g_ops[length(g_ops)];',
    '    delete last of g_ops;',
    '    local b = g_vals[length(g_vals)];',
    '    delete last of g_vals;',
    '    local a = g_vals[length(g_vals)];',
    '    delete last of g_vals;',
    '    local r = 0;',
    '    if (op == "+") { r = a + b; }',
    '    else if (op == "-") { r = a - b; }',
    '    else if (op == "*") { r = a * b; }',
    '    else { r = a / b; }',
    '    add r to g_vals;',
    '}',
    'func def_prec(op) {',
    '    if (op == "*" or op == "/") { return 2; }',
    '    if (op == "+" or op == "-") { return 1; }',
    '    return 0;',
    '}',
    'func def_calc(expr) {',
    '    g_tokens = []; def_lex(expr); g_vals = []; g_ops = [];',
    '    local i = 1;',
    '    while (i <= length(g_tokens)) {',
    '        local t = g_tokens[i];',
    '        if (t == "(") { add "(" to g_ops; }',
    '        else if (t == ")") { while (length(g_ops) > 0 and g_ops[length(g_ops)] != "(") { def_apply_top(); } delete last of g_ops; }',
    '        else if (t == "+" or t == "-" or t == "*" or t == "/") {',
    '            local pt = def_prec(t);',
    '            while (length(g_ops) > 0 and def_prec(g_ops[length(g_ops)]) >= pt) { def_apply_top(); }',
    '            add t to g_ops;',
    '        }',
    '        else { add t * 1 to g_vals; }',
    '        i += 1;',
    '    }',
    '    while (length(g_ops) > 0) { def_apply_top(); }',
    '    return g_vals[1];',
    '}',
    'onflag { say(def_calc("3 + 5 * 2")); }',
    '```',
    '- CONTRACT for calculators/evaluators: the program MUST define `func def_calc(expr)` that returns the NUMERIC result (token lists live in top-level `var g_tokens`; def_lex fills it and returns nothing), and MUST contain exactly this demo event: `onflag { say(def_calc("3 + 5 * 2")); }`',
    '- Reference pattern — tokenizer writing into a GLOBAL list (note: NO `return` of the list):',
    '```',
    'var g_tokens = [];',
    'func def_lex(s) {',
    '    var g_tokens = [];',
    '    local i = 1;',
    '    local cur = "";',
    '    while (i <= length(s)) {',
    '        local ch = letter_of(i, s);',
    '        if (ch == " ") { if (cur != "") { add cur to g_tokens; cur = ""; } }',
    '        else if (ch == "+" or ch == "-" or ch == "*" or ch == "/" or ch == "(" or ch == ")") { if (cur != "") { add cur to g_tokens; } add ch to g_tokens; cur = ""; }',
    '        else { cur = cur & ch; }',
    '        i += 1;',
    '    }',
    '    if (cur != "") { add cur to g_tokens; }',
    '}',
    '```',
    '',
    '## Keywords',
    schema.keywords.join(', '),
    '',
    '## Blocks',
  ];
  const byCat = {};
  for (const b of schema.blocks) {
    if (!byCat[b.category]) byCat[b.category] = [];
    byCat[b.category].push(b);
  }
  // Cache-stable ordering: fixed category order first, then any remaining
  // categories (e.g. 'music') in sorted order so nothing is dropped and the
  // byte layout never depends on object iteration order.
  const catOrder = ['motion', 'looks', 'sound', 'control', 'event', 'sensing', 'pen', 'operator', 'data', 'other'];
  const cats = [
    ...catOrder.filter(c => byCat[c]),
    ...Object.keys(byCat).filter(c => !catOrder.includes(c)).sort(),
  ];
  for (const cat of cats) {
    lines.push(`[${cat}]`);
    const blocksInCat = byCat[cat].slice().sort((a, b) => (a.syntax < b.syntax ? -1 : a.syntax > b.syntax ? 1 : 0));
    for (const b of blocksInCat) {
      lines.push(`  ${b.syntax} → ${b.example}`);
    }
  }
  lines.push('', '## Grammar', schema.grammar_notes);
  lines.push('', '## Variables and Lists (STRICT)');
  lines.push(
    '- Declare each variable ONCE with `var name = value;`. Re-declaring the same name is an error — ' +
    'assign later with `name = value;` instead.'
  );
  lines.push('- Declare a list with `list name;` or `list name = [a, b, c];`.');
  lines.push(
    '- To clear a list use `clear list name;` or `delete name;`. NEVER write `name = [];` for that: ' +
    'plain assignment creates a same-named VARIABLE that shadows the list, so `add`/`delete`/' +
    '`length()` keep hitting the list while `name` reads the empty variable.'
  );
  lines.push(
    '- List operations (`add x to L;`, `delete i of L;`, `delete last of L;`, `insert v at i in L;`, ' +
    '`replace item i of L with v;`, `clear list L;`, `length(L)`, `L[i]`) only work on names ' +
    'declared with `list`.'
  );
  lines.push('', '## Examples (user → goboscript)');
  lines.push('  "绿旗后移动10步" → onflag { move(10); }');
  lines.push('  "说你好2秒" → onflag { say("你好", 2); }');
  lines.push('  "重复4次移动50转弯90" → onflag { repeat(4) { move(50); turn_right(90); } }');
  lines.push('  "碰到边缘就左转15度" → onflag { if (touching_edge) { turn_left(15); } }');
  lines.push('  "点击角色随机移动" → onclick { goto_random_position; }');
  lines.push('  "按空格说你好" → onkey "space" { say("你好"); }');
  lines.push('', '## Output Format');
  lines.push('Output ONLY goboscript code, then a line starting with "EXPLANATION:" followed by a brief explanation. NEVER wrap the code in markdown fences (no backticks) — raw goboscript only.');
  lines.push('');
  lines.push('CRITICAL — ONE EVENT BLOCK: emit AT MOST ONE `onflag { }` block, and at most one ' +
    'block of each other event kind. Two `onflag` blocks become two CONCURRENT threads sharing ' +
    'the same global variables and lists; they corrupt each other mid-loop and ALL results come ' +
    'out wrong. Put every test/demo call inside that single `onflag` body, in order.');
  return lines.join('\n');
}

const _TASK_STDLIB = [
  { re: /json/i, funcName: 'def_json_get', file: 'json_get.gs' },
  { re: /正则|regex|regexp/i, funcName: 'def_regex_test', file: 'regex_test.gs' },
  { re: /xml/i, funcName: 'def_xml_ok', file: 'xml_ok.gs' },
];

function _buildTaskHint(userText) {
  const t = String(userText || '');
  const parts = [];
  for (const task of _TASK_STDLIB) {
    if (!task.re.test(t)) continue;
    let ref = '';
    try { ref = fs.readFileSync(path.join(_SERVER_DIR, '..', 'ai_refs', task.file), 'utf8'); } catch (e) {}
    const sig = ref ? ref.split('\n').slice(0, 3).join('\n') : ('func ' + task.funcName + '(...)');
    parts.push([
      '\u4efb\u52a1\u5951\u7ea6\uff1a\u51fd\u6570 ' + task.funcName + ' \u7531\u7cfb\u7edf\u6807\u51c6\u5e93\u81ea\u52a8\u63d0\u4f9b\uff08\u5b9e\u73b0\u4f1a\u9644\u52a0\u5230\u4f60\u4ee3\u7801\u672b\u5c3e\uff09\u3002\u4e0d\u8981\u81ea\u5df1\u5b9a\u4e49\u8be5\u51fd\u6570\uff0c\u4e0d\u8981\u91cd\u590d\u5b83\u7684\u540d\u5b57\u3002',
      '\u4f60\u53ea\u9700\u8981\uff1a\u5199\u4e00\u4e2a onflag \u6f14\u793a\u4e8b\u4ef6\u8c03\u7528 ' + task.funcName + ' \u5e76\u7528 say() \u5c55\u793a\u7ed3\u679c\uff1b\u9664\u6f14\u793a\u5916\u4e0d\u8981\u5199\u5176\u5b83\u903b\u8f91\u3002',
      '\u53c2\u8003\u7b7e\u540d\uff08\u52ff\u91cd\u5b9a\u4e49\uff09\uff1a' + sig
    ].join('\n'));
  }
  return parts.join('\n\n');
}

function _stripFuncDef(code, funcName) {
  const linesIn = String(code || '').split('\n');
  const outLines = [];
  let skipping = false, depth = 0;
  const headRe = new RegExp('^func\\s+' + funcName + '\\b');
  for (const ln2 of linesIn) {
    if (!skipping && headRe.test(ln2)) { skipping = true; depth = 0; }
    if (skipping) {
      for (const ch of ln2) { if (ch === '{') depth += 1; else if (ch === '}') depth -= 1; }
      if (depth <= 0 && /}/.test(ln2)) { skipping = false; }
      continue;
    }
    outLines.push(ln2);
  }
  return outLines.join('\n');
}

function _injectTaskStdlib(code, userText) {
  const t = String(userText || '');
  let out = String(code || '');
  for (const task of _TASK_STDLIB) {
    if (!task.re.test(t)) continue;
    let ref = '';
    try { ref = fs.readFileSync(path.join(_SERVER_DIR, '..', 'ai_refs', task.file), 'utf8'); } catch (e) {}
    if (!ref) continue;
    out = _stripFuncDef(out, task.funcName);
    // PREPEND so the stdlib definition registers before any caller body
    out = ref + '\n\n' + out.replace(/^\s+/, '');
  }
  return out;
}

function _stdlibFallbackProgram(userText) {
  const t = String(userText || '');
  for (const task of _TASK_STDLIB) {
    if (!task.re.test(t)) continue;
    let ref = '';
    try { ref = fs.readFileSync(path.join(_SERVER_DIR, '..', 'ai_refs', task.file), 'utf8'); } catch (e) {}
    if (!ref) continue;
    const demo = { 'def_json_get': 'onflag {', 'def_regex_test': 'onflag {', 'def_xml_ok': 'onflag {' };
    let demoBody = '';
    if (task.funcName === 'def_json_get') demoBody = 'onflag {\n    say(def_json_get("{\\"name\\":\\"amy\\",\\"age\\":7}", "name"));\n}';
    else if (task.funcName === 'def_regex_test') demoBody = 'onflag {\n    say(def_regex_test("aaab", "a*b"));\n    say(def_regex_test("aaab", "^b"));\n}';
    else demoBody = 'onflag {\n    say(def_xml_ok("<a><b>x</b></a>"));\n    say(def_xml_ok("<a><b>x</a></b>"));\n}';
    return ref + '\n\n' + demoBody + '\n';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Schema builder
// ---------------------------------------------------------------------------

const _CATEGORY_MAP = {
  'motion_': 'motion', 'looks_': 'looks', 'sound_': 'sound',
  'control_': 'control', 'event_': 'event', 'sensing_': 'sensing',
  'pen_': 'pen', 'music_': 'music', 'operator_': 'operator', 'data_': 'data',
};

const _ARG_SAMPLE = {
  STEPS: '10', DEGREES: '15', DX: '10', DY: '5',
  X: '0', Y: '0', SECS: '2', DURATION: '1',
  MESSAGE: '"Hello"', QUESTION: '"What?"',
  SIZE: '100', CHANGE: '10', VALUE: '50',
  COLOR: '"#ff0000"', BROADCAST_INPUT: '"message1"',
  NUM: '1', NUM1: '1', NUM2: '2',
  FROM: '1', TO: '10',
  STRING: '"text"', STRING1: '"abc"', STRING2: '"b"',
  LETTER: '1', NOTE: '60', BEATS: '0.5', DRUM: '1',
  TEMPO: '120', INSTRUMENT: '1', VOLUME: '50',
  ITEM: '1', PROPERTY: '"x position"',
  OBJECT: '"Sprite1"', TOWARDS: '"Sprite1"',
  TO: '"_random_"', COSTUME: '"costume1"',
  BACKDROP: '"backdrop1"',
};

function _opcodeToCategory(opcode) {
  for (const [prefix, cat] of Object.entries(_CATEGORY_MAP)) {
    if (opcode.startsWith(prefix)) return cat;
  }
  return 'other';
}

function _argSample(name) {
  return _ARG_SAMPLE[name] || '0';
}

function _buildSyntax(name, args) {
  if (!args || args.length === 0) return name;
  return `${name}(${args.map(a => a.toLowerCase()).join(', ')})`;
}

function _buildExample(name, args) {
  if (!args || args.length === 0) return `${name};`;
  const vals = args.map(a => _argSample(a)).join(', ');
  return `${name}(${vals});`;
}

let _schemaCache = null;

function getSchema() {
  if (_schemaCache) return _schemaCache;
  const blockEntries = [];

  // Statement blocks (from _BLOCK_FROM_SHAPE)
  for (const [gsName, blk] of Object.entries(gs_blocks._BLOCK_FROM_SHAPE)) {
    const spec = gs_blocks._BLOCK_SPEC[blk];
    if (!spec) continue;
    const opcode = spec.opcode;
    const category = _opcodeToCategory(opcode);
    const args = [...(spec.args || [])];
    blockEntries.push({
      name: gsName, category,
      syntax: _buildSyntax(gsName, args),
      example: _buildExample(gsName, args),
      args,
    });
  }

  // Overloaded statement blocks
  for (const [gsName, variants] of Object.entries(gs_blocks._BLOCK_OVERLOADS)) {
    for (const blk of variants) {
      const spec = gs_blocks._BLOCK_SPEC[blk];
      if (!spec) continue;
      const opcode = spec.opcode;
      const category = _opcodeToCategory(opcode);
      const args = [...(spec.args || [])];
      const tag = ` (${args.length} args)`;
      blockEntries.push({
        name: gsName + tag, category,
        syntax: _buildSyntax(gsName, args),
        example: _buildExample(gsName, args),
        args,
      });
    }
  }

  // Reporter blocks (from _REPR_FROM_SHAPE)
  for (const [gsName, rep] of Object.entries(gs_blocks._REPR_FROM_SHAPE)) {
    const spec = gs_blocks._REPR_SPEC[rep];
    if (!spec) continue;
    const opcode = spec.opcode;
    const category = _opcodeToCategory(opcode);
    const args = [...(spec.args || [])];
    blockEntries.push({
      name: gsName, category,
      syntax: _buildSyntax(gsName, args),
      example: _buildExample(gsName, args),
      args,
    });
  }

  // Keywords
  const keywords = Object.keys(KEYWORDS).sort();

  // Examples
  const examples = [
    'onflag { move(10); }',
    'onflag { repeat(4) { move(50); turn_right(90); } }',
    'onflag { say("Hello!", 2); wait(1); move(20); }',
    'onflag { if (touching_edge) { turn_left(15); } }',
    'onkey "space" { forever { move(5); if_on_edge_bounce; } }',
    'onclick { turn_right(15); }',
    'func def_twice(n) { return n * 2; }',
    'onflag { say(def_twice(21)); }',
  ];

  const grammarNotes =
    'Statements end with `;` or newline. ' +
    'Blocks use `{ ... }` braces. ' +
    'Events: `onflag`, `onkey "key" { ... }` (key as bare string, NOT function call), `onclick`, `onbackdrop "name" { ... }`, `forever`. ' +
    'Control: `repeat(n) { ... }`, `if (cond) { ... }`, `else { ... }`. ' +
    'Variables: `var name = value;` at top level. ' +
    'Iteration sugar: `for item in listName { ... }` visits every element. ' +
    'List clone sugar: `copy list src to dst;`. ' +
    'Scratch-style also accepted: `change v by n;`, `set v to n;`. ' +
    'Operators: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`, `and`, `or`, `not`. ' +
    'Overloaded calls: `say(msg)` vs `say(msg, secs)`, ' +
    '`goto(sprite)` vs `goto(x, y)`, `glide(x, y, secs)` vs `glide(target, secs)`, ' +
    '`clone` vs `clone(sprite)`. ' +
    'Functions: define reusable functions as `func def_name(a, b) { ... return expr; }` — ' +
    'the function name MUST start with the prefix `def_` (e.g. def_add, def_get_score); ' +
    'plain names like add/to/delete/insert/at/as are RESERVED words and will be rejected. ' +
    'Return values: write `return expr;` inside the function body; the compiler stores it automatically. ' +
    'Call functions anywhere an expression or statement fits: `say(def_add(2, 3));` or bare `def_fix(x);` — ' +
    'the compiler auto-expands calls and wires up returned values; do NOT manually expand anything. ' +
    'Each function owns a private variable `returnedFunc:def_name` managed entirely by the compiler.';

  _schemaCache = {
    keywords,
    blocks: blockEntries,
    examples,
    grammar_notes: grammarNotes,
  };
  return _schemaCache;
}

// ---------------------------------------------------------------------------
// AI provider call (using Node.js https)
// ---------------------------------------------------------------------------

function _callOpenAiCompatible(cfg, messages, opts = {}) {
  return new Promise((resolve, reject) => {
    let baseUrl = cfg.base_url.replace(/\/$/, '');
    // DeepSeek prefix continuation lives on the /beta endpoint.
    if (opts.prefixMode && !/\/beta$/.test(baseUrl)) {
      baseUrl = baseUrl + '/beta';
    }
    const url = new URL(baseUrl + '/chat/completions');
    // Output budget: large generated projects routinely exceed 2048 tokens
    // and a truncated final `}` makes every self-repair retry fail the same
    // way. Configurable via DEEPSEEK_MAX_TOKENS; 8192 covers deepseek-chat.
    const maxTokens = parseInt(process.env.DEEPSEEK_MAX_TOKENS || '8192', 10);
    const body = JSON.stringify({
      model: cfg.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0,
    });

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.api_key}`,
      'Content-Length': Buffer.byteLength(body),
    },
    // Socket idle timeout. The upstream call is non-streaming, so the socket
    // stays silent for the whole generation; long completions (S3/S5-scale
    // projects routinely take >30s) were killed at 30s and surfaced to the
    // client as 502 "AI 调用失败". Configurable via AI_TIMEOUT_MS; default
    // matches the stress client's own 240s budget.
    timeout: parseInt(process.env.AI_TIMEOUT_MS || '600000', 10),
  };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode !== 200) {
          reject(new Error(`AI API returned ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.message?.content || '';
          const usage = json.usage || null;
          // finish_reason === 'length' means the completion was cut off at
          // max_tokens mid-program — the #1 cause of irrecoverable repair
          // loops. Surface it so callers (frontend / stress harness) can
          // react precisely instead of guessing from error text.
          const finishReason = json.choices?.[0]?.finish_reason || null;
          resolve({ content, usage, finish_reason: finishReason });
        } catch (e) {
          reject(new Error(`AI API response parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI API request timeout'));
    });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Request handlers
// ---------------------------------------------------------------------------

async function handleHealth(req, res) {
  _sendJson(res, 200, {
    status: 'ok',
    goboscript_version: GOBOSCRIPT_VERSION,
  });
}

async function handleCompile(req, res) {
  let body;
  try {
    body = await _readJsonBody(req);
  } catch (e) {
    _sendJson(res, 400, { error: 'Invalid JSON body', detail: e.message });
    return;
  }
  const source = body.source;
  if (!source || typeof source !== 'string') {
    _sendJson(res, 422, { error: 'Missing source field', detail: 'Request must include a "source" string field.' });
    return;
  }

  try {
    const sb3Buffer = compileSource(source);
    const blockCount = _countBlocks(sb3Buffer);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="project.sb3"',
      'X-Block-Count': String(blockCount),
      'Access-Control-Allow-Origin': _corsOrigins[0] || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Length': String(sb3Buffer.length),
    });
    res.end(sb3Buffer);
  } catch (e) {
    console.error('[compile] error:', e.message);
    _sendJson(res, 422, { error: 'Compilation failed', detail: e.message });
  }
}

async function handleValidate(req, res) {
  let body;
  try {
    body = await _readJsonBody(req);
  } catch (e) {
    _sendJson(res, 400, { error: 'Invalid JSON body', detail: e.message });
    return;
  }
  const source = body.source;
  if (!source || typeof source !== 'string') {
    _sendJson(res, 422, { error: 'Missing source field', detail: 'Request must include a "source" string field.' });
    return;
  }

  try {
    const errors = _validateSource(source);
    _sendJson(res, 200, { success: errors.length === 0, errors });
  } catch (e) {
    console.error('[validate] error:', e.message);
    _sendJson(res, 500, { error: 'Validation failed', detail: e.message });
  }
}

async function handleDecompile(req, res) {
  const contentType = req.headers['content-type'] || '';
  let sb3Bytes;

  try {
    if (contentType.includes('multipart/form-data')) {
      // Parse multipart (simple parsing for file upload)
      const body = await _readBody(req);
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        _sendJson(res, 422, { error: 'Missing multipart boundary' });
        return;
      }
      // Simple multipart parsing
      const boundaryBuffer = Buffer.from('--' + boundary);
      const parts = body.split(boundaryBuffer);
      let filePart = null;
      for (const part of parts) {
        if (part.includes('filename=') && part.length > 4) {
          filePart = part;
          break;
        }
      }
      if (!filePart) {
        _sendJson(res, 422, { error: 'No file found in multipart data' });
        return;
      }
      // Extract file content (skip headers)
      const headerEnd = filePart.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        _sendJson(res, 422, { error: 'Invalid multipart format' });
        return;
      }
      sb3Bytes = filePart.slice(headerEnd + 4, filePart.length - 2); // Remove trailing \r\n
    } else {
      // Raw body (octet-stream)
      sb3Bytes = await _readBody(req);
    }
  } catch (e) {
    if (e.message === 'Body too large') {
      _sendJson(res, 413, { error: '请求体过大', detail: `最大允许 ${MAX_BODY_SIZE / (1024 * 1024)}MB` });
      return;
    }
    _sendJson(res, 400, { error: 'Failed to read request body', detail: e.message });
    return;
  }

  if (!sb3Bytes || sb3Bytes.length === 0) {
    _sendJson(res, 422, { error: 'Empty request body', detail: 'Expected .sb3 bytes (application/octet-stream or multipart).' });
    return;
  }

  // Safety validation
  try {
    _validateSb3Safety(sb3Bytes);
  } catch (e) {
    _sendJson(res, 422, { error: 'SB3 安全校验失败', detail: e.message });
    return;
  }

  try {
    const result = sb3_to_goboscript(sb3Bytes);
    _sendJson(res, 200, result);
  } catch (e) {
    console.error('[decompile] error:', e.message);
    _sendJson(res, 422, { error: 'SB3 parse error', detail: e.message });
  }
}

async function handleAiChat(req, res) {
  let body;
  try {
    body = await _readJsonBody(req);
  } catch (e) {
    _sendJson(res, 400, { error: 'Invalid JSON body', detail: e.message });
    return;
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    _sendJson(res, 422, { error: 'Missing messages field', detail: 'Request must include a "messages" array.' });
    return;
  }

  // Validate messages
  // NOTE: 'system' must be accepted — the self-repair loop (frontend) feeds
  // validation errors back as a system message, and this backend itself
  // injects role:'system' messages into the provider call (see below).
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
      _sendJson(res, 422, { error: 'Invalid message role', detail: `Role must be "user", "assistant" or "system", got: ${msg.role}` });
      return;
    }
    if (typeof msg.content !== 'string') {
      _sendJson(res, 422, { error: 'Invalid message content', detail: 'Message content must be a string.' });
      return;
    }
    if (msg.content.length > AI_MAX_MESSAGE_LENGTH) {
      _sendJson(res, 422, { error: 'Message too long', detail: `Single message must be ≤ ${AI_MAX_MESSAGE_LENGTH} characters.` });
      return;
    }
  }

  const projectContext = body.project_context || '';
  const apiKey = body.api_key;
  const baseUrl = body.base_url;
  const model = body.model;

  // Log (never log api_key)
  console.info(`[ai_chat] project_context=${projectContext ? 'yes' : 'no'} (${projectContext.length} chars), messages=${messages.length}, byok=${apiKey ? 'yes' : 'no'}`);

  // Resolve provider config
  let cfg;
  if (apiKey) {
    // BYOK path
    const byokBaseUrl = baseUrl || 'https://api.deepseek.com';
    const byokModel = model || 'deepseek-chat';

    try {
      await _validateByokBaseUrl(byokBaseUrl);
    } catch (e) {
      console.warn(`[ai_chat] BYOK base_url rejected: ${e.message}`);
      _sendJson(res, 422, { error: 'base_url 校验失败', detail: e.message });
      return;
    }

    cfg = {
      provider: 'byok',
      base_url: byokBaseUrl,
      model: byokModel,
      api_key: apiKey,
    };

    // Log only the host, never the key
    let host;
    try { host = new URL(byokBaseUrl).hostname; } catch { host = byokBaseUrl; }
    console.info(`[ai_chat] BYOK mode, host=${host}, model=${byokModel}`);
  } else {
    // No BYOK key — check if server keys are explicitly allowed
    const allowServerKey = ['true', '1', 'yes'].includes(
      (process.env.ALLOW_SERVER_KEY || 'false').toLowerCase()
    );
    if (!allowServerKey) {
      console.info('[ai_chat] no BYOK key and ALLOW_SERVER_KEY not set — returning mock');
      _sendJson(res, 200, {
        goboscript: _smartMockGoboscript(
          messages.length > 0 ? messages[messages.length - 1].content : '',
          projectContext
        ),
        explanation: AI_MOCK_EXPLANATION,
      });
      return;
    }
    // Env-var path (only when explicitly enabled)
    cfg = _getAiProviderConfig();
  }

  // Mock / no-key fallback
  if (cfg.provider === 'mock' || !cfg.api_key) {
    console.warn(`[ai_chat] AI provider=${cfg.provider}, no API key — returning mock`);
    _sendJson(res, 200, {
      goboscript: _smartMockGoboscript(
        messages.length > 0 ? messages[messages.length - 1].content : '',
        projectContext
      ),
      explanation: AI_MOCK_EXPLANATION,
    });
    return;
  }

  // Build system prompt from /schema
  const systemPrompt = _buildAiSystemPrompt();

  // Task-specific contracts: when the user asks for a parser/matcher, pin
  // the exact function signature + demo literal the validator will assert.
  // Appended AFTER the big schema prompt so it stays salient.
  const taskHint = _buildTaskHint(messages.map(m => m.content || '').join('\n'));

  // Build message list
  const aiMessages = [{ role: 'system', content: systemPrompt }];
  if (taskHint) {
    aiMessages.push({ role: 'system', content: taskHint });
  }
  // M27-F+: functions are FIRST-CLASS by default — softly prefer them
  // for any multi-step or reusable logic. The strong few-shot mandate
  // below still fires only on explicit requests, and negation phrasing
  // (不要/无需/不用/别用) suppresses both tiers.
  aiMessages.push({
    role: 'system',
    content: '风格要求：函数是一等公民。凡涉及多步运算或可复用逻辑，优先定义 func def_xxx(...) 形式的函数并在事件中调用；仅当逻辑确实极简（如单条 say/move），或用户明确表示不要函数时，才直接内联书写。'
  });
  // M27-F: when the user asks for functions, reinforce the convention
  // right before generation — long schemas dilute instructions, and the
  // model sometimes answers with fully inlined code (no custom blocks).
  {
    const allText = messages.map(m => m.content || '').join('\n');
    const wantsFunc = !/不要|无需|不用|别用/.test(allText) &&
      /函数|function|def_/i.test(allText);
    if (wantsFunc) {
      aiMessages.push({
        role: 'system',
        content: [
          '硬性要求：用户需要自定义函数。必须用 func 定义，函数名以 def_ 开头；调用写作 def_calc(a, b, o)。禁止内联展开。',
          '正确示例：',
          'func def_calc(a, b, o) {',
'            if (o == "+") { return a + b; }',
'            return 0;',
          '}',
          'onflag {',
'            say(def_calc(10, 5, "+"));',
          '}'
        ].join('\n')
      });
    }
  }
  if (projectContext) {
    aiMessages.push({ role: 'system', content: `Project context:\n${projectContext}` });
  }
  for (const msg of messages) {
    aiMessages.push({ role: msg.role, content: msg.content });
  }

  try {
    const result = await _callAiWithFallback(cfg, aiMessages);
    const raw = result.content;
    const truncated = result.finish_reason === 'length';
    if (result.usage) {
      // DeepSeek returns prompt_cache_hit_tokens / prompt_cache_miss_tokens;
      // log them so cache effectiveness is observable per call.
      const hit = result.usage.prompt_cache_hit_tokens;
      const miss = result.usage.prompt_cache_miss_tokens;
      const cacheInfo = (typeof hit === 'number' || typeof miss === 'number')
        ? ` cache_hit=${hit ?? 'n/a'} cache_miss=${miss ?? 'n/a'}`
        : '';
      console.info(
        `[ai_chat] AI call: provider=${cfg.provider} model=${cfg.model} response_len=${raw.length} ` +
        `finish=${result.finish_reason || 'n/a'} ` +
        `tokens: prompt=${result.usage.prompt_tokens} completion=${result.usage.completion_tokens} total=${result.usage.total_tokens}` +
        cacheInfo
      );
    } else {
      console.info(`[ai_chat] AI call: provider=${cfg.provider} model=${cfg.model} response_len=${raw.length} finish=${result.finish_reason || 'n/a'}`);
    }

    let [goboscript, explanation] = _parseAiResponse(raw);
    if (!explanation) explanation = '（模型未提供解释）';

    // Task stdlib: deterministic reference implementations appended for
    // parser/matcher tasks (the model only writes the demo calls).
    const convText = messages.map(m => m.content || '').join('\n');
    goboscript = _injectTaskStdlib(goboscript, convText);

    // Truncated completions can NEVER satisfy the structure rules (missing
    // closing braces at minimum). Say so loudly and up front — repair loops
    // otherwise burn identical failing rounds against max_tokens.
    if (truncated) {
      explanation =
        '⚠ 自动续写已达上限（MAX_AI_CONTINUATIONS），输出仍不完整（finish_reason=length）。' +
        '请换一种显著更小的实现：总行数 ≤120、用循环生成数据、合并变量、删光注释。' +
        '\n' + explanation;
    }

    // Validate the generated goboscript. For stdlib-backed tasks, if the
    // AI's own attempt still fails validation here (it keeps reaching for
    // break/continue etc.), ship the deterministic reference program
    // instead — runnable output beats a dead-end error message.
    let errors = _validateSource(goboscript);
    if (errors.length > 0) {
      const fb = _stdlibFallbackProgram(convText);
      if (fb) {
        const fbErrors = _validateSource(fb);
        if (fbErrors.length === 0) {
          goboscript = fb;
          errors = [];
          explanation += '\n（该任务的算法已由系统标准库保底合成，保证可运行。）';
        }
      }
    }
    if (errors.length > 0) {
      const errLines = errors.map(e => `  L${e.line}:${e.column} ${e.message}`);
      explanation += '\n\n⚠ 生成代码校验失败，请重试：\n' + errLines.join('\n');
    }

    _sendJson(res, 200, { goboscript, explanation, finish_reason: result.finish_reason || null, truncated });
  } catch (e) {
    console.error(`[ai_chat] AI call failed (provider=${cfg.provider}): ${e.message}`);
    _sendJson(res, 502, {
      error: 'AI 调用失败',
      detail: '上游 AI 服务不可用，请稍后重试或检查 api_key/base_url 配置',
    });
  }
}

function _getAiProviderConfig() {
  const provider = (process.env.MODEL_PROVIDER || 'mock').toLowerCase();
  const configs = {
    deepseek: {
      provider: 'deepseek',
      base_url: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      api_key: process.env.DEEPSEEK_API_KEY || '',
      api_key_env: 'DEEPSEEK_API_KEY',
    },
    kimi: {
      provider: 'kimi',
      base_url: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
      model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
      api_key: process.env.KIMI_API_KEY || '',
      api_key_env: 'KIMI_API_KEY',
    },
    zhipu: {
      provider: 'zhipu',
      base_url: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
      model: process.env.ZHIPU_MODEL || 'glm-4-flash',
      api_key: process.env.ZHIPU_API_KEY || '',
      api_key_env: 'ZHIPU_API_KEY',
    },
    openai: {
      provider: 'openai',
      base_url: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      api_key: process.env.OPENAI_API_KEY || '',
      api_key_env: 'OPENAI_API_KEY',
    },
    agnes: {
      provider: 'agnes',
      base_url: process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1',
      model: process.env.AGNES_MODEL || 'agnes-2.5-flash',
      api_key: process.env.AGNES_API_KEY || '',
      api_key_env: 'AGNES_API_KEY',
    },
    mock: { provider: 'mock', base_url: '', model: '', api_key: '', api_key_env: '' },
  };
  return configs[provider] || configs.mock;
}

// ---------------------------------------------------------------------------
// M27: AI call orchestration — auto-continuation on truncation plus a
// provider fallback chain (e.g. agnes -> deepseek via AI_FALLBACK_PROVIDER).
// Echo mode re-sends context with a continue instruction; prefix mode
// targets DeepSeek's /beta endpoint (prefix:true on the last assistant
// message) and is auto-selected for direct api.deepseek.com hosts.
// ---------------------------------------------------------------------------

const _CONTINUATION_USER_PROMPT =
  '你的上一次输出在 max_tokens 处被截断。请从截断处继续输出剩余内容：\n' +
  '1. 不要重复任何已生成的内容\n' +
  '2. 直接从中断处继续，保持代码完整与语法正确';

function _wantsPrefixMode(cfg) {
  const mode = (process.env.AI_CONTINUATION_MODE || 'auto').toLowerCase();
  if (mode === 'echo') return false;
  if (mode === 'prefix') return true;
  // auto: prefix only for direct DeepSeek hosts (gateway passthrough unknown)
  try {
    const host = new URL(cfg.base_url).hostname;
    return host === 'api.deepseek.com';
  } catch (_) {
    return false;
  }
}

function _stitchRaw(prev, next) {
  if (!prev) return next || '';
  let add = next || '';
  // Fence repair: an odd number of ``` markers means we are mid-fence;
  // continuation legs often open a fresh fence — drop it before joining.
  const fences = (prev.match(/```/g) || []).length;
  if (fences % 2 === 1) {
    add = add.replace(/^\s*```[a-zA-Z0-9_-]*\s*\r?\n?/, '');
  }
  // Overlap dedup: largest suffix-of-prev that prefixes add (<=200 chars).
  const maxK = Math.min(200, prev.length, add.length);
  for (let k = maxK; k > 0; k--) {
    if (prev.endsWith(add.slice(0, k))) {
      add = add.slice(k);
      break;
    }
  }
  return prev + add;
}

async function _callWithContinuation(cfg, messages) {
  const maxLegs = Math.max(1, parseInt(process.env.MAX_AI_CONTINUATIONS || '3', 10));
  const prefixMode = _wantsPrefixMode(cfg);
  let allRaw = '';
  let result = null;
  for (let leg = 0; leg < maxLegs; leg++) {
    let legMessages = messages;
    if (leg > 0) {
      legMessages = messages.slice();
      if (prefixMode) {
        // DeepSeek /beta semantics: the assistant prefix message must be
        // the FINAL message of the array — the model continues it
        // directly; anything after it makes the API reject the request.
        legMessages.push({ role: 'assistant', content: allRaw, prefix: true });
      } else {
        legMessages.push({ role: 'assistant', content: allRaw });
        legMessages.push({ role: 'user', content: _CONTINUATION_USER_PROMPT });
      }
    }
    const r = await _callOpenAiCompatible(cfg, legMessages, { prefixMode });
    const before = allRaw;
    allRaw = _stitchRaw(allRaw, r.content);
    console.info(`[ai_chat] leg ${leg + 1}/${maxLegs} provider=${cfg.provider} finish=${r.finish_reason || 'n/a'} raw_len=${allRaw.length}${leg > 0 ? ' (continued)' : ''}`);
    result = { ...r, content: allRaw };
    if ((r.finish_reason || 'stop') !== 'length') break;
    if (leg > 0 && allRaw === before) {
      console.warn('[ai_chat] continuation produced empty delta — stopping legs');
      break;
    }
  }
  return result;
}

async function _callAiWithFallback(cfg, aiMessages) {
  const attemptCfgs = [cfg];
  const fbName = (process.env.AI_FALLBACK_PROVIDER || '').toLowerCase();
  if (fbName && fbName !== cfg.provider) {
    const fb = _getAiProviderConfig(fbName);
    if (fb && fb.provider !== 'mock' && fb.api_key) attemptCfgs.push(fb);
  }
  let lastErr = null;
  for (let i = 0; i < attemptCfgs.length; i++) {
    const c = attemptCfgs[i];
    try {
      return await _callWithContinuation(c, aiMessages);
    } catch (e) {
      lastErr = e;
      const retriable = /\b(?:429|402|5\d\d)\b|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network error/i.test(String(e.message));
      const more = retriable && i < attemptCfgs.length - 1;
      console.warn(`[ai_chat] provider=${c.provider} failed: ${e.message}${more ? ' — falling back to ' + attemptCfgs[i + 1].provider : ''}`);
      if (!more) throw e;
    }
  }
  throw lastErr;
}
// ---------------------------------------------------------------------------
// M25: BYOK connection probe (自定义AI模型「测试连接」按钮).
// Validates base_url with the same SSRF rules as /ai/chat, then issues a
// cheap GET {base_url}/models against the user's provider. Never performs a
// chat completion, so probing costs no tokens. Probe OUTCOMES (upstream
// errors, timeouts) are returned as HTTP 200 {ok:false}; only malformed
// requests / rejected base_urls get 4xx, mirroring /ai/chat semantics.
// ---------------------------------------------------------------------------

function _probeModelsEndpoint(cfg) {
  return new Promise((resolve) => {
    const baseUrl = cfg.base_url.replace(/\/$/, '');
    let url;
    try {
      url = new URL(baseUrl + '/models');
    } catch (e) {
      resolve({ ok: false, error: `base_url 无法构造 /models 地址: ${e.message}` });
      return;
    }
    const headers = { Accept: 'application/json' };
    if (cfg.api_key) {
      headers.Authorization = `Bearer ${cfg.api_key}`;
    }
    const probeTimeout = parseInt(process.env.AI_PROBE_TIMEOUT_MS || '15000', 10);
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers,
      timeout: probeTimeout,
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode !== 200) {
          resolve({
            ok: false,
            status: res.statusCode,
            error: `上游返回 HTTP ${res.statusCode}: ${data.slice(0, 160)}`,
          });
          return;
        }
        let models = [];
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json.data)) {
            models = json.data.map((m) => m && m.id).filter(Boolean);
          } else if (Array.isArray(json.models)) {
            models = json.models.map((m) => m && (m.name || m.id)).filter(Boolean);
          }
        } catch (_) {
          // Reachable but non-JSON — treat as reachable without a list.
          resolve({ ok: true, status: 200, models: [] });
          return;
        }
        resolve({ ok: true, status: 200, models });
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: `连接失败: ${e.message}` }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: `连接超时（${Math.round(probeTimeout / 1000)}s）` });
    });
    req.end();
  });
}

async function handleAiProbe(req, res) {
  let body;
  try {
    body = await _readJsonBody(req);
  } catch (e) {
    _sendJson(res, 400, { error: 'Invalid JSON body', detail: e.message });
    return;
  }

  const baseUrl = typeof body.base_url === 'string' ? body.base_url.trim() : '';
  const apiKey = typeof body.api_key === 'string' ? body.api_key : '';
  const model = typeof body.model === 'string' ? body.model.trim() : '';

  if (!baseUrl) {
    _sendJson(res, 422, { error: 'Missing base_url', detail: '测试连接需要 base_url。' });
    return;
  }
  try {
    await _validateByokBaseUrl(baseUrl);
  } catch (e) {
    console.warn(`[ai_probe] base_url rejected: ${e.message}`);
    _sendJson(res, 422, { error: 'base_url 校验失败', detail: e.message });
    return;
  }

  let host = baseUrl;
  try { host = new URL(baseUrl).hostname; } catch (_) { /* keep raw */ }
  console.info(`[ai_probe] probing host=${host} model=${model || '(default)'}`);

  const result = await _probeModelsEndpoint({ base_url: baseUrl, api_key: apiKey });
  if (!result.ok) {
    console.info(`[ai_probe] failed: ${result.error}`);
    _sendJson(res, 200, { ok: false, status: result.status || null, error: result.error });
    return;
  }
  // A configured model name that the provider doesn't list is a soft warning,
  // not an error — several compatible gateways omit /models listings.
  const modelKnown = !model || result.models.length === 0 || result.models.includes(model);
  console.info(`[ai_probe] ok, models=${result.models.length}, model_known=${modelKnown}`);
  _sendJson(res, 200, {
    ok: true,
    status: result.status,
    model_count: result.models.length,
    models: result.models.slice(0, 50),
    model_known: modelKnown,
  });
}

async function handleSchema(req, res) {
  _sendJson(res, 200, getSchema());
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    _setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/health' && req.method === 'GET') {
      await handleHealth(req, res);
    } else if (pathname === '/compile' && req.method === 'POST') {
      await handleCompile(req, res);
    } else if (pathname === '/validate' && req.method === 'POST') {
      await handleValidate(req, res);
    } else if (pathname === '/decompile' && req.method === 'POST') {
      await handleDecompile(req, res);
    } else if (pathname === '/ai/chat' && req.method === 'POST') {
      await handleAiChat(req, res);
    } else if (pathname === '/ai/probe' && req.method === 'POST') {
      await handleAiProbe(req, res);
    } else if (pathname === '/schema' && req.method === 'GET') {
      await handleSchema(req, res);
    } else {
      _sendJson(res, 404, { error: 'Not found', detail: `Unknown route: ${req.method} ${pathname}` });
    }
  } catch (e) {
    console.error(`[server] Unhandled error on ${pathname}:`, e);
    _sendJson(res, 500, { error: 'Internal server error', detail: e.message });
  }
});

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Only start the server if this file is the main module (not imported by tests)
const _mainEntry = process.argv[1] ? path.resolve(process.argv[1]) : null;
const _thisFile = fileURLToPath(import.meta.url);
const isMainModule = _mainEntry === _thisFile;

if (isMainModule) {
  server.listen(PORT, HOST, () => {
    console.log(`[InstanceScratch Backend] listening on http://${HOST}:${PORT}`);
    console.log(`  CORS origins: ${_corsOrigins.join(', ')}`);
    console.log(`  Model provider: ${process.env.MODEL_PROVIDER || 'mock'}`);
    console.log(`  Allow server key: ${process.env.ALLOW_SERVER_KEY || 'false'}`);
  });
}

// M27b: keep the long-running tool server alive on stray async failures —
// log loudly instead of taking the whole backend down mid-session.
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err && err.stack || err);
});
process.on('unhandledRejection', (err) => {
  console.error('[fatal] unhandledRejection:', err && err.stack || err);
});

export { server, compileSource, _validateSource, _validateSb3Safety, _parseAiResponse, getSchema };
