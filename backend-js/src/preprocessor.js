// preprocessor.js — Token-stream macro expansion pass.
// Ported from goboscript/src/pre_processor.rs (1:1 alignment).
//
// Runs on the token array produced by lexer.js BEFORE parsing (upstream:
// parser.rs calls PreProcessor::apply(&mut tokens) after lexing, before the
// grammar). Implements:
//   - %define NAME body            simple macro (body = tokens until newline,
//                                  '\' continuation joins lines)
//   - %define NAME(a, b) body      function macro, overloaded by arity
//                                  (same arity redefines, different arities coexist)
//   - %undef NAME                  removes ALL overloads (simple + function)
//   - self-reference suppression   a macro in expansion is not re-expanded
//   - rescan after expansion       nested macros expand recursively
//   - STRINGIFY(...)               -> single Str token (parts joined by ' ')
//   - CONCAT(a, b)                 -> paste token texts, re-lex, must yield
//                                    exactly one token; result is rescanned
//
// Divergence from upstream (documented): upstream remove_marker_tokens strips
// Newline/Define/Undef/Backslash before parsing. This port strips only
// Define/Undef/Backslash: the JS recursive-descent parser (parser.js) still
// uses Newline as a statement terminator, unlike upstream's LALRPOP grammar.
// The JS lexer already splices '\' continuations away, so Backslash tokens
// only appear in hand-built streams; they are stripped for parity.

import { TokenType, Token, Lexer, LexError } from './lexer.js';

// ---------------------------------------------------------------------------
// Errors (upstream DiagnosticKind equivalents surfaced as exceptions)
// ---------------------------------------------------------------------------

export class PreProcessorError extends Error {
  /**
   * @param {string} kind upstream DiagnosticKind name
   * @param {string} message human-readable detail
   * @param {[number, number]} span [start, end] source offsets
   */
  constructor(kind, message, span = [0, 0]) {
    super(`${kind}: ${message}`);
    this.name = 'PreProcessorError';
    this.kind = kind;
    this.span = span;
  }
}

// ---------------------------------------------------------------------------
// Token -> text (mirrors Rust `impl Display for Token`)
// ---------------------------------------------------------------------------

