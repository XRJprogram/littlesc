// visitor.js — Visitor passes for goboscript
// Ported from goboscript/visitor.py (1:1 alignment)
// pass0: variable collection & enum auto-increment
// pass1: function-call expansion
// pass2: expression transformations (operator lowering, constant folding)
// pass3+4: reference collection & dead-code elimination

import {
  Name, Value, TypeValue, TypeStruct, Var,
  ExprValue, ExprName, ExprBinOp, ExprUnOp, ExprRepr, ExprFuncCall, ExprTernary,
  StmtSetVar, StmtChangeVar, StmtAddToList, StmtDeleteListIndex,
  StmtInsertAtList, StmtSetListIndex, StmtBlock, StmtProcCall,
  StmtFuncCall, StmtReturn, StmtRepeat, StmtForever, StmtBranch,
  StmtUntil, StmtWaitUntil, Diagnostic, StmtDeleteList,
  ListNode, ListDefaultValues,
} from './ast_nodes.js';
import { Block, Repr, UnOp, BinOp } from './blocks.js';

// ---------------------------------------------------------------------------
// pass0: variable collection & enum auto-increment
// ---------------------------------------------------------------------------

export function visitProjectPass0(project) {
  const diagnostics = [];
  _visitSpritePass0(project.stage, project, diagnostics);
  for (const sprite of Object.values(project.sprites)) {
    _visitSpritePass0(sprite, project, diagnostics);
  }
  return diagnostics;
}

function _visitSpritePass0(sprite, project, diagnostics) {
  // Enum auto-increment (pass0.rs visit_enum): only an explicit *Number*
  // value updates the auto-numbering base. A non-numeric explicit value
  // (e.g. a string) must be left untouched and must NOT poison the counter
  // with NaN. Explicit values set the base without bumping it.
  for (const enum_ of Object.values(sprite.enums)) {
    let counter = 0.0;
    for (const variant of enum_.variants) {
      if (variant.value !== null && variant.value !== undefined) {
        const explicit = variant.value[0];
        if (explicit && explicit.kind === 'number') {
          counter = explicit.toNumber();
        }
      } else {
        variant.value = [Value.fromFloat(counter), variant.span];
        counter += 1.0;
      }
    }
  }

  // Collect variables from proc/func bodies and event bodies
  for (const procName of Object.keys(sprite.proc_definitions)) {
    const body = sprite.proc_definitions[procName];
    if (!sprite.proc_locals[procName]) sprite.proc_locals[procName] = {};
    _collectVars(body, sprite, sprite.proc_locals[procName], project);
  }

  for (const funcName of Object.keys(sprite.func_definitions)) {
    const body = sprite.func_definitions[funcName];
    if (!sprite.func_locals[funcName]) sprite.func_locals[funcName] = {};
    _collectVars(body, sprite, sprite.func_locals[funcName], project);
    // Inject {func}:return variable
    const func = sprite.funcs[funcName];
    const retVar = new Var(
      `returnedFunc:${funcName}`, func.span,
      func.type_ || new TypeValue(),
      null, false
    );
    retVar.is_used = true;
    sprite.vars[`returnedFunc:${funcName}`] = retVar;
  }

  for (const event of sprite.events) {
    _collectVars(event.body, sprite, {}, project);
  }
}

