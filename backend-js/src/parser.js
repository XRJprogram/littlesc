// parser.js — Recursive-descent parser for goboscript
// Ported from goboscript/parser.py (1:1 alignment)

import { TokenType, Token, KEYWORDS } from './lexer.js';

// M14/C-P2: single module-level set derived from the lexer so it can never
// drift from TokenType, and no per-statement allocation in parseStmt.
const EVENT_TOKENS = new Set(
    Object.values(TokenType).filter(t =>
        typeof t === 'string' && t.startsWith('On'))
);
import {
  Name, DotName, Value, TypeValue, TypeStruct,
  ExprValue, ExprName, ExprDot, ExprArg, ExprRepr, ExprFuncCall,
  ExprUnOp, ExprBinOp, ExprTernary, ExprStructLiteral, ExprProperty,
  StructLiteralField,
  StmtRepeat, StmtForever, StmtBranch, StmtUntil, StmtWaitUntil,
  StmtSetVar, StmtChangeVar, StmtShow, StmtHide,
  StmtAddToList, StmtDeleteList, StmtDeleteListIndex,
  StmtInsertAtList, StmtSetListIndex,
  StmtBlock, StmtProcCall, StmtFuncCall, StmtReturn,
  Arg, Var, ListNode, ListDefaultValues, ListDefaultFile,
  Proc, Func, StructField, Struct, EnumVariant, EnumNode,
  EventKind, Event, Asset, RotationStyle,
  ConstExprValue, ConstExprEnumVariant, ConstExprStructLiteral,
  Sprite, Diagnostic,
} from './ast_nodes.js';
import { Block, Repr, UnOp, BinOp, blockFromShape, reprFromShape } from './blocks.js';

// ---------------------------------------------------------------------------
// Unary operator keyword -> UnOp mapping
// ---------------------------------------------------------------------------

const _UNOP_KEYWORDS = {
  [TokenType.Not]: UnOp.Not,
  [TokenType.Length]: UnOp.Length,
  [TokenType.Round]: UnOp.Round,
  [TokenType.Abs]: UnOp.Abs,
  [TokenType.Floor]: UnOp.Floor,
  [TokenType.Ceil]: UnOp.Ceil,
  [TokenType.Sqrt]: UnOp.Sqrt,
  [TokenType.Sin]: UnOp.Sin,
  [TokenType.Cos]: UnOp.Cos,
  [TokenType.Tan]: UnOp.Tan,
  [TokenType.Asin]: UnOp.Asin,
  [TokenType.Acos]: UnOp.Acos,
  [TokenType.Atan]: UnOp.Atan,
  [TokenType.Ln]: UnOp.Ln,
  [TokenType.Log]: UnOp.Log,
  [TokenType.Antiln]: UnOp.AntiLn,
  [TokenType.Antilog]: UnOp.AntiLog,
};

// ---------------------------------------------------------------------------
// Fixed-length list default expansion (grammar L92: `[default; length]`)
// ---------------------------------------------------------------------------

const _FIXED_LENGTH_LIST_MAX = 200000;

// Compound-assignment operator tokens shared by Name / Name.field /
// Name[i] / Name[i].f statement forms (grammar.lalrpop L163-329).
const _COMPOUND_ASSIGN_OPS = [
  TokenType.Increment, TokenType.Decrement,
  TokenType.AssignAdd, TokenType.AssignSubtract,
  TokenType.AssignMultiply, TokenType.AssignDivide,
  TokenType.AssignFloorDiv, TokenType.AssignModulo,
  TokenType.AssignJoin,
];

function _constExprToValue(ce) {
  // Unwrap ConstExpr wrappers into a plain Value so codegen's
  // ListDefaultValues handling emits them directly.
  if (ce instanceof ConstExprValue) return ce.value;
  return ce;
}

function _expandFixedLengthList(defaultExpr, lengthExpr, lengthSpan, diagnostics) {
  const lenVal = lengthExpr instanceof ConstExprValue ? lengthExpr.value : null;
  const len = lenVal ? lenVal.toNumber() : NaN;
  if (!isFinite(len) || len < 0 || len > _FIXED_LENGTH_LIST_MAX) {
    // Mirrors upstream DiagnosticKind::FixedLengthListInvalid 鈫?empty list.
    diagnostics.push(new Diagnostic('FixedLengthListInvalid', lengthSpan));
    return [];
  }
  return new Array(Math.floor(len)).fill(_constExprToValue(defaultExpr));
}

// ---------------------------------------------------------------------------
// ParseError
// ---------------------------------------------------------------------------

