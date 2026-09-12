// InstanceScratch AI — Side Panel
// 对话管理：多会话历史，切换/删除/新建
// 简化模型配置：Base URL + Model + API Key (OpenAI兼容)
// 流式输出 + AI输出时禁止输入 + AI删改/替换积木模式
// 模型选择：输入 API Key 后自动获取可用模型列表，用户选择模型

/* ---------- Constants ---------- */
const THEME_KEY = 'uiTheme';
const CONV_KEY = 'conversations';
const ACTIVE_CONV_KEY = 'activeConvId';

/* ---------- State ---------- */
let currentTheme = 'light';
let conversations = [];        // [{id, title, messages: [{role, content, code?, time}]}]
let activeConvId = null;
let isBusy = false;
let availableModels = [];      // cached list of models from the API
let apiKeyConfirmed = false;   // whether the API key has been verified

/* ---------- Theme ---------- */
function applyTheme(mode) {
  currentTheme = mode;
  document.documentElement.dataset.theme = mode;
}

function toggleTheme() {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  chrome.storage.local.set({ [THEME_KEY]: next }, () => applyTheme(next));
}

function initTheme() {
  chrome.storage.local.get({ [THEME_KEY]: 'light' }, (r) => applyTheme(r[THEME_KEY] || 'light'));
}

/* ---------- Conversation Management ---------- */
function genId() { return 'conv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

async function loadConversations() {
  const r = await chrome.storage.local.get([CONV_KEY, ACTIVE_CONV_KEY]);
  conversations = r[CONV_KEY] || [];
  activeConvId = r[ACTIVE_CONV_KEY] || null;
  if (!activeConvId && conversations.length > 0) {
    activeConvId = conversations[conversations.length - 1].id;
    await chrome.storage.local.set({ [ACTIVE_CONV_KEY]: activeConvId });
  }
}

async function saveConversations() {
  await chrome.storage.local.set({ [CONV_KEY]: conversations });
  await chrome.storage.local.set({ [ACTIVE_CONV_KEY]: activeConvId });
}

function getActiveConv() {
  return conversations.find((c) => c.id === activeConvId) || null;
}

function createConversation() {
  const conv = { id: genId(), title: '新对话', messages: [], time: Date.now() };
  conversations.push(conv);
  activeConvId = conv.id;
  saveConversations();
  return conv;
}

function deleteConversation(id) {
  const idx = conversations.findIndex((c) => c.id === id);
  if (idx < 0) return;
  conversations.splice(idx, 1);
  if (activeConvId === id) {
    activeConvId = conversations.length > 0 ? conversations[conversations.length - 1].id : null;
  }
  saveConversations();
}

function setConversationTitle(id, title) {
  const conv = conversations.find((c) => c.id === id);
  if (conv) { conv.title = title; conv.time = Date.now(); saveConversations(); }
}

function addMessageToActiveConv(msg) {
  const conv = getActiveConv();
  if (!conv) return;
  conv.messages.push({ ...msg, time: Date.now() });
  saveConversations();
}

function updateLastBotMessage(content, extra) {
  const conv = getActiveConv();
  if (!conv || conv.messages.length === 0) return;
  const last = conv.messages[conv.messages.length - 1];
  if (last && last.role === 'bot') {
    last.content = content;
    if (extra) Object.assign(last, extra);
    saveConversations();
  }
}

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const chatBody = $('chat-body');
const promptEl = $('prompt');
const sendBtn = $('send-btn');
const statusEl = $('status');
const targetName = $('target-name');
const targetDot = $('target-dot');
const convListEl = $('conv-list');
const convSidebar = $('conv-sidebar');
const convTitleEl = $('conv-title');

/* ---------- Conversation UI ---------- */
function renderConvList() {
  if (!convListEl) return;
  convListEl.innerHTML = '';
  const sorted = [...conversations].sort((a, b) => (b.time || 0) - (a.time || 0));
  for (const conv of sorted) {
    const item = document.createElement('div');
    item.className = 'conv-item' + (conv.id === activeConvId ? ' active' : '');
    const title = conv.title || '未命名对话';
    const time = conv.time ? new Date(conv.time).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
    item.innerHTML = `
      <div class="conv-item-info">
        <div class="conv-item-title">${title.replace(/</g, '&lt;')}</div>
        <div class="conv-item-time">${time} · ${conv.messages.length} 条消息</div>
      </div>
      <button class="conv-del" title="删除对话">🗑</button>
    `;
    item.querySelector('.conv-item-info').addEventListener('click', () => {
      activeConvId = conv.id;
      saveConversations();
      renderConvList();
      renderChat();
      convSidebar.hidden = true;
    });
    item.querySelector('.conv-del').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('删除该对话？')) {
        deleteConversation(conv.id);
        renderConvList();
        renderChat();
      }
    });
    convListEl.appendChild(item);
  }
  if (sorted.length === 0) {
    convListEl.innerHTML = '<div class="conv-empty">暂无对话记录</div>';
  }
}

