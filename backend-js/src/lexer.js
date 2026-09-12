// lexer.js — Lexer for goboscript
// Ported from goboscript/lexer.py

// ---------------------------------------------------------------------------
// TokenType — all possible token types
// ---------------------------------------------------------------------------

export const TokenType = {
  // Preprocessor directives
  Define: 'Define', Undef: 'Undef',
  // Whitespace / line-continuation
  Newline: 'Newline', Backslash: 'Backslash',
  // Top-level declaration keywords
  Costumes: 'Costumes', Sounds: 'Sounds', Local: 'Local',
  Proc: 'Proc', Func: 'Func', Return: 'Return', NoWarp: 'NoWarp',
  // Event keywords
  On: 'On', OnFlag: 'OnFlag', OnKey: 'OnKey', OnClick: 'OnClick',
  OnBackdrop: 'OnBackdrop', OnLoudness: 'OnLoudness', OnTimer: 'OnTimer', OnClone: 'OnClone',
  // Control-flow keywords
  If: 'If', Else: 'Else', Elif: 'Elif', Until: 'Until', While: 'While',
  WaitUntil: 'WaitUntil', Forever: 'Forever', Repeat: 'Repeat',
  // Multi-target section directive (InstanceScratch extension)
  Target: 'Target',
  // Logical / membership keywords
  Not: 'Not', And: 'And', Or: 'Or', In: 'In',
  // Math built-in keywords
  Length: 'Length', Round: 'Round', Abs: 'Abs', Floor: 'Floor', Ceil: 'Ceil',
  Sqrt: 'Sqrt', Sin: 'Sin', Cos: 'Cos', Tan: 'Tan', Asin: 'Asin', Acos: 'Acos',
  Atan: 'Atan', Ln: 'Ln', Log: 'Log', Antiln: 'Antiln', Antilog: 'Antilog',
  // Visibility keywords
  Show: 'Show', Hide: 'Hide',
  // List keywords
  Add: 'Add', To: 'To', Delete: 'Delete', Insert: 'Insert', At: 'At', As: 'As',
  // Type / aggregate keywords
  Enum: 'Enum', Struct: 'Struct', True_: 'True_', False_: 'False_',
  List: 'List', Cloud: 'Cloud', Var: 'Var', Orphan: 'Orphan',
  // Built-in block keywords (snake_case)
  set_x: 'set_x', set_y: 'set_y', set_size: 'set_size',
  point_in_direction: 'point_in_direction', set_volume: 'set_volume',
  set_rotation_style_left_right: 'set_rotation_style_left_right',
  set_rotation_style_all_around: 'set_rotation_style_all_around',
  set_rotation_style_do_not_rotate: 'set_rotation_style_do_not_rotate',
  // Punctuation
  Comma: 'Comma', LParen: 'LParen', RParen: 'RParen',
  LBrace: 'LBrace', RBrace: 'RBrace', Assign: 'Assign',
  Eq: 'Eq', Increment: 'Increment', Decrement: 'Decrement',
  AssignAdd: 'AssignAdd', AssignSubtract: 'AssignSubtract',
  AssignMultiply: 'AssignMultiply', AssignDivide: 'AssignDivide',
  AssignFloorDiv: 'AssignFloorDiv', AssignModulo: 'AssignModulo',
  AssignJoin: 'AssignJoin', LBracket: 'LBracket', RBracket: 'RBracket',
  Dot: 'Dot', Ne: 'Ne', Lt: 'Lt', Gt: 'Gt', Le: 'Le', Ge: 'Ge',
  Amp: 'Amp', Plus: 'Plus', Minus: 'Minus', Star: 'Star',
  Slash: 'Slash', FloorDiv: 'FloorDiv', Percent: 'Percent',
  Semicolon: 'Semicolon', Colon: 'Colon', Pipe: 'Pipe',
  Question: 'Question', Caret: 'Caret',
  // Value-bearing tokens
  Name: 'Name', Arg: 'Arg', Bin: 'Bin', Oct: 'Oct',
  Int: 'Int', Hex: 'Hex', Float: 'Float', Str: 'Str',
};