const _KEYWORD_TEXT = {
  [TokenType.Define]: '%define', [TokenType.Undef]: '%undef',
  [TokenType.Newline]: '\n', [TokenType.Backslash]: '\\',
  [TokenType.Costumes]: 'costumes', [TokenType.Sounds]: 'sounds',
  [TokenType.Local]: 'local', [TokenType.Proc]: 'proc', [TokenType.Func]: 'func',
  [TokenType.Return]: 'return', [TokenType.NoWarp]: 'nowarp',
  [TokenType.On]: 'on', [TokenType.OnFlag]: 'onflag', [TokenType.OnKey]: 'onkey',
  [TokenType.OnClick]: 'onclick', [TokenType.OnBackdrop]: 'onbackdrop',
  [TokenType.OnLoudness]: 'onloudness', [TokenType.OnTimer]: 'ontimer',
  [TokenType.OnClone]: 'onclone',
  [TokenType.If]: 'if', [TokenType.Else]: 'else', [TokenType.Elif]: 'elif',
  [TokenType.Until]: 'until', [TokenType.WaitUntil]: 'wait_until',
  [TokenType.Forever]: 'forever', [TokenType.Repeat]: 'repeat',
  [TokenType.Not]: 'not', [TokenType.And]: 'and', [TokenType.Or]: 'or',
  [TokenType.In]: 'in',
  [TokenType.Length]: 'length', [TokenType.Round]: 'round', [TokenType.Abs]: 'abs',
  [TokenType.Floor]: 'floor', [TokenType.Ceil]: 'ceil', [TokenType.Sqrt]: 'sqrt',
  [TokenType.Sin]: 'sin', [TokenType.Cos]: 'cos', [TokenType.Tan]: 'tan',
  [TokenType.Asin]: 'asin', [TokenType.Acos]: 'acos', [TokenType.Atan]: 'atan',
  [TokenType.Ln]: 'ln', [TokenType.Log]: 'log', [TokenType.Antiln]: 'antiln',
  [TokenType.Antilog]: 'antilog',
  [TokenType.Show]: 'show', [TokenType.Hide]: 'hide',
  [TokenType.Add]: 'add', [TokenType.To]: 'to', [TokenType.Delete]: 'delete',
  [TokenType.Insert]: 'insert', [TokenType.At]: 'at', [TokenType.As]: 'as',
  [TokenType.Enum]: 'enum', [TokenType.Struct]: 'struct',
  [TokenType.True_]: 'true', [TokenType.False_]: 'false',
  [TokenType.List]: 'list', [TokenType.Cloud]: 'cloud', [TokenType.Var]: 'var',
  [TokenType.Orphan]: 'orphan',
  [TokenType.set_x]: 'set_x', [TokenType.set_y]: 'set_y',
  [TokenType.set_size]: 'set_size',
  [TokenType.point_in_direction]: 'point_in_direction',
  [TokenType.set_volume]: 'set_volume',
  [TokenType.set_rotation_style_left_right]: 'set_rotation_style_left_right',
  [TokenType.set_rotation_style_all_around]: 'set_rotation_style_all_around',
  [TokenType.set_rotation_style_do_not_rotate]: 'set_rotation_style_do_not_rotate',
  [TokenType.Comma]: ',', [TokenType.LParen]: '(', [TokenType.RParen]: ')',
  [TokenType.LBrace]: '{', [TokenType.RBrace]: '}', [TokenType.Assign]: '=',
  [TokenType.Eq]: '==', [TokenType.Increment]: '++', [TokenType.Decrement]: '--',
  [TokenType.AssignAdd]: '+=', [TokenType.AssignSubtract]: '-=',
  [TokenType.AssignMultiply]: '*=', [TokenType.AssignDivide]: '/=',
  [TokenType.AssignFloorDiv]: '//=', [TokenType.AssignModulo]: '%=',
  [TokenType.AssignJoin]: '&=', [TokenType.LBracket]: '[', [TokenType.RBracket]: ']',
  [TokenType.Dot]: '.', [TokenType.Ne]: '!=', [TokenType.Lt]: '<', [TokenType.Gt]: '>',
  [TokenType.Le]: '<=', [TokenType.Ge]: '>=', [TokenType.Amp]: '&',
  [TokenType.Plus]: '+', [TokenType.Minus]: '-', [TokenType.Star]: '*',
  [TokenType.Slash]: '/', [TokenType.FloorDiv]: '//', [TokenType.Percent]: '%',
  [TokenType.Semicolon]: ';', [TokenType.Colon]: ':', [TokenType.Pipe]: '|>',
  [TokenType.Question]: '?', [TokenType.Caret]: '^',
};

export function tokenToString(token) {
  switch (token.type) {
    case TokenType.Name: return token.value;
    case TokenType.Arg: return `$${token.value}`;
    case TokenType.Bin:
    case TokenType.Oct:
    case TokenType.Int:
    case TokenType.Hex:
    case TokenType.Float: return String(token.value);
    case TokenType.Str: return `"${token.value}"`;
    default: {
      const text = _KEYWORD_TEXT[token.type];
      return text !== undefined ? text : token.type;
    }
  }
}

function tokensEqual(a, b) {
  return a.type === b.type && Object.is(a.value, b.value);
}

function cloneToken(token, start = token.start, end = token.end) {
  return new Token(token.type, token.value, start, end);
}

function cloneDefines(functionDefines, simpleDefines) {
  const fn = new Map();
  for (const [name, overloads] of functionDefines) fn.set(name, new Map(overloads));
  return [fn, new Map(simpleDefines)];
}

const _RPAREN = Object.freeze(new Token(TokenType.RParen));

// ---------------------------------------------------------------------------
// PreProcessor
// ---------------------------------------------------------------------------

