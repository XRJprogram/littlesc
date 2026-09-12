// decompiler.js — SB3 project.json decompiler
// Ported from backend/decompiler.py (1:1 alignment)
// Converts Scratch 3.0 blocks back into goboscript source code

import AdmZip from 'adm-zip';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function _quoteString(s) {
  return JSON.stringify(String(s));
}

function _fmtNumber(val) {
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') {
    if (val === Infinity) return 'Infinity';
    if (val === -Infinity) return '-Infinity';
    if (isNaN(val)) return 'NaN';
    if (val === Math.floor(val) && Math.abs(val) < 1e21) return String(val);
    return String(val);
  }
  let s = String(val);
  if (s.startsWith('.')) s = '0' + s;
  else if (s.startsWith('-.')) s = '-0.' + s.slice(2);
  return s;
}

function _fmtValue(val) {
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return _fmtNumber(val);
  if (typeof val === 'string') return _quoteString(val);
  if (val === null || val === undefined) return '0';
  return _quoteString(String(val));
}

const _REPR_DATA = /data='([^']*)'|data="([^"]*)"/;

function _extractMenuValue(val) {
  if (typeof val !== 'string') return String(val);
  const m = _REPR_DATA.exec(val);
  if (m) return m[1] !== undefined ? m[1] : m[2];
  return val;
}

