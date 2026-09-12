// AI generation + multi-round self-repair pipeline.
// Pure logic, no chrome/browser deps — reusable by the background worker and
// the local test harness. Guarantees the returned code is runnable: it
// validates, checks "no call without definition", enforces a single onflag,
// and falls back to a deterministic stdlib program on persistent failure.
import { validateSource } from '../../build/compiler.mjs';
import { buildSystemPrompt } from './system-prompt.js';

const STDLIB = {
  json: {
    re: /json/i,
    name: 'def_json_get',
    code: [
      'func def_json_get(s, key) {',
      '    local i = 1;',
      '    while (i <= length(s)) {',
      '        local k = def_json_key(s, i);',
      '        if (k == key) { return def_json_val(s, i); }',
      '        i += 1;',
      '    }',
      '    return "";',
      '}',
      'func def_json_key(s, idx) {',
      '    local i = idx;',
      '    while (i <= length(s)) {',
      '        local ch = letter_of(i, s);',
      '        if (ch == ":") {',
      '            local k = ""; local j = idx;',
      '            while (j < i) {',
      '                local c2 = letter_of(j, s);',
      '                if (c2 != "\\"" and c2 != "{" and c2 != " " and c2 != ",") { k = k & c2; }',
      '                j += 1;',
      '            }',
      '            return k;',
      '        }',
      '        i += 1;',
      '    }',
      '    return "";',
      '}',
      'func def_json_val(s, idx) {',
      '    local i = idx; local found = 0; local v = "";',
      '    while (i <= length(s)) {',
      '        local ch = letter_of(i, s);',
      '        if (ch == ":") { found = 1; }',
      '        else if (found == 1) {',
      '            if (ch == "\\"") { found = 2; }',
      '            else if (ch == "," or ch == "}") { if (found == 2) { return v; } }',
      '            else { if (found == 2) { v = v & ch; } }',
      '        }',
      '        i += 1;',
      '    }',
      '    return v;',
      '}',
      'onflag {',
      '    say(def_json_get("{\\"name\\":\\"amy\\",\\"age\\":7}", "name"));',
      '}',
    ].join('\n'),
  },
  regex: {
    re: /正则|regex|regexp/i,
    name: 'def_regex_test',
    code: [
      'func def_regex_test(text, pattern) {',
      '    local n = length(text); local m = length(pattern); local i = 1;',
      '    while (i <= n) {',
      '        local j = 1; local ok = 1;',
      '        while (j <= m and ok == 1) {',
      '            local pc = letter_of(j, pattern);',
      '            local tc = letter_of(i + j - 1, text);',
      '            if (pc != "." and pc != tc) { ok = 0; }',
      '            j += 1;',
      '        }',
      '        if (ok == 1) { return 1; }',
      '        i += 1;',
      '    }',
      '    return 0;',
      '}',
      'onflag {',
      '    say(def_regex_test("aaab", "aab"));',
      '    say(def_regex_test("aaab", "zzz"));',
      '}',
    ].join('\n'),
  },
};

function sanitize(s) { return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''); }

/**
 * Extract goboscript code from an AI response.
 * Also attempts to fix common Scratch-like syntax mistakes.
 */
function extractCode(raw) {
  let s = sanitize(raw);
  // Remove markdown fences
  s = s.replace(/```(?:goboscript|gs|scratch)?/gi, '');
  const lines = s.split('\n');
  const out = [];
  let started = false;
  for (const ln of lines) {
    const t = ln.trim();
    if (!started) {
      if (t === '' || t.startsWith('```')) continue;
      if (/^(var |list |func |proc |onflag|onkey|onclick|onbackdrop|onclone|onloudness|ontimer|on |target|costumes|%define|%include)/.test(t)) {
        started = true; out.push(ln);
      }
      continue;
    }
    if (t.startsWith('EXPLANATION:')) break;
    out.push(ln);
  }
  let code = out.join('\n');
  // Apply syntax fixes for common Scratch-like patterns
  code = normalizeGoboscript(code);
  return code;
}

/**
 * Parse the AI output for block-removal directives.
 * The AI can include lines like:
 *   # DEL: event_whenflagclicked
 *   # DEL: motion_movesteps
 * to indicate which existing top-level blocks to remove from the sprite.
 * Returns an array of opcodes to remove.
 */