export class PreProcessor {
  constructor(tokens) {
    this.tokens = tokens;             // Token[] mutated in place
    this.i = 0;
    // name -> Token[] (body)
    this.simpleDefines = new Map();
    // name -> Map<arity, {params: Token[], body: Token[]}>
    this.functionDefines = new Map();
  }

  // ~ PreProcessor::apply
  apply() {
    this.process({ start: 0, end: this.tokens.length }, new Set());
    this.removeMarkerTokens();
    return this.tokens;
  }

  // ~ looksLikeProcDefinition — true when the Define token at index i opens
  // `define Name { ... }` or `define Name(params) { ... }`. Documented
  // superset: AI models habitually emit JS-style procedure definitions where
  // upstream only has constant/function macros (`define NAME value`). The
  // def-shape wins over the (exotic) brace-initial macro body; everything
  // else keeps exact macro semantics.
  looksLikeProcDefinition(i) {
    const toks = this.tokens;
    const isNoise = (t) => t.type === TokenType.Newline || t.type === TokenType.Backslash;
    if (!toks[i + 1] || toks[i + 1].type !== TokenType.Name) return false;
    let j = i + 2;
    while (j < toks.length && isNoise(toks[j])) j += 1;
    if (j >= toks.length) return false;
    if (toks[j].type === TokenType.LBrace) return true;
    if (toks[j].type !== TokenType.LParen) return false;
    let depth = 0;
    while (j < toks.length) {
      if (toks[j].type === TokenType.LParen) depth += 1;
      else if (toks[j].type === TokenType.RParen) {
        depth -= 1;
        if (depth === 0) break;
      }
      j += 1;
    }
    if (j >= toks.length) return false;
    j += 1;
    while (j < toks.length && isNoise(toks[j])) j += 1;
    return j < toks.length && toks[j].type === TokenType.LBrace;
  }

  // ~ PreProcessor::process
  process(span, suppress) {
    let dirty = false;
    this.i = span.start;
    while (this.i < span.end) {
      if (this.tokens[this.i].type === TokenType.Define &&
          this.looksLikeProcDefinition(this.i)) {
        // Rewrite in place to Proc so the parser's proc branch handles it
        // and the trailing marker-strip never has to know about it.
        this.tokens[this.i].type = TokenType.Proc;
        this.i += 1;
        continue;
      }
      const defineName = this.parseDefineBegin(span);
      if (defineName !== null) {
        if (this.parseFunctionDefine(span, defineName)) continue;
        this.parseSimpleDefine(span, defineName);
        continue;
      }
      if (this.parseUndef(span)) continue;
      if (this.substituteSimpleDefine(span, suppress)) continue;
      if (this.substituteFunctionDefine(span, suppress)) continue;
      if (this.substituteConcat(span, suppress)) { dirty = true; continue; }
      if (this.substituteStringify(span)) { dirty = true; continue; }
      this.i += 1;
    }
    if (dirty) {
      // Rescan the whole span: pasted/stringified tokens may themselves be
      // macro invocations (nested expansion).
      this.process(span, suppress);
    }
  }

  // ~ remove_marker_tokens — strips marker noise before parsing. Newline is
  // intentionally KEPT (see file header divergence note).
  removeMarkerTokens() {
    const kept = this.tokens.filter((tok) =>
      tok.type !== TokenType.Define &&
      tok.type !== TokenType.Undef &&
      tok.type !== TokenType.Backslash);
    this.tokens.length = 0;
    for (const tok of kept) this.tokens.push(tok);
  }

  expectNoEof() {
    if (this.i >= this.tokens.length) {
      const span = this.i > 0
        ? [this.tokens[this.i - 1].start, this.tokens[this.i - 1].end]
        : [0, 0];
      throw new PreProcessorError('UnrecognizedEof', 'unexpected end of input', span);
    }
  }

  removeToken(span) {
    this.tokens.splice(this.i, 1);
    span.end -= 1;
  }

  // ~ parse_define_begin: consumes `Define Name` and returns the name token.
  parseDefineBegin(span) {
    if (this.tokens[this.i].type !== TokenType.Define) return null;
    this.i += 1;
    this.expectNoEof();
    const name = this.tokens[this.i];
    this.i -= 1;
    this.removeToken(span);
    this.removeToken(span);
    return name;
  }

