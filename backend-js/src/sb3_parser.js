// sb3_parser.js — SB3 project.json parser and scratchblocks text converter
// Ported from backend/sb3_parser.py (1:1 alignment)
// Parses blocks from an SB3 project.json and converts to scratchblocks text

import AdmZip from 'adm-zip';

// ---------------------------------------------------------------------------
// Primitive type codes in SB3 inputs:
// [1, ...] = shadow-only or same-block-shadow
// [2, ...] = block, no shadow
// [3, block, shadow] = block with obscured shadow
// Primitive arrays: [4, num] [5, posnum] [6, posint] [7, int] [8, angle]
//                    [9, color] [10, string] [11, broadcast] [12, var] [13, list]
// ---------------------------------------------------------------------------

function _resolveInput(inputData, blocksMap, variables, lists, _visited = null, _depth = 0) {
  if (!inputData || inputData.length < 2) return '';

  // Guard against deep recursion / cyclic reporter references
  if (_depth > 50) return '/*...*/';
  if (_visited === null) _visited = new Set();

  const item = inputData[1];

  // If item is a string, it's a block ID
  if (typeof item === 'string') {
    if (_visited.has(item)) return '/*cycle*/';
    const block = blocksMap[item];
    if (block) {
      _visited.add(item);
      try {
        return _blockToText(block, blocksMap, variables, lists, true, _visited, _depth + 1);
      } finally {
        _visited.delete(item);
      }
    }
    return '';
  }

  // If item is an array, it's a primitive
  if (Array.isArray(item)) {
    return _primitiveToText(item, variables, lists);
  }

  return '';
}

function _primitiveToText(prim, variables, lists) {
  if (!prim || prim.length === 0) return '';
  const ptype = prim[0];
  if ([4, 5, 6, 7, 8].includes(ptype)) {
    return String(prim.length > 1 ? prim[1] : 0);
  }
  if (ptype === 9) {
    return String(prim.length > 1 ? prim[1] : '#000000');
  }
  if (ptype === 10) {
    const val = String(prim.length > 1 ? prim[1] : '');
    return `[${val}]`;
  }
  if (ptype === 11) {
    const val = String(prim.length > 1 ? prim[1] : '');
    return `[${val}]`;
  }
  if (ptype === 12) {
    const varName = String(prim.length > 1 ? prim[1] : '');
    return `(${varName})`;
  }
  if (ptype === 13) {
    const listName = String(prim.length > 1 ? prim[1] : '');
    return `(${listName}::list)`;
  }
  return '';
}

function _getFieldValue(fields, name, defaultVal = '') {
  const field = fields[name];
  if (field && field.length >= 1) {
    return String(field[0]);
  }
  return defaultVal;
}

