// ast_nodes.js — AST node definitions for goboscript
// Ported from goboscript/ast_nodes.py
// Each Python @dataclass becomes a JS class with a constructor.

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

export class Name {
  constructor(name, span) {
    this.name = name;
    this.span = span;
  }
  basename() { return this.name; }
  fieldname() { return null; }
  is_dot() { return false; }
  toString() { return `Name(${JSON.stringify(this.name)})`; }
}

export class DotName {
  constructor(lhs, lhsSpan, rhs, rhsSpan, isGenerated = false) {
    this.lhs = lhs;
    this.lhs_span = lhsSpan;
    this.rhs = rhs;
    this.rhs_span = rhsSpan;
    this.is_generated = isGenerated;
  }
  get span() { return [this.lhs_span[0], this.rhs_span[1]]; }
  basename() { return this.lhs; }
  fieldname() { return this.rhs; }
  is_dot() { return true; }
  toString() { return `DotName(${JSON.stringify(this.lhs)}.${JSON.stringify(this.rhs)})`; }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export class TypeValue {
  constructor() {}
}

export class TypeStruct {
  constructor(name, span) {
    this.name = name;
    this.span = span;
  }
}

// ---------------------------------------------------------------------------
// Runtime values
// ---------------------------------------------------------------------------

export class Value {
  constructor(kind, data) {
    this.kind = kind; // "boolean", "number", "string"
    this.data = data; // bool, number, or string
  }

  static fromBool(b) { return new Value('boolean', !!b); }
  static fromFloat(f) { return new Value('number', Number(f)); }
  static fromStr(s) { return new Value('string', String(s)); }
  static fromInt(i) { return new Value('number', Number(i)); }

  toNumber() {
    if (this.kind === 'boolean') return this.data ? 1.0 : 0.0;
    if (this.kind === 'number') return Number(this.data);
    // string -> number (Scratch yields 0 for unparseable strings)
    const f = parseFloat(this.data);
    return isNaN(f) ? 0.0 : f;
  }

  toString() {
    if (this.kind === 'boolean') return this.data ? 'true' : 'false';
    if (this.kind === 'number') {
      const f = Number(this.data);
      if (f === Math.floor(f)) return String(Math.floor(f));
      return String(f);
    }
    return String(this.data);
  }

  toBoolean() {
    if (this.kind === 'boolean') return !!this.data;
    if (this.kind === 'number') return Number(this.data) !== 0.0;
    return !!this.data;
  }