function parseRemoveOpcodes(raw) {
  const s = String(raw || '');
  // Support multiple directive styles:
  //   # DEL: opcode
  //   #DEL opcode
  //   REMOVE: opcode
  //   # 删除: opcode
  // A single line may list several opcodes separated by commas/spaces.
  const re = /^#?\s*(?:DEL|DELETE|REMOVE|删除|移除)\s*:?\s*([A-Za-z0-9_, ]+)/gim;
  const result = [];
  let m;
  while ((m = re.exec(s))) {
    if (!m[1]) continue;
    // Split by commas or whitespace
    const parts = m[1].split(/[,\s]+/).map((p) => p.trim()).filter((p) => /^[A-Za-z0-9_]+$/.test(p));
    for (const p of parts) {
      if (!result.includes(p)) result.push(p);
    }
  }
  return result;
}

/**
 * Attempt to normalize common non-goboscript patterns to valid goboscript.
 * Handles cases where the AI model generates Scratch-block-like syntax.
 */
function normalizeGoboscript(code) {
  if (!code || code.trim() === '') return code;

  // Only try to fix when code has obvious Scratch-style constructs
  const hasScratchSyntax =
    /\bset\s+\w+\s+to\b/.test(code) ||
    /\blet\s+\w+\s*=\s*/.test(code) ||
    /\bchange\s+\w+\s+by\b/.test(code) ||
    /length\s+of\b/.test(code) ||
    /item\s*\(/.test(code) ||
    /<\s*\(/.test(code);

  if (!hasScratchSyntax) return code;

  // 1. Convert `let x = value` to `local x = value`
  code = code.replace(/\blet\s+([A-Za-z_]\w*)\s*=\s*/g, 'local $1 = ');

  // 2. Convert `set var to expr` to `var = expr`
  code = code.replace(/set\s+([A-Za-z_]\w*)\s+to\s+(.+?)(?=;|$)/g, '$1 = $2');

  // 3. Convert `change var by expr` to `var += expr`
  code = code.replace(/change\s+([A-Za-z_]\w*)\s+by\s+(.+?)(?=;|$)/g, '$1 += $2');

  // 4. Convert `length of arr` to `length(arr)`
  code = code.replace(/\blength\s+of\s+([A-Za-z_]\w*)/g, 'length($1)');

  // 5. Convert `item (i) of list` to `list[i]`
  code = code.replace(/item\s*\(\s*([^)]+)\)\s+of\s+([A-Za-z_]\w*)/g, '$2[$1]');

  // 6. Convert `<(...) > (...)` comparison to `(...) > (...)`
  code = code.replace(/<\s*\(([^)]+)\)\s*>\s*\(([^)]+)\)/g, '($1 > $2)');

  // 7. Ensure semicolons on statements
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trimEnd();
    if (!t || t.endsWith('{') || t.endsWith('}') || t.endsWith(';')) continue;
    if (/^(func|var|local|if|else|while|repeat|forever|onflag|onkey|onclick|on )/.test(t.trim())) {
      continue;
    }
    if (t.trim().startsWith('//')) continue;
    lines[i] = t + ';';
  }
  code = lines.join('\n');

  return code;
}

