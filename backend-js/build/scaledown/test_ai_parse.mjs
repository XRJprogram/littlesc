import {parseAiResponse} from '../../src/ai_response.js';
import {strict as assert} from 'node:assert';

const CODE = [
    'func add(x, y) {',
    '    return x + y;',
    '}',
    '',
    'onflag {',
    '    say(add(1, 2));',
    '}'
].join('\n');

// Shape 1 — the user's failing case: EXPLANATION first, fenced code after
const [gs1, ex1] = parseAiResponse(
    'EXPLANATION: Defines four arithmetic functions.\n' +
    '\u0060\u0060\u0060goboscript\n' + CODE + '\n\u0060\u0060\u0060');
assert.equal(gs1, CODE, 'shape1 code:\n' + gs1);
assert.equal(ex1, 'Defines four arithmetic functions.');

// Shape 2 — classic: fenced code then EXPLANATION
const [gs2, ex2] = parseAiResponse(
    '\u0060\u0060\u0060\n' + CODE + '\n\u0060\u0060\u0060\n' +
    'EXPLANATION: adds two numbers');
assert.equal(gs2, CODE);
assert.equal(ex2, 'adds two numbers');

// Shape 3 — no fences at all
const [gs3, ex3] = parseAiResponse(CODE + '\nEXPLANATION: plain');
assert.equal(gs3, CODE);
assert.equal(ex3, 'plain');

// Shape 4 — prose prefix before code
const [gs4] = parseAiResponse(
    'Sure! Here is the program:\n' + CODE);
assert.equal(gs4, CODE);

// Shape 5 — no explanation anywhere
const [, ex5] = parseAiResponse(CODE);
assert.equal(ex5, '');

console.log('all parseAiResponse shapes PASS');
