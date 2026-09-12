import React, {useState, useRef, useEffect, useCallback} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

// ── Approach B: merge compiled blocks into the current project instead of
//    vm.loadProject() which replaces everything (wiping dango cat + backdrop).
//    We parse the .sb3 zip, extract block JSON, deserialize it, and inject
//    into the existing editing target — preserving all current sprites,
//    costumes, and backdrops. ──────────────────────────────────────────
const JSZip = require('@turbowarp/jszip');

// @deprecated M7: These imports reach into scratch-vm's internal module
//    paths (src/serialization/sb3, src/engine/variable) which are not part
//    of the public API and may break on version upgrades.
//    Short-term mitigation: pin scratch-vm version; long-term fix: ask
//    scratch-vm to expose these as public API or vendor the logic locally.
const {deserializeBlocks} = require('scratch-vm/src/serialization/sb3');
const Variable = require('scratch-vm/src/engine/variable');

import styles from './ai-chat.css';
import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';
import AIDiffViewer from './ai-diff-viewer.jsx';
import { highlightBlocks, focusBlock } from './block-highlighter.js';

// ===== Backend base URL =====
// In dev, webpack-dev-server proxies /api/* → localhost:8000 (path prefix stripped).
// In production, set BACKEND_URL to the real backend origin.
const BACKEND_URL = '/api';

// ===== BYOK (Bring Your Own Key) config =====
// User-provided AI provider credentials, persisted in localStorage.
// When all three fields are empty, /ai/chat omits them → backend falls
// back to mock mode.  Presets match the backend's known providers.
const BYOK_STORAGE_KEY = 'goboscript_ai_byok';
const BYOK_PRESETS = {
    deepseek: {name: 'DeepSeek', base_url: 'https://api.deepseek.com', model: 'deepseek-chat'},
    kimi: {name: 'Kimi', base_url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k'},
    zhipu: {name: '智谱', base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4'},
    agnes: {name: 'Agnes', base_url: 'https://apihub.agnes-ai.com/v1', model: 'agnes-2.5-flash'}
};

// ===== Test SB3 files (served by webpack from static/test-sb3/) =====
// Used by the "添加 SB3 到对话" dropdown so the user can quickly load
// one of the canned projects as conversation context.  The same flow
// also supports arbitrary local .sb3 files via the file picker.
const TEST_SB3_FILES = [
    {name: 'pyinterpreter.sb3', label: 'Python 解释器', url: '/test-sb3/pyinterpreter.sb3'},
    {name: 'zhiteng.sb3', label: '执灯之局', url: '/test-sb3/zhiteng.sb3'},
    {name: 'pixel-font.sb3', label: '像素字体引擎', url: '/test-sb3/pixel-font.sb3'}
];

// ===== M27: line-targeted SEARCH/REPLACE repair (aider-style) =====
// The first successful AI reply is kept as a working copy; later repair
// rounds ask the model for small SEARCH/REPLACE patches against that copy
// instead of regenerating the whole file (smaller outputs -> fewer
// truncations). Patches are wrapped in a single ```text fence so they
// ride through the existing fence-extraction pipeline.
// M28: the model used to receive ONLY the current prompt, so a follow-up
// such as "加个循环" had no idea what had been generated before and replied
// from scratch. Send the recent turns, trimmed, so multi-turn edits stay
// coherent without blowing up the prompt budget.
const HISTORY_TURNS = 4;
const HISTORY_ITEM_MAX_CHARS = 1200;

const buildConversationHistory = (msgs, currentText) => {
    const picked = [];
    let skippedCurrent = false;
    for (let i = msgs.length - 1; i >= 0 && picked.length < HISTORY_TURNS * 2; i--) {
        const m = msgs[i];
        if (!m || m.id === 0 || m.id === '0') continue; // welcome message
        // Status/error chatter is UI noise; it is not part of the conversation.
        if (m.kind === 'retry' || m.kind === 'error' || m.kind === 'context') continue;
        if (m.role !== 'user' && m.role !== 'assistant') continue;
        const content = String(m.content || '').trim();
        if (!content) continue;
        if (!skippedCurrent && m.role === 'user' && content === currentText) {
            skippedCurrent = true; // already sent as the trailing user turn
            continue;
        }
        picked.unshift({
            role: m.role,
            content: content.length > HISTORY_ITEM_MAX_CHARS ?
                `${content.slice(0, HISTORY_ITEM_MAX_CHARS)}\n…(已截断)` : content
        });
    }
    return picked;
};

const PATCH_SYSTEM_HINT =
    '你是 goboscript 补丁助手。只输出 SEARCH/REPLACE 补丁块，SEARCH 部分' +
    '必须与原文件逐字一致（含缩进）。不要解释，不要输出完整代码。';

const applySearchReplace = (code, patchText) => {
    if (!patchText || !code) return null;
    const blocks = [];
    const re = /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n={5,}\s*\n([\s\S]*?)\n>{5,}\s*REPLACE/g;
    let m;
    while ((m = re.exec(patchText)) !== null) {
        blocks.push({search: m[1], replace: m[2]});
    }
    if (blocks.length === 0) return null;
    let out = code;
    for (const b of blocks) {
        // Exact match first; fall back to per-line trimmed match.
        if (out.includes(b.search)) {
            // Functional form: b.replace may contain $-patterns that
            // String.prototype.replace would otherwise expand.
            out = out.replace(b.search, () => b.replace);
            continue;
        }
        const sLines = b.search.split('\n').map(l => l.trim());
        const oLines = out.split('\n');
        let hit = -1;
        for (let i = 0; i <= oLines.length - sLines.length; i++) {
            let ok = true;
            for (let j = 0; j < sLines.length; j++) {
                if (oLines[i + j].trim() !== sLines[j]) {ok = false; break;}
            }
            if (ok) {hit = i; break;}
        }
        if (hit < 0) return null; // unappliable -> caller falls back
        const rLines = b.replace.split('\n');
        oLines.splice(hit, sLines.length, ...rLines);
        out = oLines.join('\n');
    }
    return out;
};

const buildPatchPrompt = (code, errors) => {
    const errText = errors.map(e =>
        `L${e.line}:${e.column} ${e.message}`).join('\n');
    return [
        '以下 goboscript 代码校验失败：',
        '```goboscript',
        code,
        '```',
        '错误清单（行列号 + 信息）：',
        errText,
        '',
        '请只修复报错涉及的行。将全部补丁块包在一个 ```text 围栏中，格式严格如下：',
        '<<<<<<< SEARCH',
        '要被替换的原有若干行（与原文件逐字一致）',
        '=======',
        '替换后的新行',
        '>>>>>>> REPLACE',
        '除该围栏外不要输出任何其他内容，也不要重复整份代码。'
    ].join('\n');
};

// ===== F3.2: IndexedDB session persistence =====
// Each session is stored as a record {id, name, messages, createdAt, updatedAt}.
// The DB is opened lazily and reused via a module-level promise.
const DB_NAME = 'littlesc-ai-chat';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';

let _dbPromise = null;

function openDB () {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB not available'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
                db.createObjectStore(SESSIONS_STORE, {keyPath: 'id'});
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function dbGetAllSessions () {
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readonly');
            const req = tx.objectStore(SESSIONS_STORE).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (_) {
        return [];
    }
}

async function dbGetSession (id) {
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readonly');
            const req = tx.objectStore(SESSIONS_STORE).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (_) {
        return null;
    }
}

async function dbPutSession (session) {
    try {
        const db = await openDB();
        // M5: Preserve createdAt from existing record if not provided
        const existing = (session.createdAt === undefined)
            ? await dbGetSession(session.id)
            : null;
        const record = {...session};
        if (record.createdAt === undefined) {
            record.createdAt = existing?.createdAt ?? Date.now();
        }
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readwrite');
            tx.objectStore(SESSIONS_STORE).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('[IDB] persist failed:', e);
    }
}

async function dbDeleteSession (id) {
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readwrite');
            tx.objectStore(SESSIONS_STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('[IDB] delete failed:', e);
    }
}

// ===== F6.4: SB3 ZIP-bomb / path-traversal protection (frontend) =====
// Limits applied to every .sb3 before JSZip.unpacks the payload.
const SB3_MAX_TOTAL_UNCOMPRESSED = 50 * 1024 * 1024;   // 50 MB
const SB3_MAX_FILE_COUNT = 1000;
const SB3_MAX_PROJECT_JSON = 10 * 1024 * 1024;          // 10 MB

/**
 * Validate an .sb3 ArrayBuffer for ZIP-bomb and path-traversal attacks.
 * Returns the loaded JSZip instance on success so the caller can reuse
 * it without unpacking twice.  Throws an Error on any violation.
 */
async function validateSb3Safety (arrayBuffer) {
    // ── Pre-check: compressed payload size ──────────────────────────
    if (arrayBuffer.byteLength > SB3_MAX_TOTAL_UNCOMPRESSED) {
        throw new Error(
            `SB3 文件过大（${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB > 50MB 限制）`
        );
    }

    const zip = await JSZip.loadAsync(arrayBuffer);
    const fileNames = Object.keys(zip.files);

    // ── File count limit ────────────────────────────────────────────
    if (fileNames.length > SB3_MAX_FILE_COUNT) {
        throw new Error(
            `SB3 文件数过多（${fileNames.length} > ${SB3_MAX_FILE_COUNT} 限制）`
        );
    }

    // ── Per-file: path traversal + cumulative uncompressed size ─────
    let totalUncompressed = 0;
    let projectJsonSize = 0;

    for (const name of fileNames) {
        const entry = zip.files[name];
        // L2: Path traversal — check each PATH SEGMENT, not just substring.
        //     Old check `name.includes('..')` false-positive on legitimate
        //     names like "my..file.svg" or "costume..v2.png".
        //     Split on both / and \ and reject any segment equal to '..'.
        const segments = name.split(/[\\/]/);
        const hasTraversal = segments.some(seg => seg === '..');
        // Also reject absolute paths (leading / or drive letter)
        const isAbsolute = name.startsWith('/') || name.startsWith('\\') ||
            (name.length >= 2 && name[1] === ':');
        if (hasTraversal || isAbsolute) {
            throw new Error(`SB3 包含路径穿越的文件名：${name}`);
        }

        // JSZip stores uncompressedSize in _data when available
        const uncompressedSize = (entry._data && entry._data.uncompressedSize) || 0;
        totalUncompressed += uncompressedSize;
        if (totalUncompressed > SB3_MAX_TOTAL_UNCOMPRESSED) {
            throw new Error(
                `SB3 解压后总大小过大（${(totalUncompressed / 1024 / 1024).toFixed(1)}MB > 50MB 限制）`
            );
        }

        if (name === 'project.json') {
            projectJsonSize = uncompressedSize;
        }
    }

    // ── project.json must exist and be within size limit ────────────
    const projectJsonFile = zip.file('project.json');
    if (!projectJsonFile) {
        throw new Error('SB3 缺少 project.json');
    }

    // If the central-directory size was zero/unknown, load and check
    if (projectJsonSize === 0) {
        const projectJsonStr = await projectJsonFile.async('string');
        if (projectJsonStr.length > SB3_MAX_PROJECT_JSON) {
            throw new Error(
                `project.json 过大（${(projectJsonStr.length / 1024 / 1024).toFixed(1)}MB > 10MB 限制）`
            );
        }
    } else if (projectJsonSize > SB3_MAX_PROJECT_JSON) {
        throw new Error(
            `project.json 过大（${(projectJsonSize / 1024 / 1024).toFixed(1)}MB > 10MB 限制）`
        );
    }

    return zip;
}

function loadBYOKConfig () {
    if (typeof localStorage === 'undefined') {
        return {base_url: '', api_key: '', model: ''};
    }
    try {
        const raw = localStorage.getItem(BYOK_STORAGE_KEY);
        if (!raw) return {base_url: '', api_key: '', model: ''};
        const parsed = JSON.parse(raw);
        return {
            base_url: parsed.base_url || '',
            api_key: parsed.api_key || '',
            model: parsed.model || ''
        };
    } catch (_) {
        return {base_url: '', api_key: '', model: ''};
    }
}

function saveBYOKConfig (config) {
    if (typeof localStorage === 'undefined') return;
    try {
        // H4: Basic validation — reject empty strings and clearly malformed keys
        const trimmedKey = (config.api_key || '').trim();
        if (trimmedKey && trimmedKey.length < 8) {
            console.warn('[BYOK] API Key too short — not saving');
            return;
        }
        localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(config));
    } catch (_) {
        // localStorage may be unavailable (private mode, quota, etc.)
    }
}

function isBYOKEmpty (config) {
    return !config.base_url && !config.api_key && !config.model;
}

// M25: true when the current config does not correspond to any built-in
// preset (i.e. the user typed a 自定义 provider). Empty config matches none
// but callers gate on isBYOKEmpty first so the initial state highlights
// nothing rather than claiming "custom".
function matchesAnyPreset (config) {
    return Object.values(BYOK_PRESETS).some(preset =>
        preset.base_url === config.base_url &&
        preset.model === config.model
    );
}

// M25: ask the backend to probe a custom provider. Backend validates the
// base_url with the same SSRF rules as /ai/chat, then GETs {base}/models.
// Upstream failures come back as HTTP 200 {ok:false, error}; only malformed
// input produces 4xx, surfaced here as {ok:false} too.
async function probeByokConnection (config) {
    const res = await fetch(`${BACKEND_URL}/ai/probe`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            base_url: config.base_url || '',
            api_key: config.api_key || '',
            model: config.model || ''
        })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        return {
            ok: false,
            error: (data && (data.detail || data.error)) || `HTTP ${res.status}`
        };
    }
    return data;
}

