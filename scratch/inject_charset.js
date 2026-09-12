const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('../backend-js/node_modules/adm-zip');

const zip = new AdmZip('project/resource/FCE2.3.sb3');
const pj = JSON.parse(zip.readAsText('project.json'));
const textSprite = pj.targets.find(t => t.name === 'Text');

if (!textSprite) {
  console.error('Text sprite not found!');
  process.exit(1);
}

const charsetText = fs.readFileSync('project/charset.txt', 'utf8');

function escapeXml(ch) {
  if (ch === '&') return '&amp;';
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  if (ch === '"') return '&quot;';
  if (ch === "'") return '&apos;';
  return ch;
}

function generateCharSvg(ch) {
  const escaped = escapeXml(ch);
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="0,0,20,20"><g transform="translate(-310,-170)"><g fill="#ff0000" stroke="none" stroke-miterlimit="10" font-family="&quot;BOUTIQUEBITMAP9X9_1&quot;, Sans Serif" font-weight="400" font-size="40"><text transform="translate(320,185) scale(0.5,0.5)" font-size="40" xml:space="preserve" fill="#ff0000" text-anchor="middle"><tspan x="0" dy="0">${escaped}</tspan></text></g></g></svg>`;
}

const existingCostumeNames = new Set(textSprite.costumes.map(c => c.name));
let addedCount = 0;

for (const ch of charsetText) {
  if (ch === '\r' || ch === '\n' || ch === '\t' || ch === ' ') continue;
  if (existingCostumeNames.has(ch)) {
    continue;
  }

  const svgStr = generateCharSvg(ch);
  const svgBuf = Buffer.from(svgStr, 'utf8');
  const assetId = crypto.createHash('md5').update(svgBuf).digest('hex');
  const fileName = `${assetId}.svg`;

  zip.addFile(fileName, svgBuf);

  textSprite.costumes.push({
    name: ch,
    dataFormat: 'svg',
    assetId: assetId,
    md5ext: fileName,
    rotationCenterX: 10,
    rotationCenterY: 10
  });

  existingCostumeNames.add(ch);
  addedCount++;
}

console.log('Total costumes now in Text sprite:', textSprite.costumes.length);
console.log('New costumes added:', addedCount);

zip.updateFile('project.json', Buffer.from(JSON.stringify(pj)));
zip.writeZip('project/resource/FCE2.3.sb3');
console.log('Successfully saved to project/resource/FCE2.3.sb3');
