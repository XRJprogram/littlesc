import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../backend-js/assets');
const backendSrc = path.resolve(__dirname, '../backend-js/src');

// 1) Generate codegen.browser.js (browser-patched goboscript codegen).
await import(path.join(__dirname, 'src/compiler-build/patch-codegen.mjs'));
console.log('codegen.browser.js patched OK');

// Fix relative imports in the generated browser codegen to point at backend-js/src.
const cgPath = path.join(__dirname, 'src/compiler-build/codegen.browser.js');
let cg = fs.readFileSync(cgPath, 'utf8');
cg = cg.replace(/from '\.\/ast_nodes\.js'/g, "from '../../../backend-js/src/ast_nodes.js'");
cg = cg.replace(/from '\.\/blocks\.js'/g, "from '../../../backend-js/src/blocks.js'");
cg = cg.replace(/from '\.\/config\.js'/g, "from '../../../backend-js/src/config.js'");
fs.writeFileSync(cgPath, cg, 'utf8');
console.log('codegen.browser.js imports fixed');

// 2) Generate browser-shims.patched.js with inlined SVG assets.
const shimsSrc = fs.readFileSync(path.join(__dirname, 'src/compiler-build/browser-shims.js'), 'utf8');
const dango = fs.readFileSync(path.join(assetsDir, 'dango-cat.svg'), 'utf8');
const backdrop = fs.readFileSync(path.join(assetsDir, 'cd21514d0531fdffb22204e0ec5ed84a.svg'), 'utf8');
const shimsPatched = shimsSrc
  .replace('{{BACKDROP_SVG}}', JSON.stringify(backdrop))
  .replace('{{DANGO_SVG}}', JSON.stringify(dango));
fs.writeFileSync(path.join(__dirname, 'src/compiler-build/browser-shims.patched.js'), shimsPatched);

// 3) Bundle compiler (goboscript → SB3) for the browser.
await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/compiler-build/entry.js')],
  outfile: path.join(__dirname, 'build/compiler.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('compiler.mjs bundled OK');

// 4) Bundle injector.
await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/lib/injector-entry.js')],
  outfile: path.join(__dirname, 'build/injector.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
});
console.log('injector.mjs bundled OK');

// 5) Bundle background service worker.
await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/background-entry.js')],
  outfile: path.join(__dirname, 'build/background.bundle.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('background.bundle.js bundled OK');