  // ~ parse_function_define: `%define NAME(a, b) body`. Returns false when
  // the next token is not `(` (caller falls back to a simple define).
  parseFunctionDefine(span, defineName) {
    this.expectNoEof();
    if (this.tokens[this.i].type !== TokenType.LParen) return false;
    this.i += 1;
    this.expectNoEof();
    let name = this.tokens[this.i];
    this.i -= 1;
    if (name.type !== TokenType.Name && name.type !== TokenType.RParen) return false;
    this.removeToken(span);
    const args = [];
    while (!tokensEqual(name, _RPAREN)) {
      if (name.type !== TokenType.Comma) args.push(cloneToken(name));
      this.removeToken(span);
      this.expectNoEof();
      name = this.tokens[this.i];
    }
    this.removeToken(span);
    const arity = args.length;
    const body = this.parseDefineBody(span);
    const key = tokenToString(defineName);
    let overloads = this.functionDefines.get(key);
    if (overloads === undefined) {
      overloads = new Map();
      this.functionDefines.set(key, overloads);
    }
    overloads.set(arity, { params: args, body }); // same arity overwrites
    return true;
  }

  // ~ parse_simple_define
  parseSimpleDefine(span, defineName) {
    const key = tokenToString(defineName);
    const body = this.parseDefineBody(span);
    this.simpleDefines.set(key, body); // redefinition replaces
  }

  // ~ parse_define_body: tokens until Newline; Backslash joins lines.
  parseDefineBody(span) {
    const body = [];
    this.expectNoEof();
    let token = this.tokens[this.i];
    while (true) {
      if (token.type === TokenType.Backslash) {
        // Line continuation: drop the backslash and the newline after it.
        this.removeToken(span);
        this.expectNoEof();
        this.removeToken(span);
        this.expectNoEof();
        token = this.tokens[this.i];
      }
      if (token.type === TokenType.Newline) break;
      body.push(cloneToken(token));
      this.removeToken(span);
      this.expectNoEof();
      token = this.tokens[this.i];
    }
    this.removeToken(span); // consume the terminating Newline
    return body;
  }

  // ~ substitute_simple_define
  substituteSimpleDefine(span, suppress) {
    const tok = this.tokens[this.i];
    const nameSpan = [tok.start, tok.end];
    const macroName = tokenToString(tok);
    const body = this.simpleDefines.get(macroName);
    if (body === undefined) return false;
    if (suppress.has(macroName)) return false; // self-reference suppression
    if (body.length === 0) {
      this.tokens.splice(this.i, 1);
      span.end = Math.max(0, span.end - 1);
      return true;
    }
    const inserted = body.map((t) => cloneToken(t, nameSpan[0], nameSpan[1]));
    this.tokens.splice(this.i, 1, ...inserted);
    const innerSuppress = new Set(suppress);
    innerSuppress.add(macroName);
    span.end += inserted.length - 1;
    const subspanEnd = this.i + inserted.length;
    const subspan = { start: this.i, end: subspanEnd };
    this.process(subspan, innerSuppress); // rescan the expansion (nesting)
    span.end += subspan.end - subspanEnd;
    return true;
  }

