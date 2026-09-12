// Block injection logic (browser extension).
// Merges a compiled goboscript project (SB3) into the CURRENT project at the
// CURRENT editing sprite, preserving all other sprites/costumes/backdrops.
// Supports mode='append' (add new blocks) and mode='replace' (replace existing
// blocks on the current sprite with the new ones).
// In 'replace' mode, only AI-injected blocks (prefix "gsinj_") and blocks the
// AI explicitly marked for removal (via removeOpcodes) are deleted. User's
// manually created blocks are preserved.
import JSZip from 'jszip';

export function currentSpriteName(vm) {
  const t = vm.editingTarget;
  if (t && !t.isStage) return t.getName();
  return null;
}

/**
 * Get the current sprite's blocks summary for AI context.
 * Returns an array of top-level blocks with their opcode and fields.
 */
export function getCurrentSpriteBlocks(vm) {
  if (!vm) throw new Error('未找到页面上的 Scratch VM');
  const t = vm.editingTarget;
  if (!t || t.isStage) return [];
  const blocks = t.blocks || {};
  const result = [];
  for (const [id, blk] of Object.entries(blocks)) {
    if (!blk || typeof blk !== 'object' || Array.isArray(blk)) continue;
    if (!blk.topLevel) continue;
    const info = { opcode: blk.opcode || 'unknown', id };
    // Extract field values for context
    if (blk.fields) {
      const fields = {};
      for (const [k, v] of Object.entries(blk.fields)) {
        if (Array.isArray(v) && v[0] != null) fields[k] = v[0];
        else if (v && typeof v === 'object' && v.id != null) fields[k] = v.name || '';
      }
      if (Object.keys(fields).length > 0) info.fields = fields;
    }
    result.push(info);
  }
  return result;
}

/**
 * Collect all block IDs in the subtree starting from a top-level block.
 * Used to remove the entire tree when deleting a top-level block.
 */
function collectBlockTree(blocks, topId) {
  const toRemove = new Set();
  const stack = [topId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!blocks[id] || toRemove.has(id)) continue;
    toRemove.add(id);
    const blk = blocks[id];
    // Follow next chain
    if (blk.next && blocks[blk.next]) stack.push(blk.next);
    // Follow input references (nested shadow blocks / reporters)
    if (blk.inputs) {
      for (const k of Object.keys(blk.inputs)) {
        const arr = blk.inputs[k];
        if (!Array.isArray(arr)) continue;
        for (const el of arr) {
          if (typeof el === 'string' && blocks[el]) stack.push(el);
        }
      }
    }
  }
  return toRemove;
}

/**
 * Selectively remove blocks from the target sprite.
 *
 * @param {object} tgt - The current sprite target (from saved project JSON).
 * @param {string} mode - 'append' or 'replace'.
 * @param {string[]} removeOpcodes - Opcodes of top-level blocks to remove.
 */
function selectiveRemoveBlocks(tgt, mode, removeOpcodes) {
  if (!tgt.blocks) return;
  const blocks = tgt.blocks;
  const topToRemove = [];
  for (const [id, blk] of Object.entries(blocks)) {
    if (!blk || typeof blk !== 'object' || Array.isArray(blk)) continue;
    if (!blk.topLevel) continue;
    // In replace mode, remove previously AI-injected blocks.
    const isAIInjected = mode === 'replace' && id.startsWith('gsinj_');
    // Remove blocks the AI explicitly marked for removal.
    const opcodeMatch = removeOpcodes && removeOpcodes.length > 0
      ? removeOpcodes.includes(blk.opcode)
      : false;
    if (isAIInjected || opcodeMatch) {
      topToRemove.push(id);
    }
  }

  // Remove the entire tree for each selected top-level block.
  const idsToRemove = new Set();
  for (const id of topToRemove) {
    for (const rid of collectBlockTree(blocks, id)) idsToRemove.add(rid);
  }
  for (const id of idsToRemove) delete blocks[id];
}