function _isDict(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const _PRIM_NUMBER_CODES = new Set([4, 5, 6, 7, 8]);

const _GOBOSCRIPT_KEYWORDS = new Set([
  'define', 'undef', 'costumes', 'sounds', 'local', 'proc', 'func',
  'return', 'nowarp', 'on', 'onflag', 'onkey', 'onclick', 'onbackdrop',
  'onloudness', 'ontimer', 'onclone', 'orphan', 'if', 'else', 'elif', 'until',
  'wait_until', 'forever', 'repeat', 'not', 'and', 'or', 'in', 'length', 'round',
  'abs', 'floor', 'ceil', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos',
  'atan', 'ln', 'log', 'antiln', 'antilog', 'show', 'hide', 'add',
  'to', 'delete', 'insert', 'at', 'as', 'enum', 'struct', 'true',
  'false', 'list', 'cloud', 'var', 'set_x', 'set_y', 'set_size',
  'point_in_direction', 'set_volume', 'set_rotation_style_left_right',
  'set_rotation_style_all_around', 'set_rotation_style_do_not_rotate',
  'of', 'letter', 'e', 'pi',
  'clone', 'goto', 'glide', 'say', 'think', 'move', 'turn', 'point',
  'switch', 'next', 'previous', 'random', 'change', 'set', 'clear',
  'go', 'play', 'stop', 'wait', 'ask', 'reset', 'stamp', 'pen',
  'broadcast', 'change_x', 'change_y', 'change_size', 'change_volume',
  'change_color_effect', 'change_fisheye_effect', 'change_whirl_effect',
  'change_pixelate_effect', 'change_mosaic_effect', 'change_brightness_effect',
  'change_ghost_effect', 'change_pitch_effect', 'change_pan_effect',
  'change_pen_size', 'change_pen_hue', 'change_pen_saturation',
  'change_pen_brightness', 'change_pen_transparency', 'change_tempo',
  'set_color_effect', 'set_fisheye_effect', 'set_whirl_effect',
  'set_pixelate_effect', 'set_mosaic_effect', 'set_brightness_effect',
  'set_ghost_effect', 'set_pitch_effect', 'set_pan_effect',
  'set_pen_size', 'set_pen_hue', 'set_pen_saturation',
  'set_pen_brightness', 'set_pen_transparency', 'set_tempo',
  'set_pen_color', 'set_instrument', 'play_drum', 'play_note', 'rest',
  'broadcast_and_wait', 'stop_all', 'stop_this_script', 'stop_other_scripts',
  'delete_this_clone', 'go_to_front', 'go_to_back', 'go_forward', 'go_backward',
  'if_on_edge_bounce', 'clear_graphic_effects', 'clear_sound_effects',
  'erase_all', 'pen_down', 'pen_up', 'start_sound', 'play_sound_until_done',
  'stop_all_sounds', 'set_drag_mode_draggable', 'set_drag_mode_not_draggable',
  'reset_timer', 'point_towards', 'switch_costume', 'switch_backdrop',
  'next_costume', 'next_backdrop', 'previous_backdrop', 'random_backdrop',
  'mouse_pointer', 'edge', 'random_position', 'myself',
  'item_num', 'letter_of', 'sensing_of',
]);

const _MENU_SPECIAL = {
  '_mouse_': 'mouse_pointer',
  '_edge_': 'edge',
  '_random_': 'random_position',
  '_myself_': 'myself',
};

// Menu *blocks* that may sit in a value slot ([1, menuId] / [3, X, menuId]).
// A block id resolving to one of these carries the last-selected literal, not
// a live expression; anything else obscuring the slot is the live value.
const _MENU_BLOCK_OPCODES = new Set([
  'looks_costume', 'looks_backdrops', 'sound_sounds_menu',
  'music_menu_DRUM', 'music_menu_INSTRUMENT', 'pen_menu_colorParam',
  'sensing_touchingobjectmenu', 'sensing_keyoptions', 'sensing_of_object_menu',
  'motion_goto_menu', 'motion_pointtowards_menu', 'sensing_distancetomenu',
  'control_create_clone_of_menu',
]);

const _MATHOP_MAP = {
  'abs': 'abs', 'floor': 'floor', 'ceiling': 'ceil', 'sqrt': 'sqrt',
  'sin': 'sin', 'cos': 'cos', 'tan': 'tan', 'asin': 'asin', 'acos': 'acos',
  'atan': 'atan', 'ln': 'ln', 'log': 'log', 'e ^': 'antiln', '10 ^': 'antilog',
};

const _BINOP_SPEC = {
  'operator_add':      ['NUM1',     'NUM2',     '+'],
  'operator_subtract': ['NUM1',     'NUM2',     '-'],
  'operator_multiply': ['NUM1',     'NUM2',     '*'],
  'operator_divide':   ['NUM1',     'NUM2',     '/'],
  'operator_mod':      ['NUM1',     'NUM2',     '%'],
  'operator_gt':       ['OPERAND1', 'OPERAND2', '>'],
  'operator_lt':       ['OPERAND1', 'OPERAND2', '<'],
  'operator_equals':   ['OPERAND1', 'OPERAND2', '=='],
  'operator_and':      ['OPERAND1', 'OPERAND2', 'and'],
  'operator_or':       ['OPERAND1', 'OPERAND2', 'or'],
  'operator_join':     ['STRING1',  'STRING2',  '&'],
};

const _EVENT_HATS = new Set([
  'event_whenflagclicked', 'event_whenkeypressed', 'event_whenbroadcastreceived',
  'event_whenthisspriteclicked', 'event_whenbackdropswitchesto',
  'event_whengreaterthan', 'control_start_as_clone',
]);

const _EFFECT_MAP = {
  'COLOR': 'color', 'FISHEYE': 'fisheye', 'WHIRL': 'whirl',
  'PIXELATE': 'pixelate', 'MOSAIC': 'mosaic',
  'BRIGHTNESS': 'brightness', 'GHOST': 'ghost',
};

// ---------------------------------------------------------------------------
// _Decompiler class
// ---------------------------------------------------------------------------

class _Decompiler {
  constructor(target, sharedUsedNames = null, sharedVarMap = null, sharedListMap = null,
              sharedProcNames = null) {
    this.target = target;
    this.name = target.name || 'Unknown';
    this.isStage = target.isStage || false;
    this.blocks = target.blocks || {};
    this.variables = target.variables || {};
    this.lists = target.lists || {};
    this.lines = [];
    this.indentLevel = 0;
    this._localCounter = 0;
    this._procNameMap = {};
    this._usedProcNames = sharedProcNames || new Set();
    this._procOrigProccode = {};
    this._negVarInits = [];
    this._negFieldInits = [];
    this._negInitsEmitted = false;
    this._varNameMap = sharedVarMap || {};
    this._listNameMap = sharedListMap || {};
    this._varOrigToClean = {};
    this._listOrigToClean = {};
    this._exprVisited = new Set();
    this._exprDepth = 0;
    // Shared clean-name set across all targets so names don't collide
    // when multiple targets are merged into one source string.
    this._sharedUsedNames = sharedUsedNames;

    this._REPORTER_OPCODES = new Set([
      'motion_xposition', 'motion_yposition', 'motion_direction',
      'looks_size', 'looks_costumenumbername', 'looks_backdropnumbername',
      'sound_volume',
      'sensing_touchingobject', 'sensing_touchingcolor', 'sensing_distanceto',
      'sensing_keypressed', 'sensing_mousedown', 'sensing_mousex',
      'sensing_mousey', 'sensing_answer', 'sensing_loudness',
      'sensing_timer', 'sensing_dayssince2000', 'sensing_username',
      'sensing_current',
      'operator_add', 'operator_subtract', 'operator_multiply',
      'operator_divide', 'operator_mod', 'operator_gt', 'operator_lt',
      'operator_equals', 'operator_and', 'operator_or', 'operator_not',
      'operator_join', 'operator_length', 'operator_round',
      'operator_mathop', 'operator_random', 'operator_contains',
      'operator_letter_of', 'operator_ifelse',
      'data_itemoflist', 'data_lengthoflist', 'data_itemnumoflist',
      'argument_reporter_string_number', 'argument_reporter_boolean',
      'data_variable', 'data_listcontents',
    ]);
  }

  // -- emission helpers --

  emit(line) {
    this.lines.push('    '.repeat(this.indentLevel) + line);
  }

  blank() {
    if (this.lines.length > 0 && this.lines[this.lines.length - 1] !== '') {
      this.lines.push('');
    }
  }

  // -- top-level entry --

  _scanProcDefinitions() {
    for (const [bid, blk] of Object.entries(this.blocks)) {
      if (!_isDict(blk)) continue;
      if (blk.opcode !== 'procedures_definition') continue;
      const inputs = blk.inputs || {};
      const cb = inputs.custom_block;
      if (!cb || cb.length < 2 || typeof cb[1] !== 'string') continue;
      const proto = this.blocks[cb[1]];
      if (!_isDict(proto)) continue;
      const mut = proto.mutation || {};
      const proccode = mut.proccode || 'block';
      if (proccode in this._procNameMap) continue;
      let baseName = proccode.split('%s')[0].trim();
      if (baseName && baseName.includes(' ')) {
        // JS strings don't have rsplit; replicate Python's str.rsplit(' ', 1)
        const li = baseName.lastIndexOf(' ');
        const lastWord = baseName.slice(li + 1);
        if (lastWord.endsWith(':')) {
          baseName = baseName.slice(0, li);
        }
      }
      if (!baseName) baseName = proccode;
      baseName = this._cleanVarName(baseName);
      let unique = baseName;
      if (this._usedProcNames.has(unique)) {
        let i = 2;
        while (this._usedProcNames.has(`${baseName}_${i}`)) i++;
        unique = `${baseName}_${i}`;
      }
      this._usedProcNames.add(unique);
      this._procNameMap[proccode] = unique;
      this._procOrigProccode[unique] = proccode;
    }
  }

  decompile() {
    this._scanProcDefinitions();
    this._emitAssetDecls();
    this._emitVariables();
    this._emitLists();
    if (!this.isStage) this._emitSpriteFields();
    if ((Object.keys(this.variables).length > 0 || Object.keys(this.lists).length > 0) ||
        (!this.isStage && this._hasNondefaultFields())) {
      this.blank();
    }
    this._emitToplevelBlocks();
    if (!this._negInitsEmitted && (this._negFieldInits.length > 0 || this._negVarInits.length > 0)) {
      this.blank();
      this.emit('onflag {');
      this.indentLevel++;
      for (const line of this._negFieldInits) this.emit(line);
      for (const line of this._negVarInits) this.emit(line);
      this.indentLevel--;
      this.emit('}');
    }
    while (this.lines.length > 0 && this.lines[this.lines.length - 1] === '') {
      this.lines.pop();
    }
    return this.lines.join('\n') + '\n';
  }

  // Emit `costumes ...;` / `sounds ...;` declarations referencing the
  // content-hashed asset filenames so a recompiled project restores the
  // original assets byte-for-byte (bytes travel out-of-band via
  // sb3ToGoboscript's `assets` map / compileSource's `assets` option).
  _emitAssetDecls() {
    const t = this.target;
    const fmt = (a) => {
      const md5ext = a.md5ext || (a.assetId ? `${a.assetId}.${a.dataFormat || 'svg'}` : null);
      const ref = md5ext ? `"${md5ext}"` : JSON.stringify(String(a.path || a.name || 'asset'));
      return `${ref} as ${JSON.stringify(String(a.name || 'asset'))}`;
    };
    const costumes = Array.isArray(t.costumes) ? t.costumes.filter(c => c && (c.md5ext || c.assetId)) : [];
    if (costumes.length > 0) {
      this.emit(`costumes ${costumes.map(fmt).join(', ')};`);
    }
    const sounds = Array.isArray(t.sounds) ? t.sounds.filter(snd => snd && (snd.md5ext || snd.assetId)) : [];
    if (sounds.length > 0) {
      this.emit(`sounds ${sounds.map(fmt).join(', ')};`);
    }
  }

  _hasNondefaultFields() {
    const t = this.target;
    if ((t.x || 0) !== 0 || (t.y || 0) !== 0) return true;
    if ((t.size || 100) !== 100) return true;
    if ((t.direction || 90) !== 90) return true;
    if (t.visible === false) return true;
    if ((t.rotationStyle || 'all around') !== 'all around') return true;
    return false;
  }

  _emitSpriteFields() {
    const t = this.target;
    if ((t.x || 0) !== 0) this.emit(`set_x ${_fmtNumber(t.x)};`);
    if ((t.y || 0) !== 0) this.emit(`set_y ${_fmtNumber(t.y)};`);
    if ((t.size || 100) !== 100) this.emit(`set_size ${_fmtNumber(t.size)};`);
    if ((t.direction || 90) !== 90) this.emit(`point_in_direction ${_fmtNumber(t.direction)};`);
    // Sprite visibility / rotation style are *target attributes*, not runtime
    // statements. Emit them as top-level `hide;` / `set_rotation_style_*;`
    // declarations (the parser maps them straight back onto the sprite
    // fields), NOT as `hide;` statements injected into the first hat script —
    // injection used to produce phantom looks_hide blocks on every round-trip.
    if (t.visible === false) this.emit('hide;');
    const rs = t.rotationStyle || 'all around';
    if (rs === 'left-right') this.emit('set_rotation_style_left_right;');
    else if (rs === "don't rotate") this.emit('set_rotation_style_do_not_rotate;');
    this._negFieldInits = [];
  }

  _emitVariables() {
    const usedCleanNames = this._sharedUsedNames || new Set();
    this._sharedUsedNames = usedCleanNames;
    for (const [vid, vinfo] of Object.entries(this.variables)) {
      if (!Array.isArray(vinfo) || vinfo.length < 2) continue;
      const varName = vinfo[0];
      const defaultVal = vinfo.length > 1 ? vinfo[1] : 0;
      const isCloud = vinfo.length > 2 && !!vinfo[2];
      if (isCloud) {
        let bare = varName;
        if (bare.startsWith('\u2601 ')) bare = bare.slice(2);
        let clean = this._cleanVarName(bare);
        if (usedCleanNames.has(clean) && !(clean in this._varNameMap)) {
          // pass
        }
        clean = this._ensureUnique(clean, usedCleanNames);
        usedCleanNames.add(clean);
        if (varName !== clean) this._varNameMap[clean] = varName;
        this._varOrigToClean[varName] = clean;
        this.emit(`cloud ${clean};`);
      } else {
        let cleanName = this._cleanVarName(varName);
        cleanName = this._ensureUnique(cleanName, usedCleanNames);
        usedCleanNames.add(cleanName);
        if (varName !== cleanName) this._varNameMap[cleanName] = varName;
        this._varOrigToClean[varName] = cleanName;
        const defaultStr = _fmtValue(defaultVal);
        this.emit(`var ${cleanName} = ${defaultStr};`);
      }
    }
    this._negVarInits = [];
  }

  _ensureUnique(name, used) {
    if (!used.has(name)) return name;
    let i = 2;
    while (used.has(`${name}_${i}`)) i++;
    return `${name}_${i}`;
  }

  _emitLists() {
    // Reuse the shared used-clean-names set so list names don't collide
    // with variable names (both within this target and across targets).
    const usedCleanNames = this._sharedUsedNames || new Set();
    this._sharedUsedNames = usedCleanNames;
    for (const [lid, linfo] of Object.entries(this.lists)) {
      if (!Array.isArray(linfo) || linfo.length === 0) continue;
      const listName = linfo[0];
      let cleanName = this._cleanVarName(listName);
      cleanName = this._ensureUnique(cleanName, usedCleanNames);
      usedCleanNames.add(cleanName);
      if (listName !== cleanName) this._listNameMap[cleanName] = listName;
      this._listOrigToClean[listName] = cleanName;
      // Emit non-empty list contents as a bracket initializer. Without
      // this, every populated list decompiled to `list name;` and its data
      // was destroyed on the very first roundtrip (breaking the
      // compile→decompile→compile idempotency contract, including values
      // folded in by top-level `add` statements).
      const items = Array.isArray(linfo[1]) ? linfo[1] : null;
      if (items && items.length > 0) {
        const rendered = items.map(v => {
          if (typeof v === 'string') {
            // Bare numeric literal when lossless — keeps recompiled sb3
            // values stable across further roundtrips.
            if (/^-?\d+$/.test(v)) return v;
            const f = Number(v);
            if (v.trim() !== '' && Number.isFinite(f)) return v;
            return _quoteString(v);
          }
          return String(v);
        });
        this.emit(`list ${cleanName} = [${rendered.join(', ')}];`);
      } else {
        this.emit(`list ${cleanName};`);
      }
    }
  }

  _cleanVarRef(name) {
    if (name in this._varOrigToClean) return this._varOrigToClean[name];
    return this._cleanVarName(name);
  }

  _cleanListRef(name) {
    if (name in this._listOrigToClean) return this._listOrigToClean[name];
    return this._cleanVarName(name);
  }

  // -- top-level blocks --

  _emitToplevelBlocks() {
    const topLevel = [];
    for (const [bid, blk] of Object.entries(this.blocks)) {
      if (_isDict(blk) && blk.topLevel) topLevel.push(bid);
    }
    topLevel.sort((a, b) => {
      const ba = this.blocks[a], bb = this.blocks[b];
      return (ba.y || 0) - (bb.y || 0) || (ba.x || 0) - (bb.x || 0);
    });
    let first = true;
    for (const tlId of topLevel) {
      const block = this.blocks[tlId];
      if (!_isDict(block)) continue;
      const opcode = block.opcode || '';
      if (this._isReporter(opcode)) continue;
      if (!block.next && !block.inputs && !_EVENT_HATS.has(opcode)) continue;
      if (!first) this.blank();
      first = false;
      if (_EVENT_HATS.has(opcode)) this._emitEvent(block);
      else if (opcode === 'procedures_definition') this._emitProcDef(block);
      else this._emitOrphanChain(tlId);
    }
  }

  // Orphan chains are top-level statement stacks that are not attached to any
  // hat block. They are live data in the SB3 (shown as loose stacks in the
  // Scratch editor), so emit them as `orphan { ... }` groups that the parser
  // and codegen preserve as hat-less topLevel chains through the round-trip.
  _emitOrphanChain(startId) {
    this.emit('orphan {');
    this.indentLevel++;
    this._walkChain(startId);
    this.indentLevel--;
    this.emit('}');
  }

  // -- event hats --

  _emitEvent(block) {
    const opcode = block.opcode || '';
    const fields = block.fields || {};
    if (_EVENT_HATS.has(opcode) && !this._negInitsEmitted &&
        (this._negFieldInits.length > 0 || this._negVarInits.length > 0)) {
      this._negInitsEmitted = true;
      if (opcode === 'event_whenflagclicked') this.emit('onflag {');
      else if (opcode === 'event_whenkeypressed') {
        const key = this._field(fields, 'KEY_OPTION', 'space');
        this.emit(`onkey ${_quoteString(key)} {`);
      } else if (opcode === 'event_whenbroadcastreceived') {
        const bcast = this._field(fields, 'BROADCAST_OPTION', 'message1');
        this.emit(`on ${_quoteString(bcast)} {`);
      } else if (opcode === 'event_whenthisspriteclicked') this.emit('onclick {');
      else if (opcode === 'event_whenbackdropswitchesto') {
        const bd = this._field(fields, 'BACKDROP', 'backdrop1');
        this.emit(`onbackdrop ${_quoteString(bd)} {`);
      } else if (opcode === 'control_start_as_clone') this.emit('onclone {');
      else if (opcode === 'event_whengreaterthan') {
        const what = this._field(fields, 'WHENGREATERTHANMENU', 'TIMER');
        const val = this._inputExpr(block.inputs || {}, 'VALUE');
        if (what.toUpperCase() === 'LOUDNESS') this.emit(`onloudness > ${val} {`);
        else this.emit(`ontimer > ${val} {`);
      } else this.emit('{');
      this.indentLevel++;
      for (const line of this._negFieldInits) this.emit(line);
      for (const line of this._negVarInits) this.emit(line);
      this._walkChain(block.next);
      this.indentLevel--;
      this.emit('}');
      return;
    }
    if (opcode === 'event_whenflagclicked') this.emit('onflag {');
    else if (opcode === 'event_whenkeypressed') {
      const key = this._field(fields, 'KEY_OPTION', 'space');
      this.emit(`onkey ${_quoteString(key)} {`);
    } else if (opcode === 'event_whenbroadcastreceived') {
      const bcast = this._field(fields, 'BROADCAST_OPTION', 'message1');
      this.emit(`on ${_quoteString(bcast)} {`);
    } else if (opcode === 'event_whenthisspriteclicked') this.emit('onclick {');
    else if (opcode === 'event_whenbackdropswitchesto') {
      const bd = this._field(fields, 'BACKDROP', 'backdrop1');
      this.emit(`onbackdrop ${_quoteString(bd)} {`);
    } else if (opcode === 'control_start_as_clone') this.emit('onclone {');
    else if (opcode === 'event_whengreaterthan') {
      const what = this._field(fields, 'WHENGREATERTHANMENU', 'TIMER');
      const val = this._inputExpr(block.inputs || {}, 'VALUE');
      if (what.toUpperCase() === 'LOUDNESS') this.emit(`onloudness > ${val} {`);
      else this.emit(`ontimer > ${val} {`);
    } else {
      this.emit(`# unknown event: ${opcode}`);
      this.emit('{');
    }
    this.indentLevel++;
    this._walkChain(block.next);
    this.indentLevel--;
    this.emit('}');
  }

  // -- procedure definitions --

  _emitProcDef(block) {
    const inputs = block.inputs || {};
    const cb = inputs.custom_block;
    let proto = null;
    if (cb && cb.length >= 2 && typeof cb[1] === 'string') {
      proto = this.blocks[cb[1]];
    }
    if (!_isDict(proto)) {
      this.emit('# procedures_definition (missing prototype)');
      return;
    }
    const mut = proto.mutation || {};
    const proccode = mut.proccode || 'block';
    let argNames = [];
    try { argNames = JSON.parse(mut.argumentnames || '[]'); } catch { argNames = []; }
    const warp = mut.warp === 'true';
    let procName = this._procNameMap[proccode];
    if (!procName) {
      const parts = proccode.split(/\s+/).filter(Boolean);
      procName = this._cleanVarName(parts.length > 0 ? parts[0] : 'block');
    }
    const prefix = warp ? '' : 'nowarp ';
    if (argNames.length > 0) {
      const argsStr = argNames.map(n => this._cleanVarName(n)).join(', ');
      this.emit(`${prefix}proc ${procName} ${argsStr} {`);
    } else {
      this.emit(`${prefix}proc ${procName} {`);
    }
    this.indentLevel++;
    this._walkChain(block.next);
    this.indentLevel--;
    this.emit('}');
  }

  // -- chain walking --

  _walkChain(startId) {
    let current = startId;
    const seen = new Set();
    while (current) {
      if (seen.has(current)) {
        this.emit('# warning: circular block reference detected');
        break;
      }
      seen.add(current);
      const block = this.blocks[current];
      if (!_isDict(block)) break;
      try {
        this._emitStmt(block);
      } catch (e) {
        const opcode = block.opcode || '?';
        this.emit(`# decompiler error on ${opcode}: ${e.message || e}`);
      }
      current = block.next;
    }
  }

  // -- statement emission --

  _emitStmt(block) {
    const opcode = block.opcode || '';
    const inputs = block.inputs || {};
    const fields = block.fields || {};
    const mutation = block.mutation || {};

    // ----- control flow -----
    if (opcode === 'control_repeat') {
      const times = this._inputExpr(inputs, 'TIMES');
      this.emit(`repeat ${times} {`);
      this._emitSubstack(inputs, 'SUBSTACK');
      this.emit('}');
      return;
    }
    if (opcode === 'control_repeat_until') {
      const cond = this._inputExpr(inputs, 'CONDITION');
      this.emit(`until ${cond} {`);
      this._emitSubstack(inputs, 'SUBSTACK');
      this.emit('}');
      return;
    }
    if (opcode === 'control_forever') {
      this.emit('forever {');
      this._emitSubstack(inputs, 'SUBSTACK');
      this.emit('}');
      return;
    }
    if (opcode === 'control_if') {
      const cond = this._inputExpr(inputs, 'CONDITION');
      this.emit(`if ${cond} {`);
      this._emitSubstack(inputs, 'SUBSTACK');
      this.emit('}');
      return;
    }
    if (opcode === 'control_if_else') {
      const cond = this._inputExpr(inputs, 'CONDITION');
      this.emit(`if ${cond} {`);
      this._emitSubstack(inputs, 'SUBSTACK');
      this.emit('} else {');
      this._emitSubstack(inputs, 'SUBSTACK2');
      this.emit('}');
      return;
    }
    if (opcode === 'control_stop') {
      const opt = this._field(fields, 'STOP_OPTION', 'all');
      if (opt === 'all') this.emit('stop_all;');
      else if (opt === 'this script') this.emit('stop_this_script;');
      else if (opt === 'other scripts in sprite') this.emit('stop_other_scripts;');
      else this.emit('stop_all;');
      return;
    }
    if (opcode === 'control_wait') {
      this.emit(`wait ${this._inputExpr(inputs, 'DURATION')};`);
      return;
    }
    if (opcode === 'control_wait_until') {
      this.emit(`wait_until ${this._inputExpr(inputs, 'CONDITION')};`);
      return;
    }
    if (opcode === 'control_create_clone_of') { this._emitClone(inputs); return; }
    if (opcode === 'control_delete_this_clone') { this.emit('delete_this_clone;'); return; }

    // ----- data: variables -----
    if (opcode === 'data_setvariableto') { this._emitSetVar(fields, inputs); return; }
    if (opcode === 'data_changevariableby') { this._emitChangeVar(fields, inputs); return; }
    if (opcode === 'data_showvariable') {
      this.emit(`show ${this._cleanVarRef(this._field(fields, 'VARIABLE', ''))};`);
      return;
    }
    if (opcode === 'data_hidevariable') {
      this.emit(`hide ${this._cleanVarRef(this._field(fields, 'VARIABLE', ''))};`);
      return;
    }
    if (opcode === 'data_showlist') {
      this.emit(`show ${this._cleanListRef(this._field(fields, 'LIST', ''))};`);
      return;
    }
    if (opcode === 'data_hidelist') {
      this.emit(`hide ${this._cleanListRef(this._field(fields, 'LIST', ''))};`);
      return;
    }

    // ----- data: lists -----
    if (opcode === 'data_addtolist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      this.emit(`add ${this._inputExpr(inputs, 'ITEM')} to ${ln};`);
      return;
    }
    if (opcode === 'data_deleteoflist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      this.emit(`delete ${ln}[${this._inputExpr(inputs, 'INDEX')}];`);
      return;
    }
    if (opcode === 'data_deletealloflist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      this.emit(`delete ${ln};`);
      return;
    }
    if (opcode === 'data_insertatlist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      this.emit(`insert ${this._inputExpr(inputs, 'ITEM')} at ${ln}[${this._inputExpr(inputs, 'INDEX')}];`);
      return;
    }
    if (opcode === 'data_replaceitemoflist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      this.emit(`${ln}[${this._inputExpr(inputs, 'INDEX')}] = ${this._inputExpr(inputs, 'ITEM')};`);
      return;
    }

    // ----- procedures: call -----
    if (opcode === 'procedures_call') { this._emitProcCall(mutation, inputs); return; }

    // ----- motion -----
    if (opcode === 'motion_movesteps') { this.emit(`move ${this._inputExpr(inputs, 'STEPS')};`); return; }
    if (opcode === 'motion_turnleft') { this.emit(`turn_left ${this._inputExpr(inputs, 'DEGREES')};`); return; }
    if (opcode === 'motion_turnright') { this.emit(`turn_right ${this._inputExpr(inputs, 'DEGREES')};`); return; }
    if (opcode === 'motion_gotoxy') {
      this.emit(`goto ${this._inputExpr(inputs, 'X')}, ${this._inputExpr(inputs, 'Y')};`);
      return;
    }
    if (opcode === 'motion_goto') { this._emitGoto(inputs); return; }
    if (opcode === 'motion_glidesecstoxy') {
      this.emit(`glide ${this._inputExpr(inputs, 'X')}, ${this._inputExpr(inputs, 'Y')}, ${this._inputExpr(inputs, 'SECS')};`);
      return;
    }
    if (opcode === 'motion_glideto') { this._emitGlideto(inputs); return; }
    if (opcode === 'motion_pointindirection') { this.emit(`point_in_direction ${this._inputExpr(inputs, 'DIRECTION')};`); return; }
    if (opcode === 'motion_pointtowards') { this._emitPointTowards(inputs); return; }
    if (opcode === 'motion_setx') { this.emit(`set_x ${this._inputExpr(inputs, 'X')};`); return; }
    if (opcode === 'motion_sety') { this.emit(`set_y ${this._inputExpr(inputs, 'Y')};`); return; }
    if (opcode === 'motion_changexby') { this.emit(`change_x ${this._inputExpr(inputs, 'DX')};`); return; }
    if (opcode === 'motion_changeyby') { this.emit(`change_y ${this._inputExpr(inputs, 'DY')};`); return; }
    if (opcode === 'motion_ifonedgebounce') { this.emit('if_on_edge_bounce;'); return; }
    if (opcode === 'motion_setrotationstyle') {
      const style = this._field(fields, 'STYLE', 'all around');
      if (style === 'left-right') this.emit('set_rotation_style_left_right;');
      else if (style === "don't rotate") this.emit('set_rotation_style_do_not_rotate;');
      else this.emit('set_rotation_style_all_around;');
      return;
    }

    // ----- looks -----
    if (opcode === 'looks_say') { this.emit(`say ${this._inputExpr(inputs, 'MESSAGE')};`); return; }
    if (opcode === 'looks_sayforsecs') {
      this.emit(`say ${this._inputExpr(inputs, 'MESSAGE')}, ${this._inputExpr(inputs, 'SECS')};`);
      return;
    }
    if (opcode === 'looks_think') { this.emit(`think ${this._inputExpr(inputs, 'MESSAGE')};`); return; }
    if (opcode === 'looks_thinkforsecs') {
      this.emit(`think ${this._inputExpr(inputs, 'MESSAGE')}, ${this._inputExpr(inputs, 'SECS')};`);
      return;
    }
    if (opcode === 'looks_switchcostumeto') {
      this.emit(`switch_costume ${this._inputExpr(inputs, 'COSTUME')};`);
      return;
    }
    if (opcode === 'looks_nextcostume') { this.emit('next_costume;'); return; }
    if (opcode === 'looks_switchbackdropto') {
      const live = this._menuObscuredExpr(inputs, 'BACKDROP');
      if (live !== null) { this.emit(`switch_backdrop ${live};`); return; }
      const bd = this._menuValue(inputs, 'BACKDROP');
      if (bd === 'previous backdrop') this.emit('previous_backdrop;');
      else if (bd === 'random backdrop') this.emit('random_backdrop;');
      else this.emit(`switch_backdrop ${_quoteString(bd)};`);
      return;
    }
    if (opcode === 'looks_nextbackdrop') { this.emit('next_backdrop;'); return; }
    if (opcode === 'looks_setsizeto') { this.emit(`set_size ${this._inputExpr(inputs, 'SIZE')};`); return; }
    if (opcode === 'looks_changesizeby') { this.emit(`change_size ${this._inputExpr(inputs, 'CHANGE')};`); return; }
    if (opcode === 'looks_changeeffectby' || opcode === 'looks_seteffectto') {
      this._emitEffect(opcode, inputs, fields);
      return;
    }
    if (opcode === 'looks_cleargraphiceffects') { this.emit('clear_graphic_effects;'); return; }
    if (opcode === 'looks_show') { this.emit('show;'); return; }
    if (opcode === 'looks_hide') { this.emit('hide;'); return; }
    if (opcode === 'looks_gotofrontback') {
      const fb = this._field(fields, 'FRONT_BACK', 'front');
      this.emit(fb === 'front' ? 'goto_front;' : 'goto_back;');
      return;
    }
    if (opcode === 'looks_goforwardbackwardlayers') {
      const num = this._inputExpr(inputs, 'NUM');
      const fb = this._field(fields, 'FORWARD_BACKWARD', 'forward');
      this.emit(fb === 'front' ? `go_forward ${num};` : `go_backward ${num};`);
      return;
    }

    // ----- sound -----
    if (opcode === 'sound_play') {
      const live = this._menuObscuredExpr(inputs, 'SOUND_MENU');
      this.emit(live !== null
        ? `start_sound ${live};`
        : `start_sound ${_quoteString(this._menuValue(inputs, 'SOUND_MENU'))};`);
      return;
    }
    if (opcode === 'sound_playuntildone') {
      const live = this._menuObscuredExpr(inputs, 'SOUND_MENU');
      this.emit(live !== null
        ? `play_sound_until_done ${live};`
        : `play_sound_until_done ${_quoteString(this._menuValue(inputs, 'SOUND_MENU'))};`);
      return;
    }
    if (opcode === 'sound_stopallsounds') { this.emit('stop_all_sounds;'); return; }
    if (opcode === 'sound_setvolumeto') { this.emit(`set_volume ${this._inputExpr(inputs, 'VOLUME')};`); return; }
    if (opcode === 'sound_changevolumeby') { this.emit(`change_volume ${this._inputExpr(inputs, 'VOLUME')};`); return; }
    if (opcode === 'sound_cleareffects') { this.emit('clear_sound_effects;'); return; }

    // ----- events: broadcast -----
    if (opcode === 'event_broadcast') {
      this.emit(`broadcast ${this._inputExpr(inputs, 'BROADCAST_INPUT')};`);
      return;
    }
    if (opcode === 'event_broadcastandwait') {
      this.emit(`broadcast_and_wait ${this._inputExpr(inputs, 'BROADCAST_INPUT')};`);
      return;
    }

    // ----- sensing -----
    if (opcode === 'sensing_askandwait') { this.emit(`ask ${this._inputExpr(inputs, 'QUESTION')};`); return; }
    if (opcode === 'sensing_resettimer') { this.emit('reset_timer;'); return; }

    // ----- pen -----
    if (opcode === 'pen_clear') { this.emit('erase_all;'); return; }
    if (opcode === 'pen_stamp') { this.emit('stamp;'); return; }
    if (opcode === 'pen_penDown') { this.emit('pen_down;'); return; }
    if (opcode === 'pen_penUp') { this.emit('pen_up;'); return; }
    if (opcode === 'pen_setPenColorToColor') { this.emit(`set_pen_color ${this._inputExpr(inputs, 'COLOR')};`); return; }
    if (opcode === 'pen_changePenSizeBy') { this.emit(`change_pen_size ${this._inputExpr(inputs, 'SIZE')};`); return; }
    if (opcode === 'pen_setPenSizeTo') { this.emit(`set_pen_size ${this._inputExpr(inputs, 'SIZE')};`); return; }
    if (opcode === 'pen_setPenColorParamTo') {
      const param = this._field(fields, 'COLOR_PARAM', 'color');
      const value = this._inputExpr(inputs, 'VALUE');
      const paramMap = { color: 'set_pen_hue', hue: 'set_pen_hue',
        saturation: 'set_pen_saturation', brightness: 'set_pen_brightness',
        transparency: 'set_pen_transparency' };
      const kw = paramMap[param] || 'set_pen_hue';
      this.emit(`${kw} ${value};`);
      return;
    }
    if (opcode === 'pen_changePenColorParamBy') {
      const param = this._field(fields, 'COLOR_PARAM', 'color');
      const value = this._inputExpr(inputs, 'VALUE');
      const paramMap = { color: 'change_pen_hue', hue: 'change_pen_hue',
        saturation: 'change_pen_saturation', brightness: 'change_pen_brightness',
        transparency: 'change_pen_transparency' };
      const kw = paramMap[param] || 'change_pen_hue';
      this.emit(`${kw} ${value};`);
      return;
    }

    // ----- sound: effects -----
    if (opcode === 'sound_seteffectto') {
      const effect = this._field(fields, 'EFFECT', 'PITCH');
      const value = this._inputExpr(inputs, 'VALUE');
      if (effect === 'PITCH') this.emit(`set_pitch_effect ${value};`);
      else if (effect === 'PAN') this.emit(`set_pan_effect ${value};`);
      else this.emit(`# set_sound_effect ${effect} ${value};`);
      return;
    }
    if (opcode === 'sound_changeeffectby') {
      const effect = this._field(fields, 'EFFECT', 'PITCH');
      const value = this._inputExpr(inputs, 'VALUE');
      if (effect === 'PITCH') this.emit(`change_pitch_effect ${value};`);
      else if (effect === 'PAN') this.emit(`change_pan_effect ${value};`);
      else this.emit(`# change_sound_effect ${effect} ${value};`);
      return;
    }

    // ----- sensing: drag mode -----
    if (opcode === 'sensing_setdragmode') {
      const mode = this._field(fields, 'DRAG_MODE', 'draggable');
      this.emit(mode === 'not draggable' ? 'set_drag_mode_not_draggable;' : 'set_drag_mode_draggable;');
      return;
    }

    // ----- fallback -----
    this.emit(`# unsupported block: ${opcode}`);
  }

  _isReporter(opcode) {
    return this._REPORTER_OPCODES.has(opcode);
  }

  _emitSubstack(inputs, key) {
    const sub = inputs[key];
    if (!sub || sub.length < 2) return;
    const subId = sub[1];
    if (typeof subId === 'string' && subId) {
      this.indentLevel++;
      this._walkChain(subId);
      this.indentLevel--;
    }
  }

  _cleanVarName(rawName) {
    if (typeof rawName !== 'string') rawName = String(rawName);
    const original = rawName;
    if (rawName.includes(':')) {
      const parts = rawName.split(':');
      const clean = parts[parts.length - 1];
      if (clean) rawName = clean;
    }
    let clean = rawName.replace(/[^a-zA-Z0-9_]/g, '_');
    if (clean && /^[0-9]/.test(clean)) clean = '_' + clean;
    clean = clean || 'var';
    if (_GOBOSCRIPT_KEYWORDS.has(clean.toLowerCase())) clean = '_' + clean;
    if (original !== clean && !(clean in this._varNameMap)) {
      this._varNameMap[clean] = original;
    }
    return clean;
  }

  _emitSetVar(fields, inputs) {
    const varField = fields.VARIABLE;
    const value = this._inputExpr(inputs, 'VALUE');
    if (varField && varField[0]) {
      const cleanName = this._cleanVarRef(varField[0]);
      this.emit(`${cleanName} = ${value};`);
    } else {
      // Malformed sb3 (setvariableto with no VARIABLE field). Do NOT emit
      // `local`: the compiler drops StmtSetVar.is_local when serializing
      // (sb3 has no proc-scoped variables), so `local _local0 = v;`
      // recompiled to a global `_local0` and the next decompile produced a
      // different source. A plain assignment reaches that same final state
      // one pass earlier (pass0 auto-creates the undeclared global).
      const name = `_local${this._localCounter}`;
      this._localCounter++;
      this.emit(`${name} = ${value};`);
    }
  }

  _emitChangeVar(fields, inputs) {
    const varField = fields.VARIABLE;
    if (!varField || !varField[0]) {
      // Same malformed-input path as _emitSetVar: plain assignment, not
      // `local` (which the compiler cannot preserve).
      const name = `_local${this._localCounter}`;
      this._localCounter++;
      const value = this._inputExpr(inputs, 'VALUE');
      this.emit(`${name} = ${value};`);
      return;
    }
    const varName = this._cleanVarRef(varField[0]);
    const valueInp = this._rawInput(inputs, 'VALUE');
    if (Array.isArray(valueInp) && valueInp.length >= 2) {
      const item = valueInp[1];
      if (Array.isArray(item) && item.length >= 2) {
        const ptype = item[0], pval = item[1];
        if (_PRIM_NUMBER_CODES.has(ptype)) {
          const num = parseFloat(pval);
          if (!isNaN(num)) {
            if (num === 1.0) { this.emit(`${varName}++;`); return; }
            if (num === -1.0) { this.emit(`${varName}--;`); return; }
          }
        }
      }
    }
    this.emit(`${varName} += ${this._inputExpr(inputs, 'VALUE')};`);
  }

  _emitProcCall(mutation, inputs) {
    const proccode = mutation.proccode || 'block';
    let procName = this._procNameMap[proccode];
    if (!procName) {
      const parts = proccode.split(/\s+/).filter(Boolean);
      procName = this._cleanVarName(parts.length > 0 ? parts[0] : 'block');
    }
    let argIds = [];
    try { argIds = JSON.parse(mutation.argumentids || '[]'); } catch { argIds = []; }
    const args = argIds.map(aid => this._inputExpr(inputs, aid));
    if (args.length > 0) {
      this.emit(`${procName} ${args.join(', ')};`);
    } else {
      this.emit(`${procName};`);
    }
  }

  _emitClone(inputs) {
    const live = this._menuObscuredExpr(inputs, 'CLONE_OPTION');
    if (live !== null) { this.emit(`clone ${live};`); return; }
    const cloneOpt = this._menuValue(inputs, 'CLONE_OPTION');
    if (cloneOpt === '_myself_' && !('CLONE_OPTION' in inputs)) {
      this.emit('clone;');
    } else {
      this.emit(`clone ${_quoteString(cloneOpt)};`);
    }
  }

  _emitGoto(inputs) {
    const live = this._menuObscuredExpr(inputs, 'TO');
    if (live !== null) { this.emit(`goto ${live};`); return; }
    const toVal = this._menuValue(inputs, 'TO');
    if (toVal === '_random_') this.emit('goto_random_position;');
    else if (toVal === '_mouse_') this.emit('goto_mouse_pointer;');
    else this.emit(`goto ${_quoteString(toVal)};`);
  }

  _emitGlideto(inputs) {
    const live = this._menuObscuredExpr(inputs, 'TO');
    const secs = this._inputExpr(inputs, 'SECS');
    if (live !== null) { this.emit(`glide ${live}, ${secs};`); return; }
    const toVal = this._menuValue(inputs, 'TO');
    if (toVal === '_random_') this.emit(`glide_to_random_position ${secs};`);
    else if (toVal === '_mouse_') this.emit(`glide_to_mouse_pointer ${secs};`);
    else this.emit(`glide ${_quoteString(toVal)}, ${secs};`);
  }

  _emitPointTowards(inputs) {
    const live = this._menuObscuredExpr(inputs, 'TOWARDS');
    if (live !== null) { this.emit(`point_towards ${live};`); return; }
    const toVal = this._menuValue(inputs, 'TOWARDS');
    if (toVal === '_mouse_') this.emit('point_towards_mouse_pointer;');
    else if (toVal === '_random_') this.emit('point_towards_random_direction;');
    else this.emit(`point_towards ${_quoteString(toVal)};`);
  }

  _emitEffect(opcode, inputs, fields) {
    const effect = this._field(fields, 'EFFECT', 'COLOR');
    const effectLower = _EFFECT_MAP[effect] || effect.toLowerCase();
    if (opcode === 'looks_changeeffectby') {
      this.emit(`change_${effectLower}_effect ${this._inputExpr(inputs, 'CHANGE')};`);
    } else {
      this.emit(`set_${effectLower}_effect ${this._inputExpr(inputs, 'VALUE')};`);
    }
  }

  // -- reporter / expression conversion --

  _blockToExpr(block) {
    const opcode = block.opcode || '';
    const inputs = block.inputs || {};
    const fields = block.fields || {};
    const mutation = block.mutation || {};

    if (opcode in _BINOP_SPEC) {
      const [lhsName, rhsName, op] = _BINOP_SPEC[opcode];
      const lhs = this._inputExpr(inputs, lhsName);
      const rhs = this._inputExpr(inputs, rhsName);
      // NOTE: do NOT "optimize" subtract(0, x) into (-x). Scratch has no
      // negate block; (0 - x) IS the canonical form. The (-x) spelling used
      // to compile back into a DIFFERENT block (unary minus lowering) in
      // statement contexts the expression transform pass does not cover,
      // breaking the round-trip.
      return `(${lhs} ${op} ${rhs})`;
    }
    if (opcode === 'operator_contains') {
      const s1 = this._inputExpr(inputs, 'STRING1');
      const s2 = this._inputExpr(inputs, 'STRING2');
      return `(${s2} in ${s1})`;
    }
    if (opcode === 'operator_letter_of') {
      const string = this._inputExpr(inputs, 'STRING');
      const letter = this._inputExpr(inputs, 'LETTER');
      return `letter_of(${letter}, ${string})`;
    }
    if (opcode === 'operator_not') return `(not ${this._inputExpr(inputs, 'OPERAND')})`;
    // Compiled form of the AI-compat ternary `cond ? a : b`; re-parses to the
    // same operator_ifelse primitive, keeping decompile→recompile idempotent.
    if (opcode === 'operator_ifelse') {
      const c = this._inputExpr(inputs, 'CONDITION');
      const t = this._inputExpr(inputs, 'THEN');
      const e = this._inputExpr(inputs, 'ELSE');
      return `((${c}) ? (${t}) : (${e}))`;
    }
    if (opcode === 'operator_length') return `(length ${this._inputExpr(inputs, 'STRING')})`;
    if (opcode === 'operator_round') return `(round ${this._inputExpr(inputs, 'NUM')})`;
    if (opcode === 'operator_mathop') {
      const op = this._field(fields, 'OPERATOR', 'abs');
      const gsOp = _MATHOP_MAP[op] || op;
      return `(${gsOp} ${this._inputExpr(inputs, 'NUM')})`;
    }
    if (opcode === 'operator_random') {
      return `random(${this._inputExpr(inputs, 'FROM')}, ${this._inputExpr(inputs, 'TO')})`;
    }
    if (opcode === 'data_itemoflist') {
      const ln = this._cleanListRef(this._field(fields, 'LIST', ''));
      return `${ln}[${this._inputExpr(inputs, 'INDEX')}]`;
    }
    if (opcode === 'data_lengthoflist') {
      return `length ${this._cleanListRef(this._field(fields, 'LIST', ''))}`;
    }
    if (opcode === 'data_itemnumoflist') {
      return `item_num(${this._inputExpr(inputs, 'ITEM')}, ${this._cleanListRef(this._field(fields, 'LIST', ''))})`;
    }
    if (opcode === 'data_listcontainsitem') {
      return `(${this._inputExpr(inputs, 'ITEM')} in ${this._cleanListRef(this._field(fields, 'LIST', ''))})`;
    }
    if (opcode === 'argument_reporter_string_number' || opcode === 'argument_reporter_boolean') {
      return `$${this._cleanVarName(this._field(fields, 'VALUE', ''))}`;
    }
    if (opcode === 'sensing_touchingobject') return this._touchingExpr(inputs);
    if (opcode === 'sensing_distanceto') return this._distanceExpr(inputs);
    if (opcode === 'sensing_keypressed') {
      // A reporter (block id or inline variable primitive) obscuring the key
      // menu is the live value; the menu only remembers the last selected
      // key. Emit the expression, NOT the menu placeholder (which used to
      // leak literal strings like "number or text" into the recompiled
      // project).
      const live = this._menuObscuredExpr(inputs, 'KEY_OPTION');
      if (live !== null) return `key_pressed(${live})`;
      return `key_pressed(${_quoteString(this._menuValue(inputs, 'KEY_OPTION'))})`;
    }
    if (opcode === 'sensing_mousedown') return 'mouse_down()';
    if (opcode === 'sensing_mousex') return 'mouse_x()';
    if (opcode === 'sensing_mousey') return 'mouse_y()';
    if (opcode === 'sensing_answer') return 'answer()';
    if (opcode === 'sensing_loudness') return 'loudness()';
    if (opcode === 'sensing_timer') return 'timer()';
    if (opcode === 'sensing_dayssince2000') return 'days_since_2000()';
    if (opcode === 'sensing_username') return 'username()';
    if (opcode === 'motion_xposition') return 'x_position()';
    if (opcode === 'motion_yposition') return 'y_position()';
    if (opcode === 'motion_direction') return 'direction()';
    if (opcode === 'looks_size') return 'size()';
    if (opcode === 'looks_costumenumbername') {
      const nn = this._field(fields, 'NUMBER_NAME', 'number');
      return nn === 'number' ? 'costume_number()' : 'costume_name()';
    }
    if (opcode === 'looks_backdropnumbername') {
      const nn = this._field(fields, 'NUMBER_NAME', 'number');
      return nn === 'number' ? 'backdrop_number()' : 'backdrop_name()';
    }
    if (opcode === 'sound_volume') return 'volume()';
    if (opcode === 'sensing_current') {
      const menu = this._field(fields, 'CURRENTMENU', 'YEAR');
      const mapping = {
        YEAR: 'current_year', MONTH: 'current_month', DATE: 'current_date',
        DAYOFWEEK: 'current_day_of_week', HOUR: 'current_hour',
        MINUTE: 'current_minute', SECOND: 'current_second',
      };
      return `${mapping[menu] || 'current_year'}()`;
    }
    if (opcode === 'sensing_touchingcolor') {
      return `touching_color(${this._inputExpr(inputs, 'COLOR')})`;
    }
    if (opcode === 'data_variable') {
      return this._cleanVarRef(this._field(fields, 'VARIABLE', ''));
    }
    if (opcode === 'data_listcontents') {
      return this._cleanListRef(this._field(fields, 'LIST', ''));
    }
    if (['math_number', 'math_positive_number', 'math_integer', 'math_angle'].includes(opcode)) {
      return _fmtNumber(this._field(fields, 'NUM', '0'));
    }
    if (opcode === 'text') return _quoteString(this._field(fields, 'TEXT', ''));
    if (opcode === 'colour_picker') return _quoteString(this._field(fields, 'COLOUR', '#000000'));
    if (opcode === 'note') return _fmtNumber(this._field(fields, 'NOTE', '60'));
    if (opcode === 'looks_costume') return _quoteString(this._field(fields, 'COSTUME', 'costume1'));
    if (opcode === 'looks_backdrops') return _quoteString(this._field(fields, 'BACKDROP', 'backdrop1'));
    if (opcode === 'sound_sounds_menu') return _quoteString(this._field(fields, 'SOUND_MENU', 'meow'));
    if (opcode === 'control_create_clone_of_menu') return _quoteString(this._field(fields, 'CLONE_OPTION', '_myself_'));
    if (opcode === 'sensing_touchingobjectmenu') return _quoteString(this._field(fields, 'TOUCHINGOBJECTMENU', '_mouse_'));
    if (opcode === 'sensing_keyoptions') return _quoteString(this._field(fields, 'KEY_OPTION', 'space'));
    if (opcode === 'sensing_of_object_menu') return _quoteString(this._field(fields, 'OBJECT', '_stage_'));
    if (opcode === 'motion_goto_menu') return _quoteString(this._field(fields, 'TO', '_random_'));
    if (opcode === 'motion_pointtowards_menu') return _quoteString(this._field(fields, 'TOWARDS', '_mouse_'));
    if (opcode === 'sensing_distancetomenu') return _quoteString(this._field(fields, 'DISTANCETOMENU', '_mouse_'));
    if (opcode === 'sensing_of') {
      const prop = this._field(fields, 'PROPERTY', 'x position');
      const live = this._menuObscuredExpr(inputs, 'OBJECT');
      if (live !== null) return `sensing_of(${_quoteString(prop)}, ${live})`;
      let obj = this._inputExpr(inputs, 'OBJECT', '"_stage_"');
      if (!obj.startsWith('"')) obj = _quoteString(obj);
      return `sensing_of(${_quoteString(prop)}, ${obj})`;
    }
    if (opcode === 'sensing_of_object_menu') return _quoteString(this._field(fields, 'OBJECT', '_stage_'));

    return `/* reporter:${opcode} */`;
  }

  _touchingExpr(inputs) {
    const live = this._menuObscuredExpr(inputs, 'TOUCHINGOBJECTMENU');
    if (live !== null) return `touching(${live})`;
    const val = this._menuValue(inputs, 'TOUCHINGOBJECTMENU');
    if (val === '_mouse_') return 'touching_mouse_pointer()';
    if (val === '_edge_') return 'touching_edge()';
    return `touching(${_quoteString(val)})`;
  }

  _distanceExpr(inputs) {
    const live = this._menuObscuredExpr(inputs, 'DISTANCETOMENU');
    if (live !== null) return `distance_to(${live})`;
    const val = this._menuValue(inputs, 'DISTANCETOMENU');
    if (val === '_mouse_') return 'distance_to_mouse_pointer()';
    return `distance_to(${_quoteString(val)})`;
  }

  // -- input resolution --

  _field(fields, name, defaultValue = '') {
    const f = fields[name];
    if (f && Array.isArray(f) && f.length >= 1) return _extractMenuValue(f[0]);
    return defaultValue;
  }

  _rawInput(inputs, name) {
    return inputs[name];
  }

  // Resolve a dropdown-with-shadow input to its live expression, or null when
  // the slot holds only a literal menu selection. Two shapes carry live
  // values: (a) a reporter block id obscuring the menu ([3, repId, menuId]),
  // and (b) an inline variable/list primitive in the value slot
  // ([3, [12|13, name, name], menuId] — the shape our own codegen emits for
  // `key_pressed score` etc.). Treating those as literals used to stringify
  // whole expressions (`sensing_of("x position", "(x + 1)")`) or silently
  // swap a variable reference for its name as a string.
  _menuObscuredExpr(inputs, inputName) {
    const inp = inputs[inputName];
    if (!inp || inp.length < 2) return null;
    const v = inp[1];
    if (typeof v === 'string') {
      const blk = this.blocks[v];
      if (_isDict(blk) && !_MENU_BLOCK_OPCODES.has(blk.opcode || '')) {
        return this._inputExpr(inputs, inputName);
      }
      return null;
    }
    if (Array.isArray(v) && v.length >= 2 && (v[0] === 12 || v[0] === 13)) {
      return this._primitiveToExpr(v);
    }
    return null;
  }

  _inputExpr(inputs, name, defaultValue = '""') {
    const inp = inputs[name];
    if (inp === undefined || inp === null) return defaultValue;
    return this._resolveInput(inp);
  }

  _resolveInput(inp) {
    if (!inp || inp.length < 2) return '""';
    if (this._exprDepth > 60) return '0';
    const typeCode = inp[0];
    const item = inp[1];
    // Bare primitive form: [primType(4..13), rawValue]. Canonical sb3 wraps
    // primitives as [shadowState, [primType, value]]; vanilla scratch-vm
    // treats a string item as a block id and would drop it. This backend's
    // OLDER codegen emitted the bare shape, so resolve it here for
    // round-tripping previously compiled projects.
    if (typeof typeCode === 'number' && typeCode >= 4 && typeCode <= 13
        && !Array.isArray(item)) {
      return this._primitiveToExpr([typeCode, item]);
    }
    if (typeof item === 'string') {
      if (this._exprVisited.has(item)) return '0';
      const block = this.blocks[item];
      if (_isDict(block)) {
        this._exprVisited.add(item);
        this._exprDepth++;
        try { return this._blockToExpr(block); }
        finally { this._exprDepth--; this._exprVisited.delete(item); }
      }
      return '""';
    }
    if (Array.isArray(item)) {
      if (item.length >= 1 && typeof item[0] === 'string') {
        const shadowId = item[0];
        if (item.length >= 2) {
          const second = item[1];
          if (_isDict(second)) {
            if (this._exprVisited.has(shadowId)) return '0';
            this._exprVisited.add(shadowId);
            this._exprDepth++;
            try { return this._blockToExpr(second); }
            finally { this._exprDepth--; this._exprVisited.delete(shadowId); }
          }
          if (typeof second === 'string') {
            if (this._exprVisited.has(second)) return '0';
            const block = this.blocks[second];
            if (_isDict(block)) {
              this._exprVisited.add(second);
              this._exprDepth++;
              try { return this._blockToExpr(block); }
              finally { this._exprDepth--; this._exprVisited.delete(second); }
            }
          }
        }
        if (this._exprVisited.has(shadowId)) return '0';
        const block = this.blocks[shadowId];
        if (_isDict(block)) {
          this._exprVisited.add(shadowId);
          this._exprDepth++;
          try { return this._blockToExpr(block); }
          finally { this._exprDepth--; this._exprVisited.delete(shadowId); }
        }
        return '""';
      }
      return this._primitiveToExpr(item);
    }
    return '""';
  }

  _primitiveToExpr(prim) {
    if (!prim || prim.length === 0) return '""';
    let ptype = prim[0];
    const val = prim.length > 1 ? prim[1] : '';
    if (Array.isArray(ptype)) return this._primitiveToExpr(ptype);
    if (typeof ptype !== 'number') return val ? _quoteString(String(val)) : '""';
    if (_PRIM_NUMBER_CODES.has(ptype)) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        // Empty / non-numeric number field (e.g. operator_subtract with an
        // untouched NUM1 shadow [1,[4,""]]): Scratch treats it as 0. Emitting
        // an empty string used to produce `( - 1)` / `( + 1)` sources that
        // the parser cannot round-trip (unary +/- after `(` either failed or
        // folded differently). Emit a plain 0 instead.
        return '0';
      }
      if (!isFinite(num)) {
        // "Infinity" / "-Infinity" / "NaN" string fields in a number slot:
        // emitting them bare would lex as identifiers (parsed as *variable*
        // references), silently turning the value into a different variable.
        // Quote them so they stay the string values Scratch treats them as.
        return _quoteString(String(val));
      }
      // Emit the PARSED number, not the raw field text: raw echoes like
      // `007`, `1.` or `-0` re-lex to different token streams (int/dot/minus)
      // and break source-level idempotency even when the value survives.
      // _fmtNumber's output (incl. `1e+21` / `1e-7` exponent forms) is
      // accepted by the lexer's Float rule, so this is stable both ways.
      return _fmtNumber(num);
    }
    if (ptype === 9) return _quoteString(String(val));
    if (ptype === 10) return _quoteString(String(val));
    if (ptype === 11) return _quoteString(String(val));
    if (ptype === 12) return this._cleanVarName(String(val));
    if (ptype === 13) return this._cleanVarName(String(val));
    return '""';
  }

  _menuValue(inputs, inputName) {
    const inp = inputs[inputName];
    if (!inp || inp.length < 2) return '';
    const item = inp[1];
    if (typeof item === 'string') {
      const block = this.blocks[item];
      if (_isDict(block)) {
        const fields = block.fields || {};
        for (const [fname, fval] of Object.entries(fields)) {
          if (fval && Array.isArray(fval) && fval.length >= 1) {
            return _extractMenuValue(fval[0]);
          }
        }
        return '';
      }
      return '';
    }
    if (Array.isArray(item)) {
      if (item.length >= 2) return _extractMenuValue(item[1]);
    }
    return '';
  }
}