// ===== Icons (inline SVG to avoid asset plumbing) =====
const ExportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ChatIcon = () => (
    <svg className={styles.aiChatHeaderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CollapseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 12 12)" />
    </svg>
);

const ExpandIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 12 12)" />
    </svg>
);

const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// F3.4: Stop icon (shown on the send button while AI/compile is in flight)
const StopIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="none" />
    </svg>
);

// Spinner icon (shown while AI/compile is in flight)
const SpinnerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.aiChatSpinner}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ===== M23: open-source (Feather-style, MIT) inline SVG icons —
// replaces emoji in UI chrome and message prefixes. =====
const I = ({children, size = '1em', ...rest}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" style={{verticalAlign: '-0.15em'}} {...rest}>
        {children}
    </svg>
);
const AlertTriangleIcon = () => (
    <I><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></I>
);
const ShieldAlertIcon = () => (
    <I><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></I>
);
const RefreshCwIcon = () => (
    <I><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></I>
);
const PaperclipIcon = () => (
    <I><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></I>
);
const XIcon = () => (
    <I><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></I>
);
const ChevronDownIcon = ({up}) => (
    <I><polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} /></I>
);
const MessageCircleIcon = () => (
    <I><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></I>
);
const WrenchIcon = () => (
    <I><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></I>
);
const PencilIcon = () => (
    <I><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></I>
);

// M21: right-click entry label per locale.
const ADD_TO_AI_LABELS = {
    'zh-cn': '\u6dfb\u52a0\u5230AI\u5bf9\u8bdd',
    'zh-tw': '\u52a0\u5165AI\u5c0d\u8a71',
    en: 'Add to AI Chat'
};

// M18: quick actions over attachments — add entries here to extend.
const QUICK_ACTIONS = [
    {
        id: 'explain',
        label: '解释代码',
        title: '让 AI 解释附件中的积木代码',
        Icon: MessageCircleIcon,
        prompt: '请逐段解释这些积木代码的作用。'
    },
    {
        id: 'fix',
        label: '修复Bug',
        title: '让 AI 修复问题；完成后用修正版替换画布上的积木',
        Icon: WrenchIcon,
        prompt: '请找出这些积木代码中的问题并修复，输出完整修正后的 goboscript。'
    }
];


// Gear icon (BYOK settings toggle)
const GearIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

// Close (X) icon for settings panel
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// Load SB3 icon (inbox / file import)
const LoadSb3Icon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 17 12 21 16 17" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.5 14.5 A2.5 2.5 0 0 0 23 12 V7 a2.5 2.5 0 0 0-2.5-2.5 h-5.5 L13 7 h-2 L11 4.5 H4.5 A2.5 2.5 0 0 0 2 7 v5 a2.5 2.5 0 0 0 2.5 2.5 h4" />
    </svg>
);

// Folder icon for local file picker option
const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

// File icon for individual SB3 entries
const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

// F3.2: Session icons (new, trash, chevron-down)
const NewSessionIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// (M23 note: ChevronDownIcon with an `up` prop is defined in the icon set
// above; this older single-direction copy was removed to avoid the clash.)

// F3.8: Blocks browser icon
const BlocksIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

// ===== Welcome message and placeholder =====
const WELCOME_MESSAGE = {
    id: 0,
    role: 'assistant',
    content: '你好！我是 GoboScript AI 助手。\n\n输入你想要的积木描述，我会生成 goboscript 代码，编译并注入到主画布。\n\n示例：\n• "绿旗点击后移动 10 步"\n• "按空格键说你好" '
};

// H5: Use a function that generates collision-resistant IDs so page
//     reloads don't clash with IDs already stored in IndexedDB.
//     crypto.randomUUID() is available in modern browsers; fall back to
//     Date.now() + random suffix for older environments.
function generateMessageId () {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ===== Block category metadata (for F3.8 blocks browser) =====
const BLOCK_CATEGORIES = [
    {id: 'Motion', label: 'Motion', color: '#4C97FF'},
    {id: 'Looks', label: 'Looks', color: '#9966FF'},
    {id: 'Sound', label: 'Sound', color: '#CF63CF'},
    {id: 'Events', label: 'Events', color: '#FFBF00'},
    {id: 'Control', label: 'Control', color: '#FFAB19'},
    {id: 'Sensing', label: 'Sensing', color: '#5CB1D6'},
    {id: 'Operators', label: 'Operators', color: '#59C059'},
    {id: 'Data', label: 'Data', color: '#FF8D1B'},
    {id: 'Pen', label: 'Pen', color: '#0FBD8B'},
    {id: 'Music', label: 'Music', color: '#0FBD8B'}
];

// ===== End-to-end pipeline helpers =====

/**
 * Step 1: POST /ai/chat → {goboscript, explanation}
 *
 * F3.4: Accepts an AbortSignal so the user can interrupt the request.
 * F4.6: Accepts a full messages array (not just user text) so the
 *       self-repair loop can feed back error context to the AI.
 *
 * BYOK: if `byokConfig` is provided and at least one field is non-empty,
 * base_url/api_key/model are added to the request body so the backend
 * calls the user's chosen provider.  When all three are empty, the
 * fields are omitted entirely and the backend falls back to mock mode.
 */
async function callAIChat (messages, projectContext, byokConfig, signal) {
    const body = {messages};
    if (projectContext) {
        body.project_context = projectContext;
    }
    if (byokConfig && !isBYOKEmpty(byokConfig)) {
        body.base_url = byokConfig.base_url || '';
        body.api_key = byokConfig.api_key || '';
        body.model = byokConfig.model || '';
    }
    const res = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        signal
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`/ai/chat 返回 ${res.status}：${detail || res.statusText}`);
    }
    return res.json();
}

/**
 * Step 2: POST /compile → .sb3 ArrayBuffer + block count (from X-Block-Count header)
 *
 * F3.4: Accepts an AbortSignal.
 */
async function compileGoboscript (source, signal) {
    const res = await fetch(`${BACKEND_URL}/compile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source}),
        signal
    });
    if (!res.ok) {
        // L1: Read text first, THEN try JSON.parse — the old order
        //     (res.json() → res.text()) consumed the body so the
        //     fallback text() returned ''.
        let detail = '';
        try {
            const text = await res.text();
            try {
                detail = JSON.stringify(JSON.parse(text));
            } catch (_) {
                detail = text;
            }
        } catch (_) {
            detail = '';
        }
        throw new Error(`/compile 返回 ${res.status}：${detail || res.statusText}`);
    }
    // L5: parseInt('abc') → NaN — guard with Number.isFinite
    const rawCount = parseInt(res.headers.get('X-Block-Count') || '0', 10);
    const blockCount = Number.isFinite(rawCount) ? rawCount : 0;
    const buffer = await res.arrayBuffer();
    return {buffer, blockCount};
}

/**
 * Step 2b: POST /validate → {success, errors[]}
 *
 * F4.6: Used by the self-repair loop to check generated code before
 *       sending it to /compile.  Returns an array of error objects
 *       with {line, column, message} fields.
 * F3.4: Accepts an AbortSignal.
 */
async function validateGoboscript (source, signal) {
    const res = await fetch(`${BACKEND_URL}/validate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source}),
        signal
    });
    // M4: Don't swallow non-2xx responses — throw so the caller can
    //     surface the error to the user instead of silently returning [].
    if (!res.ok) {
        let errText;
        try {
            errText = await res.text();
        } catch (_) {
            errText = '';
        }
        throw new Error(`validate 接口返回 ${res.status}: ${errText || res.statusText}`);
    }
    const data = await res.json();
    return data.errors || [];
}

/**
 * Format validation errors into a human-readable string for the chat.
 */
function formatValidateErrors (errors) {
    return errors.map(e => `L${e.line}:${e.column} ${e.message}`).join('\n');
}

/**
 * Step 3: Merge compiled blocks into the current project.
 *
 * Instead of vm.loadProject() — which replaces ALL targets (wiping the
 * dango cat costume and default backdrop) — we parse the .sb3 zip,
 * extract the block JSON from the first sprite target, deserialize it,
 * and inject into the VM's current editing target.
 *
 * This preserves:
 *   • The dango cat (团子猫) costume and its rotation center
 *   • The default TurboWarp backdrop (cd21514d…)
 *   • Any other sprites / costumes the user has added
 *
 * Only the blocks (and any newly-declared variables/lists) are replaced.
 *
 * F3.4: Accepts an AbortSignal — checked at each async boundary.
 * F6.2: Snapshots target.blocks before mutation; on any exception the
 *       snapshot is restored so the workspace is never left in a
 *       half-loaded state.
 * F6.4: Validates the .sb3 for ZIP-bomb / path-traversal before
 *       unpacking.
 *
 * @deprecated M6: This function directly mutates scratch-vm internal
 *   properties (target.blocks._blocks, target.blocks._scripts,
 *   target.variables, etc.) which are not part of the public API.
 *   Short-term mitigation: pin scratch-vm version and snapshot/restore
 *   on failure (already implemented via F6.2).
 *   Long-term fix: contribute an upstream PR to scratch-vm exposing
 *   a public "mergeBlocks(target, blocksJSON)" API.
 */
