import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(__dirname, '../../../backend-js/src');
const assetsDir = path.resolve(backend, '../assets');

const codegenSrc = fs.readFileSync(path.join(backend, 'codegen.js'), 'utf8');
const dango = fs.readFileSync(path.join(assetsDir, 'dango-cat.svg'), 'utf8');
const backdrop = fs.readFileSync(path.join(assetsDir, 'cd21514d0531fdffb22204e0ec5ed84a.svg'), 'utf8');

let out = codegenSrc;

// 1. Replace Node imports
out = out.replace(
  /import fs from 'fs';\nimport path from 'path';\nimport crypto from 'crypto';\nimport \{ fileURLToPath \} from 'url';\nimport AdmZip from 'adm-zip';\n/,
  "// [browser] Node imports replaced by build shims\n"
);
// 2. Remove __dirname
out = out.replace(/const __dirname = path\.dirname\(fileURLToPath\(import\.meta\.url\)\);\n/, '');
// 3. _readListDefaultFile fs usage
out = out.replace(
  /const abs = path\.isAbsolute\(p\) \? p : path\.join\(this\.sourceDir, p\);\n\s*if \(fs\.existsSync\(abs\)\) \{\n\s*return fs\.readFileSync\(abs, 'utf8'\)\n\s*\}\n\s*return null;/,
  "return null; // [browser] no filesystem access"
);

// 4. Replace makeSb3 body precisely.
const makeStart = out.indexOf('  makeSb3(project) {');
if (makeStart < 0) throw new Error('makeSb3 not found');
const endMarker = 'return zip.toBuffer();\n  }';
const makeEnd = out.indexOf(endMarker, makeStart);
if (makeEnd < 0) throw new Error('makeSb3 end marker not found');

const newMakeSb3 = `  makeSb3(project) {
    const projectJson = this.genProject(project);
    const defaultBackdropSvg = _BROWSER_ASSETS['cd21514d0531fdffb22204e0ec5ed84a.svg'];
    const dangoCatSvg = _BROWSER_ASSETS['dango-cat.svg'];
    const md5Hex = buf => _md5HexStr(_bytesToStr(buf));
    const backdropHex = md5Hex(defaultBackdropSvg);
    const dangoHex = md5Hex(dangoCatSvg);
    const backdropMd5ext = backdropHex + '.svg';
    const dangoMd5ext = dangoHex + '.svg';
    const DEFAULT_ASSET_BYTES = {
      [backdropMd5ext]: _strToBytes(defaultBackdropSvg),
      [dangoMd5ext]: _strToBytes(dangoCatSvg),
      'cd21514d0531fdffb22204e0ec5ed84a.svg': _strToBytes(defaultBackdropSvg),
      'dango-cat.svg': _strToBytes(dangoCatSvg),
    };
    const assetFiles = {};
    for (const target of projectJson.targets) {
      if (target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: 'backdrop1', assetId: backdropHex, md5ext: backdropMd5ext,
          dataFormat: 'svg', rotationCenterX: 240, rotationCenterY: 180,
        }];
      }
      if (!target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: 'costume1', assetId: dangoHex, md5ext: dangoMd5ext,
          dataFormat: 'svg', rotationCenterX: 240, rotationCenterY: 180,
        }];
      }
      for (const costume of target.costumes) {
        if (costume.md5ext && !assetFiles[costume.md5ext]) {
          if (DEFAULT_ASSET_BYTES[costume.md5ext]) assetFiles[costume.md5ext] = DEFAULT_ASSET_BYTES[costume.md5ext];
          else if (this.userAssets && this.userAssets[costume.md5ext]) assetFiles[costume.md5ext] = this.userAssets[costume.md5ext];
        }
      }
      for (const sound of (target.sounds || [])) {
        if (sound.md5ext && !assetFiles[sound.md5ext] && this.userAssets && this.userAssets[sound.md5ext]) {
          assetFiles[sound.md5ext] = this.userAssets[sound.md5ext];
        }
      }
      const normalizeAsset = (asset) => {
        if (!asset || !asset.md5ext) return;
        if (/^[a-fA-F0-9]{32}\\./.test(asset.md5ext)) return;
        let bytes = assetFiles[asset.md5ext] || DEFAULT_ASSET_BYTES[asset.md5ext];
        if (!bytes) return;
        const ext = (asset.dataFormat || asset.md5ext.split('.').pop() || 'svg').replace(/^\\./, '');
        const hex = md5Hex(bytes);
        delete assetFiles[asset.md5ext];
        asset.md5ext = hex + '.' + ext;
        asset.assetId = hex;
        assetFiles[asset.md5ext] = bytes;
      };
      for (const costume of target.costumes) normalizeAsset(costume);
      for (const sound of (target.sounds || [])) normalizeAsset(sound);
    }
    const zip = new _JSZip();
    zip.file('project.json', JSON.stringify(projectJson, null, 2));
    for (const [filename, data] of Object.entries(assetFiles)) {
      zip.file(filename, _bytesToU8(data));
    }
    return zip.generateAsync({ type: 'uint8array' }).then(u8 => _u8ToArrayBuffer(u8));
  }`;

out = out.slice(0, makeStart) + newMakeSb3 + out.slice(makeEnd + endMarker.length);

fs.writeFileSync(path.join(__dirname, 'codegen.browser.js'), out, 'utf8');
console.log('patched codegen.browser.js written, size=', out.length);