export { _Decompiler };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function sb3ToGoboscript(sb3Bytes) {
  let zip;
  try {
    zip = new AdmZip(Buffer.from(sb3Bytes));
  } catch (e) {
    throw new Error(`Invalid SB3 archive: ${e.message}`);
  }

  const MAX_UNCOMPRESSED = 50 * 1024 * 1024;
  const MAX_FILES = 5000;
  const MAX_PROJECT_JSON = 10 * 1024 * 1024;

  const entries = zip.getEntries();
  let totalSize = 0;
  for (const entry of entries) {
    const fileSize = entry.header.size;
    if (fileSize > MAX_UNCOMPRESSED) {
      throw new Error(`SB3 archive contains a file that is too large (${fileSize} bytes)`);
    }
    totalSize += fileSize;
    if (totalSize > MAX_UNCOMPRESSED) {
      throw new Error('SB3 archive exceeds maximum allowed size (50 MB)');
    }
  }
  if (entries.length > MAX_FILES) {
    throw new Error(`SB3 archive contains too many files (${entries.length})`);
  }

  for (const entry of entries) {
    const name = entry.entryName;
    const normalized = name.replace(/\\/g, '/');
    const segments = normalized.split('/');
    if (segments.includes('..')) {
      throw new Error(`Invalid file name in SB3 archive: ${name}`);
    }
    if (normalized.startsWith('/')) {
      throw new Error(`Invalid file name in SB3 archive: ${name}`);
    }
    if (/^[A-Za-z]:/.test(name)) {
      throw new Error(`Invalid file name in SB3 archive: ${name}`);
    }
  }

  const pjEntry = zip.getEntry('project.json');
  if (!pjEntry) throw new Error('SB3 archive missing project.json');
  if (pjEntry.header.size > MAX_PROJECT_JSON) {
    throw new Error(`project.json is too large (${pjEntry.header.size} bytes)`);
  }

  const pjBytes = pjEntry.getData();
  if (pjBytes.length > MAX_PROJECT_JSON) {
    throw new Error('project.json actual decompressed size exceeds limit (>10MB)');
  }
  if (pjBytes.length !== pjEntry.header.size) {
    throw new Error(`project.json actual size (${pjBytes.length}) does not match declared size (${pjEntry.header.size}), possible ZIP bomb`);
  }

  let project;
  try {
    project = JSON.parse(pjBytes.toString('utf8'));
  } catch (e) {
    throw new Error(`Invalid project.json: ${e.message}`);
  }

  if (!_isDict(project)) {
    throw new Error('Invalid project.json: expected a JSON object');
  }

  const targetsResult = [];
  const allSources = [];

  // Shared state across all targets so clean names don't collide when
  // multiple targets are merged into one source string.
  const sharedUsedNames = new Set();
  const sharedVarMap = {};
  const sharedListMap = {};
  const sharedVarReverse = {};
  const sharedListReverse = {};
  const sharedProcNames = new Set();

  for (const target of (project.targets || [])) {
    const nameMap = { variables: {}, lists: {}, procedures: {} };
    let src;
    try {
      const dec = new _Decompiler(target, sharedUsedNames, sharedVarMap, sharedListMap, sharedProcNames);
      dec._varOrigToClean = sharedVarReverse;
      dec._listOrigToClean = sharedListReverse;
      src = dec.decompile();
      nameMap.variables = { ...dec._varNameMap };
      nameMap.lists = { ...dec._listNameMap };
      nameMap.procedures = { ...dec._procOrigProccode };
    } catch (e) {
      src = `# decompilation failed for target '${target.name || '?'}': ${e.message}`;
    }
    // Count real blocks (dict entries only — arrays in target.blocks are
    // top-level script id lists). Exposed because the frontend's external-SB3
    // summary reads blockCount; the raw `blocks` map is intentionally NOT
    // returned (it can be huge).
    let blockCount = 0;
    for (const blk of Object.values(target.blocks || {})) {
      if (blk && typeof blk === 'object' && !Array.isArray(blk) && blk.opcode) blockCount++;
    }
    targetsResult.push({
      name: target.name || 'Unknown',
      isStage: target.isStage || false,
      source: src,
      name_map: nameMap,
      blockCount,
    });
    if (src.trim()) allSources.push(src);
  }

  // Inline target-boundary directives so compileSource rebuilds the SAME
  // multi-target structure (names + per-target blocks/vars/costumes) instead
  // of flattening every sprite into Sprite1. `target stage;` for the stage,
  // `target "Name";` for sprites — documented InstanceScratch extension.
  void allSources;
  const fullSource = (project.targets || [])
    .map((t, i) => {
      const r = targetsResult[i];
      if (!r || !r.source.trim()) return '';
      const marker = t.isStage ? 'target stage;' : `target ${JSON.stringify(t.name || 'Sprite1')};`;
      return `${marker}\n\n${r.source}`;
    })
    .filter(Boolean)
    .join('\n\n');

  // Asset bytes referenced by the emitted `costumes`/`sounds` declarations.
  const assets = {};
  for (const entry of zip.getEntries()) {
    if (entry.entryName === 'project.json') continue;
    try {
      const data = entry.getData();
      if (data.length > 0) assets[entry.entryName.replace(/\\/g, '/')] = data;
    } catch { /* unreadable entry: skip */ }
  }

  return { source: fullSource, targets: targetsResult, assets };
}
