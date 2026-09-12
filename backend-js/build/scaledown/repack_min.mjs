#!/usr/bin/env node
// repack_min.mjs — rebuild <in>.sb3 with minified project.json (semantically identical),
// so the hardcoded 10MB project.json guard in src/decompiler.js passes. No src changes.
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const [inF, outF] = process.argv.slice(2);
const zip = new AdmZip(fs.readFileSync(inF));
const e = zip.getEntry('project.json');
const pj = JSON.parse(e.getData().toString('utf-8'));
const before = e.header.size;
zip.updateFile('project.json', Buffer.from(JSON.stringify(pj)));
const out = zip.toBuffer();
fs.writeFileSync(outF, out);
const after = new AdmZip(out).getEntry('project.json').header.size;
console.log(`${path.basename(inF)}: project.json ${before} -> ${after} bytes; sb3 ${fs.statSync(inF).size} -> ${out.length}`);
