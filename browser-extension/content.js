// InstanceScratch content script (ISOLATED world).
// Bridge between the side panel (chrome.runtime messaging) and the page's
// MAIN-world bridge (window.postMessage). The isolated world cannot read
// MAIN-world objects directly, so all VM operations go through postMessage.
(function () {
  if (window.__instanceScratchContentLoaded) return;
  window.__instanceScratchContentLoaded = true;

  const BRIDGE = '__iscratch';

  // Inject the MAIN-world bridge script.
  function injectMainScript() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('injected-main.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- RPC to the MAIN-world bridge ----
  let seq = 0;
  const pending = new Map();

  window.addEventListener('message', (ev) => {
    const data = ev.data;
    if (!data || !data[BRIDGE]) return;
    const resp = data[BRIDGE];
    if (resp.ok === undefined && resp.type !== 'vm-ready') return;
    if (resp.type === 'vm-ready') {
      window.dispatchEvent(new CustomEvent('__iscratch-vm-ready', { detail: resp.payload }));
      return;
    }
    if (resp.id == null) return;
    const p = pending.get(resp.id);
    if (!p) return;
    pending.delete(resp.id);
    if (resp.ok) p.resolve(resp.payload);
    else p.reject(new Error(resp.error || 'bridge error'));
  });

  function rpc(type, payload, timeoutMs = 15000) {
    const id = 'req_' + (++seq) + '_' + Date.now().toString(36);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('MAIN-world bridge 未响应'));
      }, timeoutMs);
      pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try {
        window.postMessage({ [BRIDGE]: { id, type, payload } }, '*');
      } catch (e) {
        clearTimeout(timer);
        pending.delete(id);
        reject(e);
      }
    });
  }

  function waitForVM(timeoutMs = 10000) {
    return new Promise((resolve) => {
      rpc('ping', null, timeoutMs).then((r) => {
        resolve(r && r.hasVM ? r : null);
      }).catch(() => resolve(null));
    });
  }

  async function getSpriteName() {
    try {
      const r = await rpc('getSprite', null, 6000);
      return r && r.sprite ? r.sprite : null;
    } catch (e) {
      return null;
    }
  }

  async function getSpriteBlocks() {
    try {
      const r = await rpc('getSpriteBlocks', null, 6000);
      return r;
    } catch (e) {
      return { blocks: [], sprite: null };
    }
  }

  async function injectIntoCurrent(buffer, mode, removeOpcodes) {
    const payload = { buffer, mode: mode || 'append', removeOpcodes: removeOpcodes || [] };
    const injectorUrl = chrome.runtime.getURL('build/injector.mjs');
    payload.injectorUrl = injectorUrl;
    const r = await rpc('inject', payload, 30000);
    return r; // { injected, sprite }
  }

  // ---- message routing from side panel ----
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        if (msg.type === 'getSprite') {
          const sprite = await getSpriteName();
          sendResponse({ ok: true, sprite, hasVM: !!sprite });
        } else if (msg.type === 'getSpriteBlocks') {
          const res = await getSpriteBlocks();
          sendResponse({ ok: true, blocks: res.blocks || [], sprite: res.sprite });
        } else if (msg.type === 'inject') {
          const res = await injectIntoCurrent(msg.buffer, msg.mode, msg.removeOpcodes);
          sendResponse({ ok: true, injected: res.injected, sprite: res.sprite });
        } else if (msg.type === 'hasVM') {
          const vm = await waitForVM(5000);
          sendResponse({ ok: true, hasVM: !!vm });
        } else {
          sendResponse({ ok: false, error: 'unknown message type' });
        }
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  });

  // boot
  let bridgeInjected = false;
  function boot() {
    if (bridgeInjected) return;
    bridgeInjected = true;
    injectMainScript();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
