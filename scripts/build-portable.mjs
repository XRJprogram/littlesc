#!/usr/bin/env node
/**
 * build-portable.mjs — Build littlesc portable Windows release
 *
 * Steps:
 *   1. Build frontend with webpack (production)
 *   2. Ensure backend-js has node_modules installed
 *   3. Install Electron and electron-builder in electron/
 *   4. Package as portable Windows executable
 *
 * Output:
 *   electron/release/littlesc-<version>-portable.exe
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ELECTRON_DIR = path.join(ROOT, 'electron');
const BACKEND_DIR = path.join(ROOT, 'backend-js');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function run(cmd, cwd, opts = {}) {
  console.log(`\n$ ${cmd}  (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', ...opts });
}

function step(name) {
  console.log(`\n${'='.repeat(60)}\n  ▶ ${name}\n${'='.repeat(60)}`);
}

// ─────────────────────────────────────────────────────────────
// 1. Build frontend
// ─────────────────────────────────────────────────────────────
step('1/4 构建前端 (webpack production)');

// Install root dependencies if needed
if (!fs.existsSync(path.join(ROOT, 'node_modules', 'webpack'))) {
  run(`${npmCmd} install --force`, ROOT);
}

// Clean and build
run(`${npmCmd} run build`, ROOT, { env: { ...process.env, NODE_ENV: 'production' } });

if (!fs.existsSync(path.join(ROOT, 'build', 'editor.html'))) {
  console.error('ERROR: Frontend build failed - editor.html not found in build/');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 2. Ensure backend dependencies
// ─────────────────────────────────────────────────────────────
step('2/4 安装后端依赖');

if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
  run(`${npmCmd} install`, BACKEND_DIR);
}

// ─────────────────────────────────────────────────────────────
// 3. Setup electron
// ─────────────────────────────────────────────────────────────
step('3/4 安装 Electron 依赖');

if (!fs.existsSync(path.join(ELECTRON_DIR, 'node_modules', 'electron'))) {
  run(`${npmCmd} install`, ELECTRON_DIR);
}

// ─────────────────────────────────────────────────────────────
// 4. Package
// ─────────────────────────────────────────────────────────────
step('4/4 打包 Windows 便携版');

try {
  run(`${npmCmd} run build:win`, ELECTRON_DIR);
} catch (err) {
  console.error('打包失败:', err.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────
const releaseDir = path.join(ELECTRON_DIR, 'release');
if (fs.existsSync(releaseDir)) {
  const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.exe'));
  console.log(`\n✅ 构建完成！生成的便携版：`);
  for (const f of files) {
    const full = path.join(releaseDir, f);
    const size = (fs.statSync(full).size / (1024 * 1024)).toFixed(1);
    console.log(`  📦 ${path.join(releaseDir, f)}  (${size} MB)`);
  }
} else {
  console.log(`\n⚠️  release 目录未找到，请检查 electron-builder 输出。`);
}