function _blockToText(block, blocksMap, variables, lists, asReporter = false, _visited = null, _depth = 0) {
  const opcode = block.opcode || '';
  const inputs = block.inputs || {};
  const fields = block.fields || {};
  const mutation = block.mutation || {};

  function inp(name) {
    return _resolveInput(inputs[name] || [], blocksMap, variables, lists, _visited, _depth);
  }

  function op(name, inp1Name, inp2Name) {
    const v1 = inp(inp1Name);
    if (inp2Name) {
      const v2 = inp(inp2Name);
      return `(${v1} ${name} ${v2})`;
    }
    return `(${name} ${v1})`;
  }

  // ---- Event blocks ----
  if (opcode === 'event_whenflagclicked') return 'when flag clicked';
  if (opcode === 'event_whenkeypressed') {
    const key = _getFieldValue(fields, 'KEY_OPTION', 'space');
    return `when [${key}] key pressed`;
  }
  if (opcode === 'event_whenthisspriteclicked') return 'when this sprite clicked';
  if (opcode === 'event_whenbroadcastreceived') {
    const bcast = _getFieldValue(fields, 'BROADCAST_OPTION', 'message1');
    return `when I receive [${bcast}]`;
  }
  if (opcode === 'event_broadcast') {
    const msg = inp('BROADCAST_INPUT');
    return `broadcast ${msg}`;
  }
  if (opcode === 'event_broadcastandwait') {
    const msg = inp('BROADCAST_INPUT');
    return `broadcast ${msg} and wait`;
  }

  // ---- Control blocks ----
  if (opcode === 'control_repeat') {
    const times = inp('TIMES');
    return `repeat (${times})`;
  }
  if (opcode === 'control_repeat_until') {
    const cond = inp('CONDITION');
    return `repeat until ${cond}`;
  }
  if (opcode === 'control_forever') return 'forever';
  if (opcode === 'control_if') {
    const cond = inp('CONDITION');
    return `if ${cond}`;
  }
  if (opcode === 'control_if_else') {
    const cond = inp('CONDITION');
    return `if ${cond} then`;
  }
  if (opcode === 'control_stop') {
    const stopOpt = _getFieldValue(fields, 'STOP_OPTION', 'all');
    return `stop [${stopOpt}]`;
  }
  if (opcode === 'control_wait') {
    const dur = inp('DURATION');
    return `wait (${dur}) seconds`;
  }
  if (opcode === 'control_wait_until') {
    const cond = inp('CONDITION');
    return `wait until ${cond}`;
  }
  if (opcode === 'control_create_clone_of') {
    const target = inp('CLONE_OPTION');
    return `create clone of ${target}`;
  }

  // ---- Procedures (custom blocks) ----
  if (opcode === 'procedures_definition') {
    const protoInput = inputs['custom_block'];
    if (protoInput && protoInput.length >= 2) {
      const protoId = protoInput[1];
      if (typeof protoId === 'string') {
        const proto = blocksMap[protoId] || {};
        const protoMutation = proto.mutation || {};
        const proccode = protoMutation.proccode || 'block';
        let argnames = [];
        try {
          argnames = JSON.parse(protoMutation.argumentids || '[]');
        } catch (e) { /* ignore */ }
        let result = proccode;
        let argIdx = 0;
        const placeholderRe = /%[sbn]/g;
        result = result.replace(placeholderRe, (match) => {
          if (argIdx < argnames.length) {
            const replacement = `(${argnames[argIdx]})`;
            argIdx++;
            return replacement;
          }
          return match;
        });
        return `define ${result}`;
      }
    }
    return 'define';
  }

  if (opcode === 'procedures_call') {
    const proccode = mutation.proccode || 'block';
    let argids = [];
    try {
      argids = JSON.parse(mutation.argumentids || '[]');
    } catch (e) { /* ignore */ }
    const argVals = argids.map(aid => inp(aid));
    let result = proccode;
    let argIdx = 0;
    const placeholderRe = /%[sbn]/g;
    result = result.replace(placeholderRe, (match) => {
      if (argIdx < argVals.length) {
        const replacement = argVals[argIdx];
        argIdx++;
        return replacement;
      }
      return match;
    });
    return result;
  }

  // ---- Data (variables) ----
  if (opcode === 'data_setvariableto') {
    const varInfo = fields['VARIABLE'] || ['', ''];
    const varName = varInfo[0] || '';
    const val = inp('VALUE');
    return `set [${varName}] to ${val}`;
  }
  if (opcode === 'data_changevariableby') {
    const varInfo = fields['VARIABLE'] || ['', ''];
    const varName = varInfo[0] || '';
    const val = inp('VALUE');
    return `change [${varName}] by ${val}`;
  }
  if (opcode === 'data_showvariable') {
    const varInfo = fields['VARIABLE'] || ['', ''];
    const varName = varInfo[0] || '';
    return `show variable [${varName}]`;
  }
  if (opcode === 'data_hidevariable') {
    const varInfo = fields['VARIABLE'] || ['', ''];
    const varName = varInfo[0] || '';
    return `hide variable [${varName}]`;
  }

  // ---- Data (lists) ----
  if (opcode === 'data_addtolist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const val = inp('ITEM');
    return `add ${val} to [${listName}]`;
  }
  if (opcode === 'data_deleteoflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const idx = inp('INDEX');
    return `delete ${idx} of [${listName}]`;
  }
  if (opcode === 'data_deletealloflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    return `delete (all) of [${listName}]`;
  }
  if (opcode === 'data_insertatlist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const val = inp('ITEM');
    const idx = inp('INDEX');
    return `insert ${val} at ${idx} of [${listName}]`;
  }
  if (opcode === 'data_replaceitemoflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const val = inp('ITEM');
    const idx = inp('INDEX');
    return `replace item ${idx} of [${listName}] with ${val}`;
  }
  if (opcode === 'data_itemoflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const idx = inp('INDEX');
    const text = `item ${idx} of [${listName}]`;
    return asReporter ? `(${text})` : text;
  }
  if (opcode === 'data_itemnumoflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const val = inp('ITEM');
    const text = `item # of ${val} in [${listName}]`;
    return asReporter ? `(${text})` : text;
  }
  if (opcode === 'data_lengthoflist') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const text = `length of [${listName}]`;
    return asReporter ? `(${text})` : text;
  }
  if (opcode === 'data_listcontainsitem') {
    const listInfo = fields['LIST'] || ['', ''];
    const listName = listInfo[0] || '';
    const val = inp('ITEM');
    const text = `[${listName}] contains ${val}?`;
    return asReporter ? `(${text})` : text;
  }

  // ---- Motion ----
  if (opcode === 'motion_movesteps') {
    const steps = inp('STEPS');
    return `move (${steps}) steps`;
  }
  if (opcode === 'motion_turnright') {
    const deg = inp('DEGREES');
    return `turn right (${deg}) degrees`;
  }
  if (opcode === 'motion_turnleft') {
    const deg = inp('DEGREES');
    return `turn left (${deg}) degrees`;
  }
  if (opcode === 'motion_gotoxy') {
    const x = inp('X');
    const y = inp('Y');
    return `go to x: (${x}) y: (${y})`;
  }
  if (opcode === 'motion_setx') {
    const x = inp('X');
    return `set x to (${x})`;
  }
  if (opcode === 'motion_sety') {
    const y = inp('Y');
    return `set y to (${y})`;
  }
  if (opcode === 'motion_changexby') {
    const dx = inp('DX');
    return `change x by (${dx})`;
  }
  if (opcode === 'motion_changeyby') {
    const dy = inp('DY');
    return `change y by (${dy})`;
  }
  if (opcode === 'motion_glidesecstoxy') {
    const sec = inp('SECS');
    const x = inp('X');
    const y = inp('Y');
    return `glide (${sec}) secs to x: (${x}) y: (${y})`;
  }

  // ---- Looks ----
  if (opcode === 'looks_say') {
    const msg = inp('MESSAGE');
    return `say ${msg}`;
  }
  if (opcode === 'looks_sayforsecs') {
    const msg = inp('MESSAGE');
    const sec = inp('SECS');
    return `say ${msg} for (${sec}) seconds`;
  }
  if (opcode === 'looks_think') {
    const msg = inp('MESSAGE');
    return `think ${msg}`;
  }
  if (opcode === 'looks_thinkforsecs') {
    const msg = inp('MESSAGE');
    const sec = inp('SECS');
    return `think ${msg} for (${sec}) seconds`;
  }
  if (opcode === 'looks_switchcostumeto') {
    const costume = inp('COSTUME');
    return `switch costume to ${costume}`;
  }
  if (opcode === 'looks_nextcostume') return 'next costume';
  if (opcode === 'looks_setsizeto') {
    const size = inp('SIZE');
    return `set size to (${size}) %`;
  }
  if (opcode === 'looks_show') return 'show';
  if (opcode === 'looks_hide') return 'hide';

  // ---- Operators (reporters) ----
  if (opcode === 'operator_add') return op('+', 'NUM1', 'NUM2');
  if (opcode === 'operator_subtract') return op('-', 'NUM1', 'NUM2');
  if (opcode === 'operator_multiply') return op('*', 'NUM1', 'NUM2');
  if (opcode === 'operator_divide') return op('/', 'NUM1', 'NUM2');
  if (opcode === 'operator_mod') return op('mod', 'NUM1', 'NUM2');
  if (opcode === 'operator_gt') return op('>', 'OPERAND1', 'OPERAND2');
  if (opcode === 'operator_lt') return op('<', 'OPERAND1', 'OPERAND2');
  if (opcode === 'operator_equals') return op('=', 'OPERAND1', 'OPERAND2');
  if (opcode === 'operator_and') return op('and', 'OPERAND1', 'OPERAND2');
  if (opcode === 'operator_or') return op('or', 'OPERAND1', 'OPERAND2');
  if (opcode === 'operator_not') {
    const v = inp('OPERAND');
    return `(not ${v})`;
  }
  if (opcode === 'operator_join') {
    const v1 = inp('STRING1');
    const v2 = inp('STRING2');
    return `(join ${v1} ${v2})`;
  }
  if (opcode === 'operator_length') {
    const v = inp('STRING');
    return `(length of ${v})`;
  }
  if (opcode === 'operator_contains') {
    const v1 = inp('STRING1');
    const v2 = inp('STRING2');
    return `(${v1} contains ${v2}?)`;
  }
  if (opcode === 'operator_round') {
    const v = inp('NUM');
    return `(round ${v})`;
  }
  if (opcode === 'operator_mathop') {
    const opVal = _getFieldValue(fields, 'OPERATOR', 'sqrt');
    const v = inp('NUM');
    return `(${opVal} of ${v})`;
  }

  // ---- Sensing ----
  if (opcode === 'sensing_touchingobject') {
    const obj = inp('TOUCHINGOBJECTMENU');
    return `(touching ${obj}?)`;
  }
  if (opcode === 'sensing_askandwait') {
    const q = inp('QUESTION');
    return `ask ${q} and wait`;
  }
  if (opcode === 'sensing_answer') return '(answer)';
  if (opcode === 'sensing_keypressed') {
    const key = inp('KEY_OPTION');
    return `(key [${key}] pressed?)`;
  }
  if (opcode === 'sensing_mousedown') return '(mouse down?)';
  if (opcode === 'sensing_mousex') return '(mouse x)';
  if (opcode === 'sensing_mousey') return '(mouse y)';

  // ---- Sound ----
  if (opcode === 'sound_play') {
    const sound = inp('SOUND_MENU');
    return `start sound ${sound}`;
  }
  if (opcode === 'sound_playuntildone') {
    const sound = inp('SOUND_MENU');
    return `play sound ${sound} until done`;
  }
  if (opcode === 'sound_stopallsounds') return 'stop all sounds';
  if (opcode === 'sound_setvolumeto') {
    const vol = inp('VOLUME');
    return `set volume to (${vol}) %`;
  }

  // ---- Fallback: show opcode raw ----
  return `[${opcode}]`;
}

