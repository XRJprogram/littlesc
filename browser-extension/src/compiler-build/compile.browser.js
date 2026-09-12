// Browser-runnable goboscript compiler entry.
// Mirrors backend-js/src/server.js compileSource + _validateSource, but
// returns { projectJson, arrayBuffer, blockCount } using the browser-patched
// CodeGen.makeSb3 (JSZip-backed).
import { lex, LexError, TokenType, KEYWORDS } from '../../../backend-js/src/lexer.js';
import { parse, Parser, ParseError } from '../../../backend-js/src/parser.js';
import { preprocess, PreProcessorError } from '../../../backend-js/src/preprocessor.js';
import { visitProjectPass0, visitProjectPass1, visitProjectPass2, visitProjectDCE } from '../../../backend-js/src/visitor.js';
import { CodeGen } from './codegen.browser.js';
import { Project } from '../../../backend-js/src/ast_nodes.js';

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

const _DIAGNOSTIC_MESSAGES = {
  VariableRedefinition: '重复声明：该名字此前已声明过。变量用 `var 名 = 值;` 只能声明一次，之后再赋值请直接写 `名 = 值;`；列表用 `list 名;` 声明，且不能与变量同名。',
  FixedLengthListInvalid: '列表固定长度写法无效：`list 名 = [默认值; 个数]` 的个数必须是正整数常量。',
};

function _sanitizeSource(src) {
  return src.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function _spriteHasContent(s) {
  return (s.costumes.length > 0 || s.sounds.length > 0 ||
    Object.keys(s.vars).length > 0 || Object.keys(s.lists).length > 0 ||
    s.events.length > 0 || Object.keys(s.procs).length > 0 ||
    Object.keys(s.funcs).length > 0 || s.orphanChains.length > 0 ||
    Object.keys(s.enums).length > 0 || Object.keys(s.structs).length > 0);
}

function _toUserSourceParseError(userSource, prefixLen, e) {
  const off = Math.max(0, (e.pos || 0) - prefixLen);
  const [line, col] = _offsetToLineCol(userSource, off);
  const err = new Error(`L${line}:${col} ${e.message}`);
  err.line = line;
  err.column = col;
  return err;
}

export function validateSource(source) {
  source = _sanitizeSource(source);
  const errors = [];
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
  // naming convention check
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
      const raw = source.slice(nameTok.start || 0, nameTok.end || 0);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) continue;
      const isNameTok = nameTok.type === TokenType.Name;
      const isKwSlot = !isNameTok && Object.prototype.hasOwnProperty.call(KEYWORDS, raw);
      if (!isNameTok && !isKwSlot) continue;
      if (/^def_/.test(raw)) continue;
      const [ln, cl] = _offsetToLineCol(source, nameTok.start || 0);
      errors.push({ line: ln, column: cl, message: '函数名必须以 def 开头（保留字保护）：' + raw + ' → def_' + raw, kind: 'NamingError' });
      namingErrors++;
    }
  }
  const parser = new Parser(tokens);
  parser.skipNoise();
  while (!parser.isAtEnd()) {
    try {
      parser.declaration();
    } catch (e) {
      if (e instanceof ParseError) {
        const [line, col] = _offsetToLineCol(source, e.pos);
        errors.push({ line, column: col, message: e.message, kind: 'ParseError' });
        if (e.inBody) break;
        parser.skipToNextStatement();
        parser.skipNoise();
        continue;
      }
      throw e;
    }
    parser.skipNoise();
  }
  for (const d of (parser.diagnostics || [])) {
    const start = d.span ? d.span[0] : 0;
    const end = d.span && d.span.length > 1 ? d.span[1] : start;
    const [line, col] = _offsetToLineCol(source, start);
    const snippet = end > start ? source.slice(start, end).trim() : '';
    const base = _DIAGNOSTIC_MESSAGES[d.kind] || ('编译诊断：' + d.kind);
    errors.push({ line, column: col, message: snippet ? `${base}（出错位置：${snippet}）` : base, kind: d.kind || 'Diagnostic' });
  }
  return errors;
}

export async function compileSource(userSource) {
  userSource = _sanitizeSource(userSource);
  const stageSource = `costumes "cd21514d0531fdffb22204e0ec5ed84a.svg";\n`;
  const prefix = '';
  const suffix = userSource.endsWith('\n') ? '' : '\n';
  const spriteSource = prefix + userSource + suffix;

  const stageTokens = preprocess(lex(stageSource));
  const stageSprite = parse(stageTokens);

  let sprite1;
  try {
    sprite1 = parse(preprocess(lex(spriteSource)));
  } catch (e) {
    if (e instanceof ParseError) throw _toUserSourceParseError(userSource, prefix.length, e);
    throw e;
  }

  const dropped = (sprite1.diagnostics || []).filter(d => d.kind === 'ParseError');
  if (dropped.length > 0) {
    const firstSpan = dropped[0].span || [];
    const off = Math.max(0, (typeof firstSpan[0] === 'number' ? firstSpan[0] : 0) - prefix.length);
    const [line, col] = _offsetToLineCol(userSource, off);
    const firstReason = dropped[0].message ? `：${dropped[0].message}` : '';
    const err = new Error(`L${line}:${col} 语法错误，该语句已被跳过（共 ${dropped.length} 处），项目不完整；请修复后重新编译${firstReason}`);
    err.line = line; err.column = col; err.errorCount = dropped.length; err.firstReason = dropped[0].message || null;
    throw err;
  }

  const extras = sprite1._extraTargets || [];
  const spritesMap = {};
  if (_spriteHasContent(sprite1) || extras.length === 0) {
    spritesMap[sprite1.name || 'Sprite1'] = sprite1;
  }
  let projectStage = stageSprite;
  for (const ext of extras) {
    ext.sprite.name = ext.isStage ? 'Stage' : ext.name;
    if (ext.isStage) projectStage = ext.sprite;
    else spritesMap[ext.name] = ext.sprite;
  }
  if (Object.keys(spritesMap).length === 0) spritesMap['Sprite1'] = sprite1;

  const project = new Project(projectStage, spritesMap);
  visitProjectPass0(project);
  visitProjectPass1(project);
  visitProjectPass2(project);
  visitProjectDCE(project);

  const codegen = new CodeGen();
  const arrayBuffer = await codegen.makeSb3(project);
  return arrayBuffer;
}

export function countBlocks(projectJson) {
  let count = 0;
  for (const target of (projectJson.targets || [])) {
    const blocks = target.blocks || {};
    for (const bid in blocks) {
      if (typeof blocks[bid] === 'object' && !Array.isArray(blocks[bid])) count++;
    }
  }
  return count;
}