function _collectVars(stmts, sprite, localsDict, project) {
  for (const stmt of stmts) {
    if (stmt instanceof StmtSetVar && stmt.is_local) {
      // pass0.rs:216-226: a redeclaration overwrites an existing local whose
      // old type is Value; an already-typed (struct) declaration is preserved.
      const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
      const existing = localsDict[name];
      const isValueType = (t) => !(t instanceof TypeStruct);
      if (existing !== undefined) {
        if (isValueType(existing.type_)) {
          localsDict[name] = new Var(
            name, stmt.name.span || [0, 0],
            stmt.type_, null, !!stmt.is_cloud, false
          );
        }
      } else {
        localsDict[name] = new Var(
          name, stmt.name.span || [0, 0],
          stmt.type_, null, !!stmt.is_cloud, false
        );
      }
    } else if (stmt instanceof StmtSetVar && !stmt.is_local) {
      // pass0.rs:200-263: cloud variables are collected like any other
      // variable, keeping their is_cloud marker.
      const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
      if (!(name in sprite.vars) && !(name in localsDict)) {
        const bare = name.startsWith('__') ? name.slice(2) : name;
        const isGlobal = name in project.stage.vars || bare in project.stage.vars;
        if (!isGlobal) {
          sprite.vars[name] = new Var(
            name, stmt.name.span || [0, 0],
            stmt.type_, null, !!stmt.is_cloud, false
          );
        }
      }
    }

    // List-container pre-registration: qualifyName() must see every list
    // by codegen time, but AI programs routinely mention a list only
    // inside a proc body while the add-to statements live in an event.
    // Statement-level triggers only — unambiguous list intents.
    const _ensureList = (nm, sp) => {
      if (!(nm in sprite.lists) && !(nm in sprite.vars) &&
          !(nm in project.stage.lists) && !(nm in project.stage.vars)) {
        sprite.lists[nm] = new ListNode(nm, sp || [0, 0], new TypeValue(),
          new ListDefaultValues([]));
      }
    };
    const _nmOf = (n) => (n instanceof Name ? n.name : String(n));
    if (stmt instanceof StmtAddToList || stmt instanceof StmtDeleteList) {
      _ensureList(_nmOf(stmt.name), stmt.name && stmt.name.span);
    } else if (stmt instanceof StmtSetListIndex || stmt instanceof StmtDeleteListIndex || stmt instanceof StmtInsertAtList) {
      _ensureList(_nmOf(stmt.name), stmt.name && stmt.name.span);
    }

    // Recurse into control flow bodies
    if (stmt instanceof StmtRepeat || stmt instanceof StmtForever || stmt instanceof StmtUntil) {
      _collectVars(stmt.body, sprite, localsDict, project);
    } else if (stmt instanceof StmtBranch) {
      _collectVars(stmt.if_body, sprite, localsDict, project);
      _collectVars(stmt.else_body, sprite, localsDict, project);
    }
  }
}

// ---------------------------------------------------------------------------
// pass1: function-call expansion
// ---------------------------------------------------------------------------

export function visitProjectPass1(project) {
  const diagnostics = [];
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    _visitSpritePass1(sprite, project);
  }
  return diagnostics;
}

function _visitSpritePass1(sprite, project) {
  const callsiteCounter = [0];

  for (const procName of Object.keys(sprite.proc_definitions)) {
    sprite.proc_definitions[procName] = _expandFuncCalls(
      sprite.proc_definitions[procName], sprite, callsiteCounter, null
    );
  }

  for (const funcName of Object.keys(sprite.func_definitions)) {
    sprite.func_definitions[funcName] = _expandFuncCalls(
      sprite.func_definitions[funcName], sprite, callsiteCounter, funcName
    );
  }

  for (const event of sprite.events) {
    event.body = _expandFuncCalls(event.body, sprite, callsiteCounter, null);
    // pass1.rs:59-73: OnLoudnessGt / OnTimerGt threshold expressions are
    // visited as well. Upstream passes a throwaway `before` vec — hat
    // thresholds cannot host statements, so any expanded callsite statements
    // are dropped while the expression itself is rewritten.
    if (event.kind
        && (event.kind.kind === 'OnLoudnessGt' || event.kind.kind === 'OnTimerGt')
        && event.kind.value) {
      const [newValue] = _expandExprFuncCalls(event.kind.value, sprite, callsiteCounter);
      event.kind.value = newValue;
    }
  }

  // M27-F: publish every remaining function as a NATIVE procedure so
  // codegen emits a visible 自定义积木 definition + call blocks instead of
  // compile-time inlining. Bodies were expanded above; returns were lowered
  // into `set returnedFunc:<fn>` + stop by the StmtReturn branch.
  for (const funcName of Object.keys(sprite.func_definitions)) {
    let body = sprite.func_definitions[funcName];
    // Deterministic default: make sure the return variable always receives
    // a value even when control falls off the end WITHOUT an explicit
    // return. If the body ALREADY ends with an explicit trailing
    // `return expr;` (lowered to set returnedFunc:<fn>), appending another
    // set-to-default AFTER it would silently clobber the result — so skip.
    const _lastStmt = body.length ? body[body.length - 1] : null;
    const _lastName = _lastStmt && _lastStmt.name
      ? (_lastStmt.name instanceof Name ? _lastStmt.name.name : String(_lastStmt.name))
      : null;
    // A trailing `return` lowers to [setvar, StopThisScript]: the STOP is a
    // terminal block — chaining anything after it yields an illegal sb3/XML
    // <next> under control_stop, which crashes Blockly rendering (the
    // isConnected-of-null failure). Treat a terminal STOP the same as an
    // explicit trailing return: never append after it.
    // NOTE: this runs in PASS1 — a trailing `return` is still an unevaluated
    // StmtReturn marker here (it becomes setvar+StopThisScript only in the
    // later transform pass), so StmtReturn MUST be part of this check.
    const _endsWithExplicitReturn = _lastName === ('returnedFunc:' + funcName)
      || (_lastStmt instanceof StmtBlock)
      || (_lastStmt instanceof StmtReturn);
    if (!_endsWithExplicitReturn) {
      body = body.concat([new StmtSetVar(
        new Name(`returnedFunc:${funcName}`, [0, 0]),
        new ExprValue(Value.fromFloat(0.0), [0, 0]), new TypeValue(), false, false
      )]);
    }
    sprite.proc_definitions[funcName] = body;
    sprite.proc_args[funcName] = sprite.func_args[funcName] || [];
    sprite.procs[funcName] = sprite.funcs[funcName];
    sprite.proc_locals[funcName] = sprite.func_locals[funcName] || {};
  }
}