function renderChat() {
  chatBody.innerHTML = '';
  const conv = getActiveConv();
  if (convTitleEl) convTitleEl.textContent = conv ? conv.title : '新对话';

  if (!conv || conv.messages.length === 0) {
    // 无欢迎提示，直接空白区域
    return;
  }
  for (const msg of conv.messages) {
    addMsg(msg.content, msg.role === 'user' ? 'user' : (msg.role === 'error' ? 'error' : 'bot'), msg.code ? { code: msg.code } : null);
  }
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addMsg(text, cls, extra) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  if (cls === 'system') {
    el.textContent = text;
  } else {
    const p = document.createElement('div');
    p.className = 'msg-text';
    p.textContent = text;
    el.appendChild(p);
    if (extra && extra.code) {
      const pre = document.createElement('pre');
      pre.className = 'code';
      pre.textContent = extra.code;
      el.appendChild(pre);
    }
  }
  chatBody.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el;
}

function setStatus(t) {
  statusEl.innerHTML = t || '';
}

function setBusy(busy) {
  isBusy = busy;
  sendBtn.disabled = busy || !promptEl.value.trim();
  // AI输出时禁止输入内容
  promptEl.disabled = busy;
  promptEl.placeholder = busy ? 'AI 正在生成中，请稍候…' : '描述你想要的积木效果…（Enter 发送，Shift+Enter 换行）';
  if (busy) {
    setStatus('<span class="spinner">◌</span> 正在处理…');
  } else {
    setStatus('');
  }
}

/* ---------- Editor tab ---------- */
async function getActiveEditorTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  for (const t of tabs) {
    const url = t.url || '';
    if (/^https:\/\/turbowarp\.org\//.test(url) || /^https:\/\/codingclip\.com\//.test(url)) {
      return t;
    }
  }
  return null;
}

async function sendToTab(tabId, msg) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch (e) {
    return { ok: false, error: 'content script 未响应' };
  }
}

/* ---------- Target detection ---------- */
let lastTabId = null;

async function refreshTarget() {
  const tab = await getActiveEditorTab();
  if (!tab) {
    targetName.textContent = '未检测到编辑器';
    targetDot.classList.remove('online');
    return;
  }
  lastTabId = tab.id;
  const r = await sendToTab(tab.id, { type: 'getSprite' });
  if (r && r.ok) {
    targetName.textContent = r.sprite ? `当前角色：${r.sprite}` : '编辑器已连接';
    targetDot.classList.add('online');
  } else {
    targetName.textContent = '编辑器已连接';
    targetDot.classList.remove('online');
  }
}

/**
 * Get current sprite's top-level blocks summary for AI context.
 * @returns {Promise<Array<{opcode: string, id: string, fields: object}>>}
 */