async function injectSb3 (vm, arrayBuffer, signal, mode = 'append') {
    // F3.4: abort check at entry
    if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    // F6.4: Safety validation (returns the loaded zip on success)
    const zip = await validateSb3Safety(arrayBuffer);

    if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const projectJson = JSON.parse(await zip.file('project.json').async('string'));

    if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    // 2. Find the first non-stage target that has blocks
    const spriteTarget = projectJson.targets.find(t =>
        !t.isStage && t.blocks && Object.keys(t.blocks).length > 0
    );
    if (!spriteTarget) {
        return 0; // No blocks to inject — nothing to do
    }

    // 3. Deep-copy + deserialize the blocks (expands shadow primitives,
    //    adds block.id, processes inputs/fields into runtime format)
    const newBlocks = JSON.parse(JSON.stringify(spriteTarget.blocks));
    deserializeBlocks(newBlocks);

    // 4. Ensure top-level blocks have x/y coordinates for Blockly workspace
    let scriptIdx = 0;
    for (const id of Object.keys(newBlocks)) {
        const b = newBlocks[id];
        if (b.topLevel) {
            if (b.x === undefined || b.x === null) b.x = 50 + scriptIdx * 40;
            if (b.y === undefined || b.y === null) b.y = 50;
            scriptIdx++;
        }
    }

    // 5. Get the VM's editing target (or fall back to first sprite)
    let target = vm.editingTarget;
    if (!target || target.isStage) {
        target = vm.runtime.targets.find(t => !t.isStage);
    }
    if (!target) {
        throw new Error('No sprite target available for block injection');
    }
    const priorEditingTargetId = vm.editingTarget ? vm.editingTarget.id : null;

    // M27-F: projects containing NATIVE procedures (自定义积木) bypass the
    // incremental block merge — Blockly runtime rendering of hand-merged
    // procedures_definition/prototype mutations is fragile (isConnected-null
    // crash mid workspace-update). Instead: snapshot the CURRENT project via
    // vm.saveProjectSb3() (assets intact), splice the compiled sprite blocks
    // + variables into its project.json at the sb3 level, and reload whole.
    const hasProcBlocks = Object.values(spriteTarget.blocks).some(b =>
        b && typeof b === 'object' && !Array.isArray(b) &&
        /^procedures_(definition|prototype|call)$/.test(b.opcode || ''));
    if (hasProcBlocks) {
        const baseBuf = await vm.saveProjectSb3();
        const baseZip = await JSZip.loadAsync(baseBuf);
        const cur = JSON.parse(await baseZip.file('project.json').async('string'));
        let tgt = cur.targets.find(t => !t.isStage && t.name === target.getName());
        if (!tgt) tgt = cur.targets.find(t => !t.isStage);
        if (!tgt) throw new Error('No sprite target available for block injection');
        const raw = JSON.parse(JSON.stringify(spriteTarget.blocks));
        const existIds = new Set(Object.keys(tgt.blocks));
        const idm = {}; let seq2 = 0;
        for (const bid of Object.keys(raw)) {
            let nid2;
            do { nid2 = 'gsinj_' + Date.now().toString(36) + '_' + (seq2++); } while (existIds.has(nid2));
            existIds.add(nid2); idm[bid] = nid2;
        }
        const outBlocks = {};
        for (const [bid, blk] of Object.entries(raw)) {
            const nb2 = JSON.parse(JSON.stringify(blk));
            nb2.id = idm[bid];
            if (nb2.next && idm[nb2.next]) nb2.next = idm[nb2.next];
            if (nb2.parent && idm[nb2.parent]) nb2.parent = idm[nb2.parent];
            if (nb2.topLevel) { if (nb2.x == null) nb2.x = 60; if (nb2.y == null) nb2.y = 60; }
            outBlocks[idm[bid]] = nb2;
        }
        for (const nb2 of Object.values(outBlocks)) {
            if (!nb2.inputs) continue;
            for (const k of Object.keys(nb2.inputs)) {
                const arr = nb2.inputs[k];
                if (Array.isArray(arr)) {
                    nb2.inputs[k] = arr.map(el => (typeof el === 'string' && idm[el]) ? idm[el] : el);
                }
            }
        }
        // Merge variables/lists by NAME into the sprite scope (sb3 arrays).
        // Separate maps for VARIABLE and LIST because SB3 uses distinct
        // namespaces for them. Mixing them (lists stored in `variables`)
        // makes scratch-blocks throw "Serialized variable type ... does not
        // match variable field" and the whole procedures_definition stack
        // fails to render — leaving ONLY the call blocks on canvas while
        // their 定义 disappears (自制积木只有调用、没有定义).
        const varIdMap = {};
        const listIdMap = {};
        const ensureRawVar = (entry) => {
            const [vid, vd] = entry;
            const vname = Array.isArray(vd) ? vd[0] : (vd && vd.name);
            for (const [exId, exV] of Object.entries(tgt.variables || {})) {
                const exName = Array.isArray(exV) ? exV[0] : (exV && exV.name);
                if (exName === vname) { varIdMap[vid] = exId; return; }
            }
            tgt.variables = tgt.variables || {};
            tgt.variables[vid] = vd;
        };
        const ensureRawList = (entry) => {
            const [lid, ld] = entry;
            const lname = Array.isArray(ld) ? ld[0] : (ld && ld.name);
            for (const [exId, exL] of Object.entries(tgt.lists || {})) {
                const exName = Array.isArray(exL) ? exL[0] : (exL && exL.name);
                if (exName === lname) { listIdMap[lid] = exId; return; }
            }
            tgt.lists = tgt.lists || {};
            tgt.lists[lid] = ld;
            // Clean up stale scalar variables that share the L:-prefixed id
            // left behind by older buggy injections (lists wrongly stored
            // in the variables namespace → variable type mismatch).
            if (tgt.variables && tgt.variables[lid] !== undefined) {
                delete tgt.variables[lid];
            }
        };
        for (const entry of Object.entries(spriteTarget.variables || {})) ensureRawVar(entry);
        for (const entry of Object.entries(spriteTarget.lists || {})) ensureRawList(entry);
        // Merge broadcasts by NAME (SB3 broadcasts are a flat id→name map).
        const broadcastIdMap = {};
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
        // Fix: in raw SB3 the field value is [name, id] array (NOT an object
        // with .id). Old code checked `fld.id` on an array → never true →
        // field IDs were NEVER rewritten → blocks referenced variable/list
        // ids that didn't exist in the reloaded project → scratch-blocks
        // threw "Serialized variable type ... does not match variable field"
        // and entire procedures_definition stacks failed to render (只看到
        // 调用积木、定义积木消失). Handle both raw array and hydrated forms.
        for (const nb2 of Object.values(outBlocks)) {
            if (!nb2.fields) continue;
            for (const fk of ['VARIABLE', 'LIST', 'BROADCAST_OPTION']) {
                const fld = nb2.fields[fk];
                if (!fld) continue;
                const idMap = fk === 'LIST' ? listIdMap :
                    (fk === 'BROADCAST_OPTION' ? broadcastIdMap : varIdMap);
                if (Array.isArray(fld)) {
                    // Raw SB3: [name, id]
                    if (idMap[fld[1]]) {
                        nb2.fields[fk] = [fld[0], idMap[fld[1]]];
                    }
                } else if (fld && fld.id) {
                    // Hydrated: {name, id, variableType}
                    if (idMap[fld.id]) {
                        nb2.fields[fk] = [fld[0], idMap[fld.id]];
                    }
                }
            }
        }
        tgt.blocks = Object.assign({}, tgt.blocks, outBlocks);
        baseZip.file('project.json', JSON.stringify(cur));
        const mergedBuf = await baseZip.generateAsync({ type: 'arraybuffer' });
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
        try {
            await vm.loadProject(mergedBuf);
        } catch (loadErr) {
            throw new Error('注入失败（自定义积木整体重载路径）：' +
                ((loadErr && loadErr.message) || loadErr));
        }
        let nTop = 0;
        let topBlockId = null;
        for (const [bid, blk] of Object.entries(spriteTarget.blocks)) {
            if (blk && typeof blk === 'object' && !Array.isArray(blk) && blk.topLevel) {
                nTop++;
                if (!topBlockId) topBlockId = idm[bid] || bid;
            }
        }
        return {
            count: nTop,
            blockIds: Object.keys(outBlocks),
            topBlockId
        };
    }

    // F6.2/M8: snapshot BEFORE any mutation. Merge semantics mean we only
    // ever ADD keys; rollback deletes what we added and restores scripts.
    const snapshotBlocks = JSON.parse(JSON.stringify(target.blocks._blocks));
    const snapshotScripts = [...target.blocks._scripts];
    const snapshotVarIds = new Set(Object.keys(target.variables));
    const stageTargetForSnapshot = vm.runtime.getTargetForStage();
    const snapshotStageVarIds = stageTargetForSnapshot
        ? new Set(Object.keys(stageTargetForSnapshot.variables))
        : new Set();

    try {
        // M8: MERGE-PRESERVING injection. Never clear the canvas.
        //
        // Design notes (see also M12 audit below):
        //   • Every injected block gets a fresh gsinj_* id; ALL references
        //     (next/parent/topLevel and inputs in BOTH hydrated
        //     {shadow,block} and legacy-array forms) are remapped.
        //   • Variables/lists/broadcasts may live on the STAGE side of the
        //     compiled sb3 while we inject into a sprite → they are merged
        //     by NAME onto the right scope and all field references are
        //     rewritten, so Blockly never meets an unknown variable id
        //     (that used to throw mid XML-load and leave an empty canvas).
        const existingIds = new Set(Object.keys(target.blocks._blocks));
        let seq = 0;
        const freshId = () => {
            let cand;
            do {
                cand = 'gsinj_' + Date.now().toString(36) + '_' + (seq++);
            } while (existingIds.has(cand));
            existingIds.add(cand);
            return cand;
        };

        const idMap = {};
        const mapped = {};
        for (const [bid, blk] of Object.entries(newBlocks)) {
            const nid = freshId();
            idMap[bid] = nid;
            mapped[nid] = Object.assign({}, blk, {id: nid});
        }
        for (const nb of Object.values(mapped)) {
            if (nb.next && idMap[nb.next]) nb.next = idMap[nb.next];
            else if (nb.next && !idMap[nb.next]) nb.next = null;
            if (nb.parent && idMap[nb.parent]) nb.parent = idMap[nb.parent];
            if (nb.inputs) {
                for (const key of Object.keys(nb.inputs)) {
                    const v = nb.inputs[key];
                    if (Array.isArray(v)) {
                        // sb3 serialized primitive form
                        nb.inputs[key] = v.map(el =>
                            (typeof el === 'string' && idMap[el])
                                ? idMap[el] : el);
                    } else if (v && typeof v === 'object') {
                        // M12: deserializeBlocks() converts inputs to the
                        // hydrated runtime form {shadow, block} — remap
                        // those too, else menu shadows keep stale ids and
                        // toXML renders literal "undefined" (empty menus).
                        if (v.shadow && idMap[v.shadow]) {
                            v.shadow = idMap[v.shadow];
                        }
                        if (v.block && idMap[v.block]) {
                            v.block = idMap[v.block];
                        }
                    }
                }
            }
        }

        // 9+10 (M8): merge variables / lists / broadcasts from BOTH the
        // sprite and the stage side of the compiled project, matching by
        // NAME first so existing user variables are reused instead of
        // duplicated. Any renamed-id reference is rewritten below.
        const varRemap = {};
        // M28: id -> the variable type we are about to own in the workspace.
        const mergedVarTypes = new Map();
        const ensureVar = (scopeTarget, id, name, type, value) => {
            for (const [exId, exVar] of Object.entries(scopeTarget.variables)) {
                if (exVar.name === name && exVar.type === type) return exId;
            }
            if (!scopeTarget.variables[id]) {
                const nv = new Variable(id, name, type, false);
                nv.value = value;
                scopeTarget.variables[id] = nv;
                return null; // caller keeps original id
            }
            // Review-B#3: id taken by a DIFFERENT variable — allocate a
            // fresh unique id instead of silently binding this name to
            // whatever already owns that id.
            const fresh = freshId();
            const nv = new Variable(fresh, name, type, false);
            nv.value = value;
            scopeTarget.variables[fresh] = nv;
            return fresh;
        };
        const collectVars = src => {
            if (!src) return [];
            const out = [];
            for (const [vid, vd] of Object.entries(src.variables || {})) out.push([vid, vd]);
            for (const [lid, ld] of Object.entries(src.lists || {})) out.push([lid, ld]);
            for (const [bid2, bname] of Object.entries(src.broadcasts || {})) out.push([bid2, bname, true]);
            return out;
        };
        const compiledSpriteSrc = {
            variables: spriteTarget.variables,
            lists: spriteTarget.lists,
            broadcasts: spriteTarget.broadcasts
        };
        const compiledStage = projectJson.targets.find(t => t.isStage);
        const compiledStageSrc = compiledStage ? {
            variables: compiledStage.variables,
            lists: compiledStage.lists,
            broadcasts: compiledStage.broadcasts
        } : null;
        const varSources = [
            ['stage', stageTargetForSnapshot, collectVars(compiledStageSrc)],
            ['sprite', target, collectVars(compiledSpriteSrc)]
        ];
        for (const [, scopeTarget, entries] of varSources) {
            for (const entry of entries) {
                const [vid, vd, isBroadcast] = entry;
                let name; let type; let value;
                if (isBroadcast) {
                    name = typeof vd === 'string' ? vd : ((vd && vd.name) || vid);
                    type = Variable.BROADCAST_MESSAGE_TYPE;
                    value = name;
                } else if (Array.isArray(vd)) {
                    name = vd[0];
                    const isArray = Array.isArray(vd[1]);
                    type = isArray ? Variable.LIST_TYPE : Variable.SCALAR_TYPE;
                    value = isArray ? (vd[1] == null ? [] : vd[1])
                        : (vd[1] == null ? 0 : vd[1]);
                } else {
                    name = vd.name || vid;
                    type = vd.type === Variable.LIST_TYPE
                        ? Variable.LIST_TYPE : Variable.SCALAR_TYPE;
                    value = vd.value == null
                        ? (type === Variable.LIST_TYPE ? [] : 0) : vd.value;
                }
                const reused = ensureVar(scopeTarget, vid, name, type, value);
                if (reused) varRemap[vid] = reused;
                mergedVarTypes.set(reused || vid, type);
            }
        }

        // Rewrite VARIABLE / LIST / BROADCAST_OPTION field references so
        // they point at the merged (possibly reused) ids.
        for (const nb of Object.values(mapped)) {
            if (!nb.fields) continue;
            for (const fk of Object.keys(nb.fields)) {
                if (fk !== 'VARIABLE' && fk !== 'LIST' && fk !== 'BROADCAST_OPTION') continue;
                const f = nb.fields[fk];
                if (f && typeof f === 'object' && f.id) {
                    const next = Object.assign({}, f);
                    if (varRemap[f.id]) next.id = varRemap[f.id];
                    // M28: scratch-blocks reads the field's `variabletype` back
                    // out of the serialized XML and throws when it disagrees
                    // with the variable's own type. Injected blocks carry no
                    // variableType, so it defaults to '' and collides with
                    // list-typed ids (e.g. the hidden `__arr_N` lists behind
                    // anonymous array literals) — that surfaced as
                    // "Workspace Update Error" and left the injected stack
                    // rendered as broken blocks.
                    // In Scratch a VARIABLE field always points at a scalar
                    // and a LIST field always at a list, so derive it from the
                    // field name rather than trusting whatever came in the
                    // payload (an empty-string variableType is what triggered
                    // the L:__arr_N collision in the first place).
                    next.variableType = fk === 'LIST' ? Variable.LIST_TYPE :
                        (fk === 'BROADCAST_OPTION' ?
                            Variable.BROADCAST_MESSAGE_TYPE : Variable.SCALAR_TYPE);
                    nb.fields[fk] = next;
                }
            }
        }

        // 6+7. Append remapped blocks — existing ones stay untouched.
        // M14/B#5: last abort checkpoint BEFORE mutating live state.
        if (signal && signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }
        Object.assign(target.blocks._blocks, mapped);

        // 8. Append top-level script ids. M15: place them around the
        //    VIEWPORT CENTRE of the visible canvas instead of the
        //    compiler's hardcoded (60, 60).
        //    Coordinate math (derived from scratch-blocks sources):
        //    screen = divLeft + scroll*s + absolute*s + ws*s
        //    ⇒ ws = (screen − divLeft − scroll − absolute) / s
        //    (scrollX/scrollY must be INSIDE the division; viewLeft is
        //    −scrollX and viewWidth does NOT exclude the flyout, which
        //    overlays the svg's left edge.)
        const placeAtCenter = () => {
            try {
                const SB = LazyScratchBlocks.get();
                const ws = SB && typeof SB.getMainWorkspace === 'function'
                    ? SB.getMainWorkspace()
                    : null;
                if (!ws) return null;
                const s = typeof ws.getScale === 'function'
                    ? ws.getScale()
                    : (ws.scale || 1);
                const mtr = ws.getMetrics ? ws.getMetrics() : null;
                const inj = document.querySelector('.injectionDiv');
                if (!mtr || !inj) return null;
                const r = inj.getBoundingClientRect();
                const scrollX = -mtr.viewLeft;
                const scrollY = -mtr.viewTop;
                const flyW = mtr.flyoutWidth || 0;
                const cScreenX = r.left + flyW +
                    (mtr.viewWidth - flyW) / 2;
                const cScreenY = r.top + Math.max(mtr.viewHeight * 0.38, 110);
                return {
                    x: Math.round(
                        (cScreenX - r.left - scrollX -
                            mtr.absoluteLeft) / s),
                    y: Math.round(
                        (cScreenY - r.top - scrollY -
                            mtr.absoluteTop) / s)
                };
            } catch (_) {
                return null;
            }
        };
        const originXY = placeAtCenter();
        const appendedTop = Object.entries(mapped)
            .filter(([, b]) => b.topLevel)
            .map(([id2, b], idx) => {
                let px = b.x || 0;
                let py = b.y || 0;
                if (originXY) {
                    px = originXY.x + (idx % 3) * 70;
                    py = originXY.y + idx * 140;
                    b.x = px;
                    b.y = py;
                }
                return {id: id2, x: px, y: py};
            })
            .sort((a, b) => (a.y - b.y) || (a.x - b.x))
            .map(e => e.id);
        // M18: 'append' keeps old merge behaviour; 'replace' (修复Bug
        // quick action) swaps the canvas for the corrected program.
        // Variables are merged by NAME in both modes so user data
        // survives; audit + rollback below cover both paths.
        target.blocks._scripts = mode === 'replace'
            ? [...appendedTop]
            : [...snapshotScripts, ...appendedTop];
        if (mode === 'replace') {
            target.blocks._blocks = mapped;
        }

        // M12 (user demand: "注入的时候到底有没有做检查"): full
        // reference-integrity audit of the merged workspace BEFORE any UI
        // commit. Every next/parent/input block reference must resolve;
        // otherwise roll back the whole injection and report honestly.
        const auditBad = [];
        {
            const B = target.blocks._blocks;
            for (const [bid, blk] of Object.entries(B)) {
                if (!blk || typeof blk !== 'object' ||
                    Array.isArray(blk)) continue;
                const refs = [];
                if (blk.next) refs.push(blk.next);
                if (blk.parent) refs.push(blk.parent);
                if (blk.inputs) {
                    for (const v of Object.values(blk.inputs)) {
                        if (Array.isArray(v)) {
                            const code = v[0];
                            // codes 1|2|3: remaining strings are block ids;
                            // other codes carry names/values, not block refs
                            if (code === 1 || code === 2 || code === 3) {
                                for (let i = 1; i < v.length; i++) {
                                    if (typeof v[i] === 'string') {
                                        refs.push(v[i]);
                                    }
                                }
                            }
                        } else if (v && typeof v === 'object') {
                            if (v.shadow) refs.push(v.shadow);
                            if (v.block) refs.push(v.block);
                        }
                    }
                }
                for (const rid of refs) {
                    const rb = B[rid];
                    if (!rb || typeof rb !== 'object' || Array.isArray(rb)) {
                        auditBad.push(bid + '→' + rid);
                    }
                }
            }
        }
        if (auditBad.length > 0) {
            throw new Error('注入的积木引用完整性校验未通过（' +
                auditBad.length + ' 处悬空引用，如 ' +
                auditBad.slice(0, 3).join(', ') +
                '）。已回滚，主画布保持原状。');
        }

        // H1/H3 (M8): switch the editing target through the VM itself —
        // VM#setEditingTarget(id) emits BOTH targetsUpdate AND
        // workspaceUpdate, unlike Runtime#setEditingTarget.
        if (vm.editingTarget !== target) {
            vm.setEditingTarget(target.id);
        }
        if (!vm.editingTarget) {
            return appendedTop.length;
        }
        // 10b. Drop stale workspace variables that occupy an id we now own
        // with a DIFFERENT type. An earlier failed injection can leave
        // `L:__arr_N` behind as a scalar; scratch-blocks then throws
        // "Serialized variable type ... does not match" for every injected
        // block referencing it and the whole stack renders as broken blocks.
        if (ws) {
            for (const [vid, wantType] of mergedVarTypes) {
                const existing = ws.getVariableById(vid);
                if (existing && existing.type !== wantType) {
                    ws.deleteVariableById(vid);
                }
            }
        }

        // 11. Trigger UI update — render new blocks on Blockly workspace
        vm.emitWorkspaceUpdate();
        vm.runtime.emitProjectChanged();
        return {
            count: appendedTop.length,
            blockIds: Object.keys(mapped),
            topBlockId: appendedTop[0] || null
        };
    } catch (err) {
        // F6.2: Rollback — restore the snapshot so the workspace is
        // never left in a half-loaded state.
        target.blocks._blocks = snapshotBlocks;
        target.blocks._scripts = snapshotScripts;
        for (const varId of Object.keys(target.variables)) {
            if (!snapshotVarIds.has(varId)) {
                delete target.variables[varId];
            }
        }
        const stageForRollback = vm.runtime.getTargetForStage();
        if (stageForRollback) {
            for (const varId of Object.keys(stageForRollback.variables)) {
                if (!snapshotStageVarIds.has(varId)) {
                    delete stageForRollback.variables[varId];
                }
            }
        }
        // Review-B#3: undo any editing-target switch we performed.
        if (priorEditingTargetId &&
                (!vm.editingTarget ||
                 vm.editingTarget.id !== priorEditingTargetId)) {
            const prior = vm.runtime.targets.find(
                t => t.id === priorEditingTargetId);
            if (prior) vm.setEditingTarget(prior.id);
        }
        try {
            vm.emitWorkspaceUpdate();
            vm.runtime.emitProjectChanged();
        } catch (_) {
            // best-effort
        }
        throw err;
    }
}