function _expandFuncCalls(stmts, sprite, counter, funcName = null) {
  const result = [];
  for (const stmt of stmts) {
    const [before, newStmt] = _expandStmtFuncCalls(stmt, sprite, counter, funcName);
    result.push(...before);
    if (newStmt !== null) {
      result.push(newStmt);
    }
  }
  return result;
}

// Deep-clone a callsite statement (StmtFuncCall / StmtSetVar produced by
// callsite expansion). Upstream clones the Rust structs for the two copies
// (one before the loop, one at the end of the body); sharing JS objects would
// alias mutations across the two sites.
function _cloneCallsiteStmt(stmt) {
  if (stmt instanceof StmtFuncCall) {
    const kwargs = {};
    for (const k of Object.keys(stmt.kwargs || {})) {
      kwargs[k] = _cloneCallExpr(stmt.kwargs[k]);
    }
    return new StmtFuncCall(stmt.name, stmt.span, stmt.args.map(_cloneCallExpr), kwargs);
  }
  if (stmt instanceof StmtSetVar) {
    const name = stmt.name instanceof Name
      ? new Name(stmt.name.name, stmt.name.span)
      : stmt.name;
    return new StmtSetVar(name, _cloneCallExpr(stmt.value), stmt.type_, stmt.is_local, stmt.is_cloud);
  }
  return stmt;
}

function _cloneCallExpr(expr) {
  if (expr === null || expr === undefined) return expr;
  if (expr instanceof ExprValue) return new ExprValue(expr.value, expr.span);
  if (expr instanceof ExprName) {
    return new ExprName(
      expr.name instanceof Name ? new Name(expr.name.name, expr.name.span) : expr.name
    );
  }
  if (expr instanceof ExprBinOp) {
    return new ExprBinOp(expr.op, expr.span, _cloneCallExpr(expr.lhs), _cloneCallExpr(expr.rhs));
  }
  if (expr instanceof ExprUnOp) {
    return new ExprUnOp(expr.op, expr.span, _cloneCallExpr(expr.opr));
  }
  if (expr instanceof ExprTernary) {
    return new ExprTernary(
      _cloneCallExpr(expr.cond), _cloneCallExpr(expr.then), _cloneCallExpr(expr.els), expr.span);
  }
  if (expr instanceof ExprRepr) {
    return new ExprRepr(expr.repr, expr.span, expr.args.map(_cloneCallExpr));
  }
  return expr;
}

