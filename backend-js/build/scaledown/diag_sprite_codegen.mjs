import { compileSource } from '../../src/server.js';
import AdmZip from 'adm-zip';

const src = [
  'sprite "Player" {',
  '  var lives = 3;',
  '  onflag { goto(0, 0); }',
  '}',
  '',
  'sprite "Enemy" {',
  '  onflag { move(1); }',
  '}',
  '',
  'onflag { say("go"); }',
].join('\n');

const buf = compileSource(src);
const pj = JSON.parse(new AdmZip(buf).readAsText('project.json'));
for (const t of pj.targets) {
  const blocks = t.blocks || {};
  const n = Object.keys(blocks).filter(k => typeof blocks[k] === 'object').length;
  console.log('target:', t.name, 'blocks:', n, 'isStage:', !!t.isStage);
}