  isInteger() {
    if (this.kind !== 'number') return false;
    const f = Number(this.data);
    if (isNaN(f)) return false;
    return f === Math.floor(f);
  }
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export class ExprValue {
  constructor(value, span) { this.value = value; this.span = span; }
}

export class ExprName {
  constructor(name) { this.name = name; }
}

export class ExprDot {
  constructor(lhs, rhs, rhsSpan) { this.lhs = lhs; this.rhs = rhs; this.rhs_span = rhsSpan; }
}

export class ExprArg {
  constructor(name) { this.name = name; }
}

export class ExprRepr {
  constructor(repr, span, args = []) { this.repr = repr; this.span = span; this.args = args; }
}

export class ExprFuncCall {
  constructor(name, span, args = [], kwargs = {}) { this.name = name; this.span = span; this.args = args; this.kwargs = kwargs; }
}

export class ExprUnOp {
  constructor(op, span, opr) { this.op = op; this.span = span; this.opr = opr; }
}

export class ExprBinOp {
  constructor(op, span, lhs, rhs) { this.op = op; this.span = span; this.lhs = lhs; this.rhs = rhs; }
}

// AI-compat superset: `cond ? a : b` (upstream goboscript has no
// expression-level conditional). Lowers to the operator_ifelse primitive.
export class ExprTernary {
  constructor(cond, thenExpr, elseExpr, span) { this.cond = cond; this.then = thenExpr; this.els = elseExpr; this.span = span; }
}

export class ExprStructLiteral {
  constructor(name, span, fields = []) { this.name = name; this.span = span; this.fields = fields; }
}

export class ExprProperty {
  constructor(object, property, span) { this.object = object; this.property = property; this.span = span; }
}

// ---------------------------------------------------------------------------
// Struct literals
// ---------------------------------------------------------------------------

export class StructLiteralField {
  constructor(name, span, value) { this.name = name; this.span = span; this.value = value; }
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export class StmtRepeat {
  constructor(times, body) { this.times = times; this.body = body; }
}

export class StmtForever {
  constructor(body, span) { this.body = body; this.span = span; }
}

export class StmtBranch {
  // hasElse: the source explicitly wrote `else` (even with an empty body).
  // Distinguishes `if c { }` (→ control_if) from `if c { } else { }` (→ control_if_else
  // with empty SUBSTACK2), which the SB3 round-trip must preserve.
  constructor(cond, ifBody, elseBody, hasElse = false) {
    this.cond = cond; this.if_body = ifBody; this.else_body = elseBody;
    this.has_else = hasElse || !!(elseBody && elseBody.length > 0);
  }
}

export class StmtUntil {
  constructor(cond, body) { this.cond = cond; this.body = body; }
}

export class StmtWaitUntil {
  constructor(cond) { this.cond = cond; }
}

export class StmtSetVar {
  constructor(name, value, type_, isLocal, isCloud) {
    this.name = name; this.value = value; this.type_ = type_;
    this.is_local = isLocal; this.is_cloud = isCloud;
  }
}

export class StmtChangeVar {
  constructor(name, value) { this.name = name; this.value = value; }
}

export class StmtShow {
  constructor(name) { this.name = name; }
}

export class StmtHide {
  constructor(name) { this.name = name; }
}

export class StmtAddToList {
  constructor(name, value) { this.name = name; this.value = value; }
}

export class StmtDeleteList {
  constructor(name) { this.name = name; }
}

export class StmtDeleteListIndex {
  constructor(name, index) { this.name = name; this.index = index; }
}

export class StmtInsertAtList {
  constructor(name, index, value) { this.name = name; this.index = index; this.value = value; }
}

export class StmtSetListIndex {
  constructor(name, index, value) { this.name = name; this.index = index; this.value = value; }
}

export class StmtBlock {
  constructor(block, span, args = [], kwargs = {}) { this.block = block; this.span = span; this.args = args; this.kwargs = kwargs; }
}

export class StmtProcCall {
  constructor(name, span, args = [], kwargs = {}) { this.name = name; this.span = span; this.args = args; this.kwargs = kwargs; }
}

export class StmtFuncCall {
  constructor(name, span, args = [], kwargs = {}) { this.name = name; this.span = span; this.args = args; this.kwargs = kwargs; }
}

export class StmtReturn {
  constructor(value, visited = false) { this.value = value; this.visited = visited; }
}

// ---------------------------------------------------------------------------
// Arguments, variables and lists
// ---------------------------------------------------------------------------

export class Arg {
  constructor(name, span, type_, default_, isUsed = false) {
    this.name = name; this.span = span; this.type_ = type_;
    this.default = default_; this.is_used = isUsed;
  }
}

export class Var {
  constructor(name, span, type_, default_, isCloud, isUsed = false) {
    this.name = name; this.span = span; this.type_ = type_;
    this.default = default_; this.is_cloud = isCloud; this.is_used = isUsed;
  }
}

export class ListDefaultValues {
  constructor(values) { this.values = values; }
}

export class ListDefaultFile {
  constructor(path, span) { this.path = path; this.span = span; }
}

export class ListNode {
  constructor(name, span, type_, default_, isUsed = false) {
    this.name = name; this.span = span; this.type_ = type_;
    this.default = default_; this.is_used = isUsed;
  }
}

// ---------------------------------------------------------------------------
// Procedures and functions
// ---------------------------------------------------------------------------

export class Proc {
  constructor(name, span, warp = true) { this.name = name; this.span = span; this.warp = warp; }
}

export class Func {
  // Functions carry a return value, so the generated custom block MUST run
  // in warp mode (运行时不刷新屏幕). scratch-vm's procedures_call with
  // warp=false spawns an async child thread — the caller reads
  // `returnedFunc:<fn>` before the body has run, yielding a stale/garbage
  // return value (the root cause of "function calls always returning 13").
  constructor(name, span, type_ = null, warp = true) { this.name = name; this.span = span; this.type_ = type_; this.warp = warp; }
}

// ---------------------------------------------------------------------------
// Structs and enums
// ---------------------------------------------------------------------------

export class StructField {
  constructor(name, span, default_, isUsed = false) {
    this.name = name; this.span = span; this.default = default_; this.is_used = isUsed;
  }
}

export class Struct {
  constructor(name, span, fields = [], isUsed = false) {
    this.name = name; this.span = span; this.fields = fields; this.is_used = isUsed;
  }
}

export class EnumVariant {
  constructor(name, span, value, isUsed = false) {
    this.name = name; this.span = span; this.value = value; this.is_used = isUsed;
  }
}

export class EnumNode {
  constructor(name, span, variants = [], isUsed = false) {
    this.name = name; this.span = span; this.variants = variants; this.is_used = isUsed;
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export class EventKind {
  constructor(kind, opts = {}) {
    // Accept both calling conventions:
    //   new EventKind('OnFlag', { key: 'space' })
    //   new EventKind({ kind: 'OnFlag', key: 'space' })
    if (kind !== null && typeof kind === 'object' && !Array.isArray(kind)) {
      opts = kind;
      this.kind = opts.kind;
      this.key = opts.key ?? null;
      this.key_span = opts.key_span ?? opts.keySpan ?? null;
      this.backdrop = opts.backdrop ?? null;
      this.backdrop_span = opts.backdrop_span ?? opts.backdropSpan ?? null;
      this.event = opts.event ?? null;
      this.value = opts.value ?? null;
    } else {
      this.kind = kind;
      this.key = opts.key ?? null;
      this.key_span = opts.key_span ?? opts.keySpan ?? null;
      this.backdrop = opts.backdrop ?? null;
      this.backdrop_span = opts.backdrop_span ?? opts.backdropSpan ?? null;
      this.event = opts.event ?? null;
      this.value = opts.value ?? null;
    }
  }

  opcode() {
    switch (this.kind) {
      case 'OnFlag': return 'event_whenflagclicked';
      case 'OnKey': return 'event_whenkeypressed';
      case 'OnClick': return 'event_whenthisspriteclicked';
      case 'OnBackdrop': return 'event_whenbackdropswitchesto';
      case 'OnLoudnessGt':
      case 'OnTimerGt': return 'event_whengreaterthan';
      case 'OnClone': return 'control_start_as_clone';
      case 'On': return 'event_whenbroadcastreceived';
      default: throw new Error(`unknown event kind: ${JSON.stringify(this.kind)}`);
    }
  }
}

export class Event {
  constructor(kind, span, body) { this.kind = kind; this.span = span; this.body = body; }
}

// ---------------------------------------------------------------------------
// Assets and sprite configuration
// ---------------------------------------------------------------------------

export class Asset {
  constructor(name, path, span) { this.name = name; this.path = path; this.span = span; }
}

export class RotationStyle {
  constructor(style = 'all around') { this.style = style; }
}

// ---------------------------------------------------------------------------
// Constant expressions
// ---------------------------------------------------------------------------

export class ConstExprValue {
  constructor(value, span) { this.value = value; this.span = span; }
}

export class ConstExprEnumVariant {
  constructor(enumName, enumNameSpan, variantName, variantNameSpan) {
    this.enum_name = enumName; this.enum_name_span = enumNameSpan;
    this.variant_name = variantName; this.variant_name_span = variantNameSpan;
  }
}

export class ConstExprStructLiteral {
  constructor(name, span, fields = []) { this.name = name; this.span = span; this.fields = fields; }
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export class Diagnostic {
  constructor(kind, span) { this.kind = kind; this.span = span; }
}

// ---------------------------------------------------------------------------
// Sprite and Project
// ---------------------------------------------------------------------------

export class Sprite {
  constructor() {
    this.costumes = [];
    this.sounds = [];
    this.procs = {};
    this.proc_definitions = {};
    this.proc_args = {};
    this.proc_references = {};
    this.funcs = {};
    this.func_definitions = {};
    this.func_args = {};
    this.func_references = {};
    this.enums = {};
    this.structs = {};
    this.vars = {};
    this.proc_locals = {};
    this.func_locals = {};
    this.lists = {};
    this.events = [];
    // Top-level orphan stacks: `orphan { ... }` groups holding loose SB3
    // top-level blocks that are not attached to any hat. They carry no
    // runtime semantics but must survive a decompile → recompile round-trip,
    // so each group is emitted as its own topLevel=true chain without a hat.
    this.orphanChains = [];
    this.used_procs = new Set();
    this.used_funcs = new Set();
    this.volume = null;
    this.x_position = null;
    this.y_position = null;
    this.size = null;
    this.direction = null;
    this.rotation_style = new RotationStyle();
    this.hidden = false;
  }

  addVar(var_, diagnostics) {
    // Object.prototype.hasOwnProperty — `in` pierces the prototype chain, so
    // a variable legally named `toString`/`constructor` would false-positive
    // as a redefinition.
    if (Object.prototype.hasOwnProperty.call(this.vars, var_.name) ||
        Object.prototype.hasOwnProperty.call(this.lists, var_.name)) {
      diagnostics.push(new Diagnostic('VariableRedefinition', var_.span));
      return;
    }
    this.vars[var_.name] = var_;
  }

  addList(lst, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.vars, lst.name) ||
        Object.prototype.hasOwnProperty.call(this.lists, lst.name)) {
      diagnostics.push(new Diagnostic('VariableRedefinition', lst.span));
      return;
    }
    this.lists[lst.name] = lst;
  }

  addProc(proc, args, body, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.procs, proc.name)) {
      diagnostics.push(new Diagnostic('ProcRedefinition', proc.span));
      return;
    }
    this.procs[proc.name] = proc;
    this.proc_args[proc.name] = args;
    this.proc_definitions[proc.name] = body;
  }

  addFunc(func, args, body, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.funcs, func.name)) {
      diagnostics.push(new Diagnostic('FuncRedefinition', func.span));
      return;
    }
    this.funcs[func.name] = func;
    this.func_args[func.name] = args;
    this.func_definitions[func.name] = body;
  }

  addStruct(struct, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.structs, struct.name)) {
      diagnostics.push(new Diagnostic('StructRedefinition', struct.span));
      return;
    }
    this.structs[struct.name] = struct;
  }

  addEnum(enum_, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.enums, enum_.name)) {
      diagnostics.push(new Diagnostic('EnumRedefinition', enum_.span));
      return;
    }
    this.enums[enum_.name] = enum_;
  }
}

export class Project {
  constructor(stage, sprites) {
    this.stage = stage;
    this.sprites = sprites; // { name: Sprite }
  }
}