function _expandStmtFuncCalls(stmt, sprite, counter, funcName = null) {
  const before = [];

  if (stmt instanceof StmtReturn) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    // pass1.rs:193-217: mark visited once. Inside a function body the return
    // value is hoisted into `{func}:return = expr` and the statement becomes
    // `return 0.0` (visited), which pass2 then turns into stop_this_script.
    if (!stmt.visited) {
      stmt.visited = true;
      if (funcName) {
        before.push(new StmtSetVar(
          new Name(`returnedFunc:${funcName}`, [0, 0]),
          newExpr, new TypeValue(), false, false
        ));
        return [before, new StmtReturn(new ExprValue(Value.fromFloat(0.0), [0, 0]), true)];
      }
    }
    return [before, stmt];
  }

  if (stmt instanceof StmtSetVar) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }

  if (stmt instanceof StmtChangeVar) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }

  if (stmt instanceof StmtAddToList) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }

  if (stmt instanceof StmtSetListIndex) {
    const [newVal, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newVal;
    const [newIdx, b2] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newIdx;
    before.push(...b, ...b2);
    return [before, stmt];
  }

  if (stmt instanceof StmtInsertAtList) {
    const [newVal, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newVal;
    const [newIdx, b2] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newIdx;
    before.push(...b, ...b2);
    return [before, stmt];
  }

  if (stmt instanceof StmtBlock) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    return [before, stmt];
  }

  if (stmt instanceof StmtProcCall) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    return [before, stmt];
  }

  if (stmt instanceof StmtRepeat) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.times, sprite, counter);
    stmt.times = newExpr;
    before.push(...b);
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    return [before, stmt];
  }

  if (stmt instanceof StmtUntil) {
    // pass1.rs:110-116: the condition's callsite statements must run once
    // before entering the loop AND again at the end of every iteration (the
    // condition is re-evaluated after the body). The clones appended to an
    // empty body become its mountable content, so no synthetic no-op needed.
    const condCallsites = [];
    const [newCond, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newCond;
    condCallsites.push(...b);
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    before.push(...condCallsites);
    stmt.body.push(...condCallsites.map(_cloneCallsiteStmt));
    return [before, stmt];
  }

  if (stmt instanceof StmtForever) {
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    return [before, stmt];
  }

  if (stmt instanceof StmtBranch) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newExpr;
    before.push(...b);
    stmt.if_body = _expandFuncCalls(stmt.if_body, sprite, counter, funcName);
    stmt.else_body = _expandFuncCalls(stmt.else_body, sprite, counter, funcName);
    return [before, stmt];
  }

  if (stmt instanceof StmtWaitUntil) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newExpr;
    before.push(...b);
    return [before, stmt];
  }

  if (stmt instanceof StmtDeleteListIndex) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newExpr;
    before.push(...b);
    return [before, stmt];
  }

  if (stmt instanceof StmtFuncCall) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    // M27-F: known function -> native procedure call (no inlining).
    if (stmt.name in sprite.funcs) {
      return [before, new StmtProcCall(stmt.name, stmt.span, stmt.args, stmt.kwargs || {})];
    }
    return [before, stmt];
  }

  return [before, stmt];
}