export class ParseError extends Error {
  constructor(message, pos = 0) {
    super(message);
    this.message = message;
    this.pos = pos;
  }
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.sprite = new Sprite();
    this.sprite.name = 'Sprite1';
    this.diagnostics = [];
    this._parenDepth = 0;
    // Multi-target sections (`target "Name";` / `target stage;` — documented
    // InstanceScratch extension; upstream uses one file per sprite). All
    // declarations after a directive land in that target until the next one.
    this.extraTargets = []; // { name, isStage, sprite }
  }

  _switchTarget(name, isStage) {
    let entry = this.extraTargets.find(t => t.name === name);
    if (!entry) {
      const sp = new Sprite();
      sp.name = isStage ? 'Stage' : name;
      entry = { name, isStage, sprite: sp };
      this.extraTargets.push(entry);
    }
    this.sprite = entry.sprite;
  }

  // ------------------------------------------------------------------
  // Token stream helpers
  // ------------------------------------------------------------------

  peek(offset = 0) {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) {
      return new Token(TokenType.Semicolon, null, -1, -1);
    }
    return this.tokens[idx];
  }

  advance() {
    const tok = this.peek();
    this.pos += 1;
    return tok;
  }

  isAtEnd() {
    return this.pos >= this.tokens.length;
  }

  check(ttype) {
    return this.peek().type === ttype;
  }

  match(...types) {
    if (types.includes(this.peek().type)) {
      this.pos += 1;
      return true;
    }
    return false;
  }

  expect(ttype, msg = '') {
    this.skipNewlines();
    if (this.peek().type === ttype) {
      return this.advance();
    }
    const tok = this.peek();
    throw new ParseError(
      msg || `Expected ${ttype}, got ${tok.type}`, tok.start
    );
  }

  skipNewlines() {
    // Backslash tokens (if present in a hand-built stream) are line
    // continuations 鈥?same noise class as Newline (pre_processor.rs removes
    // both before parsing).
    while (this.check(TokenType.Newline) || this.check(TokenType.Backslash)) {
      this.pos += 1;
    }
  }

  skipSemicolons() {
    while (this.check(TokenType.Semicolon)) {
      this.pos += 1;
    }
  }

  skipNoise() {
    while (!this.isAtEnd() &&
           (this.peek().type === TokenType.Newline ||
            this.peek().type === TokenType.Backslash ||
            this.peek().type === TokenType.Semicolon)) {
      this.pos += 1;
    }
  }

  skipToNextStatement() {
    while (!this.isAtEnd() &&
           this.peek().type !== TokenType.Semicolon &&
           this.peek().type !== TokenType.Newline) {
      this.pos += 1;
    }
  }

  // Documented-superset helper: within the statement span ending at the next
  // depth-0 `;` / newline, rewrite the LAST depth-0 `in` that directly
  // precedes a Name into Name('of'). AI phrasings like `insert v at 1 in L;`
  // / `replace item 2 in L with x;` need it — parseExpr would otherwise
  // swallow `N in L` as the membership operator. Parens are respected so a
  // genuine membership test inside an index expression survives untouched.
  _rewriteListTargetIn() {
    let depth = 0;
    let target = -1;
    for (let k = this.pos; k < this.tokens.length; k++) {
      const t = this.tokens[k];
      if (t.type === TokenType.LParen) { depth += 1; continue; }
      if (t.type === TokenType.RParen) { depth -= 1; continue; }
      if (depth !== 0) continue;
      if (t.type === TokenType.Semicolon || t.type === TokenType.Newline) break;
      if (t.type === TokenType.In &&
          this.tokens[k + 1] && this.tokens[k + 1].type === TokenType.Name) {
        target = k;
      }
    }
    if (target >= 0) {
      this.tokens[target].type = TokenType.Name;
      this.tokens[target].value = 'of';
    }
  }

  // Documented-superset helper: rewrite Scratch's "item N of list" REPORTER
  // into canonical indexing `list[N]` throughout the upcoming statement
  // (D14 S2: `new_dir = item 1 of dir_queue;`). Matches only the strict
  // shape `item <atomic> of|from|in Name`; a variable literally named
  // `item` used any other way is untouched.
  _rewriteItemOfReporter() {
    // `replace item ...` has a dedicated superset branch in parseStmt that
    // consumes the leading `item` itself — do not pre-rewrite it here.
    const head = this.tokens[this.pos];
    if (head && head.type === TokenType.Name && head.value === 'replace') return;
    const sepVals = ['of', 'from', 'in', 'item', 'with', 'into'];
    const isAtomic = (t) => [TokenType.Int, TokenType.Float, TokenType.Str, TokenType.Name]
      .includes(t.type) && !(t.type === TokenType.Name && sepVals.includes(t.value));
    let k = this.pos;
    while (k + 3 < this.tokens.length) {
      const t = this.tokens[k];
      if (t.type === TokenType.Semicolon || t.type === TokenType.Newline) break;
      if (t.type === TokenType.Name && t.value === 'item' &&
          isAtomic(this.tokens[k + 1])) {
        const s2 = this.tokens[k + 2];
        const sepOk = s2.type === TokenType.In ||
          (s2.type === TokenType.Name && (s2.value === 'of' || s2.value === 'from'));
        if (sepOk && this.tokens[k + 3] && this.tokens[k + 3].type === TokenType.Name) {
          const listTok = this.tokens[k + 3];
          const idxTok = this.tokens[k + 1];
          const repl = [
            new Token(TokenType.Name, listTok.value, listTok.start, listTok.end),
            new Token(TokenType.LBracket, null, t.start, t.start),
            idxTok,
            new Token(TokenType.RBracket, null, s2.start, s2.start),
          ];
          this.tokens.splice(k, 4, ...repl);
          k += 4;
          continue;
        }
      }
      k += 1;
    }
  }

  // Parse one C-style for-header segment (`i = 0`, `i++`, `j += 2`, …) by
  // running the regular statement parser over an isolated token slice.
  // Returns null for an empty segment.
  _parseForSegmentStmt(stopAtRParen = false) {
    let depth = 0;
    const seg = [];
    while (!this.isAtEnd()) {
      const t = this.peek();
      if (t.type === TokenType.LParen) depth += 1;
      else if (t.type === TokenType.RParen) {
        if (depth === 0) {
          if (stopAtRParen) break;
          throw new ParseError("Unexpected ')' in for header", t.start);
        }
        depth -= 1;
      } else if (depth === 0 && t.type === TokenType.Semicolon) break;
      seg.push(this.advance());
    }
    if (seg.length === 0) return null;
    seg.push(new Token(TokenType.Newline, null, -1, -1));
    const savedTokens = this.tokens;
    const savedPos = this.pos;
    try {
      this.tokens = seg;
      this.pos = 0;
      this.skipNoise();
      return this.parseStmt();
    } finally {
      this.tokens = savedTokens;
      this.pos = savedPos;
    }
  }

  // True when the upcoming parenthesised for-header has the C-style shape
  // `( init ; cond ; incr )` — exactly two depth-0 semicolons and a brace
  // body following. Distinguishes from canonical for-in / for-range forms.
  _looksLikeCStyleFor() {
    // Tolerates being called either with 'for' still current (parseNameStmt
    // peeks without consuming) or after it: skip a leading Name 'for'.
    let start = this.pos;
    const t0 = this.tokens[start];
    if (t0 && t0.type === TokenType.Name && t0.value === 'for') start += 1;
    if (!this.tokens[start] || this.tokens[start].type !== TokenType.LParen) return false;
    let depth = 0;
    let semis = 0;
    for (let k = start; k < this.tokens.length; k++) {
      const t = this.tokens[k];
      if (t.type === TokenType.LParen) {
        depth += 1;
      } else if (t.type === TokenType.RParen) {
        depth -= 1;
        if (depth === 0) {
          let j = k + 1;
          while (j < this.tokens.length &&
                 (this.tokens[j].type === TokenType.Newline ||
                  this.tokens[j].type === TokenType.Backslash)) j += 1;
          return semis === 2 &&
            j < this.tokens.length && this.tokens[j].type === TokenType.LBrace;
        }
      } else if (depth === 1 && t.type === TokenType.Semicolon) semis += 1;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Entry point
  // ------------------------------------------------------------------

  parse() {
    this.skipNoise();
    while (!this.isAtEnd()) {
      try {
        this.declaration();
      } catch (e) {
        if (e instanceof ParseError) {
          // Body errors are fatal (see parseStmts): a recovered error there
          // means an event/proc was truncated — never compile that quietly.
          if (e.inBody) throw e;
          // Preserve the message and clamp sentinel positions (peek() past
          // EOF yields a synthetic token at -1): repair loops need a real
          // location and the actual reason, not just "L1:1 skipped".
          const at = Math.max(0, e.pos ?? 0);
          const d = new Diagnostic('ParseError', [at, at + 1]);
          d.message = e.message;
          this.diagnostics.push(d);
          while (!this.isAtEnd() &&
                 this.peek().type !== TokenType.Semicolon &&
                 this.peek().type !== TokenType.Newline) {
            this.pos += 1;
          }
          this.skipNoise();
          continue;
        }
        throw e;
      }
      this.skipNoise();
    }
    // Top-level runtime initializers become the head of each sprite's first
    // onflag (see the var-declaration sugar).
    this._flushTopLevelInits(this.sprite);
    for (const ext of this._extraTargets || []) {
      this._flushTopLevelInits(ext.sprite);
    }
    return this.sprite;
  }

  _flushTopLevelInits(sprite) {
    const pend = sprite._pendingTopLevelInits;
    if (!pend || pend.length === 0) return;
    delete sprite._pendingTopLevelInits;
    let flagEvent = sprite.events.find(ev => ev.kind && ev.kind.kind === 'OnFlag');
    if (!flagEvent) {
      flagEvent = new Event(new EventKind({ kind: 'OnFlag' }), [0, 0], []);
      sprite.events.push(flagEvent);
    }
    flagEvent.body.unshift(...pend);
  }

  // ------------------------------------------------------------------
  // Top-level declarations
  // ------------------------------------------------------------------

  declaration() {
    const tok = this.peek();

    if (tok.type === TokenType.Semicolon) {
      this.advance();
      return;
    }

    if (tok.type === TokenType.Costumes) {
      this.advance();
      const assets = this.parseCommaSeparated(() => this.parseAsset());
      this.skipNoise();
      for (const a of assets) {
        this.sprite.costumes.push(a);
      }
      return;
    }

    if (tok.type === TokenType.Sounds) {
      this.advance();
      const assets = this.parseCommaSeparated(() => this.parseAsset());
      this.skipNoise();
      for (const a of assets) {
        this.sprite.sounds.push(a);
      }
      return;
    }

    if (tok.type === TokenType.Hide) {
      this.advance();
      this.skipNoise();
      this.sprite.hidden = true;
      return;
    }

    if (tok.type === TokenType.set_x) {
      this.advance();
      // parseValue() returns [Value, span]; store the Value itself — codegen
      // serializes these sprite fields directly and a raw tuple would leak
      // into project.json (upstream sb3.rs destructures the (Value, Span)
      // pair the same way).
      const [val] = this.parseValue();
      this.sprite.x_position = val;
      return;
    }

    if (tok.type === TokenType.set_y) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.y_position = val;
      return;
    }

    if (tok.type === TokenType.set_size) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.size = val;
      return;
    }

    if (tok.type === TokenType.set_volume) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.volume = val;
      return;
    }

    if (tok.type === TokenType.point_in_direction) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.direction = val;
      return;
    }

    if (tok.type === TokenType.set_rotation_style_left_right) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle('left-right');
      return;
    }

    if (tok.type === TokenType.set_rotation_style_all_around) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle('all around');
      return;
    }

    if (tok.type === TokenType.set_rotation_style_do_not_rotate) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle("don't rotate");
      return;
    }

    // nowarp? proc Name (Args) { Body }
    // + documented superset: `define Name {...}` / `define Name(...){...}`
    // AI models habitually emit JS-style `define` for procedure definitions
    // (D13 S2 burned all 4 rounds on it; `define` otherwise lexes as the
    // preprocessor-macro keyword and hard-fails here). Taken ONLY when the
    // following tokens unambiguously form a definition shape (Name+{ or
    // Name+() so genuine macro misuse still fails loudly as before.
    if (tok.type === TokenType.NoWarp || tok.type === TokenType.Proc ||
        (tok.type === TokenType.Define &&
         this.peek(1).type === TokenType.Name &&
         (this.peek(2).type === TokenType.LBrace ||
          this.peek(2).type === TokenType.LParen))) {
      let warp = true;
      if (tok.type === TokenType.NoWarp) {
        this.advance();
        warp = false;
        if (this.check(TokenType.Define)) this.advance();
        else this.expect(TokenType.Proc, "Expected 'proc'");
      } else {
        this.advance(); // consume 'proc' — or 'define' via the alias above
      }
      const nameTok = this.expect(TokenType.Name, 'Expected proc name');
      // Support both parenthesised args: proc foo(a, b) { ... }
      // and bare args: proc foo a, b { ... }
      let args = [];
      if (this.match(TokenType.LParen)) {
        if (this.peek().type !== TokenType.RParen) {
          args = this.parseCommaSeparated(() => this.parseArg());
        }
        this.expect(TokenType.RParen, "Expected ')' after proc args");
      } else if (this.peek().type !== TokenType.LBrace) {
        args = this.parseCommaSeparated(() => this.parseArg());
      }
      const body = this.parseStmts();
      const proc = new Proc(nameTok.value, [nameTok.start, nameTok.end], warp);
      this.sprite.addProc(proc, args, body, this.diagnostics);
      return;
    }

    // func Name ( Args ) Type { Body }
    if (tok.type === TokenType.Func) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, 'Expected func name');
      this.expect(TokenType.LParen, "Expected '(' after func name");
      const args = this.peek().type !== TokenType.RParen
        ? this.parseCommaSeparated(() => this.parseArg())
        : [];
      this.expect(TokenType.RParen, "Expected ')' after func args");
      const type_ = this.parseType();
      const body = this.parseStmts();
      const func = new Func(nameTok.value, [nameTok.start, nameTok.end], type_);
      this.sprite.addFunc(func, args, body, this.diagnostics);
      return;
    }

    // Events
    if (tok.type === TokenType.On) {
      this.advance();
      const eventTok = this.expect(TokenType.Str, 'Expected broadcast name string');
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'On', event: eventTok.value });
      this.sprite.events.push(new Event(kind, [tok.start, eventTok.end], body));
      return;
    }

    if (tok.type === TokenType.OnFlag) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'OnFlag' });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }

    if (tok.type === TokenType.OnKey) {
      this.advance();
      const keyTok = this.expect(TokenType.Str, 'Expected key name string');
      const body = this.parseStmts();
      const kind = new EventKind({
        kind: 'OnKey', key: keyTok.value,
        keySpan: [keyTok.start, keyTok.end]
      });
      this.sprite.events.push(new Event(kind, [tok.start, keyTok.end], body));
      return;
    }

    if (tok.type === TokenType.OnClick) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'OnClick' });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }

    if (tok.type === TokenType.OnBackdrop) {
      this.advance();
      const bdTok = this.expect(TokenType.Str, 'Expected backdrop name string');
      const body = this.parseStmts();
      const kind = new EventKind({
        kind: 'OnBackdrop', backdrop: bdTok.value,
        backdropSpan: [bdTok.start, bdTok.end]
      });
      this.sprite.events.push(new Event(kind, [tok.start, bdTok.end], body));
      return;
    }

    if (tok.type === TokenType.OnLoudness) {
      this.advance();
      this.expect(TokenType.Gt, "Expected '>' after onloudness");
      const value = this.parseIfExpr();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'OnLoudnessGt', value });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }

    if (tok.type === TokenType.OnTimer) {
      this.advance();
      this.expect(TokenType.Gt, "Expected '>' after ontimer");
      const value = this.parseIfExpr();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'OnTimerGt', value });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }

    if (tok.type === TokenType.OnClone) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: 'OnClone' });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }

    // struct Name { fields }
    if (tok.type === TokenType.Struct) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, 'Expected struct name');
      this.expect(TokenType.LBrace, "Expected '{' after struct name");
      this.skipNoise();
      const fields = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const fname = this.expect(TokenType.Name, 'Expected field name');
          let default_ = null;
          if (this.match(TokenType.Assign)) {
            default_ = this.parseConstExpr();
          }
          fields.push(new StructField(fname.value, [fname.start, fname.end], default_));
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
        }
      }
      this.expect(TokenType.RBrace, "Expected '}' after struct fields");
      const struct = new Struct(nameTok.value, [nameTok.start, nameTok.end], fields);
      this.sprite.addStruct(struct, this.diagnostics);
      return;
    }

    // enum Name { variants }
    if (tok.type === TokenType.Enum) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, 'Expected enum name');
      this.expect(TokenType.LBrace, "Expected '{' after enum name");
      this.skipNoise();
      const variants = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const vname = this.expect(TokenType.Name, 'Expected variant name');
          let value = null;
          if (this.match(TokenType.Assign)) {
            const v = this.parseValue();
            value = [v[0], v[1]];
          }
          variants.push(new EnumVariant(vname.value, [vname.start, vname.end], value));
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
          // Tolerate a trailing comma before '}' (AI-common; the bracketed
          // list initializer allows it too — upstream lalrpop Comma<> does
          // not, documented superset).
          if (this.peek().type === TokenType.RBrace) break;
        }
      }
      this.expect(TokenType.RBrace, "Expected '}' after enum variants");
      const enum_ = new EnumNode(nameTok.value, [nameTok.start, nameTok.end], variants);
      this.sprite.addEnum(enum_, this.diagnostics);
      return;
    }

    // var Type Name (= ConstExpr)? ;
    if (tok.type === TokenType.Var) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, 'Expected variable name');
      // AI-friendly extension (documented deviation): upstream reserves
      // `[...]` initializers for lists (grammar.lalrpop L86); `var x = [...]`
      // is a syntax error there. AI-generated code routinely writes
      // `var scores = [];` for something it then `add`s to — that is list
      // intent, so register a LIST with those defaults instead of failing.
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket) {
        this.advance(); // consume '='
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        return;
      }
      let default_ = null;
      if (this.match(TokenType.Assign)) {
        if (this.isAtEnd()) {
          // Same truncation honesty as the in-body var branch; at top level
          // this lands in the recoverable-diagnostics path with the real
          // position preserved.
          throw new ParseError(
            `Unexpected EOF after '=' in initializer of '${nameTok.value}' (source may be truncated)`,
            nameTok.start);
        }
        // Runtime initializers (`var cur = boss_hp[phase];`) are AI-common:
        // upstream only allows constants here. Sugar: register the variable
        // with no default and queue a StmtSetVar that the flush step injects
        // at the head of this sprite's first onflag (synthesized if absent) —
        // "initialized at declaration" semantics under Scratch's rules.
        const snap = this.pos;
        try {
          default_ = this.parseConstExpr();
          const nt = this.peek();
          if (nt.type !== TokenType.Semicolon &&
              nt.type !== TokenType.Newline &&
              nt.type !== TokenType.RBrace) {
            throw new ParseError('not a pure constant initializer', nt.start);
          }
        } catch (e) {
          if (!(e instanceof ParseError)) throw e;
          this.pos = snap;
          const runtimeInit = this.parseExpr();
          const name = new Name(nameTok.value, [nameTok.start, nameTok.end]);
          this.sprite.addVar(new Var(nameTok.value, name.span, type_, null, false), this.diagnostics);
          if (!this.sprite._pendingTopLevelInits) this.sprite._pendingTopLevelInits = [];
          this.sprite._pendingTopLevelInits.push(
            new StmtSetVar(name, runtimeInit, new TypeValue(), false, false));
          this.skipNoise();
          return;
        }
      }
      this.skipNoise();
      const var_ = new Var(nameTok.value, [nameTok.start, nameTok.end], type_, default_, false);
      this.sprite.addVar(var_, this.diagnostics);
      return;
    }

    // cloud Name ;
    if (tok.type === TokenType.Cloud) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, 'Expected cloud variable name');
      this.skipNoise();
      const var_ = new Var(nameTok.value, [nameTok.start, nameTok.end], new TypeValue(), null, true);
      this.sprite.addVar(var_, this.diagnostics);
      return;
    }

    // list Type Name (; | = [...] ; | "path" ;)
    if (tok.type === TokenType.List) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, 'Expected list name');
      const span = [nameTok.start, nameTok.end];

      // list ... = [ values ] ;   or   list ... = [ default ; count ] ;
      if (this.match(TokenType.Assign)) {
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        return;
      }

      // list ... "path" ;
      if (this.peek().type === TokenType.Str) {
        const pathTok = this.advance();
        this.skipNoise();
        const lst = new ListNode(nameTok.value, span, type_,
          new ListDefaultFile(pathTok.value, [pathTok.start, pathTok.end]));
        this.sprite.addList(lst, this.diagnostics);
        return;
      }

      // list ... ;
      this.skipNoise();
      const lst = new ListNode(nameTok.value, span, type_, null);
      this.sprite.addList(lst, this.diagnostics);
      return;
    }

    // Top-level orphan stack: `orphan { ... }` 鈥?loose SB3 top-level blocks
    // not attached to any hat. Preserved verbatim through the round-trip.
    if (tok.type === TokenType.Orphan) {
      this.advance();
      const body = this.parseStmts();
      if (body.length > 0) this.sprite.orphanChains.push(body);
      return;
    }

    // AI-common: top-level `add <const> to LIST ;` seeds list defaults
    // (upstream only allows initializers via `list L = [v, ...];`). Fold the
    // value into the list's default values — equivalent load-time state with
    // no hidden scripts, and decompile→recompile idempotent (the decompiler
    // emits the merged defaults as a bracket initializer). Non-constant
    // values are rejected loudly; runtime adds belong inside event bodies.
    if (tok.type === TokenType.Add) {
      this.advance();
      const val = this.parseConstExpr();
      this.expect(TokenType.To, "Expected 'to' in add statement");
      const nameTok = this.expect(TokenType.Name, 'Expected list name');
      this.skipNoise();
      const lst = this.sprite.lists[nameTok.value];
      if (!lst) {
        throw new ParseError(
          `Unknown list '${nameTok.value}' in top-level add`, nameTok.start);
      }
      // Folding into file-backed or fixed-length lists would silently
      // destroy their import/expansion semantics — refuse loudly instead.
      if (!(lst.default instanceof ListDefaultValues) && lst.default !== null) {
        throw new ParseError(
          `Cannot top-level add to '${nameTok.value}': list has a ` +
          `${lst.default.constructor.name} default`, nameTok.start);
      }
      if (!(lst.default instanceof ListDefaultValues)) {
        lst.default = new ListDefaultValues([]);
      }
      lst.default.values.push(val);
      return;
    }

    // AI-common: top-level `copy list SRC to DST ;` clones preset values at
    // compile time (the in-body form desugars to a runtime loop instead — see
    // _desugarListCopy). Mirrors top-level `add`: fold SRC's default values
    // into DST so load-time state is identical and decompile→recompile stays
    // idempotent (the decompiler emits the merged defaults as a bracket
    // initializer). Unknown lists and file-backed/fixed-length defaults are
    // rejected loudly; self-copy is a no-op (same as the runtime form).
    if (tok.type === TokenType.Name && tok.value === 'copy' &&
        this.peek(1).type === TokenType.List &&
        this.peek(2).type === TokenType.Name &&
        this.peek(3).type === TokenType.To &&
        this.peek(4).type === TokenType.Name) {
      this.advance(); // copy
      this.advance(); // list
      const srcTok = this.advance(); // source list name
      this.advance(); // to
      const dstTok = this.advance(); // destination list name
      this.skipNoise();
      if (srcTok.value !== dstTok.value) {
        const src = this.sprite.lists[srcTok.value];
        if (!src) {
          throw new ParseError(
            `Unknown list '${srcTok.value}' in top-level copy list`, srcTok.start);
        }
        const dst = this.sprite.lists[dstTok.value];
        if (!dst) {
          throw new ParseError(
            `Unknown list '${dstTok.value}' in top-level copy list`, dstTok.start);
        }
        if (!(src.default instanceof ListDefaultValues) && src.default !== null) {
          throw new ParseError(
            `Cannot top-level copy from '${srcTok.value}': list has a ` +
            `${src.default.constructor.name} default`, srcTok.start);
        }
        if (dst.default !== null && !(dst.default instanceof ListDefaultValues)) {
          throw new ParseError(
            `Cannot top-level copy to '${dstTok.value}': list has a ` +
            `${dst.default.constructor.name} default`, dstTok.start);
        }
        dst.default = new ListDefaultValues(
          src.default ? [...src.default.values] : []);
      }
      return;
    }

    // Multi-target section directives:
    //   target stage ;      — following declarations go to the Stage
    //   target "Name" ;     — following declarations go to sprite Name
    // (Documented deviation: upstream goboscript uses one file per sprite;
    // the single-string service pipeline needs inline target boundaries.)
    if (tok.type === TokenType.Target) {
      this.advance();
      if (this.check(TokenType.Str)) {
        const nameTok = this.advance();
        this.skipNoise();
        this._switchTarget(nameTok.value, false);
        return;
      }
      const nt = this.expect(TokenType.Name, "Expected 'stage' or a quoted name after 'target'");
      if (nt.value !== 'stage') {
        throw new ParseError("Expected 'stage' or a quoted name after 'target'", nt.start);
      }
      this.skipNoise();
      this._switchTarget('_stage_', true);
      return;
    }

    // Documented superset: block-form multi-sprite sections
    //   sprite "Name" { ...decls... }   |   sprite Name { ... }   |   sprite stage { ... }
    // AI models writing multi-sprite games emit this naturally instead of the
    // `target "Name";` directive (D13-final S3 burned all 4 rounds on it).
    // Semantics: a SCOPED _switchTarget — every declaration inside belongs to
    // that target; the previous target resumes after the closing brace. Body
    // syntax errors stay fatal (same policy as event bodies), and a body that
    // ends mid-declaration reports honestly as Unexpected EOF.
    if (tok.type === TokenType.Name && tok.value === 'sprite' &&
        (this.peek(1).type === TokenType.Str ||
          this.peek(1).type === TokenType.Name) &&
        this.peek(2).type === TokenType.LBrace) {
      const nameT = this.peek(1);
      let isStage = false;
      let sname = null;
      if (nameT.type === TokenType.Str) {
        sname = nameT.value;
      } else if (nameT.value === 'stage') {
        isStage = true;
      } else {
        sname = nameT.value;
      }
      this.advance(); // sprite
      this.advance(); // "Name" / Name / stage
      this._parseSpriteBlockBody(sname, isStage);
      return;
    }

    // Review-C P2-3: a loop keyword here means the AI wrapped a hat inside
    // a loop at top level (or wrote a bare loop) — steer it to wrap the
    // loop INSIDE an event body instead of failing twice.
    // AI-repair leniency: `local` at TOP LEVEL has no enclosing function
    // scope — degrade it to a plain global declaration instead of failing
    // the whole program (upstream errors here; our self-repair loop burns
    // retries on this harmless slip).
    if (tok.type === TokenType.Local) {
      this.advance();
      return this.parseStmt();
    }
    const loopHint = (tok.type === TokenType.Forever ||
            tok.type === TokenType.Repeat ||
            tok.type === TokenType.Until ||
            tok.type === TokenType.While)
        ? ' — loops must live inside a TOP-LEVEL event body ' +
          '(onflag / onclick / onkey …), e.g. `onflag { forever { ... } }`'
        : '';
    throw new ParseError(
      `Unexpected token in declaration: ${tok.type}` + loopHint, tok.start
    );
  }

  // Scoped body parser for the block-form sprite superset above.
  _parseSpriteBlockBody(name, isStage) {
    const prev = this.sprite;
    this._switchTarget(name, isStage);
    this.skipNoise();
    this.expect(TokenType.LBrace, "Expected '{' after sprite header");
    try {
      while (this.peek().type !== TokenType.RBrace) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBrace) break;
        if (this.isAtEnd()) {
          throw new ParseError("Unexpected EOF, expected '}'", this.peek().start);
        }
        this.declaration();
        this.skipNoise();
      }
      this.expect(TokenType.RBrace, "Expected '}'");
    } catch (e) {
      if (e instanceof ParseError) e.inBody = true;
      this.sprite = prev;
      throw e;
    }
    this.sprite = prev;
  }

  // ------------------------------------------------------------------
  // Statements
  // ------------------------------------------------------------------

  // Bracket initializer after '=' in list declarations (grammar.lalrpop
  // L86 values form / L92 fixed-length `[default; length]` form). Consumes
  // through the closing ']' plus trailing noise; returns the ListNode.
  _parseBracketList(nameTok, type_) {
    const span = [nameTok.start, nameTok.end];
    this.expect(TokenType.LBracket, "Expected '[' after '=' in list declaration");
    this.skipNoise();
    const values = [];
    if (this.peek().type !== TokenType.RBracket) {
      const first = this.parseConstExpr();
      // Only skip newlines here — skipNoise() would also swallow the ';'
      // that separates default from count in the fixed-length form.
      this.skipNewlines();
      if (this.check(TokenType.Semicolon)) {
        // Fixed-length form expands to `length` copies of `default`
        // (upstream sb3.rs ListDefault::FixedLength → vec![value; len]).
        this.advance(); // consume ';'
        this.skipNoise();
        const lengthExpr = this.parseConstExpr();
        const lengthSpan = (lengthExpr && lengthExpr.span) ||
          [this.peek().start, this.peek().end];
        this.expect(TokenType.RBracket, "Expected ']' after fixed list length");
        this.skipNoise();
        return new ListNode(nameTok.value, span, type_,
          new ListDefaultValues(
            _expandFixedLengthList(first, lengthExpr, lengthSpan, this.diagnostics)
          ));
      }
      values.push(first);
      while (this.match(TokenType.Comma)) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBracket) break;
        values.push(this.parseConstExpr());
        // Newlines only, same reason as above.
        this.skipNewlines();
      }
    }
    this.expect(TokenType.RBracket, "Expected ']' after list values");
    this.skipNoise();
    return new ListNode(nameTok.value, span, type_, new ListDefaultValues(values));
  }

  parseStmts() {
    this.skipNoise();
    this.expect(TokenType.LBrace, "Expected '{'");
    this.skipNoise();
    const stmts = [];
    // Any ParseError raised while parsing a `{ ... }` body must stay FATAL.
    // Upstream (LALRPOP) treats every syntax error as a compile failure; if
    // the top-level recovery loop were allowed to swallow these, one bad
    // statement mid-body would silently drop the ENTIRE enclosing event/proc
    // and compilation would still "succeed" — AI repair loops then saw a
    // truncated project with no error message to fix. Marking the error lets
    // Parser.parse() distinguish body errors from stray top-level tokens.
    try {
      while (this.peek().type !== TokenType.RBrace) {
        if (this.isAtEnd()) {
          throw new ParseError("Unexpected EOF, expected '}'", this.peek().start);
        }
        const stmt = this.parseStmt();
        if (Array.isArray(stmt)) stmts.push(...stmt); // sugar desugar returns a group
        else if (stmt) stmts.push(stmt); // declaration hoists (var-in-body) return null
        this.skipNoise();
      }
      this.expect(TokenType.RBrace, "Expected '}'");
    } catch (e) {
      if (e instanceof ParseError) e.inBody = true;
      throw e;
    }
    return stmts;
  }

  // Desugar `for V in L { body }` into pointer/temp-cache statements.
  // Hidden names use the __for_ prefix so they never collide with user code
  // (identifiers starting with __ are reserved by convention here).
  _desugarForIn(varName, listName, body, span) {
    const seq = (this._forSeq = (this._forSeq || 0) + 1);
    const idx = new Name(`__for_i_${seq}`, span);
    const one = () => new ExprValue(Value.fromFloat(1), span);
    const setIdx = new StmtSetVar(idx, one(), new TypeValue(), false, false);
    const itemExpr = new ExprBinOp(
      BinOp.Of, span, new ExprName(listName), new ExprName(idx.name));
    const setVal = new StmtSetVar(
      new Name(varName, span), itemExpr, new TypeValue(), false, false);
    const bump = new StmtChangeVar(idx, one());
    const times = new ExprUnOp(UnOp.Length, span, new ExprName(listName));
    return [setIdx, new StmtRepeat(times, [setVal, ...body, bump])];
  }

  // Desugar `for V in range(A, B) { body }` (Python-style, AI-common) into
  // a pointer counted loop. Inclusive [A, B] — AI code writing range(1, 6)
  // for six plots means both endpoints; documented deviation from Python's
  // exclusive end. `range(N)` counts 1..N. Uses repeat_until so the bound
  // expressions are each evaluated from fresh nodes (no node sharing).
  _desugarRangeIn(varName, startExpr, endExpr, body, span) {
    const seq = (this._forSeq = (this._forSeq || 0) + 1);
    const idx = new Name(`__for_i_${seq}`, span);
    const one = () => new ExprValue(Value.fromFloat(1), span);
    const setIdx = new StmtSetVar(idx, startExpr, new TypeValue(), false, false);
    const cond = new ExprBinOp(BinOp.Gt, span, new ExprName(idx.name), endExpr);
    const setVal = new StmtSetVar(
      new Name(varName, span), new ExprName(idx.name), new TypeValue(), false, false);
    const bump = new StmtChangeVar(idx, one());
    return [setIdx, new StmtUntil(cond, [setVal, ...body, bump])];
  }

  // Desugar `copy list SRC to DST ;` into clear + element-wise copy loop.
  _desugarListCopy(srcName, dstName, span) {
    // Self-copy is an identity operation — clearing first would destroy the
    // data (the loop reads from the same list it just emptied).
    if (srcName === dstName) return [];
    const seq = (this._forSeq = (this._forSeq || 0) + 1);
    const idx = new Name(`__for_i_${seq}`, span);
    const one = () => new ExprValue(Value.fromFloat(1), span);
    const clear = new StmtDeleteList(new Name(dstName, span));
    const setIdx = new StmtSetVar(idx, one(), new TypeValue(), false, false);
    const itemExpr = new ExprBinOp(
      BinOp.Of, span, new ExprName(srcName), new ExprName(idx.name));
    const add = new StmtAddToList(new Name(dstName, span), itemExpr);
    const bump = new StmtChangeVar(idx, one());
    const times = new ExprUnOp(UnOp.Length, span, new ExprName(srcName));
    return [clear, setIdx, new StmtRepeat(times, [add, bump])];
  }

  parseStmt() {
    this.skipNewlines();
    this._rewriteItemOfReporter();
    const tok = this.peek();

    // AI models constantly emit `break;` / `continue;`. The language (like
    // upstream goboscript) has neither — they used to fall through to the
    // unknown-name path and silently become no-ops, producing infinite-loop
    // programs that pass compilation. Fail LOUDLY so the self-repair loop
    // rewrites them as while-condition flags.
    if (tok.type === TokenType.Name && (tok.value === 'break' || tok.value === 'continue')) {
      const nt2 = this.peek(1);
      if (nt2.type === TokenType.Semicolon || nt2.type === TokenType.Newline || nt2.type === TokenType.RBrace) {
        throw new ParseError(
          `'${tok.value}' does not exist in goboscript. Exit loops through the while/until condition instead, ` +
          'e.g. replace a sentinel loop with a flag: local done = false; while (not done) { ... if (<cond>) { done = true; } }',
          tok.start
        );
      }
    }

    // return Expr ;   |   return ;   (bare void return)
    if (tok.type === TokenType.Return) {
      this.advance();
      const nt = this.peek();
      if (nt.type === TokenType.Semicolon ||
          nt.type === TokenType.Newline ||
          nt.type === TokenType.RBrace ||
          nt.type === TokenType.EOF) {
        // Upstream allows a valueless `return;`; compile to a return whose
        // value is null (codegen decides the target-specific behavior).
        return new StmtReturn(null, false);
      }
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtReturn(value, false);
    }

    // if Expr { } (else { } | elif ...)?
    if (tok.type === TokenType.If) {
      this.advance();
      const cond = this.parseIfExpr();
      const ifBody = this.parseStmts();
      // Upstream goboscript strips Newline tokens before parsing, so `else` /
      // `elif` may legally appear on a following line. Explicit braces make
      // this unambiguous: the branch binds to the if whose `}` just closed.
      this.skipNewlines();
      if (this.match(TokenType.Else)) {
        // `else` may be followed by `if` on the NEXT line (`else\nif ...`)
        // — skip newlines before testing, matching the tolerance parseStmts
        // applies to a plain `else { }` body.
        this.skipNewlines();
        // `else if (...) { ... }` on one line: AI-generated code writes the
        // C-style chained conditional constantly; upstream only has `elif`,
        // but `else` + keyword-`if` is unambiguous — treat it as elif.
        if (this.check(TokenType.If)) {
          this.advance();
          const elseBody = [this.parseElif()];
          return new StmtBranch(cond, ifBody, elseBody, true);
        }
        const elseBody = this.parseStmts();
        return new StmtBranch(cond, ifBody, elseBody, true);
      } else if (this.check(TokenType.Elif)) {
        this.advance();
        const elseBody = [this.parseElif()];
        return new StmtBranch(cond, ifBody, elseBody, true);
      }
      return new StmtBranch(cond, ifBody, []);
    }

    // repeat Expr { }
    // + documented superset: `repeat until Expr { }` — Scratch-blocks/JS
    // hybrid spelling that AI models emit naturally (D13 S2); identical
    // semantics to `until` below. Upstream only has `until`.
    if (tok.type === TokenType.Repeat) {
      this.advance();
      if (this.check(TokenType.Until)) {
        this.advance();
        const cond = this.parseIfExpr();
        const body = this.parseStmts();
        return new StmtUntil(cond, body);
      }
      const times = this.parseIfExpr();
      const body = this.parseStmts();
      return new StmtRepeat(times, body);
    }

    // forever { }
    if (tok.type === TokenType.Forever) {
      this.advance();
      const body = this.parseStmts();
      return new StmtForever(body, [tok.start, tok.end]);
    }

    // until Expr { }
    if (tok.type === TokenType.Until) {
      this.advance();
      const cond = this.parseIfExpr();
      const body = this.parseStmts();
      return new StmtUntil(cond, body);
    }

    // while Expr { }  — sugar for `until (not Expr) { }`. AI/Python-common
    // spelling; upstream only provides `until` (grammar.lalrpop).
    if (tok.type === TokenType.While) {
      this.advance();
      const cond = this.parseIfExpr();
      const body = this.parseStmts();
      const negCond = new ExprUnOp(UnOp.Not, [tok.start, tok.end], cond);
      return new StmtUntil(negCond, body);
    }

    // wait_until Expr ;
    if (tok.type === TokenType.WaitUntil) {
      this.advance();
      const cond = this.parseIfExpr();
      this.expect(TokenType.Semicolon);
      return new StmtWaitUntil(cond);
    }

    // local Type Name = Expr ;
    if (tok.type === TokenType.Local) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, 'Expected variable name');
      // AI-friendly extension mirroring in-body `var` above: a bracket
      // initializer is list intent (`local choices = [1,2,3];`). Arrays are
      // not runtime expressions and Scratch lists are static per-sprite, so
      // hoist the declaration as a LIST instead of failing. Guarded against
      // immediate indexing (`local c = [1,2][i];` → runtime expression path).
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket &&
          this._bracketInitIsWholeRhs()) {
        this.advance(); // consume '='
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        // Same per-execution fresh-list semantics as the in-body `var`
        // bracket sugar above: clear + re-add defaults at the declaration
        // point so each call starts from the declared contents.
        const resets = [new StmtDeleteList(new Name(nameTok.value, span))];
        if (lst.default instanceof ListDefaultValues) {
          for (const ce of (lst.default.values || [])) {
            if (!(ce instanceof ConstExprValue)) continue;
            resets.push(new StmtAddToList(
              new Name(nameTok.value, span),
              new ExprValue(ce.value, ce.span || span)));
          }
        }
        return resets;
      }
      this.expect(TokenType.Assign, "Expected '=' in local var assignment");
      const value = this.parseExpr();
      this.skipNoise();
      const stLocal = new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value, type_, true, false
      );
      stLocal.__frameDecl = nameTok.value;
      if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = new Set();
      this.sprite._frameDeclNames.add(nameTok.value);
      return stLocal;
    }

    // cloud Name = Expr ;
    if (tok.type === TokenType.Cloud) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, 'Expected variable name');
      this.expect(TokenType.Assign, "Expected '=' in cloud var assignment");
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value, new TypeValue(), false, true
      );
    }

    // show Name ;   or   show ;
    if (tok.type === TokenType.Show) {
      this.advance();
      if (this.peek().type === TokenType.Semicolon || this.peek().type === TokenType.Newline) {
        this.skipNoise();
        return new StmtBlock(Block.Show, [tok.start, tok.end], [], {});
      }
      const name = this.parseName();
      this.skipNoise();
      return new StmtShow(name);
    }

    // hide Name ;   or   hide ;
    if (tok.type === TokenType.Hide) {
      this.advance();
      if (this.peek().type === TokenType.Semicolon || this.peek().type === TokenType.Newline) {
        this.skipNoise();
        return new StmtBlock(Block.Hide, [tok.start, tok.end], [], {});
      }
      const name = this.parseName();
      this.skipNoise();
      return new StmtHide(name);
    }

    // add Expr to Name ;
    if (tok.type === TokenType.Add) {
      this.advance();
      const value = this.parseExpr();
      this.expect(TokenType.To, "Expected 'to' in add statement");
      const name = this.parseName();
      this.skipNoise();
      return new StmtAddToList(name, value);
    }

    // insert Expr at Name [ Expr ] ;
    // AI-friendly Scratch phrasing: `insert <Expr> at <Expr> of Name ;`
    // (Scratch's "insert x at N of list"). Both desugar to InsertAtList.
    if (tok.type === TokenType.Insert) {
      this.advance();
      // Documented superset: `insert <Int> <val> into|in <list> ;` — Python/
      // JS argument order some models emit (D14 S2). Canonical spelling is
      // `insert <val> at <Int> of <list> ;`. Strict shape guard keeps every
      // other input on the canonical paths below.
      {
        const t0 = this.peek(), t1 = this.peek(1), t2 = this.peek(2);
        const valOk = [TokenType.Int, TokenType.Float, TokenType.Str, TokenType.Name]
          .includes(t1.type) &&
          !(t1.type === TokenType.Name && ['of', 'from', 'into', 'in'].includes(t1.value));
        const sepOk = (t2.type === TokenType.Name && ['into', 'in', 'of', 'from'].includes(t2.value)) ||
          t2.type === TokenType.In;
        if (t0.type === TokenType.Int && valOk && sepOk) {
          const idxTok = this.advance();
          const indexExpr = new ExprValue(
            Value.fromFloat(parseFloat(idxTok.value)), [idxTok.start, idxTok.end]);
          const valueExpr = this.parseExpr();
          const sepT = this.peek();
          if (!((sepT.type === TokenType.Name &&
                 ['into', 'in', 'of', 'from'].includes(sepT.value)) ||
                sepT.type === TokenType.In)) {
            throw new ParseError("Expected 'into' in insert statement", sepT.start);
          }
          this.advance();
          const lname = this.parseName();
          this.skipNoise();
          return new StmtInsertAtList(lname, indexExpr, valueExpr);
        }
      }
      const value = this.parseExpr();
      this.expect(TokenType.At, "Expected 'at' in insert statement");
      // Upstream form: `insert v at name[expr];` (grammar.lalrpop L254)
      if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.LBracket) {
        const name = this.parseName();
        this.expect(TokenType.LBracket, "Expected '[' in insert statement");
        const index = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']' in insert statement");
        this.skipNoise();
        // `insert v at m[expr] of q;` — sugar where the index is itself an
        // indexed expression: target is q. Without this check the trailing
        // `of q` escaped as a ghost proc call.
        const ofTok = this.peek();
        if (ofTok.type === TokenType.Name && ofTok.value === 'of') {
          this.advance();
          const target = this.parseName();
          this.skipNoise();
          return new StmtInsertAtList(target, index, value);
        }
        return new StmtInsertAtList(name, index, value);
      }
      // Scratch phrasing: `insert v at 1 of name;`
      // Documented superset: `insert v at 1 in name;` — same AI phrasing
      // family as `delete N from L` (D14 S2).
      this._rewriteListTargetIn();
      const index = this.parseExpr();
      const ofTok = this.peek();
      if (ofTok.type !== TokenType.Name || ofTok.value !== 'of') {
        throw new ParseError("Expected 'of' in insert statement", ofTok.start);
      }
      this.advance();
      const name = this.parseName();
      this.skipNoise();
      return new StmtInsertAtList(name, index, value);
    }

    // delete Name ;   |   delete Name [ Expr ] ;
    // AI-friendly Scratch phrasing: `delete <Expr> of Name ;`
    // (Scratch's "delete item N of list"; upstream grammar.lalrpop L257-259
    // only has the first two forms). Desugars to DeleteListIndex.
    if (tok.type === TokenType.Delete) {
      this.advance();
      // Scratch phrasing "delete item N of list": tolerate the filler word
      // `item` whenever an expression follows it (`delete item;` still means
      // deleting the list named `item`, per the upstream form).
      if (this.peek().type === TokenType.Name && this.peek().value === 'item' &&
          ![TokenType.Semicolon, TokenType.LBracket].includes(this.peek(1).type)) {
        this.advance();
      }
      // Documented superset: `delete last [item] of|from L ;` — Scratch's
      // "delete the last item of list" block wording (D13 S2 burned 4 rounds).
      // Desugars to deleting at index length(L). Upstream has no 'last'.
      {
        const val = (k) => {
          const t = this.peek(k);
          return t.type === TokenType.Name ? t.value : null;
        };
        if (val(0) === 'last' &&
            (val(1) === 'of' || val(1) === 'from' ||
             (val(1) === 'item' && (val(2) === 'of' || val(2) === 'from')))) {
          const spanTok = this.peek();
          this.advance(); // last
          if (val(0) === 'item') this.advance(); // optional filler
          this.advance(); // of / from
          const lname = this.parseName();
          this.skipNoise();
          const lenIdx = new ExprUnOp(UnOp.Length,
            [spanTok.start, spanTok.end], new ExprName(lname));
          return new StmtDeleteListIndex(lname, lenIdx);
        }
      }
      // Disambiguate: `delete NAME ;` / `delete NAME [ ...` are the upstream
      // forms; anything else that reads as `<expr> of NAME` is the sugar.
      const isUpstreamForm = this.peek().type === TokenType.Name &&
        (this.peek(1).type === TokenType.Semicolon || this.peek(1).type === TokenType.LBracket);
      if (!isUpstreamForm && this.peek().type !== TokenType.Semicolon) {
        const index = this.parseExpr();
        const ofTok = this.peek();
        // Documented superset: `delete N from L;` — Scratch/Python hybrid
        // phrasing AI models emit (D13/D14 S2); `from` is a synonym of
        // `of` here. Upstream keeps only the indexed/whole-list forms.
        if (ofTok.type !== TokenType.Name ||
            (ofTok.value !== 'of' && ofTok.value !== 'from')) {
          throw new ParseError("Expected 'of' in delete statement", ofTok.start);
        }
        this.advance();
        const name = this.parseName();
        this.skipNoise();
        return new StmtDeleteListIndex(name, index);
      }
      const name = this.parseName();
      if (this.match(TokenType.LBracket)) {
        const index = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']' in delete statement");
        this.skipNoise();
        // `delete m[expr] of q ;` — the Scratch-phrasing sugar where the
        // index is itself an indexed expression: target is q, not m.
        // Without this check the trailing `of q` escaped as a ghost proc
        // call and the wrong list was mutated.
        const ofTok = this.peek();
        if (ofTok.type === TokenType.Name && ofTok.value === 'of') {
          this.advance();
          const target = this.parseName();
          this.skipNoise();
          return new StmtDeleteListIndex(target, index);
        }
        return new StmtDeleteListIndex(name, index);
      }
      this.skipNoise();
      return new StmtDeleteList(name);
    }

    // Documented superset: `replace [item] N of|in|from L with V ;` —
    // Scratch's "replace item N of list with V" block wording. Desugars to
    // StmtSetListIndex (upstream spelling: `L[N] = V ;`).
    if (tok.type === TokenType.Name && tok.value === 'replace' &&
        this.peek(1).type === TokenType.Name && this.peek(1).value === 'item') {
      this.advance(); // replace
      this.advance(); // item
      this._rewriteListTargetIn();
      const rindex = this.parseExpr();
      const sep = this.peek();
      const sepOk = (sep.type === TokenType.In) ||
        (sep.type === TokenType.Name && (sep.value === 'of' || sep.value === 'from' || sep.value === 'in'));
      if (!sepOk) {
        throw new ParseError("Expected 'of' in replace statement", sep.start);
      }
      this.advance();
      const rlist = this.parseName();
      const withTok = this.peek();
      if (withTok.type !== TokenType.Name || withTok.value !== 'with') {
        throw new ParseError("Expected 'with' in replace statement", withTok.start);
      }
      this.advance();
      const rvalue = this.parseExpr();
      this.skipNoise();
      return new StmtSetListIndex(rlist, rindex, rvalue);
    }

    // Documented superset: `clear list Name ;` — Scratch's "delete all of
    // list" phrasing, emitted by AI models constantly (D14 S2, every round).
    // Identical target semantics to `delete Name ;` (data_deletealloflist):
    // the list survives with zero items. Upstream has no `clear` spelling.
    if (tok.type === TokenType.Name && tok.value === 'clear' &&
        this.peek(1).type === TokenType.List &&
        this.peek(2).type === TokenType.Name) {
      this.advance(); // clear
      this.advance(); // list
      const name = this.parseName();
      this.skipNoise();
      return new StmtDeleteList(name);
    }

    // Built-in block statements (set_x, set_y, etc.)
    if (tok.type === TokenType.set_x) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetX, [tok.start, tok.end], [arg], {});
    }

    if (tok.type === TokenType.set_y) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetY, [tok.start, tok.end], [arg], {});
    }

    if (tok.type === TokenType.set_size) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetSize, [tok.start, tok.end], [arg], {});
    }

    if (tok.type === TokenType.point_in_direction) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.PointInDirection, [tok.start, tok.end], [arg], {});
    }

    if (tok.type === TokenType.set_volume) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetVolume, [tok.start, tok.end], [arg], {});
    }

    if (tok.type === TokenType.set_rotation_style_left_right) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleLeftRight, [tok.start, tok.end], [], {});
    }

    if (tok.type === TokenType.set_rotation_style_all_around) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleAllAround, [tok.start, tok.end], [], {});
    }

    if (tok.type === TokenType.set_rotation_style_do_not_rotate) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleDoNotRotate, [tok.start, tok.end], [], {});
    }

    // Name-based statements
    if (tok.type === TokenType.Name) {
      return this.parseNameStmt();
    }

    // $arg = ... (argument assignment, rare)
    if (tok.type === TokenType.Arg) {
      const argTok = this.advance();
      const name = new Name(argTok.value, [argTok.start, argTok.end]);
      this.expect(TokenType.Assign, "Expected '='");
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(name, value, new TypeValue(), false, false);
    }

    // var/list/cloud DECLARATIONS in STATEMENT position (e.g. inside an
    // event body). Upstream only allows declarations at sprite level, but
    // AI-generated code naturally writes `var score = 0;` or
    // `list dir_queue;` inside onflag. Hoist them into the sprite's
    // variable/list tables and emit no statement — the declaration still
    // takes effect for the whole sprite. `local`/`cloud` assignment forms
    // keep their existing statement handling elsewhere in parseStmt.
    if (tok.type === TokenType.Var) {
      // In-body `var` declaration with AI-friendly extensions (documented
      // deviations from upstream, which allows scalar constants only):
      //   var x = [];                    → list intent, hoist as LIST
      //   var avg = total / length(l);   → runtime initializer: hoist the
      //                                    declaration and emit a runtime
      //                                    assignment statement
      this.advance(); // var
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, 'Expected variable name');
      const span = [nameTok.start, nameTok.end];
      // Guarded so `var x = [1,2][i];` (array literal + immediate index)
      // falls through to the runtime-expression path below instead of being
      // mis-hoisted as a whole-list initializer.
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket &&
          this._bracketInitIsWholeRhs()) {
        this.advance(); // consume '='
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        // Per-execution fresh-list semantics. AI code reads an in-body
        // `var tokens = [];` / `var pos = [1];` as a NEW list every call,
        // but sb3 defaults only apply once at project load — without an
        // explicit reset the second call inherits the first call's tail
        // (tokens accumulate, pos resumes mid-stream → garbage parses).
        // Emit clear + re-add-defaults right at the declaration point.
        const resets = [new StmtDeleteList(new Name(nameTok.value, span))];
        if (lst.default instanceof ListDefaultValues) {
          for (const ce of (lst.default.values || [])) {
            if (!(ce instanceof ConstExprValue)) continue;
            resets.push(new StmtAddToList(
              new Name(nameTok.value, span),
              new ExprValue(ce.value, ce.span || span)));
          }
        }
        return resets;
      }
      let default_ = null;
      let runtimeInit = null;
      if (this.match(TokenType.Assign)) {
        if (this.isAtEnd()) {
          // Truncated generation ending in `var name =`: report honestly
          // (stays a fatal in-body error) instead of a misleading
          // "Unexpected token in expression: Semicolon" at L1:1.
          throw new ParseError(
            `Unexpected EOF after '=' in initializer of '${nameTok.value}' (source may be truncated)`,
            nameTok.start);
        }
        const snap = this.pos;
        try {
          default_ = this.parseConstExpr();
          // A constant initializer must be terminated here. `var q = 16 // 4;`
          // parses as the constant 16 with `// 4` left over — that is an
          // arithmetic expression, not a constant; reparse as runtime init.
          const nt = this.peek();
          if (nt.type !== TokenType.Semicolon &&
              nt.type !== TokenType.RBrace &&
              nt.type !== TokenType.Newline) {
            throw new ParseError('not a pure constant initializer', nt.start);
          }
        } catch (e) {
          if (!(e instanceof ParseError)) throw e;
          this.pos = snap;
          runtimeInit = this.parseExpr();
        }
      }
      this.skipNoise();
      this.sprite.addVar(new Var(nameTok.value, span, type_, default_, false), this.diagnostics);
      if (runtimeInit) {
        const st = new StmtSetVar(new Name(nameTok.value, span), runtimeInit,
          new TypeValue(), false, false);
        // Frame-locals marker: visitProjectFrameLocals turns this into a
        // per-call stack slot instead of a shared global write.
        st.__frameDecl = nameTok.value;
        if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = new Set();
        this.sprite._frameDeclNames.add(nameTok.value);
        return st;
      }
      // Constant / no-init declaration: no statement exists here, so record
      // the name sprite-wide; the frame pass intersects it with each
      // function's actual assignment targets.
      if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = new Set();
      this.sprite._frameDeclNames.add(nameTok.value);
      return null;
    }
    if (tok.type === TokenType.List ||
        tok.type === TokenType.Cloud) {
      this.declaration();
      return null;
    }

    // Upstream grammar.lalrpop L342: `log Expr ;` at statement position is
    // the log builtin (compiles to an inert zwsp procedures_call); inside
    // expressions LOG stays the math unary operator. warn/error/breakpoint
    // are plain Name statements handled by parseNameStmt.
    if (tok.type === TokenType.Log) {
      this.advance();
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtProcCall('log', [tok.start, tok.end], [value], {});
    }

    // M14: teach the AI self-repair loop instantly — event keywords at
    // statement position mean a hat was nested inside a body.
    if (EVENT_TOKENS.has(tok.type)) {
        throw new ParseError(
            `Unexpected token in statement: ${tok.type}` +
            ' — events (onflag / onclick / onkey / on "msg" …) are ' +
            'TOP-LEVEL hats; move this line OUT of every {...} to column 0, e.g. ' +
            '`onclick { goto_random_position; }`',
            tok.start);
    }
    // Review-C P2-2: Scratch-style `when …` hats lex as Name tokens and
    // never hit the branch above — give them the same top-level hint.
    if (tok.type === TokenType.Name &&
            /^when([ _]|$)/i.test(String(tok.value || ''))) {
        throw new ParseError(
            `Unexpected token in statement: ${tok.value}` +
            ' — this dialect uses onflag / onclick / onkey "space" / ' +
            'on "msg" as TOP-LEVEL event hats; write the event at column 0 ' +
            'followed by { ... }, e.g. `onflag { say("hi"); }`',
            tok.start);
    }
    throw new ParseError(`Unexpected token in statement: ${tok.type}`, tok.start);
  }

  parseElif() {
    const cond = this.parseIfExpr();
    const ifBody = this.parseStmts();
    // Same newline-skip as the If branch: upstream has no Newline tokens at
    // parse time, so `else`/`elif` may follow on a later line.
    this.skipNewlines();
    if (this.match(TokenType.Else)) {
      // `else if` chaining (see parseStmt If branch); newline-tolerant too.
      this.skipNewlines();
      if (this.check(TokenType.If)) {
        this.advance();
        const elseBody = [this.parseElif()];
        return new StmtBranch(cond, ifBody, elseBody, true);
      }
      const elseBody = this.parseStmts();
      return new StmtBranch(cond, ifBody, elseBody, true);
    } else if (this.check(TokenType.Elif)) {
      this.advance();
      const elseBody = [this.parseElif()];
      return new StmtBranch(cond, ifBody, elseBody, true);
    }
    return new StmtBranch(cond, ifBody, []);
  }

  parseNameStmt() {
    const nameTok = this.peek();
    const startPos = nameTok.start;
    const nextTok = this.peek(1);

    // for <var> in <list> { body }   (sugar; not in the upstream grammar)
    //
    // "Compressed when written, expanded when compiled": desugar AT PARSE
    // TIME into plain statements so the visitor auto-registers the hidden
    // helper variables and codegen/decompiler stay untouched:
    //     __for_i_N = 1;
    //     repeat (length LIST) {
    //         VAR = LIST[__for_i_N];
    //         ...body...
    //         __for_i_N += 1;
    //     }
    // __for_i_N is the internal pointer, VAR is the per-iteration temp cache.
    // for (init; cond; incr) { body }   (C-style; AI-compat superset)
    // Desugars to: <init>; until (!(cond)) { body; <incr>; } — identical
    // machinery to the while-sugar above. D14 S3: models habitually write
    // C loops for index bookkeeping. An empty condition degrades to forever.
    if (nameTok.value === 'for' && nextTok.type === TokenType.LParen &&
        this._looksLikeCStyleFor()) {
      this.advance(); // for
      this.expect(TokenType.LParen, "Expected '(' after 'for'");
      const initStmt = this._parseForSegmentStmt(false);
      this.expect(TokenType.Semicolon, "Expected ';' in for header");
      let cond = null;
      if (!this.check(TokenType.Semicolon)) cond = this.parseIfExpr();
      this.expect(TokenType.Semicolon, "Expected ';' in for header");
      const incrStmt = this._parseForSegmentStmt(true);
      this.expect(TokenType.RParen, "Expected ')' after for clauses");
      const body = this.parseStmts();
      const prefix = [];
      if (initStmt) {
        if (Array.isArray(initStmt)) prefix.push(...initStmt);
        else prefix.push(initStmt);
      }
      const tail = incrStmt ? body.concat([incrStmt]) : body;
      if (cond === null) {
        prefix.push(new StmtForever(tail, [nameTok.start, nameTok.end]));
        return prefix;
      }
      const negCond = new ExprUnOp(UnOp.Not, [nameTok.start, nameTok.end], cond);
      prefix.push(new StmtUntil(negCond, tail));
      return prefix;
    }

    if (nameTok.value === 'for' &&
        nextTok.type === TokenType.Name &&
        this.peek(2).type === TokenType.In &&
        this.peek(3).type === TokenType.Name &&
        this.peek(4).type === TokenType.LBrace) {
      this.advance(); // for
      const varTok = this.advance(); // loop variable
      this.advance(); // in
      const listTok = this.advance(); // list name
      // NOTE: parseStmts() itself expects+consumes the opening '{'.
      const body = this.parseStmts();
      this.skipNoise();
      return this._desugarForIn(varTok.value, listTok.value, body,
        [nameTok.start, nameTok.end]);
    }

    // for <var> in [const, const, ...] { body }   (AI-compat superset)
    // The array literal hoists into a hidden list, then takes the exact same
    // element-wise desugar path as the plain-list form above.
    if (nameTok.value === 'for' &&
        nextTok.type === TokenType.Name &&
        this.peek(2).type === TokenType.In &&
        this.peek(3).type === TokenType.LBracket) {
      this.advance(); // for
      const varTok = this.advance(); // loop variable
      this.advance(); // in
      this._parenDepth++; // tolerate newlines inside the literal
      let hiddenName;
      try {
        hiddenName = this._parseArrayLiteralToHiddenList();
      } finally {
        this._parenDepth--;
      }
      // NOTE: parseStmts() itself expects+consumes the opening '{'.
      const body = this.parseStmts();
      this.skipNoise();
      return this._desugarForIn(varTok.value, hiddenName, body,
        [nameTok.start, nameTok.end]);
    }

    // for <var> in range(A, B) { body }   (Python-style sugar; inclusive)
    if (nameTok.value === 'for' &&
        nextTok.type === TokenType.Name &&
        this.peek(2).type === TokenType.In &&
        this.peek(3).type === TokenType.Name && this.peek(3).value === 'range' &&
        this.peek(4).type === TokenType.LParen) {
      this.advance(); // for
      const varTok = this.advance(); // loop variable
      this.advance(); // in
      this.advance(); // range
      this.advance(); // (
      // Same newline tolerance as ordinary parenthesized expressions.
      this._parenDepth++;
      let rangeArgs;
      try {
        rangeArgs = [this.parseExpr()];
        if (this.match(TokenType.Comma)) rangeArgs.push(this.parseExpr());
        this.expect(TokenType.RParen, "Expected ')' after range arguments");
      } finally {
        this._parenDepth--;
      }
      // NOTE: parseStmts() itself expects+consumes the opening '{'.
      const body = this.parseStmts();
      this.skipNoise();
      const span = [nameTok.start, nameTok.end];
      const [a, b] = rangeArgs.length === 2
        ? rangeArgs
        : [new ExprValue(Value.fromFloat(1), span), rangeArgs[0]];
      return this._desugarRangeIn(varTok.value, a, b, body, span);
    }

    // copy list SRC to DST ;   (sugar: one-statement list clone)
    //
    // Expands to: delete all of DST; then a pointer/temp-var loop appending
    // every element of SRC into DST. Same parse-time desugar strategy.
    if (nameTok.value === 'copy' &&
        nextTok.type === TokenType.List &&
        this.peek(2).type === TokenType.Name &&
        this.peek(3).type === TokenType.To &&
        this.peek(4).type === TokenType.Name) {
      this.advance(); // copy
      this.advance(); // list
      const srcTok = this.advance(); // source list name
      this.advance(); // to
      const dstTok = this.advance(); // destination list name
      this.skipNoise();
      return this._desugarListCopy(srcTok.value, dstTok.value,
        [nameTok.start, nameTok.end]);
    }

    // Scratch-style statements (AI-compat extension; not in the upstream
    // grammar, accepted for naturalness):
    //   change <var> by <expr> ;   鈫?StmtChangeVar   (`by` lexes as Name)
    //   set <var> to <expr> ;      鈫?StmtSetVar      (`to` lexes as TokenType.To)
    // Guarded on the exact 3-token shape so real identifiers named
    // `change`/`set`, proc calls like `change(x);`, plain assignments
    // `change = 1;`, typed assigns `set T v = e;`, and `add x to list;`
    // all keep their existing parse paths.
    if ((nameTok.value === 'change' || nameTok.value === 'set') &&
        nextTok.type === TokenType.Name) {
      const kwTok = this.peek(2);
      const isChangeBy = nameTok.value === 'change' &&
        kwTok.type === TokenType.Name && kwTok.value === 'by';
      const isSetTo = nameTok.value === 'set' && kwTok.type === TokenType.To;
      if (isChangeBy || isSetTo) {
        this.advance(); // change | set
        const targetTok = this.advance(); // variable name
        this.advance(); // by | to
        const target = new Name(targetTok.value, [targetTok.start, targetTok.end]);
        const value = this.parseExpr();
        this.skipNoise();
        if (isChangeBy) return new StmtChangeVar(target, value);
        return new StmtSetVar(target, value, new TypeValue(), false, false);
      }
    }

    // StructType v = Expr ;  (grammar L136: `Type NAME "=" Expr ";"`)
    // Typed declaration assignment 鈥?must win over the proc-call fallback
    // whenever the source reads `Name Name =`. Does not fire for `x.y = ...`
    // (nextTok is Dot there) or plain `x = ...` (nextTok is Assign).
    if (nextTok.type === TokenType.Name &&
        this.peek(2).type === TokenType.Assign) {
      this.advance(); // consume type name
      const varTok = this.advance(); // consume variable name
      this.advance(); // consume '='
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(varTok.value, [varTok.start, varTok.end]),
        value,
        new TypeStruct(nameTok.value, [nameTok.start, nameTok.end]),
        false, false
      );
    }

    // Name.field ...  (DotName assignment)
    if (nextTok.type === TokenType.Dot) {
      this.advance(); // consume Name
      this.advance(); // consume Dot
      const fieldTok = this.expect(TokenType.Name, 'Expected field name');
      const lhsName = new DotName(
        nameTok.value, [nameTok.start, nameTok.end],
        fieldTok.value, [fieldTok.start, fieldTok.end]
      );
      const opTok = this.peek();
      if (opTok.type === TokenType.Assign) {
        this.advance();
        const value = this.parseExpr();
        this.skipNoise();
        return new StmtSetVar(lhsName, value, new TypeValue(), false, false);
      }
      return this._compoundFieldAssign(lhsName, opTok, startPos);
    }

    // Name[Expr] ...  (list index)
    if (nextTok.type === TokenType.LBracket) {
      this.advance(); // consume Name
      this.advance(); // consume [
      const index = this.parseExpr();
      this.expect(TokenType.RBracket, "Expected ']'");

      // Name[Expr].field = / ++ / -- / += ...  (indexed field compound
      // assignment, grammar.lalrpop L287-329)
      if (this.peek().type === TokenType.Dot) {
        this.advance();
        const fieldTok = this.expect(TokenType.Name, 'Expected field name');
        const indexedName = new DotName(
          nameTok.value, [nameTok.start, nameTok.end],
          fieldTok.value, [fieldTok.start, fieldTok.end]
        );
        const opTok = this.peek();
        if (opTok.type === TokenType.Assign) {
          this.advance(); // consume '='
          const value = this.parseExpr();
          this.skipNoise();
          return new StmtSetListIndex(indexedName, index, value);
        }
        if (_COMPOUND_ASSIGN_OPS.includes(opTok.type)) {
          return this._compoundIndexAssign(indexedName, index, opTok, startPos);
        }
        throw new ParseError(
          `Expected assignment after '${nameTok.value}[...].${fieldTok.value}'`,
          opTok.start
        );
      }

      const opTok = this.peek();
      if (opTok.type === TokenType.Assign) {
        this.advance();
        const value = this.parseExpr();
        this.skipNoise();
        return new StmtSetListIndex(
          new Name(nameTok.value, [nameTok.start, nameTok.end]),
          index, value
        );
      }

      return this._compoundIndexAssign(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        index, opTok, startPos
      );
    }

    // Name ++ ; / -- ; / += Expr ; / etc.
    if ([TokenType.Increment, TokenType.Decrement,
         TokenType.AssignAdd, TokenType.AssignSubtract,
         TokenType.AssignMultiply, TokenType.AssignDivide,
         TokenType.AssignFloorDiv, TokenType.AssignModulo,
         TokenType.AssignJoin].includes(nextTok.type)) {
      this.advance(); // consume Name
      const name = new Name(nameTok.value, [nameTok.start, nameTok.end]);
      const opTok = this.advance();
      return this._compoundAssign(name, opTok, startPos);
    }

    // Name = Expr ;  (simple assignment)
    if (nextTok.type === TokenType.Assign) {
      this.advance(); // consume Name
      this.advance(); // consume =
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value, new TypeValue(), false, false
      );
    }

    // Name(args) ;  or  Name arg1, arg2 ;  or  Name ;  (proc/block call)
    let args = [], kwargs = {};
    if (nextTok.type === TokenType.LParen) {
      const savedPos = this.pos;
      this.advance(); // consume Name
      this.advance(); // consume (
      try {
        [args, kwargs] = this.parseCallArgs();
        this.expect(TokenType.RParen, "Expected ')'");
        if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
          throw new ParseError('Not a call-args form', this.peek().start);
        }
      } catch (e) {
        if (!(e instanceof ParseError)) throw e;
        // Backtrack: parse as "Name arg1, arg2;" form
        this.pos = savedPos;
        this.advance(); // consume Name
        if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
          this.skipNewlines();
          [args, kwargs] = this._parseProcCallArgs();
        } else {
          args = []; kwargs = {};
        }
      }
    } else {
      // Name ;  -- proc call with no args
      // Name expr ;  -- proc call with args (no parens)
      this.advance(); // consume Name
      if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
        this.skipNewlines();
        [args, kwargs] = this._parseProcCallArgs();
      }
    }

    // Require a statement terminator (semicolon or newline) after proc/block call.
    // Without this, "move(10) }" (missing semicolon) would be silently accepted.
    if (this.check(TokenType.Semicolon) || this.check(TokenType.Newline)) {
      this.skipNoise();
    } else if (this.isAtEnd()) {
      // EOF is acceptable at top level
    } else {
      throw new ParseError(
        `Expected ';' or newline after statement, got ${this.peek().type}`,
        this.peek().start
      );
    }

    const nameStr = nameTok.value;
    const span = [nameTok.start, nameTok.end];

    // Try to match a built-in block
    const block = blockFromShape(nameStr, args.length);
    if (block !== null) {
      return new StmtBlock(block, span, args, kwargs);
    }

    // log keyword -> proc call
    if (nameStr === 'log') {
      return new StmtProcCall(nameStr, span, args, kwargs);
    }

    // Otherwise it's a user-defined proc call
    return new StmtProcCall(nameStr, span, args, kwargs);
  }

  _parseProcCallArgs() {
    const args = [];
    const kwargs = {};
    while (true) {
      this.skipNewlines();
      if (this.peek().type === TokenType.Name &&
          this.peek(1).type === TokenType.Colon) {
        const nameTok = this.advance();
        this.advance(); // consume :
        const value = this.parseExpr();
        kwargs[nameTok.value] = [[nameTok.start, nameTok.end], value];
      } else {
        args.push(this.parseExpr());
      }
      this.skipNewlines();
      if (!this.match(TokenType.Comma)) break;
    }
    return [args, kwargs];
  }

  _compoundAssign(name, opTok, startPos) {
    const varName = new ExprName(name);
    const nameSpan = name.span;

    if (opTok.type === TokenType.Increment) {
      this.skipNoise();
      return new StmtChangeVar(name, new ExprValue(Value.fromFloat(1.0), nameSpan));
    }

    if (opTok.type === TokenType.Decrement) {
      this.skipNoise();
      return new StmtChangeVar(name, new ExprValue(Value.fromFloat(-1.0), nameSpan));
    }

    const value = this.parseExpr();
    this.skipNoise();

    if (opTok.type === TokenType.AssignAdd) {
      return new StmtChangeVar(name, value);
    }
    if (opTok.type === TokenType.AssignSubtract) {
      const negSpan = (value && value.span) ? value.span : nameSpan;
      const negValue = new ExprBinOp(BinOp.Sub, negSpan,
        new ExprValue(Value.fromFloat(0.0), negSpan), value);
      return new StmtChangeVar(name, negValue);
    }

    const binopMap = {
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join,
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, varName, value);
    return new StmtSetVar(name, result, new TypeValue(), false, false);
  }

  _compoundFieldAssign(lhsName, opTok, startPos) {
    const nameSpan = lhsName.span;
    const varName = new ExprName(lhsName);

    if (opTok.type === TokenType.Increment) {
      this.advance();
      this.skipNoise();
      return new StmtChangeVar(lhsName, new ExprValue(Value.fromFloat(1.0), nameSpan));
    }

    if (opTok.type === TokenType.Decrement) {
      this.advance();
      this.skipNoise();
      return new StmtChangeVar(lhsName, new ExprValue(Value.fromFloat(-1.0), nameSpan));
    }

    this.advance(); // consume the operator
    const value = this.parseExpr();
    this.skipNoise();

    const binopMap = {
      [TokenType.AssignAdd]: BinOp.Add,
      [TokenType.AssignSubtract]: BinOp.Sub,
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join,
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, varName, value);
    return new StmtSetVar(lhsName, result, new TypeValue(), false, false);
  }

  _compoundIndexAssign(name, index, opTok, startPos) {
    const nameSpan = name.span;
    // The read-back expression indexes the list by its base name 鈥?for a
    // DotName (`a[i].f`) the sb3 lowering of BinOp::Of expects the plain list
    // name in the LIST field, matching the `a[i].f = v` path which also
    // lowers through name.lhs.
    const baseName = name instanceof DotName
      ? new Name(name.lhs, name.lhs_span)
      : name;
    const listAccess = new ExprBinOp(BinOp.Of, nameSpan, new ExprName(baseName), index);

    if (opTok.type === TokenType.Increment) {
      this.advance();
      this.skipNoise();
      const result = new ExprBinOp(BinOp.Add, nameSpan, listAccess,
        new ExprValue(Value.fromFloat(1.0), nameSpan));
      return new StmtSetListIndex(name, index, result);
    }

    if (opTok.type === TokenType.Decrement) {
      this.advance();
      this.skipNoise();
      const result = new ExprBinOp(BinOp.Sub, nameSpan, listAccess,
        new ExprValue(Value.fromFloat(-1.0), nameSpan));
      return new StmtSetListIndex(name, index, result);
    }

    this.advance(); // consume operator
    const value = this.parseExpr();
    this.skipNoise();

    const binopMap = {
      [TokenType.AssignAdd]: BinOp.Add,
      [TokenType.AssignSubtract]: BinOp.Sub,
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join,
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, listAccess, value);
    return new StmtSetListIndex(name, index, result);
  }

  // ------------------------------------------------------------------
  // Expressions (Pratt parser with precedence)
  // ------------------------------------------------------------------

  parseExpr() {
    return this._parseTernary(false);
  }

  parseIfExpr() {
    return this._parseTernary(true);
  }

  // `cond ? a : b` — AI-compat superset (C/JS ternary), right-associative,
  // binding loosest. Lowers to a hidden temp var + control_if_else in
  // visitor pass1 (scratch-vm has no if/else reporter primitive).
  _parseTernary(noStruct) {
    const cond = this._parseBinary(0, noStruct);
    if (this.peek().type !== TokenType.Question) return cond;
    const qtok = this.advance();
    this.skipNewlines();
    const thenExpr = this._parseTernary(noStruct);
    this.skipNewlines();
    this.expect(TokenType.Colon, "Expected ':' in conditional expression");
    this.skipNewlines();
    const elseExpr = this._parseTernary(noStruct);
    return new ExprTernary(cond, thenExpr, elseExpr, [qtok.start, qtok.end]);
  }

  // Precedence levels (higher = binds tighter)
  static _PREC_OR = 1;
  static _PREC_AND = 2;
  static _PREC_EQ = 3;
  static _PREC_JOIN = 4;
  static _PREC_CMP = 5;
  static _PREC_ADD = 6;
  static _PREC_MUL = 7;
  static _PREC_POW = 8;   // `^` — AI-compat sugar, right-assoc, desugared
  static _PREC_UNARY = 9;
  static _PREC_TERM = 10;

  _binaryOpInfo(tok) {
    const t = tok.type;
    if (t === TokenType.Or) return [Parser._PREC_OR, BinOp.Or, false];
    if (t === TokenType.And) return [Parser._PREC_AND, BinOp.And, false];
    if (t === TokenType.Eq) return [Parser._PREC_EQ, BinOp.Eq, false];
    if (t === TokenType.Ne) return [Parser._PREC_EQ, BinOp.Ne, false];
    if (t === TokenType.In) return [Parser._PREC_EQ, BinOp.In, false];
    if (t === TokenType.Amp) return [Parser._PREC_JOIN, BinOp.Join, true];
    if (t === TokenType.Lt) return [Parser._PREC_CMP, BinOp.Lt, false];
    if (t === TokenType.Le) return [Parser._PREC_CMP, BinOp.Le, false];
    if (t === TokenType.Gt) return [Parser._PREC_CMP, BinOp.Gt, false];
    if (t === TokenType.Ge) return [Parser._PREC_CMP, BinOp.Ge, false];
    if (t === TokenType.Plus) return [Parser._PREC_ADD, BinOp.Add, false];
    if (t === TokenType.Minus) return [Parser._PREC_ADD, BinOp.Sub, false];
    if (t === TokenType.Star) return [Parser._PREC_MUL, BinOp.Mul, false];
    if (t === TokenType.Slash) return [Parser._PREC_MUL, BinOp.Div, false];
    if (t === TokenType.FloorDiv) return [Parser._PREC_MUL, BinOp.FloorDiv, false];
    if (t === TokenType.Percent) return [Parser._PREC_MUL, BinOp.Mod, false];
    return [0, null, false];
  }

  _parseBinary(minPrec, noStruct = false) {
    // Inside parentheses a Newline does not terminate the expression
    // (upstream strips newlines entirely, so multi-line conditions like
    // `if (a and\n b)` are legal goboscript there; C/JS/Python agree).
    this.skipNewlines();
    let left = this._parseUnary(noStruct);

    while (true) {
      // Bare-newline continuation: when the next significant token continues
      // the expression with a binary operator at or above minPrec, the
      // newline(s) are transparent. This mirrors upstream's newline-stripping
      // lexer for the common AI formatting `expr op\n expr` while still
      // letting a newline terminate an expression before a non-operator.
      if (this.peek().type === TokenType.Newline) {
        let k = 0;
        while (this.peek(k).type === TokenType.Newline) k++;
        const [np] = this._binaryOpInfo(this.peek(k));
        const nk = this.peek(k);
        const isCont = np > 0 && np >= minPrec ||
          (nk.type === TokenType.Caret || nk.type === TokenType.Question);
        if (isCont) {
          for (let j = 0; j < k; j++) this.advance();
        }
      }
      if (this._parenDepth > 0) this.skipNewlines();
      const tok = this.peek();

      // Handle "not in"
      if (tok.type === TokenType.Not && this.peek(1).type === TokenType.In) {
        this.advance(); // consume not
        this.advance(); // consume in
        const rhs = this._parseBinary(Parser._PREC_EQ + 1, noStruct);
        const inner = new ExprBinOp(BinOp.In, [tok.start, tok.end], left, rhs);
        left = new ExprUnOp(UnOp.Not, [tok.start, tok.end], inner);
        continue;
      }

      // `base ^ exp` — AI-compat sugar (upstream has no power operator).
      // Right-assoc; desugared to a multiplication chain at parse time.
      if (tok.type === TokenType.Caret && Parser._PREC_POW >= minPrec) {
        this.advance(); // consume ^
        const rhs = this._parseBinary(Parser._PREC_POW, noStruct);
        left = this._desugarPow(left, rhs, [tok.start, tok.end]);
        continue;
      }

      const [prec, binop, rightAssoc] = this._binaryOpInfo(tok);
      if (prec < minPrec || binop === null) break;

      this.advance(); // consume operator
      const nextMin = rightAssoc ? prec : prec + 1;
      const rhs = this._parseBinary(nextMin, noStruct);
      left = new ExprBinOp(binop, [tok.start, tok.end], left, rhs);
    }

    return left;
  }

  // `base ^ exp` lowering. Scratch/TurboWarp has no two-operand pow block,
  // so constant integer exponents expand into a multiply chain — but ONLY
  // for atom bases (literal / variable), because the duplicated base
  // subtree is shared across n-1 operator parents and the visitor's in-place
  // transforms must not meet aliased complex nodes. Anything else is a loud
  // ParseError steering the author to a temp variable or repeat loop.
  _desugarPow(base, exp, span) {
    const n = this._tryConstEval(exp);
    if (n === null || !Number.isInteger(n) || n < 0 || n > 32) {
      throw new ParseError(
        "power '^' needs a constant integer exponent (0..32); assign the base to a variable and use repeat/multiplication otherwise", span[0]);
    }
    if (!(base instanceof ExprValue || base instanceof ExprName)) {
      throw new ParseError(
        "power '^' base must be a literal or variable; assign complex expressions to a temp variable first", span[0]);
    }
    if (n === 0) return new ExprValue(Value.fromFloat(1), span);
    let result = base;
    for (let i = 1; i < n; i++) {
      result = new ExprBinOp(BinOp.Mul, span, result, base);
    }
    return result;
  }

  // Constant-fold a pure-literal arithmetic subtree (used for pow exponents
  // like the `3^2` inside `2^3^2`, which desugars into a Mul chain before
  // the outer exponent check runs). Returns a finite number or null.
  _tryConstEval(expr) {
    if (expr instanceof ExprValue && expr.value) {
      const v = expr.value.toNumber();
      return (typeof v === 'number' && isFinite(v)) ? v : null;
    }
    if (expr instanceof ExprBinOp) {
      const a = this._tryConstEval(expr.lhs);
      if (a === null) return null;
      const b = this._tryConstEval(expr.rhs);
      if (b === null) return null;
      switch (expr.op) {
        case BinOp.Add: return a + b;
        case BinOp.Sub: return a - b;
        case BinOp.Mul: return a * b;
        case BinOp.Div: return b === 0 ? null : a / b;
        case BinOp.Mod: return b === 0 ? null : a % b;
        default: return null;
      }
    }
    return null;
  }

  _parseUnary(noStruct = false) {
    if (this._parenDepth > 0) this.skipNewlines();
    const tok = this.peek();

    // Unary minus
    if (tok.type === TokenType.Minus) {
      this.advance();
      const operand = this._parseUnary(noStruct);
      // Fold `-<numeric literal>` into a negative ExprValue at parse time:
      // a negative literal is a value, not an operation. This keeps it out of
      // UnOp lowering entirely, so statements the expression transform pass
      // does not cover (e.g. `set_x -175;`) still compile to a plain
      // primitive instead of crashing with "UnOp.Minus has no opcode".
      if (operand instanceof ExprValue && operand.value !== null && operand.value !== undefined) {
        const v = operand.value;
        if (v.kind === 'number' || v.kind === 'boolean') {
          const n = v.toNumber();
          if (!isNaN(n) && isFinite(n)) {
            return new ExprValue(Value.fromFloat(-n), [tok.start, tok.end]);
          }
        }
      }
      return new ExprUnOp(UnOp.Minus, [tok.start, tok.end], operand);
    }

    // Other unary operators (not, length, round, abs, etc.)
    if (tok.type in _UNOP_KEYWORDS) {
      this.advance();
      // AI-friendly tolerance: models write English operator phrasing
      // `length of dir_queue`; upstream grammar is bare prefix `length X`
      // (grammar.lalrpop L386). Skip an intervening `of` after length.
      if (tok.type === TokenType.Length &&
          this.peek().type === TokenType.Name && this.peek().value === 'of') {
        this.advance();
      }
      const operand = this._parseUnary(noStruct);
      const op = _UNOP_KEYWORDS[tok.type];
      return new ExprUnOp(op, [tok.start, tok.end], operand);
    }

    return this._parseTerm(noStruct);
  }

  _parseTerm(noStruct = false) {
    const tok = this.peek();

    // [ const, const, ... ] — anonymous constant array literal (AI-compat
    // superset; upstream has no expression-position arrays). Hoisted into a
    // hidden per-sprite list so immediate indexing (`[-120,0,120][rand]`)
    // reuses the existing BinOp::Of lowering (data_itemoflist) unchanged.
    if (tok.type === TokenType.LBracket) {
      const hiddenName = this._parseArrayLiteralToHiddenList();
      return this._parsePostfix(new ExprName(new Name(hiddenName, [tok.start, tok.end])));
    }

    // ( Expr )
    if (tok.type === TokenType.LParen) {
      this.advance();
      this._parenDepth++;
      try {
        const expr = this.parseExpr();
        if (this._parenDepth > 0) this.skipNewlines();
        this.expect(TokenType.RParen, "Expected ')'");
        return this._parsePostfix(expr);
      } finally {
        this._parenDepth--;
      }
    }

    // true / false -> Value(1.0 / 0.0)
    if (tok.type === TokenType.True_) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(1.0), [tok.start, tok.end])
      );
    }

    if (tok.type === TokenType.False_) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(0.0), [tok.start, tok.end])
      );
    }

    // Integer / Hex / Oct / Bin
    if ([TokenType.Int, TokenType.Hex, TokenType.Oct, TokenType.Bin].includes(tok.type)) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromInt(tok.value), [tok.start, tok.end])
      );
    }

    // Float
    if (tok.type === TokenType.Float) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(tok.value), [tok.start, tok.end])
      );
    }

    // String literal
    if (tok.type === TokenType.Str) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromStr(tok.value), [tok.start, tok.end])
      );
    }

    // $arg (argument reference)
    if (tok.type === TokenType.Arg) {
      this.advance();
      const name = new Name(tok.value, [tok.start, tok.end]);
      return this._parsePostfix(new ExprArg(name));
    }

    // Name (could be: variable, function call, struct literal)
    if (tok.type === TokenType.Name) {
      this.advance();
      const nameStr = tok.value;
      const span = [tok.start, tok.end];

      // Name ( args ) -> function call or Repr
      if (this.peek().type === TokenType.LParen) {
        this.advance(); // consume (
        let callArgs, callKwargs;
        [callArgs, callKwargs] = this.parseCallArgs();
        this.expect(TokenType.RParen, "Expected ')'");

        // Check if it's a Repr (reporter block)
        const reprDef = reprFromShape(nameStr);
        if (reprDef !== null) {
          return this._parsePostfix(
            new ExprRepr(reprDef, span, callArgs)
          );
        }

        // Otherwise it's a user-defined function call
        return this._parsePostfix(
          new ExprFuncCall(nameStr, span, callArgs, callKwargs)
        );
      }

      // Name { fields } -> struct literal (only in non-if context)
      if (!noStruct && this.peek().type === TokenType.LBrace) {
        this.advance(); // consume {
        this.skipNoise();
        const fields = [];
        if (this.peek().type !== TokenType.RBrace) {
          while (true) {
            const fname = this.expect(TokenType.Name, 'Expected field name');
            this.expect(TokenType.Colon, "Expected ':' after field name");
            const fval = this.parseExpr();
            fields.push(new StructLiteralField(
              fname.value, [fname.start, fname.end], fval
            ));
            this.skipNoise();
            if (!this.match(TokenType.Comma)) break;
            this.skipNoise();
          }
        }
        this.expect(TokenType.RBrace, "Expected '}'");
        return this._parsePostfix(
          new ExprStructLiteral(nameStr, span, fields)
        );
      }

      // Plain variable reference
      return this._parsePostfix(new ExprName(new Name(nameStr, span)));
    }

    // peek() past EOF returns a synthetic Semicolon at pos -1 (see peek()):
    // a "Semicolon" complaint here usually means the source ENDS mid-
    // expression — i.e. a truncated generation. Say so (pointing at the last
    // real token) so repair loops match /Unexpected EOF/ and regenerate a
    // compressed program instead of replaying the same cut-off output.
    // Upstream parity: such an error stays fatal (no partial-AST recovery).
    if (this.isAtEnd()) {
      const lastTok = this.tokens[this.tokens.length - 1];
      throw new ParseError(
        'Unexpected EOF in expression (source may be truncated)',
        lastTok ? Math.max(0, lastTok.end) : 0);
    }
    throw new ParseError(`Unexpected token in expression: ${tok.type}`, tok.start);
  }

  _parsePostfix(expr) {
    while (true) {
      const tok = this.peek();

      // expr [ index ] -> BinOp::Of (letter_of)
      if (tok.type === TokenType.LBracket) {
        this.advance();
        const index = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']'");
        expr = new ExprBinOp(BinOp.Of, [tok.start, tok.end], expr, index);
        continue;
      }

      // expr . Name -> Expr::Dot
      if (tok.type === TokenType.Dot) {
        this.advance();
        if (this.peek().type === TokenType.Name) {
          const fieldTok = this.advance();
          expr = new ExprDot(expr, fieldTok.value, [fieldTok.start, fieldTok.end]);
          continue;
        } else if (this.peek().type === TokenType.Str) {
          const propTok = this.advance();
          expr = new ExprProperty(expr, propTok.value, [propTok.start, propTok.end]);
          continue;
        }
      }

      break;
    }
    return expr;
  }

  // ------------------------------------------------------------------
  // Helpers for parsing sub-constructs
  // ------------------------------------------------------------------

  parseName() {
    const nameTok = this.expect(TokenType.Name, 'Expected name');
    if (this.peek().type === TokenType.Dot) {
      this.advance();
      const fieldTok = this.expect(TokenType.Name, "Expected field name after '.'");
      return new DotName(
        nameTok.value, [nameTok.start, nameTok.end],
        fieldTok.value, [fieldTok.start, fieldTok.end]
      );
    }
    return new Name(nameTok.value, [nameTok.start, nameTok.end]);
  }

  // Register (or reuse) a hidden per-sprite list holding the elements of an
  // anonymous `[a, b, c]` literal. Named `__arr_N` and skipped from collision
  // checks against user declarations.
  _hiddenArrayList(elems, span) {
    this._arrSeq = (this._arrSeq || 0) + 1;
    let name = `__arr_${this._arrSeq}`;
    while (this.sprite.lists[name] || this.sprite.vars[name]) {
      this._arrSeq++;
      name = `__arr_${this._arrSeq}`;
    }
    this.sprite.addList(
      new ListNode(name, span, new TypeValue(), new ListDefaultValues(elems)),
      this.diagnostics);
    return name;
  }

  // Parse `[const, const, ...]` from the opening '[' (not yet consumed)
  // through the closing ']'; hoists the elements into a hidden sprite list
  // and returns its name.
  _parseArrayLiteralToHiddenList() {
    this.advance(); // consume '['
    this.skipNewlines();
    const elems = [];
    if (this.peek().type !== TokenType.RBracket) {
      elems.push(this.parseConstExpr());
      this.skipNewlines();
      while (this.match(TokenType.Comma)) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBracket) break;
        elems.push(this.parseConstExpr());
        this.skipNewlines();
      }
    }
    this.expect(TokenType.RBracket, "Expected ']' in array literal");
    return this._hiddenArrayList(elems, [this.tokens[this.pos - 1].end, this.tokens[this.pos - 1].end]);
  }

  // Guard for the var/local bracket-init hoist: true only when the token
  // after the matching ']' terminates the statement (`;`/newline/`}`/EOF).
  // `var x = [1,2][i];` must NOT take the hoist path — the RHS is a runtime
  // expression (array literal + immediate index), handled by parseExpr.
  _bracketInitIsWholeRhs() {
    let depth = 0;
    let i = 1; // peek(1) is the opening '['
    for (;; i++) {
      const t = this.peek(i);
      if (!t || t.type === TokenType.EOF) return false;
      if (t.type === TokenType.LBracket) depth++;
      else if (t.type === TokenType.RBracket) {
        depth--;
        if (depth === 0) break;
      }
    }
    const t = this.peek(i + 1);
    return !t || t.type === TokenType.Semicolon || t.type === TokenType.Newline ||
      t.type === TokenType.RBrace || t.type === TokenType.EOF;
  }


  parseType() {
    if (this.peek().type === TokenType.Name) {
      const nextTok = this.peek(1);
      if ([TokenType.Assign, TokenType.Semicolon, TokenType.Newline,
           TokenType.LBracket, TokenType.LParen,
           TokenType.Increment, TokenType.Decrement,
           TokenType.Comma, TokenType.RBrace, TokenType.RParen,
           TokenType.LBrace, TokenType.Str].includes(nextTok.type)) {
        return new TypeValue();
      }
      const nameTok = this.advance();
      return new TypeStruct(nameTok.value, [nameTok.start, nameTok.end]);
    }
    return new TypeValue();
  }

  parseValue() {
    const tok = this.peek();
    if (tok.type === TokenType.Minus) {
      this.advance();
      const [val, span] = this.parseValue();
      const v = val.toNumber();
      return [Value.fromFloat(-v), span];
    }

    if (tok.type === TokenType.True_) {
      this.advance();
      return [Value.fromFloat(1.0), [tok.start, tok.end]];
    }

    if (tok.type === TokenType.False_) {
      this.advance();
      return [Value.fromFloat(0.0), [tok.start, tok.end]];
    }

    if ([TokenType.Int, TokenType.Hex, TokenType.Oct, TokenType.Bin].includes(tok.type)) {
      this.advance();
      return [Value.fromInt(tok.value), [tok.start, tok.end]];
    }

    if (tok.type === TokenType.Float) {
      this.advance();
      return [Value.fromFloat(tok.value), [tok.start, tok.end]];
    }

    if (tok.type === TokenType.Str) {
      this.advance();
      return [Value.fromStr(tok.value), [tok.start, tok.end]];
    }

    if (this.isAtEnd()) {
      const lastTok = this.tokens[this.tokens.length - 1];
      throw new ParseError(
        'Unexpected EOF in constant expression (source may be truncated)',
        lastTok ? Math.max(0, lastTok.end) : 0);
    }
    throw new ParseError(`Expected constant value, got ${tok.type}`, tok.start);
  }

  parseConstExpr() {
    // Enum variant: Name . Name
    if (this.peek().type === TokenType.Name &&
        this.peek(1).type === TokenType.Dot &&
        this.peek(2).type === TokenType.Name) {
      const enumTok = this.advance();
      this.advance(); // consume Dot
      const variantTok = this.advance();
      return new ConstExprEnumVariant(
        enumTok.value, [enumTok.start, enumTok.end],
        variantTok.value, [variantTok.start, variantTok.end]
      );
    }

    // Struct literal: Name { field: value, ... }
    if (this.peek().type === TokenType.Name &&
        this.peek(1).type === TokenType.LBrace) {
      const nameTok = this.advance();
      this.advance(); // consume {
      this.skipNoise();
      const fields = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const fname = this.expect(TokenType.Name, 'Expected field name');
          this.expect(TokenType.Colon, "Expected ':'");
          const val = this.parseValue();
          fields.push([fname.value, [fname.start, fname.end], val[0], val[1]]);
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
        }
      }
      this.expect(TokenType.RBrace, "Expected '}'");
      return new ConstExprStructLiteral(
        nameTok.value, [nameTok.start, nameTok.end], fields
      );
    }

    // Plain value
    const [val, span] = this.parseValue();
    return new ConstExprValue(val, span);
  }

  parseArg() {
    const type_ = this.parseType();
    const nameTok = this.expect(TokenType.Name, 'Expected argument name');
    let default_ = null;
    if (this.match(TokenType.Assign)) {
      default_ = this.parseConstExpr();
    }
    return new Arg(nameTok.value, [nameTok.start, nameTok.end], type_, default_);
  }

  parseAsset() {
    const pathTok = this.expect(TokenType.Str, 'Expected asset path string');
    let alias = null;
    if (this.match(TokenType.As)) {
      const aliasTok = this.expect(TokenType.Str, 'Expected alias string');
      alias = aliasTok.value;
    }
    const name = alias || pathTok.value.split('/').pop().split('.')[0];
    const asset = new Asset(name, pathTok.value, [pathTok.start, pathTok.end]);
    // Round-trip support: paths that are content-hashed sb3 asset names
    // (`<md5hex>.<ext>`) carry their md5ext/assetId/dataFormat through to
    // codegen so decompiled projects recompile with byte-identical assets.
    const base = pathTok.value.split('/').pop();
    const m = /^([0-9a-fA-F]{32})\.(svg|png|jpg|jpeg|gif|wav|mp3)$/.exec(base);
    if (m) {
      asset.md5ext = base.toLowerCase();
      asset.assetId = m[1].toLowerCase();
      asset.dataFormat = m[2] === 'jpg' ? 'jpg' : m[2];
    }
    return asset;
  }

  parseCallArgs() {
    this.skipNoise();
    const args = [];
    const kwargs = {};
    if (this.peek().type === TokenType.RParen) {
      return [args, kwargs];
    }

    while (true) {
      this.skipNoise();
      if (this.peek().type === TokenType.Name &&
          this.peek(1).type === TokenType.Colon) {
        const nameTok = this.advance();
        this.advance(); // consume :
        const value = this.parseExpr();
        kwargs[nameTok.value] = [[nameTok.start, nameTok.end], value];
      } else {
        args.push(this.parseExpr());
      }
      this.skipNoise();
      if (!this.match(TokenType.Comma)) break;
      this.skipNoise();
    }
    return [args, kwargs];
  }

  parseCommaSeparated(parseFn) {
    const result = [];
    this.skipNoise();
    if (this._isListEnd()) {
      return result;
    }
    while (true) {
      this.skipNoise();
      result.push(parseFn());
      this.skipNoise();
      if (!this.match(TokenType.Comma)) break;
      this.skipNoise();
      if (this._isListEnd()) break;
    }
    return result;
  }

  _isListEnd() {
    const t = this.peek().type;
    return [TokenType.RBrace, TokenType.RParen, TokenType.RBracket,
            TokenType.Semicolon, TokenType.Newline].includes(t);
  }
}

// ---------------------------------------------------------------------------
// Convenience function: parse source code 鈫?Sprite
// ---------------------------------------------------------------------------

export function parse(tokens) {
  const parser = new Parser(tokens);
  const sprite = parser.parse();
  // Expose recovery-recorded diagnostics so callers (compileSource) can
  // refuse to emit an sb3 built from silently-skipped source.
  sprite.diagnostics = parser.diagnostics;
  // Multi-target sections (empty when the source used no `target` directive).
  sprite._extraTargets = parser.extraTargets;
  return sprite;
}
