// InstanceScratch AI — MAIN-world bridge (injected via <script> tag).
// Runs in the page's MAIN world, discovers the Scratch VM instance on the
// page (Turbowarp.org / codingclip.com / other scratch-gui editors), and
// executes operations (get current sprite / inject SB3 / get blocks) on behalf
// of the isolated content script.
//
// Cross-world communication: the isolated content script posts a
// window.postMessage({__iscratch:{id,type,payload}}) and this bridge replies
// with window.postMessage({__iscratch:{id,ok,payload|error}}).
(function () {
  if (window.__instanceScratchInjected) return;
  window.__instanceScratchInjected = true;

  const BRIDGE = '__iscratch';
  let vm = null;

  // ---- VM discovery strategies ----
  function tryDirect() {
    return window.vm || null;
  }

  // Duck-type: a scratch-vm instance carries runtime.targets / saveProjectSb3
  // / loadProject / editingTarget.
  function looksLikeVM(o) {
    if (!o || typeof o !== 'object') return false;
    return (o.runtime && Array.isArray(o.runtime.targets)) &&
      typeof o.saveProjectSb3 === 'function' &&
      typeof o.loadProject === 'function' &&
      o.editingTarget;
  }

  const MAX_FIBER_SCAN = 40000;
  function findVMFiber(root, seen, budget) {
    const stack = [root];
    let scanned = 0;
    while (stack.length > 0 && scanned < budget) {
      const node = stack.pop();
      scanned++;
      if (!node || seen.has(node)) continue;
      seen.add(node);
      if (node.memoizedProps && looksLikeVM(node.memoizedProps.vm)) return node.memoizedProps.vm;
      if (node.stateNode && looksLikeVM(node.stateNode)) return node.stateNode;
      if (node.return) stack.push(node.return);
      if (node.child) stack.push(node.child);
      if (node.sibling) stack.push(node.sibling);
      if (node.alternate && !seen.has(node.alternate)) stack.push(node.alternate);
    }
    return null;
  }

  // Scan DOM for a React root (covers #root / #app / scratch-gui).
  function tryFiber() {
    const sel = ['#root', '.scratch-gui', '#app', '#gui', '[class*="gui"]'];
    const roots = [];
    for (const s of sel) {
      try {
        const els = document.querySelectorAll(s);
        els.forEach((el) => roots.push(el));
      } catch (e) { /* ignore */ }
    }
    if (roots.length === 0) {
      try {
        document.querySelectorAll('body *').forEach((el) => {
          if (roots.length > 30) return;
          for (const k in el) {
            if (k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$')) {
              roots.push(el);
              break;
            }
          }
        });
      } catch (e) { /* ignore */ }
    }
    for (const el of roots) {
      for (const key of Object.keys(el)) {
        if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactContainer$')) continue;
        const fiber = el[key];
        const found = findVMFiber(fiber, new Set(), MAX_FIBER_SCAN);
        if (found) return found;
      }
    }
    return null;
  }

  // CodingClip / other editors may expose VM on a specific selector or
  // window property.
  function tryGlobals() {
    const candidates = [
      window.vm,
      window.scratchVM,
      window.Scratch?.vm,
      window.__scratchVm,
      window.__vm,
    ];
    for (const c of candidates) {
      if (c && looksLikeVM(c)) return c;
    }
    return null;
  }

  function discover() {
    if (vm && looksLikeVM(vm)) return vm;
    vm = tryDirect() || tryGlobals() || tryFiber();
    return vm && looksLikeVM(vm) ? vm : null;
  }

  function currentSpriteName() {
    const v = discover();
    return v && v.editingTarget && !v.editingTarget.isStage ? v.editingTarget.getName() : null;
  }

  // Get current sprite blocks summary for AI context.
  function currentSpriteBlocks() {
    const v = discover();
    if (!v || !v.editingTarget || v.editingTarget.isStage) return [];
    const blocks = v.editingTarget.blocks || {};
    const result = [];
    for (const [id, blk] of Object.entries(blocks)) {
      if (!blk || typeof blk !== 'object' || Array.isArray(blk)) continue;
      if (!blk.topLevel) continue;
      const info = { opcode: blk.opcode || 'unknown', id };
      if (blk.fields) {
        const fields = {};
        for (const [k, val] of Object.entries(blk.fields)) {
          if (Array.isArray(val) && val[0] != null) fields[k] = val[0];
        }
        if (Object.keys(fields).length > 0) info.fields = fields;
      }
      result.push(info);
    }
    return result;
  }

  // ---- message handling ----
  function handle(type, payload) {
    const v = discover();
    switch (type) {
      case 'ping':
        return { hasVM: !!v, sprite: currentSpriteName() };
      case 'getSprite':
        if (!v) throw new Error('未找到页面上的 Scratch VM（请确认当前页面是编辑器）');
        return { sprite: currentSpriteName() };
      case 'getSpriteBlocks': {
        if (!v) throw new Error('未找到页面上的 Scratch VM（请确认当前页面是编辑器）');
        return { blocks: currentSpriteBlocks(), sprite: currentSpriteName() };
      }
      case 'inject': {
        if (!v) throw new Error('未找到页面上的 Scratch VM（请确认当前页面是编辑器）');
        if (!payload || !payload.buffer) throw new Error('缺少待注入的 SB3 数据');
        const url = chrome?.runtime?.getURL
          ? chrome.runtime.getURL('build/injector.mjs')
          : payload.injectorUrl;
        const mode = payload.mode || 'append';
        const removeOpcodes = payload.removeOpcodes || [];
        return import(url).then((mod) => mod.injectSb3IntoCurrent(v, payload.buffer, { mode, removeOpcodes }));
      }
      case 'greenFlag': {
        if (!v) throw new Error('未找到页面上的 Scratch VM');
        v.greenFlag();
        return { ok: true };
      }
      case 'stopAll': {
        if (!v) throw new Error('未找到页面上的 Scratch VM');
        v.stopAll();
        return { ok: true };
      }
      case 'saveProject': {
        if (!v) throw new Error('未找到页面上的 Scratch VM');
        return v.saveProjectSb3().then((buf) => ({ buffer: Array.from(new Uint8Array(buf)) }));
      }
      default:
        throw new Error('unknown operation: ' + type);
    }
  }

  window.addEventListener('message', (ev) => {
    const data = ev.data;
    if (!data || !data[BRIDGE]) return;
    const req = data[BRIDGE];
    if (typeof req.id !== 'number' && typeof req.id !== 'string') return;
    if (req.ok !== undefined || !req.type) return;
    const reply = (payload, error) => {
      const out = { __iscratch: { id: req.id, ok: !error, payload: payload ?? null } };
      if (error) out.__iscratch.error = error;
      try { window.postMessage(out, '*'); } catch (e) { /* ignore */ }
    };
    try {
      Promise.resolve(handle(req.type, req.payload))
        .then((r) => reply(r))
        .catch((e) => reply(null, e && e.message ? e.message : String(e)));
    } catch (e) {
      reply(null, e && e.message ? e.message : String(e));
    }
  });

  // Broadcast "ready" once a VM is discovered
  function announce() {
    try { window.postMessage({ __iscratch: { type: 'vm-ready', payload: { hasVM: !!discover() } } }, '*'); } catch (e) { /* ignore */ }
  }

  let tries = 0;
  const iv = setInterval(() => {
    if (discover() || tries > 60) { clearInterval(iv); }
    tries++;
  }, 1000);
  setTimeout(announce, 800);
})();