function _expandExprFuncCalls(expr, sprite, counter) {
  const before = [];

  if (expr === null || expr === undefined) {
    return [expr, before];
  }

  if (expr instanceof ExprFuncCall) {
    if (!(expr.name in sprite.funcs)) {
      return [expr, before];
    }

    // M27-F: lower to a NATIVE procedure call + read of its result.
    // The function stays a visible 自定义积木 on the canvas and runtime
    // recursion is allowed.
    //
    // IMPORTANT: returnedFunc:<fn> is a SINGLE sprite-level variable shared by
    // every call to that function. If two calls to the same function appear in
    // one expression (e.g. `def_eval_node(3) + def_eval_node(4)` — extremely
    // common in AI-generated parsers/calculators), the second call clobbers
    // the first call's result and BOTH operands read the last value. Fix: sink
    // the result into a unique temp var right after each call, then reference
    // that temp var.
    const newArgs = [];
    for (const arg of expr.args) {
      const [newArg, argBefore] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...argBefore);
      newArgs.push(newArg);
    }
    before.push(new StmtProcCall(expr.name, expr.span, newArgs, {}));

    counter[0] += 1;
    const tmpName = `__ret_${counter[0]}`;
    const tmpVar = new Var(tmpName, expr.span || [0, 0], new TypeValue(), null, false);
    tmpVar.is_used = true;
    sprite.vars[tmpName] = tmpVar;
    before.push(new StmtSetVar(
      new Name(tmpName, expr.span || [0, 0]),
      new ExprName(new Name(`returnedFunc:${expr.name}`, expr.span)),
      new TypeValue(), false, false
    ));
    return [new ExprName(new Name(tmpName, expr.span || [0, 0])), before];
  }
  if (expr instanceof ExprBinOp) {
    const [newLhs, b] = _expandExprFuncCalls(expr.lhs, sprite, counter);
    expr.lhs = newLhs;
    before.push(...b);
    const [newRhs, b2] = _expandExprFuncCalls(expr.rhs, sprite, counter);
    expr.rhs = newRhs;
    before.push(...b2);
    return [expr, before];
  }

  if (expr instanceof ExprUnOp) {
    const [newOpr, b] = _expandExprFuncCalls(expr.opr, sprite, counter);
    expr.opr = newOpr;
    before.push(...b);
    return [expr, before];
  }

  if (expr instanceof ExprTernary) {
    // Syntax sugar: `cond ? a : b` cannot compile to any real primitive —
    // scratch-vm has NO if/else REPORTER (only the control_if_else
    // STATEMENT), so an invented opcode would evaluate to undefined at
    // runtime and violates the sb3 spec. Lower here instead, mirroring
    // callsite expansion: emit a sprite-private hidden temp var __tern_N,
    // an `if (cond) { __tern_N = a } else { __tern_N = b }` statement group
    // as before-statements, and rewrite the expression to a plain var read.
    // Branches stay lazily evaluated, matching ternary semantics.
    const [newCond, b0] = _expandExprFuncCalls(expr.cond, sprite, counter);
    const [newThen] = _expandExprFuncCalls(expr.then, sprite, counter);
    const [newEls] = _expandExprFuncCalls(expr.els, sprite, counter);
    counter[0] += 1;
    const tmpName = `__tern_${counter[0]}`;
    const tmpVar = new Var(
      tmpName, expr.span || [0, 0],
      new TypeValue(),
      null, false
    );
    tmpVar.is_used = true;
    sprite.vars[tmpName] = tmpVar;
    before.push(...b0);
    before.push(new StmtBranch(
      newCond,
      [new StmtSetVar(new Name(tmpName, expr.span || [0, 0]), newThen, new TypeValue(), false, false)],
      [new StmtSetVar(new Name(tmpName, expr.span || [0, 0]), newEls, new TypeValue(), false, false)],
      true
    ));
    return [new ExprName(new Name(tmpName, expr.span || [0, 0])), before];
  }

  if (expr instanceof ExprRepr) {
    const newArgs = [];
    for (const arg of expr.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    expr.args = newArgs;
    return [expr, before];
  }

  return [expr, before];
}

// ---------------------------------------------------------------------------
// pass2: expression transformations
// ---------------------------------------------------------------------------

export function visitProjectPass2(project) {
  const diagnostics = [];
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    _visitSpritePass2(sprite, project, diagnostics);
  }
  return diagnostics;
}

function _visitSpritePass2(sprite, project, diagnostics) {
  for (const procName of Object.keys(sprite.proc_definitions)) {
    sprite.proc_definitions[procName] = _transformStmts(
      sprite.proc_definitions[procName], sprite, project, diagnostics, true
    );
  }
  for (const funcName of Object.keys(sprite.func_definitions)) {
    sprite.func_definitions[funcName] = _transformStmts(
      sprite.func_definitions[funcName], sprite, project, diagnostics, true
    );
  }
  for (const event of sprite.events) {
    event.body = _transformStmts(event.body, sprite, project, diagnostics, true);
    // pass2.rs:156-161: OnLoudnessGt / OnTimerGt threshold expressions are
    // transformed too (0-x lowering etc.).
    if (event.kind
        && (event.kind.kind === 'OnLoudnessGt' || event.kind.kind === 'OnTimerGt')
        && event.kind.value) {
      event.kind.value = _transformExpr(event.kind.value, sprite, project, diagnostics);
    }
  }
}

function _transformStmts(stmts, sprite, project, diagnostics, topLevel = true) {
  // Expression transforms on every statement (bodies recurse with
  // topLevel=false, matching pass2.rs visit_stmts).
  for (const stmt of stmts) {
    _transformStmt(stmt, sprite, project, diagnostics);
  }
  // pass2.rs:206-213: a trailing `return` in a script body is deleted
  // outright; any other `return` is *replaced* by exactly one
  // stop_this_script block (never appended after — that produced double
  // stops and made top-level returns hit codegen's STOP_OPTION='all'
  // fallback).
  const result = [];
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    if (stmt instanceof StmtReturn) {
      if (topLevel && i === stmts.length - 1) {
        continue;
      }
      result.push(new StmtBlock(Block.StopThisScript, [0, 0], [], {}));
      continue;
    }
    result.push(stmt);
  }
  return result;
}

