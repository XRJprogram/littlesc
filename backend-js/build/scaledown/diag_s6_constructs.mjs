// diag_s6_constructs.mjs — 复现 S6/S5 的具体语法构造
import { compileSource } from '../../src/server.js';
import fs from 'fs';
import AdmZip from 'adm-zip';

const t = (label, code) => {
  try {
    const buf = compileSource(code);
    console.log(label, '=> OK', buf.length + 'B');
  } catch (e) {
    console.log(label, '=> THROWS:', e.message.slice(0, 120).replace(/\n/g, ' | '));
  }
};

t('T1 minus-eq scalar', 'onflag {\n    x -= 1;\n}\n');
t('T2 minus-eq list index', 'list crop_stage;\nonflag {\n    crop_stage[1] -= 1;\n}\n');
t('T3 plus-eq list index', 'list crop_stage;\nonflag {\n    crop_stage[1] += 1;\n}\n');
t('T4 say CJK concat', 'onflag {\n    var plot = 2;\n    say("虫害！地块" + plot + "作物受损", 1);\n}\n');
t('T5 for-in + if + minus-eq', 'list crop_stage;\nonflag {\n    for plot in crop_stage {\n        if (crop_stage[plot] > 0) {\n            crop_stage[plot] -= 1;\n            say("hit", 1);\n        }\n    }\n}\n');
t('T6 var line-wrap assign', 'onflag {\n    var a =\n    3;\n}\n');
t('T7 else-if one line', 'onflag {\n    if (1 > 0) {\n        say "a";\n    } else if (2 > 0) {\n        say "b";\n    } else {\n        say "c";\n    }\n}\n');
t('T8 nested if in else', 'onflag {\n    if (1 > 0) {\n        say "a";\n    } else {\n        if (2 > 0) {\n            say "b";\n        }\n    }\n}\n');
t('T9 length of expr', 'list dir_queue;\nonflag {\n    if (length of dir_queue > 0) {\n        direction = dir_queue[1];\n    }\n}\n');
t('T10 bare length prefix', 'list dir_queue;\nonflag {\n    x = length dir_queue;\n}\n');
t('T11 length call', 'onflag {\n    x = length("abc");\n}\n');
t('T12 delete-of', 'list q;\nonflag {\n    delete 1 of q;\n}\n');
t('T13 insert-at-of', 'list bx;\nonflag {\n    insert 5 at 1 of bx;\n}\n');
t('T14 upstream insert/delete', 'list bx;\nonflag {\n    insert 5 at bx[1];\n    delete bx[2];\n    delete bx;\n}\n');
t('T15 delete item-of', 'list q;\nonflag {\n    delete item 1 of q;\n}\n');
t('T16 for-in-range 2 args', 'onflag {\n    for i in range(1, 6) {\n        x = i * 2;\n    }\n}\n');
t('T17 range single arg', 'onflag {\n    for k in range(3) {\n        say "x";\n    }\n}\n');
t('T18 delete list named item', 'list item;\nonflag {\n    delete item;\n}\n');
t('T19 while loop', 'onflag {\n    while (true) {\n        x += 1;\n        if (x > 10) {\n            stop_all;\n        }\n    }\n}\n');
t('T20 multiline condition', 'onflag {\n    if (not (a == 1 and\n        b == 2) and\n        c == 3) {\n        say "ok";\n    }\n}\n');

const full = (f) => {
  try {
    const buf = compileSource(fs.readFileSync('tmp_stress/' + f, 'utf8'));
    const pj = JSON.parse(new AdmZip(buf).readAsText('project.json'));
    let n = 0;
    for (const t2 of pj.targets || []) for (const b of Object.values(t2.blocks || {})) if (typeof b === 'object' && !Array.isArray(b)) n++;
    console.log(f, '=> OK blocks=' + n);
  } catch (e) { console.log(f, '=> THROWS:', e.message.slice(0, 140)); }
};
for (const f of ['code_S2.gs', 'code_S4.gs', 'code_S6.gs']) full(f);