  // ~ substitute_function_define
  substituteFunctionDefine(span, suppress) {
    const tok = this.tokens[this.i];
    const nameSpan = [tok.start, tok.end];
    const macroName = tokenToString(tok);
    const overloads = this.functionDefines.get(macroName);
    if (overloads === undefined) return false;
    if (suppress.has(macroName)) return false;
    const next = this.tokens[this.i + 1];
    if (next === undefined || next.type !== TokenType.LParen) return false;

    const [args] = this.parseMacroCallArgs(span);
    const arity = args.length;
    const def = overloads.get(arity);
    if (def === undefined) {
      const expected = overloads.keys().next();
      throw new PreProcessorError(
        'MacroArgsCountMismatch',
        `macro '${macroName}' expects ${expected.done ? 0 : expected.value} argument(s), given ${arity}`,
        nameSpan,
      );
    }
    const { params, body } = def;
    let j = this.i;
    for (const bodyTok of body) {
      const pos = params.findIndex((p) => tokensEqual(p, bodyTok));
      if (pos >= 0) {
        for (const argTok of args[pos]) {
          this.tokens.splice(j, 0, cloneToken(argTok, nameSpan[0], nameSpan[1]));
          j += 1;
          span.end += 1;
        }
      } else {
        this.tokens.splice(j, 0, cloneToken(bodyTok, nameSpan[0], nameSpan[1]));
        j += 1;
        span.end += 1;
      }
    }
    const innerSuppress = new Set(suppress);
    innerSuppress.add(macroName);
    const subspan = { start: this.i, end: j };
    this.process(subspan, innerSuppress);
    span.end += subspan.end - j;
    return true;
  }

  // ~ parse_undef: removes ALL overloads for the name.
  parseUndef(span) {
    if (this.tokens[this.i].type !== TokenType.Undef) return false;
    this.removeToken(span);
    this.expectNoEof();
    const name = tokenToString(this.tokens[this.i]);
    this.functionDefines.delete(name);
    this.simpleDefines.delete(name);
    this.removeToken(span);
    return true;
  }

  // ~ substitute_stringify: STRINGIFY(...) -> single Str token.
  substituteStringify(span) {
    const tok = this.tokens[this.i];
    if (tok.type !== TokenType.Name || tok.value !== 'STRINGIFY') return false;
    const nameSpan = [tok.start, tok.end];
    const next = this.tokens[this.i + 1];
    if (next === undefined || next.type !== TokenType.LParen) return false;
    this.removeToken(span); // STRINGIFY
    this.removeToken(span); // (
    this.expectNoEof();
    const parts = [];
    let parens = 0;
    while (true) {
      const cur = this.tokens[this.i];
      if (cur.type === TokenType.RParen && parens === 0) {
        this.removeToken(span);
        break;
      }
      if (cur.type === TokenType.LParen) parens += 1;
      else if (cur.type === TokenType.RParen) parens -= 1;
      parts.push(tokenToString(cur));
      this.removeToken(span);
      this.expectNoEof();
    }
    this.tokens.splice(this.i, 0,
      new Token(TokenType.Str, parts.join(' '), nameSpan[0], nameSpan[1]));
    span.end += 1;
    return true;
  }

  // ~ parse_macro_call_args: consumes `NAME ( a, b )`, returns argument
  // token-lists split on top-level commas (nested parens respected).
  parseMacroCallArgs(span) {
    this.removeToken(span); // macro name
    const open = this.tokens[this.i];
    if (open === undefined || open.type !== TokenType.LParen) {
      throw new PreProcessorError(
        'UnrecognizedToken',
        `expected '(', got ${open ? open.type : 'EOF'}`,
        open ? [open.start, open.end] : [0, 0],
      );
    }
    this.removeToken(span);
    this.expectNoEof();

    const argsStart = this.i;
    let token = this.tokens[this.i];
    const args = [];
    let arg = [];

    if (token.type !== TokenType.RParen) {
      let parens = 0;
      while (parens >= 0) {
        if (token.type === TokenType.LParen) {
          parens += 1;
          arg.push(cloneToken(token));
        } else if (token.type === TokenType.RParen) {
          parens -= 1;
          if (parens < 0) {
            args.push(arg);
            arg = [];
          } else {
            arg.push(cloneToken(token));
          }
        } else if (token.type === TokenType.Comma && parens === 0) {
          args.push(arg);
          arg = [];
        } else {
          arg.push(cloneToken(token));
        }
        this.removeToken(span);
        if (parens >= 0) {
          this.expectNoEof();
          token = this.tokens[this.i];
        }
      }
    } else {
      this.removeToken(span); // `()` — zero arguments
    }

    const argsEnd = this.i;
    return [args, argsStart, argsEnd];
  }

