// InstanceScratch AI — MV3 background service worker
// Compile goboscript → SB3, call OpenAI-compatible AI (streaming), persist settings.
import { compileSource, validateSource } from './build/compiler.mjs';
import { generateAndRepair } from './src/lib/ai-pipeline.js';

const DEFAULT_SETTINGS = {
  base_url: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  api_key: '',
  max_rounds: 5,
  temperature: 0,
  max_tokens: 8192,
};

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ settings: DEFAULT_SETTINGS }, (r) => {
      resolve(Object.assign({}, DEFAULT_SETTINGS, r.settings || {}));
    });
  });
}

/**
 * Fetch available models from an OpenAI-compatible API.
 * @param {string} baseUrl - e.g. "https://api.deepseek.com/v1"
 * @param {string} apiKey - API key to authenticate with
 * @returns {Promise<string[]>} List of model IDs
 */
async function fetchAvailableModels(baseUrl, apiKey) {
  const base = (baseUrl || '').replace(/\/+$/, '');
  if (!base) throw new Error('Base URL 为空');
  const resp = await fetch(`${base}/models`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const json = await resp.json();
  const models = (json.data || []).map((m) => m.id).filter(Boolean);
  return models;
}

async function callModel(settings, messages, { maxTokens, temperature }) {
  const base = settings.base_url.replace(/\/+$/, '');
  const body = JSON.stringify({
    model: settings.model,
    messages,
    max_tokens: maxTokens ?? 8192,
    temperature: temperature ?? 0,
    stream: false,
  });
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`,
    },
    body,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`AI API ${resp.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  return {
    content: json.choices?.[0]?.message?.content || '',
    finish_reason: json.choices?.[0]?.finish_reason || null,
  };
}

// Streaming model call — returns a ReadableStream of text chunks.
// Non-streaming providers fall back to a single-chunk stream.
async function callModelStream(settings, messages, { maxTokens, temperature }) {
  const base = settings.base_url.replace(/\/+$/, '');
  const body = JSON.stringify({
    model: settings.model,
    messages,
    max_tokens: maxTokens ?? 8192,
    temperature: temperature ?? 0,
    stream: true,
  });

  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`,
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI API ${resp.status}: ${text.slice(0, 200)}`);
  }

  if (!resp.body) {
    // No streaming support — get full response, yield as a single chunk.
    const json = await resp.json();
    const full = json.choices?.[0]?.message?.content || '';
    return {
      async *[Symbol.asyncIterator]() { yield full; }
    };
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let buffer = '';

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE data lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                chunks.push(delta);
                yield delta;
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
        // Flush remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim();
            if (data !== '[DONE]') {
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) {
                  chunks.push(delta);
                  yield delta;
                }
              } catch (e) { /* skip */ }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  };
}

// Collect all streamed content into a single string.
async function collectStream(settings, messages, opts) {
  const stream = await callModelStream(settings, messages, opts);
  let full = '';
  for await (const chunk of stream) {
    full += chunk;
  }
  return full;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'compile') {
        const errors = validateSource(msg.source);
        if (errors.length > 0) { sendResponse({ ok: false, stage: 'validate', errors }); return; }
        const buffer = await compileSource(msg.source);
        sendResponse({ ok: true, buffer: Array.from(new Uint8Array(buffer)), stage: 'compile' });
      } else if (msg.type === 'validate') {
        const errors = validateSource(msg.source);
        sendResponse({ ok: errors.length === 0, errors });
      } else if (msg.type === 'aiChat' || msg.type === 'aiChatStream') {
        const settings = await getSettings();
        if (msg.settings) {
          settings.base_url = msg.settings.base_url || settings.base_url;
          settings.model = msg.settings.model || settings.model;
          settings.api_key = msg.settings.api_key || settings.api_key;
        }
        if (!settings.api_key) {
          sendResponse({ ok: false, error: '未配置 API Key，请在设置中填写' });
          return;
        }

        // Use the AI pipeline which handles multi-round self-repair.
        // For streaming, collect all chunks into the model call.
        const modelFn = (messages, opts) => collectStream(settings, messages, opts)
          .then(content => ({ content, finish_reason: 'stop' }));

        const res = await generateAndRepair(msg.prompt, settings, modelFn, msg.history, msg.currentBlocks);
        sendResponse(res);
      } else if (msg.type === 'getSettings') {
        const settings = await getSettings();
        const hasKey = !!settings.api_key;
        settings.api_key = settings.api_key ? '••••' + settings.api_key.slice(-4) : '';
        sendResponse({ settings, has_key: hasKey });
      } else if (msg.type === 'saveSettings') {
        const s = Object.assign({}, msg.settings || {});
        // Preserve existing model if new model is empty
        if (!s.model) {
          const cur = await getSettings();
          s.model = cur.model || '';
        }
        // Preserve existing API key if not provided or masked
        if (!s.api_key || (s.api_key || '').startsWith('••••')) {
          const cur = await getSettings();
          s.api_key = cur.api_key || '';
        }
        await chrome.storage.local.set({ settings: s });
        sendResponse({ ok: true });
      } else if (msg.type === 'fetchModels') {
        // Fetch available models from the API endpoint
        const curSettings = await getSettings();
        const baseUrl = msg.base_url || curSettings.base_url;
        const apiKey = msg.api_key || curSettings.api_key;
        if (!apiKey) {
          sendResponse({ ok: false, error: '未配置 API Key' });
          return;
        }
        try {
          const models = await fetchAvailableModels(baseUrl, apiKey);
          sendResponse({ ok: true, models });
        } catch (e) {
          sendResponse({ ok: false, error: e.message });
        }
      } else if (msg.type === 'getSpriteBlocks') {
        // Query what blocks currently exist on the sprite for AI context.
        // This will be handled by content script routing to MAIN world.
        const res = { ok: false, error: 'content script 未实现 getSpriteBlocks' };
        sendResponse(res);
      } else {
        sendResponse({ ok: false, error: 'unknown message type' });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true;
});

// ---- True streaming AI via long-lived Port connection ----
// The side panel opens a chrome.runtime.connect({name:'aiStream'}) and streams
// each AI delta chunk over the port, enabling progressive output display.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'aiStream') return;

  port.onMessage.addListener(async (msg) => {
    if (!msg || msg.type !== 'start') return;
    const settings = await getSettings();
    if (msg.settings) {
      settings.base_url = msg.settings.base_url || settings.base_url;
      settings.model = msg.settings.model || settings.model;
      settings.api_key = msg.settings.api_key || settings.api_key;
    }
    if (!settings.api_key) {
      try { port.postMessage({ type: 'done', ok: false, error: '未配置 API Key，请在设置中填写' }); } catch (e) {}
      return;
    }

    // Stream each chunk from the model to the port in real time.
    const modelFn = async (messages, opts) => {
      const stream = await callModelStream(settings, messages, opts);
      return stream; // returns an async iterator of text chunks
    };

    const onStream = (delta) => {
      try { port.postMessage({ type: 'delta', delta }); } catch (e) { /* port closed */ }
    };

    try {
      const res = await generateAndRepair(msg.prompt, settings, modelFn, msg.history, msg.currentBlocks, onStream);
      try { port.postMessage({ type: 'done', ok: res.ok, result: res }); } catch (e) {}
    } catch (e) {
      try { port.postMessage({ type: 'done', ok: false, error: e.message }); } catch (err) {}
    }
  });

  port.onDisconnect.addListener(() => { /* port closed by side panel */ });
});

console.log('[InstanceScratch] background worker loaded');

try {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
} catch (e) {
  console.warn('[InstanceScratch] sidePanel init failed', e);
}