// ===== Reverse sync helpers (F5.4) =====

/**
 * Count all real blocks across all vm targets.
 * Shadow-block references are stored as arrays; real blocks are objects.
 */
function countVmBlocks (vm) {
    if (!vm || !vm.runtime || !vm.runtime.targets) return 0;
    let count = 0;
    for (const target of vm.runtime.targets) {
        const blocks = target.blocks;
        if (blocks && typeof blocks._blocks === 'object') {
            for (const bid of Object.keys(blocks._blocks)) {
                const b = blocks._blocks[bid];
                if (b && typeof b === 'object' && !Array.isArray(b)) {
                    count++;
                }
            }
        }
    }
    return count;
}

/**
 * Reverse sync pipeline:
 *   1. vm.saveProjectSb3('arraybuffer') → .sb3 bytes
 *   2. POST /api/decompile (raw body) → {source, targets}
 *
 * F3.4: Accepts an AbortSignal.
 */
async function decompileProject (vm, signal) {
    const arrayBuffer = await vm.saveProjectSb3('arraybuffer');
    const res = await fetch(`${BACKEND_URL}/decompile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/octet-stream'},
        body: arrayBuffer,
        signal
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`/decompile 返回 ${res.status}：${detail || res.statusText}`);
    }
    return res.json();
}

/**
 * Decompile an arbitrary .sb3 file (NOT the current vm project) into
 * goboscript source, suitable for use as project_context.
 *
 * Used by the "添加 SB3 到对话" entry.  Accepts either a URL string
 * (for files served by webpack from static/test-sb3/) or a File object
 * (for files picked from the user's local filesystem).
 *
 * F3.4: Accepts an AbortSignal.
 * F6.4: The backend /decompile endpoint performs the same SB3 safety
 *       validation server-side before decompiling.
 *
 * Returns {source, targets, lineCount, blockCount, spriteCount, ...}
 * as produced by the backend's /decompile endpoint, plus a `fileName`
 * field added by the caller for display.
 */
async function decompileSb3External (sb3UrlOrFile, signal) {
    let arrayBuffer;
    let fileName;
    if (typeof sb3UrlOrFile === 'string') {
        // URL — fetch as ArrayBuffer
        const res = await fetch(sb3UrlOrFile, {signal});
        if (!res.ok) {
            throw new Error(`下载 SB3 失败：${res.status} ${res.statusText}`);
        }
        arrayBuffer = await res.arrayBuffer();
        // Pull filename from last path segment
        fileName = sb3UrlOrFile.split('/').pop();
    } else if (sb3UrlOrFile instanceof File) {
        arrayBuffer = await sb3UrlOrFile.arrayBuffer();
        fileName = sb3UrlOrFile.name;
    } else {
        throw new Error('decompileSb3External: 接受 URL 字符串或 File 对象');
    }

    const res = await fetch(`${BACKEND_URL}/decompile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/octet-stream'},
        body: arrayBuffer,
        signal
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`/decompile 返回 ${res.status}：${detail || res.statusText}`);
    }
    const result = await res.json();
    result.fileName = fileName;
    return result;
}

// ===== Sidebar width config =====
// Persisted to localStorage so the user's preferred width survives reloads.
const SIDEBAR_WIDTH_STORAGE_KEY = 'goboscript_ai_sidebar_width';
const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_MAX_WIDTH = 640;
const SIDEBAR_DEFAULT_WIDTH = 400;

function loadSidebarWidth () {
    if (typeof localStorage === 'undefined') return SIDEBAR_DEFAULT_WIDTH;
    try {
        const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        if (!raw) return SIDEBAR_DEFAULT_WIDTH;
        const w = parseInt(raw, 10);
        if (Number.isNaN(w)) return SIDEBAR_DEFAULT_WIDTH;
        return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, w));
    } catch (_) {
        return SIDEBAR_DEFAULT_WIDTH;
    }
}

function saveSidebarWidth (w) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(w));
    } catch (_) {
        // ignore
    }
}

