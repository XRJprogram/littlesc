// ai_response.js — parse a raw LLM reply into [goboscript, explanation].
// Pure functions only (no I/O) so it is directly unit-testable.

// A line that can legitimately START a top-level goboscript program.
const TOP_LEVEL_LINE_RE = /^(\/\/|\/\*|%define\b|%undef\b|onflag\b|onkey\b|onclick\b|onclone\b|onbackdrop\b|onloudness\b|ontimer\b|when\b|target\b|var\b|list\b|cloud\b|proc\b|func\b|define\b|costumes\b|sounds\b|struct\b|enum\b|orphan\b)/;

/**
 * Parse a raw AI response.
 *
 * M19 hardening (user bug report): the model may place the EXPLANATION
 * line FIRST and wrap ONLY THE CODE in markdown fences — the old code
 * stripped fences only when the text STARTED with ```, leaving a trailing
 * fence inside the source ("L34:1 unexpected character `"), and retries
 * could never fix it. New order:
 *   1. drop EVERY fence line anywhere in the reply;
 *   2. lift an `EXPLANATION:` line out of the flow wherever it sits
 *      (its inline content becomes the explanation);
 *   3. strip prose that precedes the first top-level goboscript line.
 */
// M28 (real-API regression): models routinely emit TWO `onflag { }` blocks
// even when the system prompt forbids it. In Scratch those become two
// CONCURRENT hat threads sharing the same global variables and lists, so they
// corrupt each other mid-loop and every result comes out wrong. Merge the
// bodies into the first block, in source order, so the intent (run these
// calls one after another) actually happens.
const ONFLAG_BLOCK_RE = /^[ \t]*onflag[ \t]*\{/gm;

function _matchBrace (src, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < src.length; i++) {
        const ch = src[i];
        if (ch === '"') { // skip string literals so braces inside them don't count
            i++;
            while (i < src.length && src[i] !== '"') {
                if (src[i] === '\\') i++;
                i++;
            }
            continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function _mergeDuplicateOnflag (source) {
    ONFLAG_BLOCK_RE.lastIndex = 0;
    const blocks = [];
    let m;
    while ((m = ONFLAG_BLOCK_RE.exec(source)) !== null) {
        const openIdx = source.indexOf('{', m.index);
        const closeIdx = openIdx < 0 ? -1 : _matchBrace(source, openIdx);
        if (closeIdx < 0) break;
        blocks.push({start: m.index, closeIdx, body: source.slice(openIdx + 1, closeIdx)});
        ONFLAG_BLOCK_RE.lastIndex = closeIdx;
    }
    if (blocks.length <= 1) return source;

    // Drop every onflag block back-to-front so earlier offsets stay valid.
    let out = source;
    for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        out = out.slice(0, b.start) + out.slice(b.closeIdx + 1);
    }
    const merged = 'onflag {' + blocks.map(b => b.body).join('\n') + '}';
    const at = blocks[0].start;
    return out.slice(0, at) + merged + out.slice(at);
}

function parseAiResponse (raw) {
    let text = String(raw || '').trim();

    // 1. Remove every markdown fence line, wherever it appears.
    //    (``` alone, ```goboscript, ~~~ etc. are never valid goboscript.)
    const noFences = text.split('\n').filter(line => {
        const t = line.trim();
        return !(t.startsWith('```') || t.startsWith('~~~'));
    });
    text = noFences.join('\n');

    // 2. Lift the EXPLANATION line out of the flow (first occurrence).
    const marker = 'EXPLANATION:';
    let explanation = '';
    const kept = [];
    for (const line of text.split('\n')) {
        if (!explanation && line.trim().startsWith(marker)) {
            explanation = line.trim().slice(marker.length).trim();
            continue;
        }
        kept.push(line);
    }
    text = kept.join('\n').trim();

    // 3. Tolerant prose-prefix strip: under heavy compression pressure
    //    models sometimes prepend a sentence before the code.
    const rawLines = text.split('\n');
    if (rawLines.length > 0 &&
            !TOP_LEVEL_LINE_RE.test(rawLines[0].trim())) {
        const first = rawLines.findIndex(l =>
            TOP_LEVEL_LINE_RE.test(l.trim()));
        if (first > 0) text = rawLines.slice(first).join('\n');
    }

    text = _mergeDuplicateOnflag(text);

    return [text.trim(), explanation];
}

export {parseAiResponse};