// Mapping from a lowercased identifier string to its keyword TokenType.
// Null-prototype: a plain `{}` inherits Object properties, so identifiers
// like `constructor`/`toString`/`valueOf` would lex as keywords/functions
// instead of Name tokens.
export const KEYWORDS = Object.assign(Object.create(null), {
  'define': TokenType.Define, 'undef': TokenType.Undef,
  'costumes': TokenType.Costumes, 'sounds': TokenType.Sounds,
  'local': TokenType.Local, 'proc': TokenType.Proc, 'func': TokenType.Func,
  'return': TokenType.Return, 'nowarp': TokenType.NoWarp,
  'on': TokenType.On, 'onflag': TokenType.OnFlag, 'onkey': TokenType.OnKey,
  'onclick': TokenType.OnClick, 'onbackdrop': TokenType.OnBackdrop,
  'onloudness': TokenType.OnLoudness, 'ontimer': TokenType.OnTimer,
  'onclone': TokenType.OnClone,
  'orphan': TokenType.Orphan,
  'if': TokenType.If, 'else': TokenType.Else, 'elif': TokenType.Elif,
  'until': TokenType.Until, 'wait_until': TokenType.WaitUntil,
  'while': TokenType.While,
  'target': TokenType.Target,
  'forever': TokenType.Forever, 'repeat': TokenType.Repeat,
  'not': TokenType.Not, 'and': TokenType.And, 'or': TokenType.Or, 'in': TokenType.In,
  'length': TokenType.Length, 'round': TokenType.Round, 'abs': TokenType.Abs,
  'floor': TokenType.Floor, 'ceil': TokenType.Ceil, 'sqrt': TokenType.Sqrt,
  'sin': TokenType.Sin, 'cos': TokenType.Cos, 'tan': TokenType.Tan,
  'asin': TokenType.Asin, 'acos': TokenType.Acos, 'atan': TokenType.Atan,
  'ln': TokenType.Ln, 'log': TokenType.Log, 'antiln': TokenType.Antiln,
  'antilog': TokenType.Antilog,
  'show': TokenType.Show, 'hide': TokenType.Hide,
  'add': TokenType.Add, 'to': TokenType.To, 'delete': TokenType.Delete,
  'insert': TokenType.Insert, 'at': TokenType.At, 'as': TokenType.As,
  'enum': TokenType.Enum, 'struct': TokenType.Struct,
  'true': TokenType.True_, 'false': TokenType.False_,
  'list': TokenType.List, 'cloud': TokenType.Cloud, 'var': TokenType.Var,
  'set_x': TokenType.set_x, 'set_y': TokenType.set_y,
  'set_size': TokenType.set_size,
  'point_in_direction': TokenType.point_in_direction,
  'set_volume': TokenType.set_volume,
  'set_rotation_style_left_right': TokenType.set_rotation_style_left_right,
  'set_rotation_style_all_around': TokenType.set_rotation_style_all_around,
  'set_rotation_style_do_not_rotate': TokenType.set_rotation_style_do_not_rotate,
});

export class Token {
  constructor(type, value = null, start = 0, end = 0) {
    this.type = type;
    this.value = value;
    this.start = start;
    this.end = end;
  }
}

export class LexError extends Error {
  constructor(message, offset) {
    super(message);
    this.message = message;
    this.offset = offset;
  }
}

// ---------------------------------------------------------------------------
// Regular-expression fragments used by the scanner.
// ---------------------------------------------------------------------------

