// 打包浏览器扩展为可直接导入的 zip。
// 产物：release/InstanceScratch-AI-v{VERSION}.zip
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 从 manifest.json 读取版本
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const version = manifest.version;
const outDir = path.join(__dirname, 'release');
const zipName = `InstanceScratch-AI-v${version}.zip`;
const zipPath = path.join(outDir, zipName);

// 需要打包进扩展的文件
const files = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'injected-main.js',
  'sidepanel.html',
  'sidepanel.css',
  'sidepanel.js',
  'icons/instance-scratch.svg',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'build/compiler.mjs',
  'build/injector.mjs',
  'build/background.bundle.js',
  'README.md',
];

import JSZip from 'jszip';
fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const zip = new JSZip();
for (const f of files) {
  const full = path.join(__dirname, f);
  if (!fs.existsSync(full)) {
    console.warn('  [skip] missing:', f);
    continue;
  }
  zip.file(f, fs.readFileSync(full));
}
const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
fs.writeFileSync(zipPath, buf);
const kb = (buf.length / 1024).toFixed(1);
console.log(`✅ 打包完成：${zipPath} (${kb} KB)`);
console.log(`   版本 v${version}，共 ${files.filter(f => fs.existsSync(path.join(__dirname, f))).length} 个文件`);