async function getCurrentBlocksContext() {
  try {
    const tab = await getActiveEditorTab();
    if (!tab) return [];
    const r = await sendToTab(tab.id, { type: 'getSpriteBlocks' });
    if (r && r.ok && r.blocks) return r.blocks;
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Format blocks summary for the AI prompt.
 */
function formatBlocksForPrompt(blocks) {
  if (!blocks || blocks.length === 0) return '（当前角色暂无积木）';
  const lines = blocks.map((b) => {
    const f = b.fields && Object.keys(b.fields).length > 0
      ? ` fields={${Object.entries(b.fields).map(([k, v]) => `${k}:${v}`).join(', ')}}`
      : '';
    return `- ${b.opcode}${f}`;
  });
  return '当前角色的顶层积木：\n' + lines.join('\n');
}

/* ---------- Main flow: AI → compile → inject ---------- */
async function handlePrompt(prompt) {
  addMsg(prompt, 'user');
  addMessageToActiveConv({ role: 'user', content: prompt });

  const tab = await getActiveEditorTab();
  if (!tab) {
    const errMsg = '❌ 请先打开 turbowarp.org 或 codingclip.com 编辑器。';
    addMsg(errMsg, 'error');
    addMessageToActiveConv({ role: 'error', content: errMsg });
    return;
  }
  lastTabId = tab.id;
  setBusy(true);

  try {
    // Fetch current sprite blocks for AI context
    const currentBlocks = await getCurrentBlocksContext();
    const blocksContext = formatBlocksForPrompt(currentBlocks);

    // Pass conversation history as context
    const conv = getActiveConv();
    const history = conv && conv.messages ? conv.messages
      .filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.code ? m.content + '\n\n```goboscript\n' + m.code + '\n```' : m.content
      }))
      .slice(-10) : [];

    // ---- Streaming AI (true progressive output via long-lived Port) ----
    const streamEl = addMsg('', 'bot');
    const textEl = streamEl.querySelector('.msg-text');
    let liveBuffer = '';

    // Render raw AI text progressively. Code is extracted later for compile,
    // but we show the live stream text so the user sees output as it arrives.
    function renderStreamText() {
      // Filter markdown code fences for a cleaner live view; the final compiled
      // code is shown separately after generation completes.
      const pretty = liveBuffer
        .replace(/```(?:goboscript|gs|scratch)?/gi, '')
        .split('\n').filter((l) => !/^#\s*(?:DEL|REMOVE|删除|移除)\s*:?/i.test(l.trim())).join('\n');
      textEl.textContent = pretty || '…';
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    const port = chrome.runtime.connect({ name: 'aiStream' });
    const streamResult = await new Promise((resolve) => {
      // Guard against the port never answering (e.g. worker killed mid-call).
      const timeout = setTimeout(() => {
        try { port.disconnect(); } catch (e) {}
        resolve({ ok: false, error: 'AI 响应超时，请检查网络或 API Key' });
      }, 120000);
      port.onMessage.addListener((m) => {
        if (m.type === 'delta') {
          liveBuffer += m.delta;
          renderStreamText();
        } else if (m.type === 'done') {
          clearTimeout(timeout);
          resolve(m);
        }
      });
      port.postMessage({
        type: 'start',
        prompt,
        history,
        currentBlocks: blocksContext
      });
    });
    try { port.disconnect(); } catch (e) {}

    if (!streamResult.ok) {
      const errMsg = '❌ AI 生成失败：' + (streamResult.error || '未知错误');
      textEl.textContent = errMsg;
      streamEl.classList.add('error');
      addMessageToActiveConv({ role: 'error', content: errMsg });
      setBusy(false);
      return;
    }

    const aiCode = streamResult.result.code;
    const rounds = streamResult.result.rounds || 1;
    const isFallback = !!streamResult.result.fallback;
    // Parse removeOpcodes from the AI response
    const removeOpcodes = streamResult.result.removeOpcodes || [];

    // Update the streaming text with the final result
    textEl.textContent = `✅ AI 已生成代码（${rounds} 轮）`;
    const pre = document.createElement('pre');
    pre.className = 'code';
    pre.textContent = aiCode;
    streamEl.appendChild(pre);

    const botMsg = `✅ AI 已生成代码（${rounds} 轮）`;
    addMessageToActiveConv({ role: 'bot', content: botMsg, code: aiCode });
    if (isFallback) {
      setStatus('⚠ 使用标准库保底方案');
    }

    // ---- Compile ----
    setStatus('🔧 正在编译成积木…');
    const comp = await chrome.runtime.sendMessage({ type: 'compile', source: aiCode });
    if (!comp.ok) {
      const errs = (comp.errors || []).map((e) => `L${e.line}:${e.column} ${e.message}`).join('\n');
      const errMsg = '❌ 编译失败：\n' + errs;
      addMsg(errMsg, 'error');
      addMessageToActiveConv({ role: 'error', content: errMsg });
      if (aiCode) {
        const debugPre = document.createElement('pre');
        debugPre.className = 'code';
        debugPre.textContent = aiCode;
        chatBody.appendChild(debugPre);
      }
      setBusy(false);
      return;
    }

    // ---- Detect modification intent ----
    // Look for keywords suggesting the user wants to modify/replace existing code
    const lower = prompt.toLowerCase();
    let injectMode = 'append'; // default: append new blocks
    // Trigger replace mode when the user explicitly asks to rewrite/delete/replace
    // existing blocks. "重新写/重写/再写/推翻/推倒/重做" imply discarding the old
    // implementation entirely, so treat them as replacement too.
    const replaceRe = /\b(删除|替换|修改|清除|删掉|重建|重写|重新写|再写|推翻|推倒|重做|override|overwrite|replace|modify|delete|rewrite|redo)\b/;
    if (replaceRe.test(lower)) {
      injectMode = 'replace'; // replace existing blocks in the current sprite
    }

    // Determine removal opcodes:
    // - In replace mode, always remove previously AI-injected blocks (handled in injector).
    // - Also remove any opcodes the AI explicitly marked for removal.
    setStatus(`📦 正在${injectMode === 'replace' ? '替换' : '注入'}到当前角色…`);
    const injected = await sendToTab(tab.id, {
      type: 'inject',
      buffer: comp.buffer,
      mode: injectMode,
      removeOpcodes
    });
    if (injected && injected.ok) {
      if (injected.injected > 0) {
        const action = injectMode === 'replace' ? '替换' : '注入';
        const okMsg2 = `✅ 已${action} ${injected.injected} 个积木到角色「${injected.sprite}」`;
        addMsg(okMsg2, 'bot');
        addMessageToActiveConv({ role: 'bot', content: okMsg2 });
      } else {
        const wMsg = '⚠ 注入完成，但未检测到可注入的顶层积木。';
        addMsg(wMsg, 'error');
        addMessageToActiveConv({ role: 'error', content: wMsg });
      }
    } else {
      const errMsg2 = '❌ 注入失败：' + ((injected && injected.error) || '未知错误');
      addMsg(errMsg2, 'error');
      addMessageToActiveConv({ role: 'error', content: errMsg2 });
    }

    // Update conversation title
    const conv2 = getActiveConv();
    if (conv2 && (conv2.title === '新对话' || !conv2.title)) {
      const shortTitle = prompt.length > 20 ? prompt.slice(0, 20) + '…' : prompt;
      setConversationTitle(conv2.id, shortTitle);
      if (convTitleEl) convTitleEl.textContent = shortTitle;
    }
  } catch (e) {
    const errMsg3 = '❌ 流程异常：' + e.message;
    addMsg(errMsg3, 'error');
    addMessageToActiveConv({ role: 'error', content: errMsg3 });
  } finally {
    setBusy(false);
  }
}

/* ---------- Provider presets ---------- */
const PROVIDERS = {
  deepseek: { base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  kimi:     { base_url: 'https://api.moonshot.cn/v1', model: 'kimi-k3' },
  agnes:    { base_url: 'https://apihub.agnes-ai.com/v1', model: 'agnes-2.5-flash' },
  openai:   { base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  custom:   { base_url: '', model: '' },
};
const PROVIDER_NOTES = {
  deepseek: 'DeepSeek API',
  kimi: 'Moonshot Kimi API',
  agnes: 'Agnes API',
  openai: 'OpenAI API',
  custom: '自定义 OpenAI 兼容接口',
};

function guessProvider(baseUrl) {
  const b = baseUrl || '';
  if (b.includes('deepseek')) return 'deepseek';
  if (b.includes('moonshot')) return 'kimi';
  if (b.includes('agnes')) return 'agnes';
  if (b.includes('openai')) return 'openai';
  return 'custom';
}

/* ---------- Settings ---------- */
async function loadSettingsPanel() {
  const r = await chrome.runtime.sendMessage({ type: 'getSettings' });
  if (!r || !r.settings) return;
  const s = r.settings;
  $('base_url').value = s.base_url || '';
  const prov = guessProvider(s.base_url);
  $('provider').value = prov;
  $('provider-note').textContent = PROVIDER_NOTES[prov] || '';
  if (r.has_key) {
    $('api_key').placeholder = '已保存 key（••••），留空则沿用';
  }
  // Load saved model if available
  if (s.model) {
    populateModelSelect([s.model]);
    $('model-select').value = s.model;
    $('model-section').hidden = false;
    $('save-model').style.display = 'inline-block';
    $('save-settings').textContent = '更换 API Key';
    apiKeyConfirmed = true;
  }
  // Try to fetch models if we have a saved API key
  if (r.has_key) {
    fetchModels(s.base_url, null, false);
  }
}

/**
 * Fetch available models from the API's /models endpoint.
 * @param {string} baseUrl - The base URL for the API.
 * @param {string} apiKey - The API key to use.
 * @param {boolean} showLoading - Whether to show loading status.
 */
async function fetchModels(baseUrl, apiKey, showLoading = true) {
  try {
    if (showLoading) {
      $('settings-status').textContent = '⏳ 正在获取模型列表…';
    }
    const r = await chrome.runtime.sendMessage({ type: 'fetchModels', base_url: baseUrl, api_key: apiKey });
    if (!r.ok) {
      $('settings-status').textContent = '⚠ ' + (r.error || '获取模型失败');
      return;
    }
    const models = r.models || [];
    availableModels = models;
    if (models.length > 0) {
      populateModelSelect(models);
      $('model-section').hidden = false;
      $('save-model').style.display = 'inline-block';
      // Pre-select the saved model if it exists in the list
      const saved = await chrome.runtime.sendMessage({ type: 'getSettings' });
      if (saved && saved.settings && saved.settings.model) {
        if (models.includes(saved.settings.model)) {
          $('model-select').value = saved.settings.model;
        }
      }
      $('settings-status').textContent = `✅ 获取到 ${models.length} 个模型，请选择`;
    } else {
      $('settings-status').textContent = '⚠ 未获取到可用模型';
    }
  } catch (e) {
    $('settings-status').textContent = '⚠ 获取模型失败：' + e.message;
  }
}

/**
 * Populate the model select dropdown.
 */
function populateModelSelect(models) {
  const sel = $('model-select');
  if (!sel) return;
  sel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— 请选择模型 —';
  sel.appendChild(placeholder);
  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  }
  // Always add a custom option for manual entry
  const custom = document.createElement('option');
  custom.value = '__custom__';
  custom.textContent = '✏️ 手动输入模型…';
  sel.appendChild(custom);
}

async function saveSettings() {
  const settings = {
    provider: $('provider').value,
    base_url: $('base_url').value.trim(),
    model: '', // model will be set after user selects from fetched list
    api_key: $('api_key').value.trim(),
  };
  if (!settings.base_url) {
    $('settings-status').textContent = '❌ 请填写 Base URL';
    return;
  }
  if (!settings.api_key) {
    // Check if we already have a saved API key
    const r = await chrome.runtime.sendMessage({ type: 'getSettings' });
    if (!r || !r.has_key) {
      $('settings-status').textContent = '❌ 请填写 API Key';
      return;
    }
    settings.api_key = ''; // keep existing
  }
  const r = await chrome.runtime.sendMessage({ type: 'saveSettings', settings });
  const stEl = $('settings-status');
  if (r && r.ok) {
    stEl.textContent = '✅ API Key 已确认，正在获取模型…';
    // After saving API key, fetch available models
    await fetchModels(settings.base_url, settings.api_key || null, false);
    // Don't close the modal — let user select a model
    apiKeyConfirmed = true;
    $('save-settings').textContent = '更换 API Key';
  } else {
    stEl.textContent = '❌ 保存失败：' + ((r && r.error) || '未知错误');
  }
}

async function saveModelSelection() {
  const modelSel = $('model-select').value;
  let modelName = modelSel;
  if (modelSel === '__custom__') {
    modelName = $('model-custom').value.trim();
    if (!modelName) {
      $('settings-status').textContent = '❌ 请输入模型名称';
      return;
    }
  }
  if (!modelName) {
    $('settings-status').textContent = '❌ 请选择模型';
    return;
  }

  const settings = {
    base_url: $('base_url').value.trim(),
    model: modelName,
    api_key: '', // keep existing key
  };
  const r = await chrome.runtime.sendMessage({ type: 'saveSettings', settings });
  const stEl = $('settings-status');
  if (r && r.ok) {
    stEl.textContent = '✅ 已保存';
    setTimeout(() => { $('settings-overlay').hidden = true; }, 600);
    updateProviderStatus();
  } else {
    stEl.textContent = '❌ 保存失败：' + ((r && r.error) || '未知错误');
  }
}

function updateProviderStatus() {
  chrome.runtime.sendMessage({ type: 'getSettings' }).then((r) => {
    const s = r && r.settings;
    const hasKey = r && r.has_key;
    const dot = $('provider-dot');
    const name = $('provider-name');
    if (s && s.model) {
      name.textContent = s.model;
      dot.className = 'provider-dot' + (hasKey ? ' on' : ' off');
    } else {
      name.textContent = '未配置';
      dot.className = 'provider-dot off';
    }
  });
}

/* ---------- Event bindings ---------- */
function bind() {
  $('theme-toggle').addEventListener('click', toggleTheme);
  $('conv-toggle').addEventListener('click', () => {
    renderConvList();
    convSidebar.hidden = !convSidebar.hidden;
  });
  $('conv-close').addEventListener('click', () => { convSidebar.hidden = true; });
  $('new-chat').addEventListener('click', () => {
    createConversation();
    renderConvList();
    renderChat();
  });
  $('settings-btn').addEventListener('click', () => {
    loadSettingsPanel();
    $('settings-overlay').hidden = false;
  });
  $('settings-close').addEventListener('click', () => { $('settings-overlay').hidden = true; });

  // Provider select
  $('provider').addEventListener('change', () => {
    const p = PROVIDERS[$('provider').value];
    if (p && $('provider').value !== 'custom') {
      $('base_url').value = p.base_url;
    }
    $('provider-note').textContent = PROVIDER_NOTES[$('provider').value] || '';
  });

  $('save-settings').addEventListener('click', saveSettings);
  $('save-model').addEventListener('click', saveModelSelection);

  // Model select change
  $('model-select').addEventListener('change', () => {
    if ($('model-select').value === '__custom__') {
      $('model-custom').style.display = 'block';
    } else {
      $('model-custom').style.display = 'none';
    }
  });

  promptEl.addEventListener('input', () => {
    sendBtn.disabled = isBusy || promptEl.value.trim().length === 0;
  });
  promptEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });
  sendBtn.addEventListener('click', doSend);

  // Click outside to close sidebar/settings
  document.addEventListener('click', (e) => {
    if (convSidebar && !convSidebar.hidden && !convSidebar.contains(e.target) && !e.target.closest('#conv-toggle')) {
      convSidebar.hidden = true;
    }
  });
}

function doSend() {
  if (isBusy) return; // 禁止在AI输出时输入
  const prompt = promptEl.value.trim();
  if (!prompt) return;
  promptEl.value = '';
  sendBtn.disabled = true;
  handlePrompt(prompt);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  bind();

  await loadConversations();
  if (!activeConvId) {
    createConversation();
  }
  renderConvList();
  renderChat();
  updateProviderStatus();

  refreshTarget();
  setInterval(refreshTarget, 3000);
});