function _transformStmt(stmt, sprite, project, diagnostics) {
  if (stmt instanceof StmtRepeat || stmt instanceof StmtUntil) {
    if ('times' in stmt && stmt.times !== undefined) {
      stmt.times = _transformExpr(stmt.times, sprite, project, diagnostics);
    } else if ('cond' in stmt && stmt.cond !== undefined) {
      stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
    }
    stmt.body = _transformStmts(stmt.body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtForever) {
    stmt.body = _transformStmts(stmt.body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtBranch) {
    stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
    stmt.if_body = _transformStmts(stmt.if_body, sprite, project, diagnostics, false);
    stmt.else_body = _transformStmts(stmt.else_body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtSetVar || stmt instanceof StmtChangeVar || stmt instanceof StmtAddToList) {
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtSetListIndex) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtInsertAtList) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtDeleteListIndex) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
  } else if (stmt instanceof StmtWaitUntil) {
    stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
  } else if (stmt instanceof StmtReturn) {
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtBlock || stmt instanceof StmtProcCall || stmt instanceof StmtFuncCall) {
    stmt.args = stmt.args.map(a => _transformExpr(a, sprite, project, diagnostics));
  }
}


function _isBooleanExpr(expr) {
  // Scratch boolean-typed reporters:
  //   - operator_equals / operator_not / operator_and / operator_or
  //   - operator_lt / operator_gt
  //   - sensing predicates (touching*, keypressed, mousedown)
  if (expr instanceof ExprBinOp) {
    return expr.op === BinOp.Eq || expr.op === BinOp.Ne ||
           expr.op === BinOp.Lt || expr.op === BinOp.Gt ||
           expr.op === BinOp.Le || expr.op === BinOp.Ge ||
           expr.op === BinOp.And || expr.op === BinOp.Or ||
           expr.op === BinOp.In;
  }
  if (expr instanceof ExprUnOp) {
    return expr.op === UnOp.Not;
  }
  if (expr instanceof ExprRepr) {
    return expr.repr === Repr.Contains || expr.repr === Repr.Touching || expr.repr === Repr.TouchingMousePointer ||
           expr.repr === Repr.TouchingEdge || expr.repr === Repr.KeyPressed ||
           expr.repr === Repr.MouseDown;
  }
  return false;
}