  // ~ expand_token_list: expand a detached token list with cloned defines.
  expandTokenList(tokens, suppress) {
    const spanned = tokens.map((t) => cloneToken(t, 0, 0));
    if (spanned.length > 0) {
      const sub = new PreProcessor(spanned);
      [sub.functionDefines, sub.simpleDefines] =
        cloneDefines(this.functionDefines, this.simpleDefines);
      sub.process({ start: 0, end: spanned.length }, suppress);
      sub.removeMarkerTokens();
    }
    return spanned;
  }

  // ~ peek_macro_call_args: look ahead without consuming; null if no `(`.
  peekMacroCallArgs() {
    let k = this.i + 1;
    if (k >= this.tokens.length || this.tokens[k].type !== TokenType.LParen) {
      return null;
    }
    k += 1;
    if (k >= this.tokens.length) {
      const prev = this.tokens[k - 1];
      throw new PreProcessorError('UnrecognizedEof', 'unexpected end of input',
        [prev.start, prev.end]);
    }
    const args = [];
    let arg = [];
    let token = this.tokens[k];
    if (token.type !== TokenType.RParen) {
      let parens = 0;
      while (parens >= 0) {
        if (token.type === TokenType.LParen) {
          parens += 1;
          arg.push(cloneToken(token));
        } else if (token.type === TokenType.RParen) {
          parens -= 1;
          if (parens < 0) {
            args.push(arg);
            arg = [];
          } else {
            arg.push(cloneToken(token));
          }
        } else if (token.type === TokenType.Comma && parens === 0) {
          args.push(arg);
          arg = [];
        } else {
          arg.push(cloneToken(token));
        }
        k += 1;
        if (parens >= 0) {
          if (k >= this.tokens.length) {
            const prev = this.tokens[k - 1];
            throw new PreProcessorError('UnrecognizedEof', 'unexpected end of input',
              [prev.start, prev.end]);
          }
          token = this.tokens[k];
        }
      }
    }
    return args;
  }

  // ~ concat_tokens: paste two token texts and re-lex; the result must be
  // exactly one token covering the whole pasted text.
  concatTokens(left, right, span) {
    const pasted = tokenToString(left) + tokenToString(right);
    try {
      const tokens = new Lexer(pasted).lex();
      if (tokens.length === 1 && tokens[0].start === 0 && tokens[0].end === pasted.length) {
        return tokens[0];
      }
    } catch (e) {
      if (e instanceof LexError) {
        throw new PreProcessorError('InvalidToken', `CONCAT cannot paste '${pasted}'`, span);
      }
      throw e;
    }
    throw new PreProcessorError('InvalidToken', `CONCAT cannot paste '${pasted}'`, span);
  }

  // ~ substitute_concat: arguments are macro-expanded BEFORE pasting; on
  // invalid pastes the error is raised before any token is consumed.
  substituteConcat(span, suppress) {
    const tok = this.tokens[this.i];
    if (tok.type !== TokenType.Name || tok.value !== 'CONCAT') return false;
    const nameSpan = [tok.start, tok.end];

    const args = this.peekMacroCallArgs();
    if (args === null) return false;

    if (args.length !== 2) {
      throw new PreProcessorError(
        'MacroArgsCountMismatch',
        `CONCAT expects 2 arguments, given ${args.length}`,
        nameSpan,
      );
    }

    const left = this.expandTokenList(args[0], suppress);
    const right = this.expandTokenList(args[1], suppress);

    if (left.length !== 1 || right.length !== 1) {
      throw new PreProcessorError(
        'InvalidToken',
        'CONCAT arguments must each expand to exactly one token',
        nameSpan,
      );
    }

    const pasted = this.concatTokens(left[0], right[0], nameSpan);

    this.parseMacroCallArgs(span); // now consume NAME ( a, b )
    this.tokens.splice(this.i, 0, pasted);
    span.end += 1;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Entry point: expand macros on a lexer.js token array (in place).
// ---------------------------------------------------------------------------

export function preprocess(tokens) {
  return new PreProcessor(tokens).apply();
}