export async function injectSb3IntoCurrent(vm, compiledSb3Buffer, { mode = 'append', removeOpcodes = [] } = {}) {
  if (!vm) throw new Error('未找到页面上的 Scratch VM');
  const zip = await JSZip.loadAsync(compiledSb3Buffer);
  const pj = JSON.parse(await zip.file('project.json').async('string'));

  // Pick the first non-stage sprite that has blocks from the compiled project.
  const spriteTarget = pj.targets.find((t) => !t.isStage && t.blocks && Object.keys(t.blocks).length > 0);
  if (!spriteTarget) return { injected: 0 };

  // Get current project from the live VM.
  const baseBuf = await vm.saveProjectSb3();
  const baseZip = await JSZip.loadAsync(baseBuf);
  const cur = JSON.parse(await baseZip.file('project.json').async('string'));

  let tgt = cur.targets.find((t) => !t.isStage && t.name === currentSpriteName(vm));
  if (!tgt) tgt = cur.targets.find((t) => !t.isStage);
  if (!tgt) throw new Error('当前项目没有可用于注入的角色');

  // ---- Selective block removal ----
  // Do NOT clear all blocks. Only remove:
  //   1) Previously AI-injected blocks (prefix "gsinj_") when in replace mode
  //   2) Blocks the AI explicitly marked for removal (removeOpcodes)
  // This preserves user's manually created blocks.
  if (mode === 'replace' || (removeOpcodes && removeOpcodes.length > 0)) {
    selectiveRemoveBlocks(tgt, mode, removeOpcodes || []);
  }

  const raw = JSON.parse(JSON.stringify(spriteTarget.blocks));
  const existIds = new Set(Object.keys(tgt.blocks || {}));
  const idm = {};
  let seq = 0;
  for (const bid of Object.keys(raw)) {
    let nid;
    do { nid = 'gsinj_' + Date.now().toString(36) + '_' + (seq++); } while (existIds.has(nid));
    existIds.add(nid);
    idm[bid] = nid;
  }
  const outBlocks = {};
  for (const [bid, blk] of Object.entries(raw)) {
    const nb = JSON.parse(JSON.stringify(blk));
    nb.id = idm[bid];
    if (nb.next && idm[nb.next]) nb.next = idm[nb.next];
    if (nb.parent && idm[nb.parent]) nb.parent = idm[nb.parent];
    if (nb.topLevel) { if (nb.x == null) nb.x = 60; if (nb.y == null) nb.y = 60; }
    outBlocks[idm[bid]] = nb;
  }
  for (const nb of Object.values(outBlocks)) {
    if (!nb.inputs) continue;
    for (const k of Object.keys(nb.inputs)) {
      const arr = nb.inputs[k];
      if (Array.isArray(arr)) nb.inputs[k] = arr.map((el) => (typeof el === 'string' && idm[el]) ? idm[el] : el);
    }
  }

  // Merge variables/lists by NAME.
  const varIdMap = {};
  const listIdMap = {};
  const broadcastIdMap = {};
  const ensureVar = (entry) => {
    const [vid, vd] = entry;
    const vname = Array.isArray(vd) ? vd[0] : (vd && vd.name);
    for (const [exId, exV] of Object.entries(tgt.variables || {})) {
      const exName = Array.isArray(exV) ? exV[0] : (exV && exV.name);
      if (exName === vname) { varIdMap[vid] = exId; return; }
    }
    tgt.variables = tgt.variables || {};
    tgt.variables[vid] = vd;
  };
  const ensureList = (entry) => {
    const [lid, ld] = entry;
    const lname = Array.isArray(ld) ? ld[0] : (ld && ld.name);
    for (const [exId, exL] of Object.entries(tgt.lists || {})) {
      const exName = Array.isArray(exL) ? exL[0] : (exL && exL.name);
      if (exName === lname) { listIdMap[lid] = exId; return; }
    }
    tgt.lists = tgt.lists || {};
    tgt.lists[lid] = ld;
    if (tgt.variables && tgt.variables[lid] !== undefined) delete tgt.variables[lid];
  };
  for (const entry of Object.entries(spriteTarget.variables || {})) ensureVar(entry);
  for (const entry of Object.entries(spriteTarget.lists || {})) ensureList(entry);
  for (const [bid, bname] of Object.entries(spriteTarget.broadcasts || {})) {
    const exName = typeof bname === 'string' ? bname : ((bname && bname.name) || bid);
    let reused = false;
    for (const [exId, exB] of Object.entries(tgt.broadcasts || {})) {
      const n = typeof exB === 'string' ? exB : ((exB && exB.name) || exId);
      if (n === exName) { broadcastIdMap[bid] = exId; reused = true; break; }
    }
    if (!reused) {
      tgt.broadcasts = tgt.broadcasts || {};
      tgt.broadcasts[bid] = typeof bname === 'string' ? bname : (bname && bname.name);
    }
  }
  // Fix field id references.
  for (const nb of Object.values(outBlocks)) {
    if (!nb.fields) continue;
    for (const fk of ['VARIABLE', 'LIST', 'BROADCAST_OPTION']) {
      const fld = nb.fields[fk];
      if (!fld) continue;
      const idMap = fk === 'LIST' ? listIdMap : (fk === 'BROADCAST_OPTION' ? broadcastIdMap : varIdMap);
      if (Array.isArray(fld)) {
        if (idMap[fld[1]]) nb.fields[fk] = [fld[0], idMap[fld[1]]];
      } else if (fld && fld.id) {
        if (idMap[fld.id]) nb.fields[fk] = [fld[0], idMap[fld.id]];
      }
    }
  }

  tgt.blocks = Object.assign({}, tgt.blocks, outBlocks);
  baseZip.file('project.json', JSON.stringify(cur));
  const mergedBuf = await baseZip.generateAsync({ type: 'arraybuffer' });
  await vm.loadProject(mergedBuf);

  let top = 0;
  for (const blk of Object.values(spriteTarget.blocks)) {
    if (blk && typeof blk === 'object' && !Array.isArray(blk) && blk.topLevel) top++;
  }
  return { injected: top, sprite: currentSpriteName(vm) };
}
