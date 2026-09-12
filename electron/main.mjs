/**
 * InstanceScratch Desktop — Electron main process
 * 
 * A portable (green) desktop wrapper for the web editor + Node backend.
 * 
 * Architecture:
 *   ┌─────────────────────────────────────────────────┐
 *   │ Electron main (Node.js runtime)                 │
 *   │   ├─ imports & starts backend server (:random)  │
 *   │   ├─ static file server for build/ (:random)    │
 *   │   │    └─ proxies /api/* → backend port         │
 *   │   └─ BrowserWindow → http://127.0.0.1:<webport> │
 *   └─────────────────────────────────────────────────┘
 */
import { app, BrowserWindow, shell, dialog } from 'electron';
import http from 'http';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Prevent multiple instances ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ── Locate app root (works both in dev and packaged mode) ──
const APP_ROOT = app.isPackaged
  ? process.resourcesPath
  : path.join(__dirname, '..');

const BUILD_DIR = path.join(APP_ROOT, 'build');
const BACKEND_DIR = path.join(APP_ROOT, 'backend-js');

// ─────────────────────────────────────────────────────────────
// Find a free TCP port
// ─────────────────────────────────────────────────────────────
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────
// MIME type mapping
// ─────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ─────────────────────────────────────────────────────────────
// Static file server + API proxy
// ─────────────────────────────────────────────────────────────
function createWebServer(buildDir, backendPort) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    // ── Proxy API requests to backend ──
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const targetPath = pathname === '/api' ? '/' : pathname.slice(4);
      const proxyReq = http.request({
        host: '127.0.0.1',
        port: backendPort,
        path: targetPath + url.search,
        method: req.method,
        headers: req.headers,
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (err) => {
        console.error('[proxy] error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: 'Backend unavailable', detail: err.message }));
        }
      });
      req.pipe(proxyReq);
      return;
    }

    // ── Serve static files ──
    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(buildDir, 'editor.html');
    } else {
      // Prevent path traversal
      filePath = path.join(buildDir, pathname.replace(/^\/+/, ''));
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(buildDir))) {
        res.writeHead(403, {'Content-Type': 'text/plain'});
        res.end('Forbidden');
        return;
      }
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // SPA fallback: serve editor.html for client-side routes
        const indexPath = path.join(buildDir, 'editor.html');
        fs.stat(indexPath, (err2) => {
          if (err2) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found: ' + pathname);
            return;
          }
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          fs.createReadStream(indexPath).pipe(res);
        });
        return;
      }
      res.writeHead(200, {'Content-Type': getMimeType(filePath)});
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Start backend server (in-process via dynamic import)
// ─────────────────────────────────────────────────────────────
let backendServer = null;
let backendPort = null;

async function startBackend() {
  backendPort = await getFreePort();

  try {
    // Set environment variables BEFORE importing the backend module,
    // since it reads env vars at module load time.
    process.env.PORT = String(backendPort);
    process.env.HOST = '127.0.0.1';
    process.env.MODEL_PROVIDER = process.env.MODEL_PROVIDER || 'mock';
    process.env.CORS_ALLOW_ORIGINS = process.env.CORS_ALLOW_ORIGINS || 'http://127.0.0.1:*';

    const serverEntry = path.join(BACKEND_DIR, 'src', 'server.js');
    const serverUrl = pathToFileURL(serverEntry).href;
    const mod = await import(serverUrl);
    backendServer = mod.server;

    await new Promise((resolve, reject) => {
      backendServer.once('error', reject);
      backendServer.listen(backendPort, '127.0.0.1', () => resolve());
    });
    console.log(`[backend] started on http://127.0.0.1:${backendPort}`);
    return backendPort;
  } catch (err) {
    console.error('[backend] failed to start in-process:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// Main app
// ─────────────────────────────────────────────────────────────
let mainWindow = null;
let webServer = null;

async function createWindow() {
  // Check build output
  const editorPath = path.join(BUILD_DIR, 'editor.html');
  if (!fs.existsSync(editorPath)) {
    dialog.showErrorBox(
      'littlesc 启动失败',
      `前端构建产物未找到：${editorPath}\n\n请重新构建或下载完整版。`
    );
    app.quit();
    return;
  }

  // Check backend entry
  const serverEntry = path.join(BACKEND_DIR, 'src', 'server.js');
  if (!fs.existsSync(serverEntry)) {
    dialog.showErrorBox(
      'littlesc 启动失败',
      `后端源码未找到：${serverEntry}\n\n请重新构建或下载完整版。`
    );
    app.quit();
    return;
  }

  // Start backend in-process
  try {
    await startBackend();
  } catch (err) {
    dialog.showErrorBox(
      'littlesc 后端启动失败',
      `无法启动后端服务：\n${err.message}\n\n${err.stack || ''}`
    );
    app.quit();
    return;
  }

  // Start web server
  const webPort = await getFreePort();
  webServer = createWebServer(BUILD_DIR, backendPort);
  await new Promise((resolve, reject) => {
    webServer.once('error', reject);
    webServer.listen(webPort, '127.0.0.1', () => resolve());
  });
  console.log(`[web] serving ${BUILD_DIR} on http://127.0.0.1:${webPort}`);

  // Create window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'littlesc',
    autoHideMenuBar: true,
    backgroundColor: '#4C97FF',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${webPort}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const appUrl = `http://127.0.0.1:${webPort}/`;
  await mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────
function shutdownServers() {
  if (webServer) {
    try { webServer.close(); } catch {}
    webServer = null;
  }
  if (backendServer) {
    try { backendServer.close(); } catch {}
    backendServer = null;
  }
}

// Single instance handling
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  if (!gotLock) return;
  createWindow();
});

app.on('window-all-closed', () => {
  shutdownServers();
  app.quit();
});

app.on('before-quit', () => {
  shutdownServers();
});