const _RE_SKIP_WS = /[ \r\t\f\uFEFF]+/;
// Line comments: upstream goboscript uses `#`. `//` (C-style, written
// constantly by LLMs) is accepted as an extension — but ONLY where an
// expression cannot continue. After a complete operand (`16 // 4`) the
// upstream FloorDiv token (token.rs `#[token("//")]`) must win, so the
// scanner consults the previous significant token before treating `//` as a
// comment (see lex() step 2).
const _RE_HASH_COMMENT = /#[^\n]*\n?/;
const _RE_SLASHSLASH_COMMENT = /\/\/[^\n]*\n?/;
// Token types after which `//` continues an expression (FloorDiv), not a
// comment: operand atoms and closing brackets.
const _EXPR_TAIL_TYPES = new Set([
  TokenType.Name, TokenType.Int, TokenType.Float, TokenType.Str,
  TokenType.Hex, TokenType.Oct, TokenType.Bin, TokenType.Arg,
  TokenType.RBracket, TokenType.RParen, TokenType.True_, TokenType.False_,
]);
// Block comments: C-style `/* ... */`, also an AI-friendly extension.
const _RE_BLOCK_COMMENT = /\/\*[\s\S]*?\*\//;
const _RE_IDENT = /[_a-zA-Z][_a-zA-Z0-9]*/;
const _RE_ARG = /\$[_a-zA-Z0-9]+/;
const _RE_BIN = /0b[0-1][_0-1]*/;
const _RE_OCT = /0o[0-7][_0-7]*/;
const _RE_HEX = /0x[0-9a-fA-F][_0-9a-fA-F]*/;
const _RE_INT = /0|[1-9][0-9]*/;
const _RE_INT_RUN = /[0-9][_0-9]*/;
const _RE_FLOAT_FRACTION = /\.[0-9]+/;
const _RE_FLOAT_EXPONENT = /[Ee][\-+]?[0-9]+/;
const _RE_STRING = /"(?:[^"\\]|\\["\\/bfnrt]|\\u[0-9a-zA-Z]{4})*"/;
const _RE_PREPROC = /%(define|undef)\b/;

// Multi-character operators sorted longest-first so the scanner can attempt a
// greedy match. Each entry maps the literal text to its TokenType.
const _OPERATORS = [
  ['//=', TokenType.AssignFloorDiv],
  ['++', TokenType.Increment],
  ['--', TokenType.Decrement],
  ['+=', TokenType.AssignAdd],
  ['-=', TokenType.AssignSubtract],
  ['*=', TokenType.AssignMultiply],
  ['/=', TokenType.AssignDivide],
  ['%=', TokenType.AssignModulo],
  ['&=', TokenType.AssignJoin],
  ['&&', TokenType.And],
  ['||', TokenType.Or],
  ['==', TokenType.Eq],
  ['!=', TokenType.Ne],
  ['<=', TokenType.Le],
  ['>=', TokenType.Ge],
  ['//', TokenType.FloorDiv],
  ['|>', TokenType.Pipe],
  [',', TokenType.Comma],
  ['(', TokenType.LParen],
  [')', TokenType.RParen],
  ['{', TokenType.LBrace],
  ['}', TokenType.RBrace],
  ['[', TokenType.LBracket],
  [']', TokenType.RBracket],
  ['.', TokenType.Dot],
  ['&', TokenType.Amp],
  ['+', TokenType.Plus],
  ['-', TokenType.Minus],
  ['*', TokenType.Star],
  ['/', TokenType.Slash],
  ['%', TokenType.Percent],
  [';', TokenType.Semicolon],
  [':', TokenType.Colon],
  ['?', TokenType.Question],
  ['^', TokenType.Caret],
  ['<', TokenType.Lt],
  ['>', TokenType.Gt],
  ['=', TokenType.Assign],
  ['|', TokenType.Pipe],
  ['!', TokenType.Not],
];

// Helper: match regex exactly at position using sticky flag
function matchSticky(regex, str, offset) {
  const sticky = new RegExp(regex.source, 'y');
  sticky.lastIndex = offset;
  const m = sticky.exec(str);
  return m;
}

export class Lexer {
  constructor(source) {
    this.source = source;
    this._tokens = [];
    this.offset = 0;
    this.length = source.length;
  }

  lex() {
    while (this.offset < this.length) {
      // 1. Skip runs of insignificant whitespace.
      let m = matchSticky(_RE_SKIP_WS, this.source, this.offset);
      if (m) {
        this.offset += m[0].length;
        continue;
      }

      // 2. Skip line comments. `#` is always a comment (upstream). `//` is
      // context-sensitive: after a complete operand it is the upstream
      // FloorDiv operator (or `//=` AssignFloorDiv), everywhere else it is
      // the AI-friendly line-comment extension.
      if (this.source[this.offset] === '#') {
        m = matchSticky(_RE_HASH_COMMENT, this.source, this.offset);
        if (m) {
          this.offset += m[0].length;
          continue;
        }
      }
      if (this.source.startsWith('//', this.offset)) {
        const lastTok = this._tokens.length ? this._tokens[this._tokens.length - 1] : null;
        const exprContinues = !!(lastTok && _EXPR_TAIL_TYPES.has(lastTok.type));
        if (!exprContinues) {
          m = matchSticky(_RE_SLASHSLASH_COMMENT, this.source, this.offset);
          if (m) {
            this.offset += m[0].length;
            continue;
          }
        }
        // else: fall through to the operator table, which matches `//=`
        // (AssignFloorDiv) and `//` (FloorDiv) greedily — upstream parity.
      }

      // 2b. Skip block comments /* ... */ (non-greedy, may span lines; no
      // newline token is emitted so a comment never splits a statement).
      m = matchSticky(_RE_BLOCK_COMMENT, this.source, this.offset);
      if (m) {
        this.offset += m[0].length;
        continue;
      }

      // 3. Newline.
      const ch = this.source[this.offset];
      if (ch === '\n') {
        const start = this.offset;
        this.offset += 1;
        this._tokens.push(new Token(TokenType.Newline, null, start, start + 1));
        continue;
      }

      // 4. Line continuation backslash.
      // Upstream strips every Backslash token before parsing
      // (pre_processor.rs remove_marker_tokens), so content after `\`
      // belongs to the same statement. Splice C-style: swallow the backslash,
      // any horizontal whitespace and the joined newline, emitting no tokens,
      // so the continuation line merges into the current statement.
      if (ch === '\\') {
        this.offset += 1;
        while (this.offset < this.length &&
               /[ \r\t\f]/.test(this.source[this.offset])) {
          this.offset += 1;
        }
        if (this.source[this.offset] === '\n') {
          this.offset += 1;
        }
        continue;
      }

      // 5. Preprocessor directives or modulo operator.
      if (ch === '%') {
        if (this.source.startsWith('%=', this.offset)) {
          this._tokens.push(new Token(TokenType.AssignModulo, null, this.offset, this.offset + 2));
          this.offset += 2;
          continue;
        }
        const start = this.offset;
        m = matchSticky(_RE_PREPROC, this.source, this.offset);
        if (m) {
          const text = m[1];
          this.offset += m[0].length;
          const tokType = text === 'define' ? TokenType.Define : TokenType.Undef;
          this._tokens.push(new Token(tokType, null, start, this.offset));
          continue;
        }
        // Not a preprocessor directive — treat as modulo operator.
        this.offset += 1;
        this._tokens.push(new Token(TokenType.Percent, null, start, start + 1));
        continue;
      }

      // 6. Argument reference $name.
      m = matchSticky(_RE_ARG, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        this._tokens.push(new Token(TokenType.Arg, raw.slice(1), start, this.offset));
        continue;
      }

      // 7. Numeric literals.
      m = matchSticky(_RE_BIN, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, '');
        this._tokens.push(new Token(TokenType.Bin, parseInt(digits, 2), start, this.offset));
        continue;
      }

      m = matchSticky(_RE_OCT, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, '');
        this._tokens.push(new Token(TokenType.Oct, parseInt(digits, 8), start, this.offset));
        continue;
      }

      m = matchSticky(_RE_HEX, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, '');
        this._tokens.push(new Token(TokenType.Hex, parseInt(digits, 16), start, this.offset));
        continue;
      }

      // Float-or-int decision.
      const intMatch = matchSticky(_RE_INT_RUN, this.source, this.offset);
      if (intMatch) {
        const start = this.offset;
        const intEnd = start + intMatch[0].length;
        // Look for a fractional part.
        const fracMatch = matchSticky(_RE_FLOAT_FRACTION, this.source, intEnd);
        if (fracMatch) {
          const afterFrac = intEnd + fracMatch[0].length;
          const expMatch = matchSticky(_RE_FLOAT_EXPONENT, this.source, afterFrac);
          const end = expMatch ? afterFrac + expMatch[0].length : afterFrac;
          const raw = this.source.slice(start, end).replace(/_/g, '');
          this.offset = end;
          this._tokens.push(new Token(TokenType.Float, parseFloat(raw), start, end));
          continue;
        }
        // No fractional part -- look for an exponent.
        const expMatch = matchSticky(_RE_FLOAT_EXPONENT, this.source, intEnd);
        if (expMatch) {
          const end = intEnd + expMatch[0].length;
          const raw = this.source.slice(start, end).replace(/_/g, '');
          this.offset = end;
          this._tokens.push(new Token(TokenType.Float, parseFloat(raw), start, end));
          continue;
        }
        // Plain integer.
        const raw = intMatch[0].replace(/_/g, '');
        this.offset = intEnd;
        this._tokens.push(new Token(TokenType.Int, parseInt(raw, 10), start, intEnd));
        continue;
      }

      // 8. String literal.
      m = matchSticky(_RE_STRING, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        let decoded;
        try {
          decoded = JSON.parse(raw);
        } catch (e) {
          throw new LexError(`invalid string literal: ${e.message}`, start);
        }
        this._tokens.push(new Token(TokenType.Str, decoded, start, this.offset));
        continue;
      }

      // 9. Identifier / keyword.
      m = matchSticky(_RE_IDENT, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const text = m[0];
        this.offset += text.length;
        const tokType = KEYWORDS[text];
        if (tokType) {
          this._tokens.push(new Token(tokType, null, start, this.offset));
        } else {
          this._tokens.push(new Token(TokenType.Name, text, start, this.offset));
        }
        continue;
      }

      // 10. Operators / punctuation.
      let matched = false;
      for (const [opText, opType] of _OPERATORS) {
        if (this.source.startsWith(opText, this.offset)) {
          const start = this.offset;
          this.offset += opText.length;
          this._tokens.push(new Token(opType, null, start, this.offset));
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // 11. Anything else is an error.
      throw new LexError(`unexpected character ${JSON.stringify(ch)}`, this.offset);
    }

    return this._tokens;
  }
}

export function lex(source) {
  return new Lexer(source).lex();
}
