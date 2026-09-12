import { compileSource, _validateSource } from '../../src/server.js';

const NL = String.fromCharCode(10);
const cases = {
  t1_copy_alone: ['list a;', 'list b;', 'copy list a to b;'].join(NL),
  t2_ai_full: [
    'var scores = [90, 85];',
    'list backup;',
    'copy list scores to backup;',
    'var total = 0;',
    'onflag { for item in backup { total += item; } say(total); }',
  ].join(NL),
  t3_selfcopy_top: ['list a = [1,2];', 'copy list a to a;'].join(NL),
  t4_unknown: ['list a;', 'copy list a to nope;'].join(NL),
  t5_file_default: ['list a "x.txt";', 'list b;', 'copy list a to b;'].join(NL),
  t6_local_bracket: ['onflag {', '  local choices = [-120, 0, 120];', '  say(choices[2]);', '}'].join(NL),
  t7_var_bracket_body: ['onflag {', '  var q = [7, 8, 9];', '  say(q[1]);', '}'].join(NL),
  t8_arr_index_expr: ['onclone {', '  var hx = [-120, 0, 120][random(1, 3)];', '  goto(hx, 0);', '}'].join(NL),
  t9_for_in_array: ['onflag {', '  var s = 0;', '  for i in [1, 2, 3, 4] { s += i; }', '  say(s);', '}'].join(NL),
  t10_ternary: ['onflag {', '  var x = 5;', '  say(x > 3 ? "big" : "small");', '  if (x > 1 ? true : false) { say("yes"); }', '}'].join(NL),
  t11_pow: ['onflag {', '  var d = 3;', '  var dd = d^2 + 2^3^2;', '  say(dd);', '}'].join(NL),
  t12_bare_newline_bool: [
    'proc is_opposite(a, b) {',
    '    return (a == 1 and b == 3) or',
    '           (a == 3 and b == 1) or',
    '           (a == 2 and b == 4);',
    '}',
    'onflag { if (is_opposite(1, 3)) { say("opp"); } }',
  ].join(NL),
  t13_var_newline_init: ['onflag {', '  var q =', '  42;', '  say(q);', '}'].join(NL),
  t14_top_runtime_init: [
    'list boss_hp = [100, 60];',
    'var phase = 1;',
    'var cur = boss_hp[phase];',
    'onflag { say(cur); }',
  ].join(NL),
};

let fail = 0;
for (const [k, v] of Object.entries(cases)) {
  const errs = _validateSource(v).filter(e => e.kind === 'ParseError');
  let sb3 = '';
  try { sb3 = compileSource(v).length + 'B'; }
  catch (e) { sb3 = 'COMPILE-ERR ' + e.message.slice(0, 70); }
  console.log(k, '| parseErrors:', JSON.stringify(errs), '| sb3:', sb3);
}
console.log('DONE');
