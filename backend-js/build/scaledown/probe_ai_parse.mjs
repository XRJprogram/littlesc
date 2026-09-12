import { _parseAiResponse } from '../../src/server.js';

const NL = String.fromCharCode(10);
let pass = true;
function check(label, cond, got) {
  console.log((cond ? 'OK  ' : 'FAIL') + ' ' + label + (cond ? '' : ' | got: ' + JSON.stringify(got)));
  if (!cond) pass = false;
}

// 1. prose prefix before code is dropped
{
  const [gs] = _parseAiResponse('I need to rewrite this compactly.' + NL + NL + '// code' + NL + 'var phase = 1;' + NL + 'onflag { say(1); }');
  check('prose-prefix stripped', gs.startsWith('// code'), gs.slice(0, 40));
}
// 2. clean code untouched
{
  const [gs] = _parseAiResponse('onflag { say(1); }');
  check('clean code untouched', gs === 'onflag { say(1); }', gs);
}
// 3. EXPLANATION marker still splits
{
  const [gs, ex] = _parseAiResponse('var a = 1;' + NL + 'EXPLANATION: it sets a');
  check('explanation split', gs === 'var a = 1;' && ex === 'it sets a', gs + ' | ' + ex);
}
// 4. prose containing a code-looking word mid-sentence does not false-trigger
//    (first line starts with prose, no valid top-level line later → unchanged)
{
  const src = 'This program lists variables and does stuff.';
  const [gs] = _parseAiResponse(src);
  check('no valid line → unchanged', gs === src, gs);
}
// 5. fenced code still works
{
  const [gs] = _parseAiResponse('```gs' + NL + 'list q = [1];' + NL + '```');
  check('fence stripped', gs === 'list q = [1];', gs);
}

console.log(pass ? 'AI-PARSE PASS' : 'AI-PARSE FAIL');
process.exit(pass ? 0 : 1);
