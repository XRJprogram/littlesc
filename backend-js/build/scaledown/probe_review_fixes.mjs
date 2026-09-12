// probe_review_fixes.mjs — 子代理审查发现的 bug 逐项回归探针
import { compileSource, _validateSource } from '../../src/server.js';
import { sb3ToGoboscript } from '../../src/decompiler.js';
import AdmZip from 'adm-zip';

let pass = 0, fail = 0;
const ck = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('OK ', name); }
  else { fail++; console.log('XX ', name, detail); }
};
const pjOf = (buf) => JSON.parse(new AdmZip(buf).readAsText('project.json'));
const blocksOf = (buf) => {
  const pj = pjOf(buf);
  const out = [];
  for (const t of pj.targets || []) for (const b of Object.values(t.blocks || {})) {
    if (typeof b === 'object' && !Array.isArray(b)) out.push(b);
  }
  return out;
};

// B1 KEYWORDS 原型污染：constructor/toString 等作合法标识符
try {
  const buf = compileSource('proc p constructor {\n}\n\nvar toString = 1;\n\nonflag {\n    toString += 1;\n    p();\n}\n');
  ck('B1 constructor/toString 标识符', blocksOf(buf).length >= 3);
} catch (e) { ck('B1', false, e.message.slice(0, 100)); }

// A1 `//` 上下文敏感：表达式后=整除，语句间隙=注释
try {
  const buf = compileSource('onflag {\n    x = 16 // 4;\n    say x;\n}\n');
  const ops = blocksOf(buf).map(b => b.opcode);
  ck('A1a `x = 16 // 4` 为整除', ops.includes('operator_divide') || ops.includes('operator_mathop'), JSON.stringify(ops));
} catch (e) { ck('A1a', false, e.message.slice(0, 120)); }
try {
  const buf = compileSource('// 头注释\nonflag {\n    x = 1; // 行尾注释\n    say "hi";\n}\n');
  ck('A1b 注释仍可用', blocksOf(buf).length >= 2);
} catch (e) { ck('A1b', false, e.message.slice(0, 120)); }

// A2/A3 顶层 sprite 几何与音量字段
{
  const buf = compileSource('set_x 175;\nset_y -50;\nset_size 80;\npoint_in_direction 90;\nset_volume 40;\nonflag {\n    say "x";\n}\n');
  const sprite = pjOf(buf).targets.find(t => !t.isStage);
  ck('A2 set_x/y/size/direction 落盘',
    sprite.x === 175 && sprite.y === -50 && sprite.size === 80 && sprite.direction === 90,
    JSON.stringify({ x: sprite.x, y: sprite.y, size: sprite.size, direction: sprite.direction }));
  ck('A3 volume 数值化', sprite.volume === 40, 'volume=' + JSON.stringify(sprite.volume));
}

// B2 无类型文件列表声明可解析（文件不存在→空表不崩）
try {
  const buf = compileSource('list q "no_such_file_9x.txt";\nonflag {\n    add 1 to q;\n}\n');
  const lst = pjOf(buf).targets.find(t => !t.isStage).lists;
  const arr = Object.values(lst)[0];
  ck('B2 `list q "f.txt";` 可解析', Array.isArray(arr[1]));
} catch (e) { ck('B2', false, e.message.slice(0, 120)); }

// B3 delete/insert 前瞻歧义：索引为下标表达式时不再产生幽灵 proc
{
  const buf = compileSource('list m;\nlist q;\nonflag {\n    insert 9 at m[1] of q;\n    delete m[1] of q;\n}\n');
  const bl = blocksOf(buf);
  const ghost = bl.filter(b => b.opcode === 'procedures_call' || b.opcode === 'procedures_definition');
  const dels = bl.filter(b => b.opcode === 'data_deleteoflist').length;
  const ins = bl.filter(b => b.opcode === 'data_insertatlist').length;
  ck('B3 无幽灵调用且删插正确', ghost.length === 0 && dels === 1 && ins === 1,
    `ghost=${ghost.length} del=${dels} ins=${ins}`);
}

console.log(`[part1] pass=${pass} fail=${fail}`);
export { };