function _transformExpr(expr, sprite, project, diagnostics) {
  if (expr === null || expr === undefined) {
    return expr;
  }

  // Recurse first (bottom-up)
  if (expr instanceof ExprBinOp) {
    expr.lhs = _transformExpr(expr.lhs, sprite, project, diagnostics);
    expr.rhs = _transformExpr(expr.rhs, sprite, project, diagnostics);
  } else if (expr instanceof ExprUnOp) {
    expr.opr = _transformExpr(expr.opr, sprite, project, diagnostics);
  } else if (expr instanceof ExprRepr) {
    expr.args = expr.args.map(a => _transformExpr(a, sprite, project, diagnostics));
  } else if (expr instanceof ExprTernary) {
    expr.cond = _transformExpr(expr.cond, sprite, project, diagnostics);
    expr.then = _transformExpr(expr.then, sprite, project, diagnostics);
    expr.els = _transformExpr(expr.els, sprite, project, diagnostics);
  }

  // Apply transformations

  // minus: -x → 0 - x (recursively transform to enable constant folding)
  if (expr instanceof ExprUnOp && expr.op === UnOp.Minus) {
    const zero = new ExprValue(Value.fromFloat(0.0), expr.span);
    expr = new ExprBinOp(BinOp.Sub, expr.span, zero, expr.opr);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // Le: a <= b → !(a > b)
  if (expr instanceof ExprBinOp && expr.op === BinOp.Le) {
    const gt = new ExprBinOp(BinOp.Gt, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, gt);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // Ge: a >= b → !(a < b)
  if (expr instanceof ExprBinOp && expr.op === BinOp.Ge) {
    const lt = new ExprBinOp(BinOp.Lt, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, lt);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // Ne: a != b → !(a == b)
  if (expr instanceof ExprBinOp && expr.op === BinOp.Ne) {
    const eq = new ExprBinOp(BinOp.Eq, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, eq);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // FloorDiv: a // b → floor(a / b)
  if (expr instanceof ExprBinOp && expr.op === BinOp.FloorDiv) {
    const div = new ExprBinOp(BinOp.Div, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Floor, expr.span, div);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // Not: coerce non-boolean operands. `not x` where x is a variable or
  // literal → `x = 0` (operator_equals), which produces a Boolean-typed
  // block that Blockly accepts. Without this, `operator_not` receives a
  // String-typed `data_variable` operand → "Connection checks failed"
  // → entire procedures_definition stacks fail to render (自制积木只有
  // 调用、没有定义). Scratch evaluates `x = 0` the same way it evaluates
  // `not x` for both numbers and strings (0/"" falsy, others truthy).
  if (expr instanceof ExprUnOp && expr.op === UnOp.Not &&
      !_isBooleanExpr(expr.opr)) {
    const zero = new ExprValue(Value.fromFloat(0.0), expr.span);
    expr = new ExprBinOp(BinOp.Eq, expr.span, expr.opr, zero);
    return _transformExpr(expr, sprite, project, diagnostics);
  }

  // Constant folding / algebraic simplifications DISABLED for round-trip
  // fidelity: the original SB3 legitimately contains blocks like (" " & x),
  // (x - 0), (1 * x), (2 + 3) — users placed them. Folding or simplifying
  // them away changes the block histogram on every decompile → recompile
  // cycle, so a faithful round-trip must compile them back verbatim.
  if (false && expr instanceof ExprBinOp && expr.lhs instanceof ExprValue && expr.rhs instanceof ExprValue) {
    const folded = _tryFoldBinop(expr.op, expr.lhs.value, expr.rhs.value);
    if (folded !== null) {
      return new ExprValue(folded, expr.span);
    }
  }

  if (false && expr instanceof ExprUnOp && expr.opr instanceof ExprValue) {
    const folded = _tryFoldUnop(expr.op, expr.opr.value);
    if (folded !== null) {
      return new ExprValue(folded, expr.span);
    }
  }

  if (false && expr instanceof ExprBinOp) {
    // 0 + x → x, x + 0 → x
    if (expr.op === BinOp.Add) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === 'number' && expr.lhs.value.toNumber() === 0) {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'number' && expr.rhs.value.toNumber() === 0) {
        return expr.lhs;
      }
    }
    // x - 0 → x
    if (expr.op === BinOp.Sub && expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'number' && expr.rhs.value.toNumber() === 0) {
      return expr.lhs;
    }
    // 1 * x → x, x * 1 → x
    if (expr.op === BinOp.Mul) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === 'number' && expr.lhs.value.toNumber() === 1) {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'number' && expr.rhs.value.toNumber() === 1) {
        return expr.lhs;
      }
    }
    // x / 1 → x
    if (expr.op === BinOp.Div && expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'number' && expr.rhs.value.toNumber() === 1) {
      return expr.lhs;
    }
    // 0 * x → 0, x * 0 → 0
    if (expr.op === BinOp.Mul) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === 'number' && expr.lhs.value.toNumber() === 0) {
        return new ExprValue(Value.fromFloat(0.0), expr.span);
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'number' && expr.rhs.value.toNumber() === 0) {
        return new ExprValue(Value.fromFloat(0.0), expr.span);
      }
    }
    // "" & x → x, x & "" → x (join)
    if (expr.op === BinOp.Join) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === 'string' && expr.lhs.value.data === '') {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === 'string' && expr.rhs.value.data === '') {
        return expr.lhs;
      }
    }
  }

  return expr;
}