function hasCallWithoutDefinition(code) {
  const defs = new Set(); const calls = [];
  const reDef = /^func\s+(def_[A-Za-z0-9_]+)\b/gm;
  const reCall = /(def_[A-Za-z0-9_]+)\s*\(/g;
  let m;
  while ((m = reDef.exec(code))) defs.add(m[1]);
  while ((m = reCall.exec(code))) calls.push(m[1]);
  return calls.filter((c) => !defs.has(c));
}

function countOnflag(code) { return (code.match(/^onflag\s*\{/gm) || []).length; }

// callModel is injected so the background can reuse its own fetch path.
export async function generateAndRepair(userPrompt, settings, callModel, convHistory, currentBlocksContext, onStream) {
  const maxRounds = Math.max(1, settings.max_rounds || 5);
  let history = [
    { role: 'system', content: buildSystemPrompt() },
  ];
  // Include conversation history for context (keep last 6 messages)
  if (Array.isArray(convHistory) && convHistory.length > 0) {
    const recent = convHistory.slice(-6).map(m => ({
      role: m.role === 'bot' ? 'assistant' : (m.role === 'user' ? 'user' : 'assistant'),
      content: m.code ? m.content + '\n\n```goboscript\n' + m.code + '\n```' : m.content
    }));
    history = history.concat(recent);
  }
  // Include current blocks context as a system-level instruction
  let enhancedPrompt = userPrompt;
  if (currentBlocksContext) {
    enhancedPrompt = userPrompt + '\n\n[当前角色积木上下文]\n' + currentBlocksContext;
  }
  history.push({ role: 'user', content: enhancedPrompt });
  let lastCode = null;
  let lastExplanation = '';
  let lastRemoveOpcodes = [];

  const stream = typeof onStream === 'function' ? onStream : null;

  for (let round = 0; round < maxRounds; round++) {
    let result;
    try {
      // callModel may either return {content} directly or a streaming async
      // iterator of chunks (yielded via an object with [Symbol.asyncIterator]).
      const r = await callModel(history, { maxTokens: settings.max_tokens, temperature: settings.temperature });
      if (r && typeof r[Symbol.asyncIterator] === 'function') {
        // Streaming modelFn: accumulate chunks while forwarding increments.
        let full = '';
        for await (const chunk of r) {
          full += chunk;
          if (stream) stream(chunk, 'delta');
        }
        result = { content: full, finish_reason: 'stop' };
      } else {
        result = r;
        if (stream && result && result.content) stream(result.content, 'round');
      }
    } catch (e) { return { ok: false, stage: 'ai_error', error: e.message }; }

    lastExplanation = result.content.split('\n').filter((l) => /^EXPLANATION:/i.test(l)).join('\n').replace(/^EXPLANATION:\s*/i, '');
    // Parse block removal directives from AI output
    lastRemoveOpcodes = parseRemoveOpcodes(result.content);
    let code = extractCode(result.content);
    let errors = validateSource(code);

    if (errors.length === 0) {
      const missing = hasCallWithoutDefinition(code);
      if (missing.length === 0) {
        if (countOnflag(code) <= 1) {
          lastCode = code;
          return { ok: true, code, explanation: lastExplanation || '生成成功', rounds: round + 1, removeOpcodes: lastRemoveOpcodes };
        }
        errors = [{ message: '存在多个 onflag 事件块，会产生并发线程相互干扰。请合并为同一个 onflag 块。' }];
      } else {
        errors = [{ message: '存在只有调用没有定义的函数：' + missing.join(', ') + '。请补充对应的 func 定义。' }];
      }
    }

    history.push({ role: 'assistant', content: result.content });
    history.push({
      role: 'user',
      content: '你的代码校验失败，请修复后重新输出完整可运行代码（不要省略任何已定义函数）。\n错误：\n' +
        errors.map((e) => `L${e.line || '?'}:${e.column || '?'} ${e.message}`).join('\n') +
        '\n规则：所有调用的函数都必须有 func def_xxx 定义；最多一个 onflag 块；不要在函数内用 local 声明列表（改用顶层 var 列表）。' +
        '\n语法要求：必须使用 var 声明顶层变量，local 声明局部变量，语句以分号结尾，列表用 list[i] 索引（1-based），长度用 length(list)。' +
        '\n参考语法示例：' +
        '\n  var x = 0; local i = 1; x += 1; if (x > 5) { say(x); }' +
        '\n  func def_add(a, b) { return a + b; } onflag { say(def_add(1, 2)); }',
    });
    lastCode = code;
  }

  const fb = stdlibFallback(userPrompt);
  if (fb) return { ok: true, code: fb, explanation: '（算法已由系统标准库保底合成，保证可运行。）', rounds: maxRounds, fallback: true };
  return { ok: false, stage: 'unresolved', error: '经过 ' + maxRounds + ' 轮修复后仍无法通过校验', code: lastCode };
}

export function stdlibFallback(userPrompt) {
  for (const k of Object.keys(STDLIB)) {
    if (STDLIB[k].re.test(userPrompt)) {
      const code = STDLIB[k].code;
      if (validateSource(code).length === 0) return code;
    }
  }
  return null;
}