function _walkScript(startBlockId, blocksMap, variables, lists, indent = 0, _substackVisited = null) {
  const lines = [];
  let currentId = startBlockId;
  const seen = new Set();

  while (currentId) {
    if (seen.has(currentId)) {
      lines.push(`${'    '.repeat(indent)}// warning: circular reference`);
      break;
    }
    seen.add(currentId);
    const block = blocksMap[currentId];
    if (!block) break;

    const opcode = block.opcode || '';
    const inputs = block.inputs || {};
    const prefix = '    '.repeat(indent);

    try {
      const text = _blockToText(block, blocksMap, variables, lists);
      const substack = inputs['SUBSTACK'];
      const substack2 = inputs['SUBSTACK2'];

      if (substack || opcode === 'control_forever') {
        lines.push(`${prefix}${text}`);

        if (_substackVisited === null) _substackVisited = new Set();
        if (substack) {
          const subId = substack.length >= 2 ? substack[1] : null;
          if (typeof subId === 'string' && subId) {
            if (_substackVisited.has(subId)) {
              lines.push(`${'    '.repeat(indent + 1)}// warning: circular substack`);
            } else {
              _substackVisited.add(subId);
              const subLines = _walkScript(subId, blocksMap, variables, lists, indent + 1, _substackVisited);
              lines.push(...subLines);
            }
          }
        }

        if (substack2) {
          const sub2Id = substack2.length >= 2 ? substack2[1] : null;
          lines.push(`${prefix}else`);
          if (typeof sub2Id === 'string' && sub2Id) {
            if (_substackVisited.has(sub2Id)) {
              lines.push(`${'    '.repeat(indent + 1)}// warning: circular substack`);
            } else {
              _substackVisited.add(sub2Id);
              const sub2Lines = _walkScript(sub2Id, blocksMap, variables, lists, indent + 1, _substackVisited);
              lines.push(...sub2Lines);
            }
          }
        }

        lines.push(`${prefix}end`);
      } else {
        lines.push(`${prefix}${text}`);
      }
    } catch (e) {
      lines.push(`${prefix}// error rendering ${opcode}: ${e.message}`);
    }

    currentId = block.next;
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Main entry point: parse SB3 and return structured data
// ---------------------------------------------------------------------------

export function sb3ToScratchblocks(sb3Bytes) {
  const MAX_UNCOMPRESSED = 50 * 1024 * 1024; // 50 MB
  const MAX_FILES = 5000;
  const MAX_PROJECT_JSON = 10 * 1024 * 1024; // 10 MB

  let zip;
  try {
    zip = new AdmZip(Buffer.from(sb3Bytes));
  } catch (e) {
    throw new Error(`Invalid SB3 archive: ${e.message}`);
  }

  const entries = zip.getEntries();

  // Check for zip bombs
  let totalSize = 0;
  for (const entry of entries) {
    if (entry.header.size > MAX_UNCOMPRESSED) {
      throw new Error(`SB3 archive contains a file that is too large (${entry.header.size} bytes)`);
    }
    totalSize += entry.header.size;
    if (totalSize > MAX_UNCOMPRESSED) {
      throw new Error('SB3 archive exceeds maximum allowed size (50 MB)');
    }
  }
  if (entries.length > MAX_FILES) {
    throw new Error(`SB3 archive contains too many files (${entries.length})`);
  }

  // Validate file names (prevent Zip Slip)
  const winDriveRe = /^[A-Za-z]:/;
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
    if (winDriveRe.test(name)) {
      throw new Error(`Invalid file name in SB3 archive: ${name}`);
    }
  }

  // Find project.json
  const pjEntry = entries.find(e => e.entryName === 'project.json');
  if (!pjEntry) {
    throw new Error('SB3 archive missing project.json');
  }

  if (pjEntry.header.size > MAX_PROJECT_JSON) {
    throw new Error(`project.json is too large (${pjEntry.header.size} bytes)`);
  }

  let projectJson;
  try {
    const pjText = pjEntry.getData().toString('utf8');
    projectJson = JSON.parse(pjText);
  } catch (e) {
    throw new Error(`Invalid project.json: ${e.message}`);
  }

  const targetsResult = [];
  let totalBlocks = 0;

  for (const target of (projectJson.targets || [])) {
    const name = target.name || 'Unknown';
    const isStage = target.isStage || false;
    const variables = target.variables || {};
    const lists = target.lists || {};
    const blocksMap = target.blocks || {};

    // Count blocks (exclude primitives which are arrays)
    let blockCount = 0;
    for (const v of Object.values(blocksMap)) {
      if (typeof v === 'object' && !Array.isArray(v)) blockCount++;
    }
    totalBlocks += blockCount;

    // Find top-level blocks
    const topLevel = [];
    for (const [bid, blk] of Object.entries(blocksMap)) {
      if (typeof blk === 'object' && !Array.isArray(blk) && blk.topLevel) {
        topLevel.push(bid);
      }
    }

    // Sort by y position then x for natural reading order
    topLevel.sort((a, b) => {
      const ba = blocksMap[a];
      const bb = blocksMap[b];
      const ya = (ba && ba.y) || 0;
      const yb = (bb && bb.y) || 0;
      if (ya !== yb) return ya - yb;
      const xa = (ba && ba.x) || 0;
      const xb = (bb && bb.x) || 0;
      return xa - xb;
    });

    // Walk each script
    const allLines = [];
    for (const tlId of topLevel) {
      const scriptLines = _walkScript(tlId, blocksMap, variables, lists);
      if (scriptLines.length > 0) {
        allLines.push(...scriptLines);
        allLines.push(''); // blank line between scripts
      }
    }

    // Also list variables and lists as comments
    const varNames = Object.values(variables).map(v => v[0]);
    const listNames = Object.values(lists).map(v => v[0]);

    targetsResult.push({
      name,
      isStage,
      variables: varNames,
      lists: listNames,
      scripts: allLines,
      block_count: blockCount,
    });
  }

  // Build full scratchblocks text
  const fullTextParts = [];
  for (const t of targetsResult) {
    if (t.scripts.length > 0) {
      fullTextParts.push(`// ${t.name}`);
      if (t.variables.length > 0) {
        fullTextParts.push(`// Variables: ${t.variables.join(', ')}`);
      }
      if (t.lists.length > 0) {
        fullTextParts.push(`// Lists: ${t.lists.join(', ')}`);
      }
      fullTextParts.push(...t.scripts);
    }
  }

  return {
    targets: targetsResult,
    scratchblocks_text: fullTextParts.join('\n'),
    block_count: totalBlocks,
  };
}