// ===== AIChat component =====
const AIChat = ({vm, locale = 'zh-cn'}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const messagesRef = useRef(null);
    // M18: attachment-style block context. Right-click 添加到AI对话 no
    // longer dumps source into the input — it parks a collapsible,
    // deletable chip here; sending with attachments injects the context
    // as a system message instead of touching the user's typed text.
    const [attachments, setAttachments] = useState([]);
    const attachmentsRef = useRef([]);
    useEffect(() => {attachmentsRef.current = attachments;}, [attachments]);
    // M28: mirror of the rendered conversation. The send handler's closure
    // captures a stale `messages`, so read history through this ref instead —
    // that is what lets a follow-up ("加个循环") see what was generated before.
    const conversationRef = useRef([]);
    useEffect(() => {conversationRef.current = messages;}, [messages]);
    const [autoApply, setAutoApply] = useState(true);
    // 'append' (default) keeps old merge behaviour; quick-action 修复Bug
    // sets this to 'replace' for exactly one send.
    const injectModeRef = useRef('append');
    // M15/M17: restores Blockly.ContextMenu.show on unmount
    const origShowRef = useRef(null);
    const textareaRef = useRef(null);

    // ===== Resizable sidebar width =====
    // The sidebar width is controlled by inline style on the expanded
    // container.  A drag handle on the left edge lets the user resize
    // between SIDEBAR_MIN_WIDTH and SIDEBAR_MAX_WIDTH.  The width is
    // persisted to localStorage so it survives reloads.
    const [sidebarWidth, setSidebarWidth] = useState(() => loadSidebarWidth());
    const [isDragging, setIsDragging] = useState(false);
    const dragStateRef = useRef(null); // {startX, startWidth} during drag
    // L3: Track latest width in a ref so onMouseUp persists the ACTUAL
    //     final width instead of a stale closure value.
    const sidebarWidthRef = useRef(sidebarWidth);
    useEffect(() => {
        sidebarWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    // ===== F3.2: Session management state =====
    // sessions: list of {id, name, createdAt, updatedAt} (messages loaded
    //           on demand to avoid holding all sessions' messages in memory)
    // currentSessionId: active session ID
    // sessionDropdownOpen: controls the session selector dropdown
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);

    // ===== F3.4: AbortController refs =====
    // H2: Use SEPARATE refs for chat pipeline and SB3 loading to avoid
    //     AbortController races between the two async flows.
    //   chatAbortRef — for handleSend (AI → compile → inject pipeline)
    //   sb3AbortRef  — for loadSb3AsContext (external .sb3 decompile)
    // handleStop aborts whichever controller is active.
    const chatAbortControllerRef = useRef(null);
    const sb3AbortControllerRef = useRef(null);

    // Track whether any async operation is in flight (chat or sb3 loading)
    // so handleSend can block when SB3 loading is in progress.
    const sb3LoadingRef = useRef(false);

    // ===== F3.8: Blocks browser state =====
    // view: 'chat' | 'blocks' — toggles between chat and blocks browser
    // schema: cached result of GET /schema (keywords, blocks, examples, grammar_notes)
    // selectedBlock: the block currently shown in the detail panel
    const [view, setView] = useState('chat');
    const [schema, setSchema] = useState(null);
    // M2: Track schema fetch errors and retry count so the user can
    //     re-fetch the schema instead of being stuck on a spinner.
    const [schemaError, setSchemaError] = useState(null);
    const [schemaRetry, setSchemaRetry] = useState(0);
    const [selectedBlock, setSelectedBlock] = useState(null);

    // ===== BYOK settings state =====
    const [byokConfig, setByokConfig] = useState(() => loadBYOKConfig());
    const [settingsOpen, setSettingsOpen] = useState(false);
    // M25: 自定义AI模型「测试连接」probe state
    const [probeState, setProbeState] = useState({status: 'idle', message: ''});

    // ===== "添加 SB3 到对话" state =====
    const [loadSb3Open, setLoadSb3Open] = useState(false);
    const [externalContextInfo, setExternalContextInfo] = useState(null);
    const fileInputRef = useRef(null);

    // ===== Reverse sync state (F5.4) =====
    const projectContextRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const [syncStatus, setSyncStatus] = useState({
        status: 'idle',
        blockCount: 0,
        time: null,
        error: null
    });

    // ===== F3.2: Initialize sessions from IndexedDB on mount =====
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const stored = await dbGetAllSessions();
            if (cancelled) return;
            if (stored.length === 0) {
                // Create a default session
                const now = Date.now();
                const defaultSession = {
                    id: `session-${now}`,
                    name: '新会话',
                    messages: [WELCOME_MESSAGE],
                    createdAt: now,
                    updatedAt: now
                };
                await dbPutSession(defaultSession);
                if (cancelled) return;
                setSessions([defaultSession]);
                setCurrentSessionId(defaultSession.id);
                setMessages([WELCOME_MESSAGE]);
            } else {
                // Sort by updatedAt desc — pick the most recent as active
                stored.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                const latest = stored[0];
                setSessions(stored.map(s => ({
                    id: s.id,
                    name: s.name,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt
                })));
                setCurrentSessionId(latest.id);
                setMessages(latest.messages || [WELCOME_MESSAGE]);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ===== F3.2: Persist messages to IndexedDB whenever they change =====
    useEffect(() => {
        if (!currentSessionId) return;
        // Avoid persisting the initial WELCOME_MESSAGE before IDB init completes
        dbPutSession({
            id: currentSessionId,
            name: sessions.find(s => s.id === currentSessionId)?.name || '会话',
            messages,
            updatedAt: Date.now()
        });
    }, [messages, currentSessionId, sessions]);

    // ===== F3.8: Fetch schema on mount (M2: retry on failure) =====
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        // M2: Clear previous error when retrying
        setSchemaError(null);
        fetch(`${BACKEND_URL}/schema`, {signal: controller.signal})
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!cancelled && data) {
                    setSchema(data);
                    setSchemaError(null);
                } else if (!cancelled && !data) {
                    setSchemaError('Schema 获取失败（HTTP 错误）');
                }
            })
            .catch(e => {
                if (!cancelled) {
                    console.error('Schema fetch failed:', e);
                    setSchemaError(e.name === 'AbortError'
                        ? 'Schema 获取超时（5 秒）'
                        : `Schema 获取失败：${e.message || e}`);
                }
            })
            .finally(() => clearTimeout(timer));
        return () => {
            cancelled = true;
            clearTimeout(timer);
            controller.abort();
        };
    }, [schemaRetry]); // M2: re-run when schemaRetry changes

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    // ===== Reverse sync: decompile current project → project_context =====
    // M1: Use an AbortController so syncNow can be aborted on unmount.
    const syncAbortControllerRef = useRef(null);
    const syncNow = useCallback(async () => {
        if (!vm) return;
        const blockCount = countVmBlocks(vm);
        setSyncStatus({status: 'syncing', blockCount, time: null, error: null});

        // M1: Abort any in-flight sync before starting a new one
        if (syncAbortControllerRef.current) {
            syncAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        syncAbortControllerRef.current = controller;

        try {
            const result = await decompileProject(vm, controller.signal);
            projectContextRef.current = result.source || null;
            setSyncStatus({status: 'synced', blockCount, time: new Date(), error: null});
        } catch (err) {
            if (err.name === 'AbortError') return; // aborted — silent
            setSyncStatus({
                status: 'error', blockCount, time: null,
                error: err.message || String(err)
            });
        } finally {
            if (syncAbortControllerRef.current === controller) {
                syncAbortControllerRef.current = null;
            }
        }
    }, [vm]);

    // ===== "添加 SB3 到对话" — load an external .sb3 as project_context =====
    const loadSb3AsContext = useCallback(async (sb3UrlOrFile) => {
        setLoadSb3Open(false);
        // H2: Use sb3AbortControllerRef (not the shared abortControllerRef)
        //     so handleSend and loadSb3AsContext don't clobber each other.
        // M8: Capture currentSessionId at entry to detect if user switched
        //     sessions during the async operation.
        const sessionAtStart = currentSessionId;

        // Abort any previous SB3 loading in progress
        if (sb3AbortControllerRef.current) {
            sb3AbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        sb3AbortControllerRef.current = controller;
        sb3LoadingRef.current = true;

        // H2: Set busy so the user can't send chat messages during SB3 loading
        setBusy(true);
        setSyncStatus(prev => ({...prev, status: 'syncing', error: null}));

        try {
            const result = await decompileSb3External(sb3UrlOrFile, controller.signal);
            const source = result.source || '';
            projectContextRef.current = source || null;

            const lineCount = source ? source.split('\n').length : 0;
            const spriteCount = result.targets ?
                result.targets.filter(t => !t.isStage).length : 0;
            // L5: Guard against NaN — if any target's blocks keys are
            //     non-numeric, reduce could produce NaN.
            const rawBlockCount = result.targets ?
                (result.targets.reduce((acc, t) =>
                    acc + (t.blocks ? Object.keys(t.blocks).length : 0), 0)) : 0;
            const blockCount = Number.isFinite(rawBlockCount) ? rawBlockCount : 0;

            // M8: Only update context info if the user hasn't switched sessions
            const stillSameSession = currentSessionId === sessionAtStart;

            setExternalContextInfo({
                fileName: result.fileName,
                lineCount,
                spriteCount,
                blockCount,
                loadedAt: new Date()
            });

            // M8: Use functional setState so we don't overwrite a stale state
            setSyncStatus(() => ({
                status: 'synced',
                blockCount,
                time: new Date(),
                error: null
            }));

            const summary = `✓ 已加载 ${result.fileName} 作为对话上下文\n\n` +
                `• ${lineCount} 行 goboscript\n` +
                `• ${spriteCount} 个 sprite\n` +
                `• ${blockCount} 个积木\n\n` +
                `现在你可以在下方输入指令，AI 会基于这段代码作答。`;

            if (stillSameSession) {
                setMessages(prev => [...prev, {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: summary
                }]);
            }
        } catch (err) {
            if (err.name === 'AbortError') return; // user cancelled — silent
            // M8: Functional update for error state too
            setSyncStatus(() => ({
                status: 'error',
                blockCount: 0,
                time: null,
                error: err.message || String(err)
            }));
            if (currentSessionId === sessionAtStart) {
                setMessages(prev => [...prev, {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: `✗ 加载 SB3 失败：${err.message || err}`
                }]);
            }
        } finally {
            sb3AbortControllerRef.current = null;
            sb3LoadingRef.current = false;
            setBusy(false);
        }

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 50);
    }, [currentSessionId]);

    // Hidden file input onChange handler
    const handleFileInputChange = useCallback((e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            loadSb3AsContext(file);
        }
        e.target.value = '';
    }, [loadSb3AsContext]);

    useEffect(() => {
        if (!vm) return;

        const triggerSync = () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                syncNow();
            }, 1000);
        };

        vm.on('PROJECT_CHANGED', triggerSync);

        return () => {
            vm.removeListener('PROJECT_CHANGED', triggerSync);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            // M1: Abort any in-flight sync on unmount to prevent
            //     setState on an unmounted component
            if (syncAbortControllerRef.current) {
                syncAbortControllerRef.current.abort();
                syncAbortControllerRef.current = null;
            }
        };
    }, [vm, syncNow]);

    // Auto-resize textarea
    const handleInputChange = useCallback(e => {
        setInput(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
        }
    }, []);

    const addMessage = useCallback(msg => {
        const id = msg.id || generateMessageId();
        setMessages(prev => [...prev, {id, ...msg}]);
        return id;
    }, []);

    const handleApplyMessage = useCallback(async (msgId) => {
        const msg = (conversationRef.current || []).find(m => m.id === msgId);
        if (!msg || !msg.code) return;

        try {
            const { buffer } = await compileGoboscript(msg.code);
            const injectRes = await injectSb3(vm, buffer, null, injectModeRef.current);
            const count = (injectRes && typeof injectRes === 'object') ? injectRes.count : injectRes;
            const blockIds = (injectRes && injectRes.blockIds) || [];
            const topBlockId = injectRes && injectRes.topBlockId;

            setMessages(prev => prev.map(m => m.id === msgId ? {
                ...m,
                status: 'applied',
                appliedBlockCount: count,
                injectedBlockIds: blockIds,
                topBlockId: topBlockId
            } : m));

            // Smooth glow pulse & viewport center
            setTimeout(() => {
                if (blockIds.length > 0) {
                    highlightBlocks(blockIds);
                }
                if (topBlockId) {
                    focusBlock(topBlockId);
                }
            }, 100);
        } catch (err) {
            addMessage({
                role: 'error',
                content: `应用变更失败：${err.message || String(err)}`
            });
        }
    }, [vm, addMessage]);

    const handleFocusMessage = useCallback((msgId) => {
        const msg = (conversationRef.current || []).find(m => m.id === msgId);
        if (!msg) return;
        if (msg.injectedBlockIds && msg.injectedBlockIds.length > 0) {
            highlightBlocks(msg.injectedBlockIds);
        }
        if (msg.topBlockId) {
            focusBlock(msg.topBlockId);
        }
    }, []);

    const handleDiscardMessage = useCallback((msgId) => {
        setMessages(prev => prev.map(m => m.id === msgId ? {
            ...m,
            status: 'rejected'
        } : m));
    }, []);

    const handleExportGoboscript = useCallback(async () => {
        try {
            if (!vm) return;
            const res = await decompileProject(vm);
            if (!res || !res.source) {
                addMessage({
                    role: 'error',
                    content: '当前项目为空或反编译失败'
                });
                return;
            }
            const blob = new Blob([res.source], {type: 'text/plain;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project.gs';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addMessage({
                role: 'assistant',
                kind: 'context',
                content: '成功导出整个项目的 goboscript 源码 (project.gs)。你可以在 AGY 中继续对话编写，或存入 project/ 目录。'
            });
        } catch (err) {
            addMessage({
                role: 'error',
                content: `导出工程源码失败：${err.message || String(err)}`
            });
        }
    }, [vm, addMessage]);

    // ===== F3.2: Session management handlers =====
    const handleNewSession = useCallback(() => {
        const now = Date.now();
        const newSession = {
            id: `session-${now}`,
            name: `会话 ${sessions.length + 1}`,
            messages: [WELCOME_MESSAGE],
            createdAt: now,
            updatedAt: now
        };
        dbPutSession(newSession);
        setSessions(prev => [...prev, {
            id: newSession.id,
            name: newSession.name,
            createdAt: newSession.createdAt,
            updatedAt: newSession.updatedAt
        }]);
        setCurrentSessionId(newSession.id);
        setMessages([WELCOME_MESSAGE]);
        setSessionDropdownOpen(false);
        setInput('');
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, [sessions.length]);

    const handleSwitchSession = useCallback(async (id) => {
        const session = await dbGetSession(id);
        if (session) {
            setCurrentSessionId(id);
            setMessages(session.messages || [WELCOME_MESSAGE]);
            setSessionDropdownOpen(false);
            setInput('');
        }
    }, []);

    const handleDeleteSession = useCallback(async (id) => {
        await dbDeleteSession(id);
        // M3: Use functional setState to avoid stale closure over `sessions`
        setSessions(prev => {
            const remaining = prev.filter(s => s.id !== id);
            if (remaining.length === 0) {
                // Always keep at least one session
                const now = Date.now();
                const defaultSession = {
                    id: `session-${now}`,
                    name: '新会话',
                    messages: [WELCOME_MESSAGE],
                    createdAt: now,
                    updatedAt: now
                };
                dbPutSession(defaultSession);
                setCurrentSessionId(defaultSession.id);
                setMessages([WELCOME_MESSAGE]);
                return [{
                    id: defaultSession.id,
                    name: defaultSession.name,
                    createdAt: defaultSession.createdAt,
                    updatedAt: defaultSession.updatedAt
                }];
            }
            // If we deleted the active session, switch to the most recent remaining
            if (id === currentSessionId) {
                const latest = remaining
                    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
                dbGetSession(latest.id).then(session => {
                    setCurrentSessionId(latest.id);
                    setMessages(session?.messages || [WELCOME_MESSAGE]);
                });
            }
            return remaining;
        });
    }, [currentSessionId]);

    // ===== F3.4: Stop / interrupt handler =====
    // H2: Abort both controllers — whichever is active will be interrupted.
    const handleStop = useCallback(() => {
        if (chatAbortControllerRef.current) {
            chatAbortControllerRef.current.abort();
            chatAbortControllerRef.current = null;
        }
        if (sb3AbortControllerRef.current) {
            sb3AbortControllerRef.current.abort();
            sb3AbortControllerRef.current = null;
        }
        sb3LoadingRef.current = false;
        setBusy(false);
        addMessage({role: 'assistant', content: '⏹ 已中断生成。主画布不受影响。'});
    }, [addMessage]);

    // ===== F3.8: Insert block reference into chat context =====
    const handleInsertBlock = useCallback((block) => {
        // L7: Guard against missing schema fields — use ?? '—' so the
        //     template string never inserts literal "undefined".
        const syntax = block.syntax ?? '—';
        const example = block.example ?? '—';
        const category = block.category ?? '—';
        const refText = `（参考积木：${syntax}｜示例：${example}｜类别：${category}）\n`;
        setInput(prev => prev ? `${prev}\n${refText}` : refText);
        setView('chat');
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, []);

    /**
     * End-to-end injection pipeline with F4.6 self-repair loop:
     *
     *   1. POST /ai/chat → goboscript + explanation
     *   2. POST /validate → check for syntax errors
     *   3. If errors: append error feedback to messages, re-call AI
     *      (max 3 attempts total).  Show retry status in chat.
     *   4. POST /compile → .sb3 bytes
     *   5. injectSb3 → parse .sb3, merge blocks into current target
     *      (F6.2: rollback on failure, F6.4: safety validation)
     *   6. Show success message
     *
     * F3.4: Every fetch carries an AbortSignal so the user can stop
     *       at any point.  On abort, busy state is cleared and the
     *       main canvas is untouched.
     */
    /** M27: one targeted SEARCH/REPLACE patch round. Returns patched
     * source or null (model misbehaved / patch unappliable / request
     * failed) — the caller then falls back to full regeneration. */
    const requestPatchRepair = useCallback(async (code, errors, opts) => {
        const {byokConfig: bk, signal: sig} = opts || {};
        addMessage({
            role: 'assistant',
            kind: 'retry',
            content: '尝试定向修补（仅修改报错行）…'
        });
        try {
            const res = await callAIChat([
                {role: 'system', content: PATCH_SYSTEM_HINT},
                {role: 'user', content: buildPatchPrompt(code, errors)}
            ], projectContextRef.current, bk, sig);
            const patched = applySearchReplace(code, res.goboscript || '');
            if (!patched) {
                addMessage({
                    role: 'assistant',
                    kind: 'retry',
                    content: '定向修补不可用（未按格式返回或补丁无法应用），转回完整重试。'
                });
                return null;
            }
            return patched;
        } catch (err) {
            if (err && err.name === 'AbortError') throw err;
            return null;
        }
    }, [addMessage]);

    const handleSend = useCallback(async overrideText => {
        // M27-F: guard against non-string overrides (e.g. a raw event
        // object passed by an unbound onClick) silently becoming the
        // literal prompt "[object Object]".
        const safeOverride = typeof overrideText === 'string' ? overrideText : null;
        const text = String(safeOverride != null ? safeOverride : input)
            .trim();
        if (!text || busy) return;

        // 1. Push user message
        addMessage({role: 'user', content: text});
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setBusy(true);

        // F3.4: Create AbortController for this pipeline run
        // H2: Use chatAbortControllerRef (separate from sb3AbortControllerRef)
        const controller = new AbortController();
        chatAbortControllerRef.current = controller;
        const signal = controller.signal;

        // M18: park attached block-context as a SYSTEM message so it
        // reaches the model without polluting the visible conversation;
        // chat shows a compact chip instead of the raw source.
        // M27-F: reinforce the function convention INSIDE the user turn —
        // the model weights the latest tokens far more than the long
        // system schema, which otherwise dilutes the instruction.
        const _negFunc = /不要|无需|不用|别用/.test(text) &&
            /函数|function|def_/i.test(text);
        const wantsFuncTail = !_negFunc &&
            /函数|function|def_/i.test(text);
        // Symmetric reinforcement: when the user NEGATES functions, the
        // override must out-rank both the standing first-class-functions
        // stance AND any function examples still visible in this thread —
        // otherwise the model pattern-matches the history and emits a def_.
        const effectiveText = _negFunc
            ? text + '\n\n（本次要求优先于一切既有风格约定与上文示例：禁止定义任何自定义函数/func/def_，所有逻辑直接内联书写。）'
            : wantsFuncTail
                ? text + '\n\n（再次强调：必须定义 func def_xxx(...) 形式的函数并在 onflag 中调用；函数名以 def_ 开头。）'
                : text;
        const atts = attachmentsRef.current;
        let contextBlock = '';
        if (atts.length > 0) {
            contextBlock = atts.map(a =>
                `【附件·积木上下文】target "${a.spriteName}"（${a.blockCount} 块）\n${a.source}`
            ).join('\n\n');
            addMessage({
                role: 'context',
                kind: 'context',
                content: atts.map(a => `${a.spriteName} · ${a.blockCount} 块`).join('，')
            });
        }

        let currentTargetName = '当前角色';
        let currentOldSource = '';
        try {
            const currentT = vm && (vm.editingTarget || (vm.runtime && vm.runtime.targets.find(x => !x.isStage)));
            if (currentT) {
                currentTargetName = currentT.getName() || '当前角色';
                const matchAtt = atts.find(a => a.targetId === currentT.id);
                if (matchAtt && matchAtt.source) {
                    currentOldSource = matchAtt.source;
                }
            }
        } catch (_) {}
        let activeMsgId = null;

        // F4.6: Self-repair loop — build up the AI conversation with
        // error feedback so the model can fix its own mistakes.
        const MAX_ATTEMPTS = 3;
        const aiMessages = [
            ...(contextBlock ? [{role: 'system', content: contextBlock}] : []),
            ...buildConversationHistory(conversationRef.current, effectiveText),
            {role: 'user', content: effectiveText}
        ];
        let lastGoboscript = '';
        let lastErrors = [];
        // M27-F: deterministic convention enforcement — if the user asked
        // for functions but the reply has no `func def_` definition, force
        // exactly one targeted rewrite round before accepting.
        const wantsFunc = !/不要|无需|不用|别用/.test(text) &&
            /函数|function|def_/i.test(text);
        let enforcedRewriteUsed = false;
        // M27: working copy — the first successful reply becomes the base
        // all targeted patches apply against.
        let workingCode = '';

        try {
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                if (signal.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                if (attempt > 1) {
                    addMessage({
                        role: 'assistant',
                        kind: 'retry',
                        content: `第 ${attempt - 1} 次重试中…（根据上次的编译错误修正代码）`
                    });
                }

                // ── Step 1: AI chat → goboscript ──────────────────────
                const aiResult = await callAIChat(
                    aiMessages,
                    projectContextRef.current,
                    byokConfig,
                    signal
                );

                lastGoboscript = aiResult.goboscript || '';
                if (lastGoboscript) {
                    // Always track the LATEST full generation so later
                    // SEARCH/REPLACE patches match the current text, not
                    // a stale early snapshot.
                    workingCode = lastGoboscript;
                }

                // Show generated goboscript + explanation with Diff metadata
                activeMsgId = addMessage({
                    role: 'assistant',
                    kind: 'goboscript',
                    content: aiResult.explanation || '',
                    code: lastGoboscript,
                    oldCode: currentOldSource,
                    targetName: currentTargetName,
                    status: autoApply ? 'applied' : 'pending'
                });

                if (!lastGoboscript) {
                    addMessage({
                        role: 'error',
                        content: 'AI 未返回 goboscript 代码，请重试。'
                    });
                    return;
                }

                // ── Step 2: Validate the generated goboscript ────────
                if (signal.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                lastErrors = await validateGoboscript(lastGoboscript, signal);

                if (lastErrors.length === 0) {
                    if (wantsFunc && !enforcedRewriteUsed &&
                            !/(^|\n)\s*func\s+def_/.test(lastGoboscript)) {
                        enforcedRewriteUsed = true;
                        addMessage({
                            role: 'assistant',
                            kind: 'retry',
                            content: '检测到未按要求包装成 func def_* 函数，要求模型重新包装…'
                        });
                        aiMessages.push({role: 'assistant', content: lastGoboscript});
                        aiMessages.push({
                            role: 'system',
                            content: '重写要求：把逻辑包装成函数。必须包含 func def_xxx(...) 形式的定义（函数名以 def_ 开头），并在 onflag 里调用它；不要内联展开。只输出完整可编译的 goboscript 代码。'
                        });
                        continue;
                    }
                    // Validation passed — proceed to compile + inject
                    break;
                }

                // ── Validation failed: show retry status ─────────────
                const errSummary = formatValidateErrors(lastErrors);
                addMessage({
                    role: 'assistant',
                    kind: 'retry-error',
                    content: `第 ${attempt} 次校验失败：\n${errSummary}`
                });

                // ── Feed error back to AI for the next attempt ───────
                // The assistant's previous response is included so the
                // model sees what it generated, followed by a system
                // message with the specific errors to fix.
                // M27: try a targeted patch round against the working
                // copy BEFORE falling back to a full regeneration round.
                if (workingCode) {
                    const patched = await requestPatchRepair(
                        workingCode, lastErrors,
                        {byokConfig, signal}
                    );
                    if (patched) {
                        const errs2 = await validateGoboscript(patched, signal);
                        if (errs2.length === 0) {
                            lastGoboscript = patched;
                            workingCode = patched;
                            lastErrors = [];
                            break;
                        }
                        // Patch applied but still invalid: adopt it as the
                        // new base so the next round shrinks the problem.
                        workingCode = patched;
                    }
                }

                aiMessages.push({role: 'assistant', content: lastGoboscript});
                aiMessages.push({
                    role: 'system',
                    content: `上一次生成的 goboscript 代码校验失败，错误如下（行列号 + 信息）：\n${errSummary}\n\n请根据上述错误修正代码，重新生成完整可编译的 goboscript。只输出修正后的代码，不要解释。`
                });
            }

            // ── F4.6: If all attempts failed, notify the user ────────
            if (lastErrors.length > 0) {
                addMessage({
                    role: 'error',
                    kind: 'error',
                    content: `${MAX_ATTEMPTS} 次尝试均未通过校验。\n\n最后错误：\n${formatValidateErrors(lastErrors)}\n\n请手动检查或修改描述后重试。`
                });
                return;
            }

            // ── Step 3: Compile goboscript → .sb3 ────────────────────
            if (signal.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            const {buffer} = await compileGoboscript(lastGoboscript, signal);

            // ── Step 4: Inject into scratch-vm ───────────────────────
            if (!vm) {
                addMessage({
                    role: 'error',
                    kind: 'error',
                    content: '未找到 scratch-vm 实例，无法注入积木。'
                });
                return;
            }

            if (signal.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            // Step 4: Inject into scratch-vm if autoApply is enabled
            if (autoApply) {
                const injectRes = await injectSb3(vm, buffer, signal, injectModeRef.current);
                const count = (injectRes && typeof injectRes === 'object') ? injectRes.count : injectRes;
                const blockIds = (injectRes && injectRes.blockIds) || [];
                const topBlockId = injectRes && injectRes.topBlockId;

                if (activeMsgId) {
                    setMessages(prev => prev.map(m => m.id === activeMsgId ? {
                        ...m,
                        status: 'applied',
                        appliedBlockCount: count,
                        injectedBlockIds: blockIds,
                        topBlockId: topBlockId
                    } : m));
                }

                // Realtime Blockly Visual Diff: pulse glow on modified blocks & center view!
                setTimeout(() => {
                    if (blockIds.length > 0) {
                        highlightBlocks(blockIds);
                    }
                    if (topBlockId) {
                        focusBlock(topBlockId);
                    }
                }, 120);
            }

            // ── Step 5: silent success (M16/M18) — the canvas growing IS
            // the feedback; no toast.

        } catch (err) {
            // F3.4: AbortError — user pressed stop, silent cleanup
            if (err.name === 'AbortError') {
                // Already handled by handleStop; just ensure busy is off
                return;
            }

            // ── Other errors: show detail to user ───────────────────
            const errMsg = err.message || String(err);

            // F6.2/F6.4: injection safety errors are surfaced clearly
            if (errMsg.includes('SB3') || errMsg.includes('路径穿越') ||
                errMsg.includes('过大') || errMsg.includes('文件数')) {
                addMessage({
                    role: 'error',
                    kind: 'error',
                    content: `注入安全检查失败：${errMsg}`
                });
            } else if (errMsg.includes('/compile')) {
                addMessage({
                    role: 'error',
                    content: `编译失败：${errMsg}\n\n建议：检查 goboscript 语法（行列号见 /validate 输出）。`
                });
            } else {
                addMessage({role: 'error', content: errMsg});
            }
        } finally {
            // H2: Only clear the chat controller ref, not the shared one
            chatAbortControllerRef.current = null;
            // M18: one-shot inject mode consumed
            injectModeRef.current = 'append';
            setBusy(false);
        }
    }, [input, busy, vm, byokConfig, addMessage]);

    // M18: run a quick action over the current attachments. 修复Bug marks
    // this single send as replace-mode (consumed in handleSend finally).
    const runQuickAction = useCallback(action => {
        if (!attachmentsRef.current.length || busy) return;
        if (action.id === 'fix') {
            injectModeRef.current = 'replace';
        }
        handleSend(action.prompt);
    }, [busy, handleSend]);

    const toggleAttachmentCollapsed = useCallback(id => {
        setAttachments(prev => prev.map(a =>
            a.id === id ? {...a, collapsed: !a.collapsed} : a));
    }, []);

    const removeAttachment = useCallback(id => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    }, []);

    // ===== M15/M17: 右键菜单 → AI 对话（原生单咽喉点方案） =====
    // 本构建 scratch-blocks 没有 ContextMenuRegistry；块/工作区/评论的全部
    // 上下文菜单都经 Blockly.ContextMenu.show(e, options, rtl) 渲染
    // （block_svg.js:728 / workspace_svg.js:1628）。包裹这一个函数，我们的
    // 条目就是与「复制」「删除」同通道的一等 goog.ui.MenuItem：渲染、悬停、
    // ACTION 激活、自动关闭全部走原生代码。无 DOM 克隆、无合成事件。
    const handleSendBlocksToAi = useCallback(async () => {
        try {
            const t = vm.editingTarget ||
                (vm.runtime &&
                    vm.runtime.targets.find(x => !x.isStage));
            if (!t) {
                addMessage({role: 'error', content: '⛔ 当前没有可反编译的角色'});
                return;
            }
            // 反编译整个编辑目标 → M18: 存为可展开/可删除的附件 chip，
            // 不再直接填输入框。
            const buf = await vm.saveProjectSb3('arraybuffer');
            const res = await fetch(BACKEND_URL + '/decompile', {
                method: 'POST',
                headers: {'Content-Type': 'application/octet-stream'},
                body: buf
            });
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
            const data = await res.json();
            const src = (data.targets && data.targets[t.id]) || data.source || '';
            if (!src) {
                addMessage({
                    role: 'error',
                    kind: 'error',
                    content: '该角色没有可反编译的积木'
                });
                return;
            }
            const blockCount = Object.values(t.blocks._blocks)
                .filter(b => b && typeof b === 'object' && !Array.isArray(b) && b.opcode)
                .length;
            const att = {
                id: 'att_' + Date.now().toString(36),
                kind: 'blocks',
                targetId: t.id,
                spriteName: t.getName(),
                blockCount,
                source: src,
                collapsed: true
            };
            // same target re-added → replace its chip instead of stacking
            setAttachments(prev => [
                ...prev.filter(a => a.targetId !== att.targetId),
                att
            ]);
        } catch (err) {
            addMessage({
                role: 'error',
                kind: 'error',
                content: '发送积木失败：' + (err.message || String(err))
            });
        }
    }, [vm, addMessage, setAttachments]);

    // M17: install the native ContextMenu.show wrapper once per callback
    // identity. Identity-guarded restore (review-A#2) so TurboWarp's addon
    // API — which wraps the SAME function via createBlockContextMenu — is
    // never clobbered by our unmount cleanup.
    useEffect(() => {
        let cancelled = false;
        LazyScratchBlocks.load().then(() => {
            if (cancelled) return;
            let SB = null;
            try {SB = LazyScratchBlocks.get();} catch (_) {SB = null;}
            if (!(SB && SB.ContextMenu &&
                    typeof SB.ContextMenu.show === 'function')) {
                console.warn('[ai-chat] ContextMenu.show unavailable; ' +
                    '右键入口不可用');
                return;
            }
            const origShow = SB.ContextMenu.show;
            // review-A#1: flyout right-clicks call show(e, [], rtl); the
            // native code hides EMPTY menus. Only extend menus that would
            // render anyway (workspace/block menus always have options).
            const ourShow = function (e, options, rtl) {
                try {
                    if (Array.isArray(options) && options.length > 0 &&
                            !options.some(o => o && o.__aiChatEntry)) {
                        options.push({
                            text: ADD_TO_AI_LABELS[locale] || ADD_TO_AI_LABELS['zh-cn'],
                            enabled: true,
                            __aiChatEntry: true,
                            callback: () => handleSendBlocksToAi()
                        });
                    }
                } catch (_) {/* never break the native menu */}
                return origShow.call(this, e, options, rtl);
            };
            SB.ContextMenu.show = ourShow;
            origShowRef.current = () => {
                if (SB.ContextMenu.show === ourShow) {
                    SB.ContextMenu.show = origShow;
                }
                // someone wrapped over us — leave their chain intact
            };
        }).catch(e => {
            console.warn('[ai-chat] context-menu hook failed:',
                e && e.message ? e.message : e);
        });
        return () => {
            cancelled = true;
            if (origShowRef.current) {
                try {origShowRef.current();} catch (_) {}
                origShowRef.current = null;
            }
        };
    }, [handleSendBlocksToAi, locale]);

    // Enter to send (Shift+Enter for newline)
    const handleKeyDown = useCallback(e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // M9-2 (restored): the width transition alone does NOT notify Blockly.
    // Pump synthetic window resizes across the 200ms transition so the
    // workspace re-layouts into the freed/claimed space (F2 delta).
    const toggleCollapse = useCallback(() => {
        setCollapsed(prev => !prev);
        let n = 0;
        const pump = () => {
            try {window.dispatchEvent(new Event('resize'));} catch (_) {}
            if (++n < 14) setTimeout(pump, 30);
        };
        pump();
    }, []);

    // ===== Resizable sidebar: drag handle handlers =====
    // onMouseDown on the handle starts a drag session.  We capture the
    // starting X and current width, then attach document-level mousemove
    // and mouseup listeners.  mousemove computes newWidth = startWidth
    // + (startX - currentX) because the handle is on the LEFT edge —
    // dragging left widens, dragging right narrows.
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // L3: Read from sidebarWidthRef (always current) instead of
        //     sidebarWidth (may be stale due to closure)
        dragStateRef.current = {
            startX: e.clientX,
            startWidth: sidebarWidthRef.current
        };
        setIsDragging(true);
    }, []);

    // Document-level mousemove/mouseup — active only during a drag.
    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e) => {
            const ds = dragStateRef.current;
            if (!ds) return;
            const delta = ds.startX - e.clientX;
            const newWidth = Math.max(
                SIDEBAR_MIN_WIDTH,
                Math.min(SIDEBAR_MAX_WIDTH, ds.startWidth + delta)
            );
            setSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            // L3: Persist the ACTUAL final width from the ref, not the
            //    stale closure value of `sidebarWidth`.
            // L4: Removed dead `delta` code that served no purpose.
            saveSidebarWidth(sidebarWidthRef.current);
            dragStateRef.current = null;
            setIsDragging(false);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]); // L3: Removed `sidebarWidth` from deps — using ref instead

    // ===== Current session name (for display) =====
    const currentSessionName = sessions.find(s => s.id === currentSessionId)?.name || '新会话';

    // ===== F3.8: Group schema blocks by category =====
    const blocksByCategory = React.useMemo(() => {
        if (!schema || !schema.blocks) return [];
        const map = {};
        for (const b of schema.blocks) {
            const cat = b.category || 'Other';
            if (!map[cat]) map[cat] = [];
            map[cat].push(b);
        }
        // Order by BLOCK_CATEGORIES, append any unknown categories at end
        const ordered = [];
        for (const cat of BLOCK_CATEGORIES) {
            if (map[cat.id]) {
                ordered.push({...cat, blocks: map[cat.id]});
            }
        }
        for (const cat of Object.keys(map)) {
            if (!BLOCK_CATEGORIES.find(c => c.id === cat)) {
                ordered.push({id: cat, label: cat, color: '#888', blocks: map[cat]});
            }
        }
        return ordered;
    }, [schema]);

    // ===== Collapsed state: thin vertical bar =====
    if (collapsed) {
        return (
            <div className={`${styles.aiChatSidebar} ${styles.collapsed}`}>
                <div
                    className={styles.aiChatCollapseBar}
                    onClick={toggleCollapse}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCollapse();
                        }
                    }}
                    title="展开 AI 助手"
                >
                    <div className={styles.aiChatCollapseIcon}>
                        <ExpandIcon />
                    </div>
                    <div className={styles.aiChatCollapseLabel}>
                        AI 助手
                    </div>
                </div>
            </div>
        );
    }

    // ===== Expanded state =====
    return (
        <div
            className={`${styles.aiChatSidebar} ${styles.expanded} ${isDragging ? styles.dragging : ''}`}
            style={{width: `${sidebarWidth}px`}}
        >
            {/* Resize handle — left edge */}
            <div
                className={`${styles.aiChatResizeHandle} ${isDragging ? styles.dragging : ''}`}
                onMouseDown={handleResizeStart}
                title="拖动调整宽度"
            />
            {/* Header */}
            <div className={styles.aiChatHeader}>
                <div className={styles.aiChatHeaderTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChatIcon />
                    <span style={{ fontWeight: 600 }}>AI Copilot</span>
                    <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        letterSpacing: '0.5px'
                    }}>
                        AGY
                    </span>
                </div>
                <div className={styles.aiChatHeaderActions}>
                    <button
                        className={styles.aiChatSettingsButton}
                        onClick={handleExportGoboscript}
                        title="导出整个项目为 goboscript 源码 (project.gs) 供 AGY 协同编辑"
                    >
                        <ExportIcon />
                    </button>
                    <button
                        className={`${styles.aiChatSettingsButton} ${loadSb3Open ? styles.settingsOpen : ''} ${externalContextInfo ? styles.settingsActive : ''}`}
                        onClick={() => {setSessionDropdownOpen(false); setLoadSb3Open(prev => !prev);}}
                        title="添加 SB3 到对话"
                    >
                        <LoadSb3Icon />
                        {externalContextInfo && (
                            <span className={styles.aiChatSettingsDot} />
                        )}
                    </button>
                    <button
                        className={`${styles.aiChatSettingsButton} ${settingsOpen ? styles.settingsOpen : ''} ${!isBYOKEmpty(byokConfig) ? styles.settingsActive : ''}`}
                        onClick={() => {setSessionDropdownOpen(false); setSettingsOpen(prev => !prev);}}
                        title="API 设置"
                    >
                        <GearIcon />
                        {!isBYOKEmpty(byokConfig) && (
                            <span className={styles.aiChatSettingsDot} />
                        )}
                    </button>
                    <button
                        className={styles.aiChatCollapseButton}
                        onClick={toggleCollapse}
                        title="折叠侧栏"
                    >
                        <CollapseIcon />
                    </button>
                </div>
            </div>

            {/* ===== F3.2 + F3.8: Sub-header (session selector + view tabs) ===== */}
            <div className={styles.aiChatSubHeader}>
                {/* Session selector */}
                <button
                    className={styles.aiChatSessionSelector}
                    onClick={() => {setSettingsOpen(false); setLoadSb3Open(false); setSessionDropdownOpen(prev => !prev);}}
                    title="切换/管理会话"
                >
                    <span className={styles.aiChatSessionName}>{currentSessionName}</span>
                    <ChevronDownIcon />
                </button>
                {/* View tabs */}
                <div className={styles.aiChatViewTabs}>
                    <button
                        className={`${styles.aiChatViewTab} ${view === 'chat' ? styles.viewTabActive : ''}`}
                        onClick={() => setView('chat')}
                        title="对话"
                    >
                        对话
                    </button>
                    <button
                        className={`${styles.aiChatViewTab} ${view === 'blocks' ? styles.viewTabActive : ''}`}
                        onClick={() => setView('blocks')}
                        title="积木浏览器"
                    >
                        <BlocksIcon />
                    </button>
                </div>
            </div>

            {/* ===== F3.2: Session selector dropdown ===== */}
            {sessionDropdownOpen && (
                <div className={styles.aiChatSessionDropdown}>
                    <div className={styles.aiChatSessionDropdownHeader}>
                        <span>会话列表</span>
                        <button
                            className={styles.aiChatSessionNewBtn}
                            onClick={handleNewSession}
                            title="新建会话"
                        >
                            <NewSessionIcon />
                            <span>新建</span>
                        </button>
                    </div>
                    <div className={styles.aiChatSessionList}>
                        {sessions.map(s => (
                            <div
                                key={s.id}
                                className={`${styles.aiChatSessionItem} ${s.id === currentSessionId ? styles.sessionItemActive : ''}`}
                            >
                                <button
                                    className={styles.aiChatSessionItemBtn}
                                    onClick={() => handleSwitchSession(s.id)}
                                >
                                    <span className={styles.aiChatSessionItemName}>{s.name}</span>
                                    <span className={styles.aiChatSessionItemTime}>
                                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString('zh-CN') : ''}
                                    </span>
                                </button>
                                <button
                                    className={styles.aiChatSessionDeleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(s.id);
                                    }}
                                    title="删除会话"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== Hidden file input for local .sb3 picker ===== */}
            <input
                type="file"
                accept=".sb3"
                ref={fileInputRef}
                style={{display: 'none'}}
                onChange={handleFileInputChange}
            />

            {/* ===== "添加 SB3 到对话" dropdown panel ===== */}
            {loadSb3Open && (
                <div className={styles.aiChatSettingsPanel}>
                    <div className={styles.aiChatSettingsHeader}>
                        <span>添加 SB3 到对话</span>
                        <button
                            className={styles.aiChatSettingsClose}
                            onClick={() => setLoadSb3Open(false)}
                            title="关闭"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Test SB3 file list */}
                    <div className={styles.aiChatSb3List}>
                        {TEST_SB3_FILES.map(f => (
                            <button
                                key={f.name}
                                className={`${styles.aiChatSb3Item} ${
                                    externalContextInfo &&
                                    externalContextInfo.fileName === f.name ?
                                        styles.aiChatSb3ItemActive : ''
                                }`}
                                onClick={() => loadSb3AsContext(f.url)}
                                title={f.name}
                            >
                                <FileIcon />
                                <span className={styles.aiChatSb3ItemName}>{f.name}</span>
                                <span className={styles.aiChatSb3ItemLabel}>{f.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className={styles.aiChatSb3Divider} />

                    {/* Local file picker */}
                    <button
                        className={styles.aiChatSb3LocalButton}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                        <FolderIcon />
                        <span>从本地选择 .sb3 文件…</span>
                    </button>

                    {/* Loaded-context summary */}
                    {externalContextInfo && (
                        <div className={styles.aiChatSb3Summary}>
                            <div className={styles.aiChatSb3SummaryTitle}>
                                当前上下文：{externalContextInfo.fileName}
                            </div>
                            <div className={styles.aiChatSb3SummaryStats}>
                                {externalContextInfo.lineCount} 行 ·
                                {' '}{externalContextInfo.spriteCount} sprite ·
                                {' '}{externalContextInfo.blockCount} 积木
                            </div>
                            <button
                                className={styles.aiChatSb3ClearButton}
                                onClick={() => {
                                    projectContextRef.current = null;
                                    setExternalContextInfo(null);
                                }}
                            >
                                清除
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== BYOK Settings popover (F5.6) ===== */}
            {settingsOpen && (
                <div className={styles.aiChatSettingsPanel}>
                    <div className={styles.aiChatSettingsHeader}>
                        <span>API 设置（BYOK）</span>
                        <button
                            className={styles.aiChatSettingsClose}
                            onClick={() => setSettingsOpen(false)}
                            title="关闭"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Preset buttons */}
                    <div className={styles.aiChatPresets}>
                        {Object.entries(BYOK_PRESETS).map(([key, preset]) => {
                            const isActive = byokConfig.base_url === preset.base_url &&
                                byokConfig.model === preset.model;
                            return (
                                <button
                                    key={key}
                                    className={`${styles.aiChatPresetButton} ${isActive ? styles.presetActive : ''}`}
                                    onClick={() => {
                                        const next = {
                                            ...byokConfig,
                                            base_url: preset.base_url,
                                            model: preset.model
                                        };
                                        setByokConfig(next);
                                        saveBYOKConfig(next);
                                    }}
                                >
                                    {preset.name}
                                </button>
                            );
                        })}
                        {/* M25: 自定义 chip — active when config matches no
                            preset and is not empty; clicking starts a blank
                            custom config (keeps any existing API key). */}
                        <button
                            className={`${styles.aiChatPresetButton} ` +
                                `${(!matchesAnyPreset(byokConfig) && !isBYOKEmpty(byokConfig)) ?
                                    styles.presetActive : ''}`}
                            title="使用任意 OpenAI 兼容的自定义模型服务"
                            onClick={() => {
                                const next = {...byokConfig, base_url: '', model: ''};
                                setByokConfig(next);
                                saveBYOKConfig(next);
                            }}
                        >
                            自定义
                        </button>
                    </div>

                    {/* M25: 自定义 AI 模型 section header */}
                    <div className={styles.aiChatSectionTitle}>
                        自定义 AI 模型
                    </div>
                    <div className={styles.aiChatSectionHint}>
                        填入任意 OpenAI 兼容接口（请求发往 {'{base_url}'}/chat/completions），
                        或点击上方预设快速填充。
                    </div>

                    {/* Base URL */}
                    <label className={styles.aiChatField}>
                        <span className={styles.aiChatFieldLabel}>Base URL</span>
                        <input
                            type="text"
                            className={styles.aiChatFieldInput}
                            value={byokConfig.base_url}
                            onChange={e => {
                                const next = {...byokConfig, base_url: e.target.value};
                                setByokConfig(next);
                                saveBYOKConfig(next);
                            }}
                            placeholder="https://api.example.com/v1"
                        />
                    </label>

                    {/* API Key */}
                    <label className={styles.aiChatField}>
                        <span className={styles.aiChatFieldLabel}>API Key</span>
                        <input
                            type="password"
                            className={styles.aiChatFieldInput}
                            value={byokConfig.api_key}
                            onChange={e => {
                                const next = {...byokConfig, api_key: e.target.value};
                                setByokConfig(next);
                                saveBYOKConfig(next);
                            }}
                            placeholder="sk-…（留空走 mock）"
                        />
                    </label>

                    {/* Model */}
                    <label className={styles.aiChatField}>
                        <span className={styles.aiChatFieldLabel}>Model</span>
                        <input
                            type="text"
                            className={styles.aiChatFieldInput}
                            value={byokConfig.model}
                            onChange={e => {
                                const next = {...byokConfig, model: e.target.value};
                                setByokConfig(next);
                                saveBYOKConfig(next);
                            }}
                            placeholder="deepseek-chat"
                        />
                    </label>

                    {/* M25: connection test row */}
                    <div className={styles.aiChatProbeRow}>
                        <button
                            className={styles.aiChatProbeButton}
                            disabled={probeState.status === 'testing' || !byokConfig.base_url}
                            onClick={async () => {
                                setProbeState({status: 'testing', message: '测试中…'});
                                try {
                                    const r = await probeByokConnection(byokConfig);
                                    if (r && r.ok) {
                                        const suffix = (byokConfig.model && r.model_count > 0 && !r.model_known)
                                            ? ' · 模型名不在服务商列表中' : '';
                                        const detail = r.model_count > 0
                                            ? `连接成功 · ${r.model_count} 个可用模型${suffix}`
                                            : '连接成功（端点未返回模型列表）';
                                        setProbeState({status: 'ok', message: detail});
                                    } else {
                                        const msg = (r && (r.error || r.detail)) || '未知错误';
                                        setProbeState({status: 'fail', message: `连接失败：${msg}`});
                                    }
                                } catch (e) {
                                    setProbeState({status: 'fail', message: `连接失败：${e.message}`});
                                }
                            }}
                        >
                            测试连接
                        </button>
                        {probeState.status !== 'idle' && (
                            <span
                                className={[
                                    styles.aiChatProbeResult,
                                    probeState.status === 'ok' ? styles.probeOk : '',
                                    probeState.status === 'fail' ? styles.probeFail : ''
                                ].join(' ')}
                            >
                                {probeState.message}
                            </span>
                        )}
                    </div>

                    <div className={styles.aiChatSettingsHint}>
                        配置存于浏览器 localStorage，每次请求自动携带。
                        三项全空时后端走 mock 模式。
                    </div>
                    {/* H4: Security warning about localStorage storage */}
                    <div
                        className={styles.aiChatSettingsHint}
                        style={{
                            color: '#c0392b',
                            fontSize: '0.75rem',
                            marginTop: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(192,57,43,0.08)',
                            borderRadius: '4px'
                        }}
                    >
                        ⚠ 密钥以明文存于 localStorage，请勿在公共电脑保存。
                    </div>
                </div>
            )}

            {/* ===== F3.8: Blocks browser view ===== */}
            {view === 'blocks' && (
                <div className={styles.aiChatBlocksView}>
                    {schema ? (
                        <>
                            <div className={styles.aiChatBlocksHeader}>
                                <span>积木浏览器</span>
                                <span className={styles.aiChatBlocksCount}>
                                    {schema.blocks?.length || 0} 个积木
                                </span>
                            </div>
                            <div className={styles.aiChatBlocksList}>
                                {blocksByCategory.map(cat => (
                                    <div key={cat.id} className={styles.aiChatBlockCategory}>
                                        <div
                                            className={styles.aiChatBlockCategoryHeader}
                                            style={{borderLeftColor: cat.color}}
                                        >
                                            <span
                                                className={styles.aiChatBlockCategoryDot}
                                                style={{backgroundColor: cat.color}}
                                            />
                                            <span>{cat.label}</span>
                                            <span className={styles.aiChatBlockCategoryCount}>
                                                {cat.blocks.length}
                                            </span>
                                        </div>
                                        {cat.blocks.map((block, idx) => (
                                            <button
                                                key={`${block.name}-${idx}`}
                                                className={`${styles.aiChatBlockItem} ${
                                                    selectedBlock === block ? styles.blockItemActive : ''
                                                }`}
                                                onClick={() => setSelectedBlock(block)}
                                            >
                                                <code className={styles.aiChatBlockSyntax}>
                                                    {block.syntax}
                                                </code>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {/* Selected block detail */}
                            {selectedBlock && (
                                <div className={styles.aiChatBlockDetail}>
                                    <div className={styles.aiChatBlockDetailHeader}>
                                        <span>{selectedBlock.name}</span>
                                        <span
                                            className={styles.aiChatBlockDetailCat}
                                            style={{
                                                backgroundColor: BLOCK_CATEGORIES.find(c => c.id === selectedBlock.category)?.color || '#888'
                                            }}
                                        >
                                            {selectedBlock.category}
                                        </span>
                                    </div>
                                    <div className={styles.aiChatBlockDetailRow}>
                                        <span className={styles.aiChatBlockDetailLabel}>语法</span>
                                        <code>{selectedBlock.syntax}</code>
                                    </div>
                                    <div className={styles.aiChatBlockDetailRow}>
                                        <span className={styles.aiChatBlockDetailLabel}>示例</span>
                                        <code>{selectedBlock.example}</code>
                                    </div>
                                    {selectedBlock.args && selectedBlock.args.length > 0 && (
                                        <div className={styles.aiChatBlockDetailRow}>
                                            <span className={styles.aiChatBlockDetailLabel}>参数</span>
                                            <code>{selectedBlock.args.join(', ')}</code>
                                        </div>
                                    )}
                                    <button
                                        className={styles.aiChatBlockInsertBtn}
                                        onClick={() => handleInsertBlock(selectedBlock)}
                                    >
                                        注入到对话上下文
                                    </button>
                                </div>
                            )}
                        </>
                    ) : schemaError ? (
                        // M2: Show error + retry button instead of permanent spinner
                        <div className={styles.aiChatBlocksLoading}>
                            <span style={{color: '#c0392b'}}>{schemaError}</span>
                            <button
                                onClick={() => setSchemaRetry(n => n + 1)}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.25rem 0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                重试
                            </button>
                        </div>
                    ) : (
                        <div className={styles.aiChatBlocksLoading}>
                            <SpinnerIcon />
                            <span>加载积木列表中…</span>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Message list (chat view only) ===== */}
            {view === 'chat' && (
                <div className={styles.aiChatMessages} ref={messagesRef}>
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`${styles.aiChatMessage} ${styles[msg.role] || ''} ${msg.kind ? styles[`msg-${msg.kind}`] : ''}`}
                        >
                            {/* M23: icon per role/kind — no emoji */}
                            {msg.role === 'error' && <span className={styles.msgIcon}><AlertTriangleIcon /></span>}
                            {msg.kind === 'retry' && <span className={styles.msgIcon}><RefreshCwIcon /></span>}
                            {msg.content && <div style={{ marginBottom: msg.code ? '6px' : 0 }}>{msg.content}</div>}
                            {msg.code && (
                                <AIDiffViewer
                                    oldCode={msg.oldCode || ''}
                                    newCode={msg.code}
                                    targetName={msg.targetName || '当前角色'}
                                    status={msg.status || 'applied'}
                                    appliedBlockCount={msg.appliedBlockCount || 0}
                                    onApply={() => handleApplyMessage(msg.id)}
                                    onFocusBlocks={() => handleFocusMessage(msg.id)}
                                    onDiscard={() => handleDiscardMessage(msg.id)}
                                />
                            )}
                        </div>
                    ))}
                    {busy && (
                        <div className={`${styles.aiChatMessage} ${styles.assistant}`}>
                            <SpinnerIcon />
                            <span style={{marginLeft: '0.5rem'}}>正在生成与编译…</span>
                        </div>
                    )}
                </div>
            )}

            {/* ===== M18: attachments strip + quick actions ===== */}
            {view === 'chat' && attachments.length > 0 && (
                <div className={styles.aiChatAttachments}>
                    <div className={styles.aiChatAttChips}>
                        {attachments.map(att => (
                            <div key={att.id} className={styles.aiChatAttachment}>
                                <div
                                    className={styles.aiChatAttHead}
                                    onClick={() => toggleAttachmentCollapsed(att.id)}
                                    title={att.collapsed ? '展开源码' : '收起源码'}
                                >
                                    <span className={styles.aiChatAttIcon}><PaperclipIcon /></span>
                                    <span className={styles.aiChatAttName}>
                                        {att.spriteName} · {att.blockCount} 块
                                    </span>
                                    <button
                                        className={styles.aiChatAttBtn}
                                        onClick={e => {
                                            e.stopPropagation();
                                            toggleAttachmentCollapsed(att.id);
                                        }}
                                        aria-label={att.collapsed ? '展开' : '收起'}
                                    >
                                        <ChevronDownIcon up={!att.collapsed} />
                                    </button>
                                    <button
                                        className={styles.aiChatAttBtn}
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeAttachment(att.id);
                                        }}
                                        aria-label="删除附件"
                                    >
                                        <XIcon />
                                    </button>
                                </div>
                                {!att.collapsed && (
                                    <pre className={styles.aiChatAttSource}><code>{att.source}</code></pre>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.aiChatQuickActions}>
                        {QUICK_ACTIONS.map(action => {
                            const Icon = action.Icon;
                            return (
                                <button
                                    key={action.id}
                                    className={styles.aiChatQuickAction}
                                    title={action.title}
                                    disabled={busy}
                                    onClick={() => runQuickAction(action)}
                                >
                                    <Icon /> {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== Input area (chat view only) ===== */}
            {view === 'chat' && (
                <div className={styles.aiChatInputArea}>
                    <div className={styles.aiChatInputWrapper}>
                        <textarea
                            ref={textareaRef}
                            className={styles.aiChatTextarea}
                            placeholder="描述你想生成的积木…  (Enter 发送, Shift+Enter 换行)"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={busy}
                        />
                        {/* F3.4: Stop button replaces send button when busy */}
                        {busy ? (
                            <button
                                className={styles.aiChatStopButton}
                                onClick={handleStop}
                                title="停止生成"
                            >
                                <StopIcon />
                            </button>
                        ) : (
                            <button
                                className={styles.aiChatSendButton}
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                title="发送"
                            >
                                <SendIcon />
                            </button>
                        )}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px 2px',
                        fontSize: '11px',
                        color: '#64748b'
                    }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={autoApply}
                                onChange={e => setAutoApply(e.target.checked)}
                                style={{ margin: 0, cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500 }}>自动注入画布并高亮</span>
                        </label>
                        <button
                            onClick={handleExportGoboscript}
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                            }}
                            title="将整个项目导出为 goboscript 源码 (project.gs) 供 AGY 协同编辑"
                        >
                            <span>导出工程 (AGY)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ===== F5.4 Reverse sync status bar ===== */}
            <div
                className={`${styles.aiChatSyncBar} ${styles[`sync-${syncStatus.status}`] || ''}`}
                title={syncStatus.error || ''}
            >
                {syncStatus.status === 'idle' && (
                    <>
                        <span className={styles.syncDot} />
                        <span>项目未同步</span>
                    </>
                )}
                {syncStatus.status === 'syncing' && (
                    <>
                        <SpinnerIcon />
                        <span>同步中…</span>
                    </>
                )}
                {syncStatus.status === 'synced' && (
                    <>
                        <span className={styles.syncDot}>✓</span>
                        <span>
                            项目已同步：{syncStatus.blockCount} 积木 ·{' '}
                            {syncStatus.time ? syncStatus.time.toLocaleTimeString('zh-CN') : ''}
                        </span>
                    </>
                )}
                {syncStatus.status === 'error' && (
                    <>
                        <span className={styles.syncDot}>✗</span>
                        <span>同步失败</span>
                        <button
                            className={styles.syncRetryButton}
                            onClick={syncNow}
                            title={syncStatus.error || '点击重试'}
                        >
                            重试
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

AIChat.propTypes = {
    vm: PropTypes.instanceOf(VM),
    locale: PropTypes.string
};

// M21: read the editor locale from redux so the right-click entry and UI
// chrome can localize (zh-cn / zh-tw / en).
// M28: `selectLocale` is the ACTION creator (it returns {type, locale}), so
// wiring it as a selector fed an object into a PropTypes.string slot. Read the
// reducer state directly — same source language-selector.jsx uses.
const mapStateToProps = state => ({locale: state.locales.locale});
export default connect(mapStateToProps)(AIChat);