function _tryFoldBinop(op, lhs, rhs) {
  if (lhs.kind === 'number' && rhs.kind === 'number') {
    const a = lhs.toNumber();
    const b = rhs.toNumber();
    if (op === BinOp.Add) return Value.fromFloat(a + b);
    if (op === BinOp.Sub) return Value.fromFloat(a - b);
    if (op === BinOp.Mul) return Value.fromFloat(a * b);
    if (op === BinOp.Div) {
      if (b === 0) return null;
      return Value.fromFloat(a / b);
    }
    if (op === BinOp.Mod) {
      if (b === 0) return null;
      return Value.fromFloat(a - b * Math.floor(a / b));
    }
    if (op === BinOp.Lt) return Value.fromFloat(a < b ? 1.0 : 0.0);
    if (op === BinOp.Gt) return Value.fromFloat(a > b ? 1.0 : 0.0);
    if (op === BinOp.Eq) return Value.fromFloat(a === b ? 1.0 : 0.0);
    if (op === BinOp.And) return Value.fromFloat(a && b ? 1.0 : 0.0);
    if (op === BinOp.Or) return Value.fromFloat(a || b ? 1.0 : 0.0);
  }
  if (op === BinOp.Join) {
    return Value.fromStr(lhs.toString() + rhs.toString());
  }
  return null;
}

function _tryFoldUnop(op, opr) {
  if (op === UnOp.Not) {
    return Value.fromFloat(opr.toBoolean() ? 0.0 : 1.0);
  }
  if (op === UnOp.Length) {
    return Value.fromFloat(parseFloat(opr.toString().length));
  }
  if (op === UnOp.Round) {
    if (opr.kind === 'number') {
      return Value.fromFloat(parseFloat(Math.round(opr.toNumber())));
    }
  }
  if (op === UnOp.Minus) {
    if (opr.kind === 'number') {
      return Value.fromFloat(-opr.toNumber());
    }
  }
  // Math ops
  if (opr.kind === 'number') {
    const n = opr.toNumber();
    const deg = n * Math.PI / 180.0;
    if (op === UnOp.Abs) return Value.fromFloat(Math.abs(n));
    if (op === UnOp.Floor) return Value.fromFloat(Math.floor(n));
    if (op === UnOp.Ceil) return Value.fromFloat(Math.ceil(n));
    if (op === UnOp.Sqrt) return n >= 0 ? Value.fromFloat(Math.sqrt(n)) : null;
    if (op === UnOp.Sin) return Value.fromFloat(Math.sin(deg));
    if (op === UnOp.Cos) return Value.fromFloat(Math.cos(deg));
    if (op === UnOp.Tan) return Value.fromFloat(Math.tan(deg));
    if (op === UnOp.Asin) {
      if (n < -1 || n > 1) return null;
      return Value.fromFloat(Math.asin(n) * 180.0 / Math.PI);
    }
    if (op === UnOp.Acos) {
      if (n < -1 || n > 1) return null;
      return Value.fromFloat(Math.acos(n) * 180.0 / Math.PI);
    }
    if (op === UnOp.Atan) return Value.fromFloat(Math.atan(n) * 180.0 / Math.PI);
    if (op === UnOp.Ln) return n > 0 ? Value.fromFloat(Math.log(n)) : null;
    if (op === UnOp.Log) return n > 0 ? Value.fromFloat(Math.log10(n)) : null;
    if (op === UnOp.AntiLn) return Value.fromFloat(Math.exp(n));
    if (op === UnOp.AntiLog) return Value.fromFloat(Math.pow(10, n));
  }
  return null;
}

// ---------------------------------------------------------------------------
// pass3 + pass4: reference collection & dead-code elimination
// ---------------------------------------------------------------------------

export function visitProjectDCE(project) {
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    // Mark all vars, lists, procs, funcs as used
    for (const var_ of Object.values(sprite.vars)) {
      var_.is_used = true;
    }
    for (const lst of Object.values(sprite.lists)) {
      lst.is_used = true;
    }
    for (const struct of Object.values(sprite.structs)) {
      struct.is_used = true;
      for (const field of struct.fields) {
        field.is_used = true;
      }
    }
    for (const enum_ of Object.values(sprite.enums)) {
      enum_.is_used = true;
      for (const variant of enum_.variants) {
        variant.is_used = true;
      }
    }
    for (const argList of Object.values(sprite.proc_args)) {
      for (const arg of argList) {
        arg.is_used = true;
      }
    }
    for (const argList of Object.values(sprite.func_args)) {
      for (const arg of argList) {
        arg.is_used = true;
      }
    }

    // Mark procs/funcs that are called from event bodies
    sprite.used_procs = new Set(Object.keys(sprite.procs));
    sprite.used_funcs = new Set(Object.keys(sprite.funcs));
  }
}
