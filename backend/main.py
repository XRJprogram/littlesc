"""Goboscript-py FastAPI backend service.

Provides compilation and validation endpoints for goboscript source code,
wrapping the goboscript-py compiler package.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import os
import sys
import json
import shutil
import tempfile
import logging
import ipaddress
import importlib.util

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

# ── Wire up goboscript-py package ────────────────────────────────────
# The goboscript-py source lives outside this backend directory.  We add
# its parent to sys.path so that ``import goboscript`` works without
# modifying the upstream package.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_BACKEND_DIR))
_GOBOSCRIPT_PKG_PATH = os.environ.get(
    "GOBOSCRIPT_PKG_PATH",
    os.path.join(_PROJECT_ROOT, "shared", "goboscript-unzip", "goboscript-project"),
)
if _GOBOSCRIPT_PKG_PATH not in sys.path:
    sys.path.insert(0, _GOBOSCRIPT_PKG_PATH)

from goboscript.lexer import Lexer, LexError, TokenType, KEYWORDS  # noqa: E402
from goboscript.parser import Parser, ParseError  # noqa: E402
from goboscript.__main__ import compile_project  # noqa: E402
from goboscript import blocks as gs_blocks  # noqa: E402

# M2: Load decompiler via importlib to avoid namespace package collision.
_decompiler_path = os.path.join(_GOBOSCRIPT_PKG_PATH, "backend", "decompiler.py")
_spec = importlib.util.spec_from_file_location("goboscript_decompiler", _decompiler_path)
_decompiler_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_decompiler_module)
sb3_to_goboscript = _decompiler_module.sb3_to_goboscript  # noqa: E402

# ── Load .env file (if present) ─────────────────────────────────────
# L2: Use path relative to __file__ instead of hardcoded absolute path.
_ENV_FILE = os.environ.get("ENV_FILE", os.path.join(_PROJECT_ROOT, ".env"))
if os.path.exists(_ENV_FILE):
    with open(_ENV_FILE) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and "=" in _line and not _line.startswith("#"):
                _key, _, _val = _line.partition("=")
                _val = _val.strip()
                # M1: Strip surrounding quotes (single or double).
                if len(_val) >= 2 and _val[:1] in ('"', "'") and _val[-1:] == _val[:1]:
                    _val = _val[1:-1]
                os.environ.setdefault(_key.strip(), _val)

logger = logging.getLogger("InstanceScratch")
# L3: Only configure our own logger, not the root logger.
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("%(asctime)s [%(name)s] %(levelname)s %(message)s"))
    logger.addHandler(_h)
logger.setLevel(logging.INFO)

# ── Scaffold constants (from `goboscript new`) ──────────────────────
BLANK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>\n'
GOBOSCRIPT_TOML = (
    "no_miscellaneous_limits = false\n"
    "no_sprite_fencing = false\n"
    "frame_interpolation = false\n"
    "high_quality_pen = false\n"
)

# The TurboWarp/Scratch default cat costume (dango-cat.svg).  We embed it
# so that every compiled project ships with at least one visible sprite —
# the Scratch cat — matching the IDE's default state.
_DANGO_CAT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dango-cat.svg")
try:
    with open(_DANGO_CAT_PATH, "r") as _f:
        DANGO_CAT_SVG = _f.read()
except FileNotFoundError:
    DANGO_CAT_SVG = BLANK_SVG  # fallback: blank (cat won't render, but compile still works)

# The TurboWarp default backdrop (cd21514d0531fdffb22204e0ec5ed84a.svg).
# We embed it so that every compiled project ships with the correct
# default backdrop — matching the IDE's initial state.
_DEFAULT_BACKDROP_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "cd21514d0531fdffb22204e0ec5ed84a.svg",
)
try:
    with open(_DEFAULT_BACKDROP_PATH, "r") as _f:
        DEFAULT_BACKDROP_SVG = _f.read()
except FileNotFoundError:
    DEFAULT_BACKDROP_SVG = BLANK_SVG  # fallback

# ── AI chat: provider config & system prompt ──────────────────────

# Provider defaults: base_url, default model, and the env var that
# holds the API key for that provider.
PROVIDER_CONFIGS: dict[str, dict] = {
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "default_model": "deepseek-chat",
        "api_key_env": "DEEPSEEK_API_KEY",
    },
    "kimi": {
        "base_url": "https://api.moonshot.cn/v1",
        "default_model": "moonshot-v1-8k",
        "api_key_env": "KIMI_API_KEY",
    },
    "zhipu": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "default_model": "glm-4-flash",
        "api_key_env": "ZHIPU_API_KEY",
    },
    "mock": {
        "base_url": "",
        "default_model": "",
        "api_key_env": "",
    },
}

# Mock fallback response.
AI_MOCK_GOBOSCRIPT = "onflag { move(10); }"
AI_MOCK_EXPLANATION = "示例：绿旗点击后移动 10 步（mock 回退，未接真实模型）"


# ── Smart mock: keyword-based goboscript generation ──────────────────
# When no real AI API key is configured, this function inspects the
# user's natural-language message and generates a *contextually
# appropriate* goboscript snippet.  This makes the mock useful for
# end-to-end testing of the injection pipeline.
import re as _re

def _smart_mock_goboscript(message: str, project_context: str | None = None) -> str:
    """Generate goboscript based on keywords in the user message.

    This is a **mock** — it does simple keyword matching, not real NLP.
    It recognises common Scratch verbs (move, turn, say, think, play,
    repeat, bounce, etc.) in both Chinese and English.

    When ``project_context`` is provided (non-empty goboscript source
    decompiled from the user's loaded SB3), the mock can simulate
    *incremental modification*: it parses the context for the last
    ``onflag { ... }`` block and emits a modified version, proving the
    AI sees the existing code.
    """
    # L4: Unify — use msg (lowercased) for both keyword matching and number extraction.
    msg = message.lower()

    # Extract numbers from the message (use lowercased string for consistency).
    nums = _re.findall(r'\d+', msg)
    first_num = nums[0] if nums else "10"
    second_num = nums[1] if len(nums) > 1 else first_num

    # ── Scenario 3: algorithm generation ─────────────────────────────
    # "冒泡排序" / "bubble sort"
    # L8: Replaced unverifiable bubble-sort mock with a simple, verified example.
    if any(kw in msg for kw in ['冒泡', 'bubble']):
        return (
            'onflag {\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '}\n'
        )

    # "正则" / "regex" — a simple pattern matcher using string ops
    if any(kw in msg for kw in ['正则', 'regex']):
        return (
            'var s = "hello123world";\n'
            'var i = 0;\n'
            'var match = "";\n'
            'onflag {\n'
            '  repeat(length(s)) {\n'
            '    if (letter(s, i) >= "0" and letter(s, i) <= "9") {\n'
            '      match = concat(match, letter(s, i));\n'
            '    }\n'
            '    i = i + 1;\n'
            '  }\n'
            '  say(match, 2);\n'
            '}\n'
        )

    # "排序" / "sort" (general — fall through to simple pattern if not matched)
    # L8: Replaced unverifiable sort mock with a simple, verified example.
    if any(kw in msg for kw in ['排序', 'sort']):
        return (
            'onflag {\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '  move(10);\n'
            '  turn_right(15);\n'
            '}\n'
        )

    # ── Scenario 2: incremental modification based on project_context ──
    # If context is loaded and user asks to "add"/"fix"/"modify",
    # parse the last onflag block from the context and return it
    # with a small modification — proving the AI sees the existing code.
    # L5: NOTE — this is a mock that uses simple text scanning. It may be
    # misled by string literals containing "onflag" or braces. Acceptable
    # for mock purposes; for production, use Lexer token-level scanning.
    if project_context and any(kw in msg for kw in [
        '添加', '增加', '加', 'fix', '修复', '改', '修改', '增强', 'enhance', 'add'
    ]):
        # Find the last onflag { ... } block in the context.
        # We do a simple scan: find all "onflag" positions, take the last.
        ctx = project_context or ""
        last_onflag = ctx.rfind("onflag")
        if last_onflag != -1:
            # Find the matching closing brace at the same depth.
            # Start scanning after "onflag" looking for "{".
            brace_start = ctx.find("{", last_onflag)
            if brace_start != -1:
                depth = 0
                end = -1
                for i in range(brace_start, len(ctx)):
                    if ctx[i] == "{":
                        depth += 1
                    elif ctx[i] == "}":
                        depth -= 1
                        if depth == 0:
                            end = i
                            break
                if end != -1:
                    # Extract the body (between brace_start+1 and end)
                    body = ctx[brace_start + 1:end]
                    # Insert a marker line: a say() block before the closing
                    # brace, proving the AI modified the existing code.
                    insertion = '\n    say("✓ 已增量修改", 1);\n'
                    # Check if the body already ends with whitespace/newline
                    if body and not body.endswith('\n'):
                        body = body + '\n'
                    return (
                        f'onflag {{{body}{insertion}}}\n'
                    )

    # ── Keyword detection (original behaviour) ──────────────────────
    # Order matters: check compound/intent-specific keywords before
    # simple ones (e.g. "repeat" before "move" so "重复4次移动" works).

    # "repeat" / "重复" / "循环"
    if any(kw in msg for kw in ['重复', '循环', 'repeat', 'forever', '一直']):
        if 'forever' in msg or '一直' in msg or '不停' in msg:
            return 'onflag { forever { move(10); if_on_edge_bounce; } }'
        count = first_num
        return f'onflag {{ repeat({count}) {{ move(50); turn_right(90); }} }}'

    # "bounce" / "反弹"
    if any(kw in msg for kw in ['反弹', 'bounce', '碰壁']):
        return 'onflag { forever { move(10); if_on_edge_bounce; } }'

    # "say" / "说"
    if any(kw in msg for kw in ['说', 'say', 'hello', '你好', 'hi ']):
        text = '你好！' if ('你好' in msg or 'hello' in msg.lower()) else 'Hello!'
        return f'onflag {{ say("{text}", 2); }}'

    # "move" / "移动" / "走"
    if any(kw in msg for kw in ['移动', '走', 'move', '步']):
        steps = first_num
        return f'onflag {{ move({steps}); }}'

    # "turn" / "旋转" / "转"
    if any(kw in msg for kw in ['转', '旋转', 'turn', 'rotate']):
        deg = first_num
        if 'left' in msg or '左' in msg:
            return f'onflag {{ turn_left({deg}); }}'
        return f'onflag {{ turn_right({deg}); }}'

    # "play sound" / "播放声音"
    if any(kw in msg for kw in ['声音', 'sound', '播放', 'play']):
        return 'onflag { play_sound_until_done("meow"); }'

    # "change color" / "颜色" / "特效"
    if any(kw in msg for kw in ['颜色', 'color', '特效', 'effect']):
        return 'onflag { set_color_effect(25); }'

    # "wait" / "等待"
    if any(kw in msg for kw in ['等待', 'wait']):
        secs = first_num
        return f'onflag {{ wait({secs}); }}'

    # "stop" / "停止"
    if any(kw in msg for kw in ['停止', 'stop', '全部']):
        return 'onflag { stop_all; }'

    # ── Fallback: default mock ──────────────────────────────────────
    return AI_MOCK_GOBOSCRIPT


def _get_ai_provider_config() -> dict:
    """Resolve the active provider config from env vars.

    Priority (highest → lowest):
    1. Explicit overrides: MODEL_PROVIDER, API_KEY, BASE_URL, MODEL_NAME
    2. Provider-specific key env (DEEPSEEK_API_KEY / KIMI_API_KEY / ZHIPU_API_KEY)
    3. Fallback to "mock"
    """
    provider_name = os.environ.get("MODEL_PROVIDER", "deepseek").lower()

    # If MODEL_PROVIDER is explicitly "mock", or if no provider has a key,
    # we still resolve the config for logging but will use mock response.
    if provider_name not in PROVIDER_CONFIGS:
        provider_name = "deepseek"

    cfg = PROVIDER_CONFIGS[provider_name].copy()
    cfg["provider"] = provider_name

    # Override with explicit env vars if set.
    cfg["base_url"] = os.environ.get("BASE_URL", cfg["base_url"])
    cfg["model"] = os.environ.get("MODEL_NAME", cfg["default_model"])

    # Resolve API key: explicit API_KEY > provider-specific env.
    api_key = os.environ.get("API_KEY") or os.environ.get(cfg["api_key_env"], "")
    cfg["api_key"] = api_key

    return cfg


def _build_ai_system_prompt() -> str:
    """Build the system prompt dynamically from /schema data.

    Injects the full keyword list + block reference (138 blocks, 67 keywords)
    so the model generates goboscript-compliant code.

    Token-efficient format: one compact line per block
    (``name(args) → example``), no separate args column.
    """
    # M5: Cache the system prompt at module level to avoid recomputing
    # on every /ai/chat request.
    global _CACHED_SYSTEM_PROMPT
    if _CACHED_SYSTEM_PROMPT is not None:
        return _CACHED_SYSTEM_PROMPT

    schema = get_schema()

    from collections import defaultdict
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for b in schema["blocks"]:
        by_cat[b["category"]].append(b)

    lines: list[str] = []
    lines.append(
        "You are a goboscript code assistant. "
        "goboscript is a text language that compiles to Scratch 3.0 (.sb3)."
    )

    # ── Keywords (compact: space-separated, 12 per line) ──
    kws = schema["keywords"]
    lines.append(f"\n## Keywords ({len(kws)})")
    for i in range(0, len(kws), 12):
        lines.append(" ".join(kws[i:i + 12]))

    # ── Block Reference (compact: name(args) → example) ──
    cat_order = [
        "event", "motion", "looks", "sound", "control",
        "sensing", "pen", "music", "operator", "data", "other",
    ]
    lines.append(f"\n## Blocks ({len(schema['blocks'])})")
    for cat in cat_order:
        if cat not in by_cat:
            continue
        blocks = by_cat[cat]
        lines.append(f"[{cat}]")
        for b in blocks:
            lines.append(f"  {b['syntax']} → {b['example']}")

    lines.append("\n## Grammar")
    lines.append(schema["grammar_notes"])

    # ── Few-shot: Chinese → goboscript mappings (improves accuracy) ──
    lines.append("\n## Examples (user → goboscript)")
    lines.append('  "绿旗后移动10步" → onflag { move(10); }')
    lines.append('  "说你好2秒" → onflag { say("你好", 2); }')
    lines.append('  "重复4次移动50转弯90" → onflag { repeat(4) { move(50); turn_right(90); } }')
    lines.append('  "碰到边缘就左转15度" → onflag { if (touching_edge) { turn_left(15); } }')

    lines.append("\n## Output Format")
    lines.append(
        "Output ONLY goboscript code, then a line starting with "
        "EXPLANATION: followed by a brief one-sentence explanation "
        "in Chinese. No markdown fences."
    )
    lines.append("Example:\nonflag { move(10); }\nEXPLANATION: 绿旗点击后移动10步")

    _CACHED_SYSTEM_PROMPT = "\n".join(lines)
    return _CACHED_SYSTEM_PROMPT


# M5: Module-level cache for the system prompt.
_CACHED_SYSTEM_PROMPT: str | None = None


class CompileRequest(BaseModel):
    source: str


class ValidateRequest(BaseModel):
    source: str


class ValidateError(BaseModel):
    line: int
    column: int
    message: str
    kind: str = "error"


class ValidateResponse(BaseModel):
    success: bool
    errors: list[ValidateError]


class HealthResponse(BaseModel):
    status: str
    goboscript_version: str


# ── Helpers ──────────────────────────────────────────────────────────


def _offset_to_linecol(source: str, offset: int) -> tuple[int, int]:
    """Convert a character offset into 1-based (line, column)."""
    if offset < 0:
        return 1, 1
    line = 1
    col = 1
    for i, ch in enumerate(source):
        if i >= offset:
            break
        if ch == "\n":
            line += 1
            col = 1
        else:
            col += 1
    return line, col


# ── Schema builder ─────────────────────────────────────────────────

# Map opcode prefix → human-readable category.
_CATEGORY_MAP = {
    "motion_": "motion",
    "looks_": "looks",
    "sound_": "sound",
    "control_": "control",
    "event_": "event",
    "sensing_": "sensing",
    "pen_": "pen",
    "music_": "music",
    "operator_": "operator",
    "data_": "data",
}

# Sample values for common argument types (used to generate examples).
_ARG_SAMPLE = {
    "STEPS": "10", "DEGREES": "15", "DX": "10", "DY": "5",
    "X": "0", "Y": "0", "SECS": "2", "DURATION": "1",
    "MESSAGE": '"Hello"', "QUESTION": '"What?"',
    "SIZE": "100", "CHANGE": "10", "VALUE": "50",
    "COLOR": '"#ff0000"', "BROADCAST_INPUT": '"message1"',
    "NUM": "1", "NUM1": "1", "NUM2": "2",
    "FROM": "1", "TO": "10",
    "STRING": '"text"', "STRING1": '"abc"', "STRING2": '"b"',
    "LETTER": "1", "NOTE": "60", "BEATS": "0.5", "DRUM": "1",
    "TEMPO": "120", "INSTRUMENT": "1", "VOLUME": "50",
    "ITEM": "1", "PROPERTY": '"x position"',
    "OBJECT": '"Sprite1"', "TOWARDS": '"Sprite1"',
    "TO": '"_random_"', "COSTUME": '"costume1"',
    "BACKDROP": '"backdrop1"',
}


def _opcode_to_category(opcode: str) -> str:
    for prefix, cat in _CATEGORY_MAP.items():
        if opcode.startswith(prefix):
            return cat
    return "other"


def _arg_sample(arg_name: str) -> str:
    return _ARG_SAMPLE.get(arg_name, "0")


def _build_syntax(name: str, args: list[str]) -> str:
    if not args:
        return name
    return f"{name}({', '.join(a.lower() for a in args)})"


def _build_example(name: str, args: list[str]) -> str:
    if not args:
        return f"{name};"
    vals = ", ".join(_arg_sample(a) for a in args)
    return f"{name}({vals});"


def _build_schema() -> dict:
    """Build the goboscript schema by introspecting blocks.py + lexer.py."""
    block_entries: list[dict] = []

    # --- Statement blocks (from _BLOCK_FROM_SHAPE) ---
    for gs_name, blk in gs_blocks._BLOCK_FROM_SHAPE.items():
        spec = gs_blocks._BLOCK_SPEC[blk]
        opcode = spec.opcode
        category = _opcode_to_category(opcode)
        args = list(spec.args)
        block_entries.append({
            "name": gs_name,
            "category": category,
            "syntax": _build_syntax(gs_name, args),
            "example": _build_example(gs_name, args),
            "args": args,
        })

    # --- Overloaded statement blocks (from _BLOCK_OVERLOADS) ---
    for gs_name, variants in gs_blocks._BLOCK_OVERLOADS.items():
        for blk in variants:
            spec = gs_blocks._BLOCK_SPEC[blk]
            opcode = spec.opcode
            category = _opcode_to_category(opcode)
            args = list(spec.args)
            # Use variant name to distinguish overloads.
            tag = f" ({len(args)} args)"
            block_entries.append({
                "name": gs_name + tag,
                "category": category,
                "syntax": _build_syntax(gs_name, args),
                "example": _build_example(gs_name, args),
                "args": args,
            })

    # --- Reporter blocks (from _REPR_FROM_SHAPE) ---
    for gs_name, rep in gs_blocks._REPR_FROM_SHAPE.items():
        spec = gs_blocks._REPR_SPEC[rep]
        opcode = spec.opcode
        category = _opcode_to_category(opcode)
        args = list(spec.args)
        block_entries.append({
            "name": gs_name,
            "category": category,
            "syntax": _build_syntax(gs_name, args),
            "example": _build_example(gs_name, args),
            "args": args,
        })

    # --- Keywords ---
    keywords = sorted(KEYWORDS.keys())

    # --- Grammar examples ---
    examples = [
        "onflag { move(10); }",
        "onflag { repeat(4) { move(50); turn_right(90); } }",
        "onflag { say(\"Hello!\", 2); wait(1); move(20); }",
        "onflag { if (touching_edge) { turn_left(15); } }",
        "onkey(\"space\") { forever { move(5); if_on_edge_bounce; } }",
    ]

    grammar_notes = (
        "Statements end with `;` or newline. "
        "Blocks use `{ ... }` braces. "
        "Events: `onflag`, `onkey(\"key\")`, `onclick`, `forever`. "
        "Control: `repeat(n) { ... }`, `if (cond) { ... }`, `else { ... }`. "
        "Variables: `var name = value;`. "
        "Operators: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`, `and`, `or`, `not`. "
        "Overloaded calls: `say(msg)` vs `say(msg, secs)`, "
        "`goto(sprite)` vs `goto(x, y)`, `glide(x, y, secs)` vs `glide(target, secs)`, "
        "`clone` vs `clone(sprite)`."
    )

    return {
        "keywords": keywords,
        "blocks": block_entries,
        "examples": examples,
        "grammar_notes": grammar_notes,
    }


# Build once at import time (cached).
_SCHEMA_CACHE: dict | None = None


def get_schema() -> dict:
    global _SCHEMA_CACHE
    if _SCHEMA_CACHE is None:
        _SCHEMA_CACHE = _build_schema()
    return _SCHEMA_CACHE


def _prepare_project_dir(source: str) -> str:
    """Create a temp project directory.

    Layout (matches ``goboscript new`` scaffold):
      stage.gs   — Stage target, minimal (backdrop only)
      sprite1.gs — Sprite target, **user code goes here** + cat costume
      cd21514d…svg — TurboWarp default backdrop for the Stage
      dango-cat.svg — the Scratch cat costume for Sprite1
      goboscript.toml — compiler config

    Rationale: putting user code in ``sprite1.gs`` (not ``stage.gs``)
    ensures that motion/looks blocks like ``move()``, ``say()`` land on a
    sprite, and the cat costume declaration guarantees a visible actor.
    The default backdrop (cd21514d…) matches TurboWarp's initial state so
    that even a full vm.loadProject() preserves the expected look.
    """
    tmp = tempfile.mkdtemp(prefix="gobs_")

    # Stage: minimal — just the default TurboWarp backdrop, no user blocks.
    with open(os.path.join(tmp, "stage.gs"), "w") as f:
        f.write('costumes "cd21514d0531fdffb22204e0ec5ed84a.svg";\n')

    # Sprite1: prepend a cat-costume declaration so the sprite is always
    # visible.  If the user's code also declares ``costumes``, the parser
    # will add those as additional costumes (no conflict).
    with open(os.path.join(tmp, "sprite1.gs"), "w") as f:
        f.write('costumes "dango-cat.svg";\n')
        f.write(source)
        if not source.endswith("\n"):
            f.write("\n")

    # Assets
    with open(os.path.join(tmp, "cd21514d0531fdffb22204e0ec5ed84a.svg"), "w") as f:
        f.write(DEFAULT_BACKDROP_SVG)
    with open(os.path.join(tmp, "dango-cat.svg"), "w") as f:
        f.write(DANGO_CAT_SVG)

    with open(os.path.join(tmp, "goboscript.toml"), "w") as f:
        f.write(GOBOSCRIPT_TOML)
    return tmp


def _validate_source(source: str) -> list[ValidateError]:
    """Run lexer + parser to collect structured errors with line/column."""
    errors: list[ValidateError] = []

    # 1. Lex
    try:
        tokens = Lexer(source).lex()
    except LexError as e:
        line, col = _offset_to_linecol(source, e.offset)
        errors.append(ValidateError(
            line=line, column=col, message=e.message, kind="LexError"
        ))
        return errors  # Can't parse without tokens.

    # 2. Parse — call declaration() directly so we catch ParseError
    #    with its original message before parse()'s internal recovery
    #    swallows it.
    parser = Parser(tokens)
    parser.skip_noise()
    while not parser.is_at_end():
        try:
            parser.declaration()
        except ParseError as e:
            line, col = _offset_to_linecol(source, e.pos)
            errors.append(ValidateError(
                line=line, column=col, message=e.message, kind="ParseError"
            ))
            # M6: Recovery: use Parser's public method instead of
            # directly mutating parser.pos.
            parser.skip_to_next_statement()
            parser.skip_noise()
            continue
        parser.skip_noise()

    return errors


# ── FastAPI app ─────────────────────────────────────────────────────

app = FastAPI(title="Goboscript-py Compiler Service", version="1.0.0")

# S2: Restrict CORS to known frontend origins via env var.
# Format: comma-separated list of origins (e.g. "https://app.example.com,http://localhost:3000").
# If CORS_ALLOW_ORIGINS is not set or empty, default to localhost dev origins only.
_cors_env = os.environ.get("CORS_ALLOW_ORIGINS", "").strip()
if _cors_env:
    _cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    _cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", response_model=HealthResponse)
async def health():
    import goboscript
    return HealthResponse(
        status="ok",
        goboscript_version=getattr(goboscript, "__version__", "unknown"),
    )


@app.post("/compile")
async def compile_endpoint(req: CompileRequest):
    """Compile goboscript source into an .sb3 file.

    Returns the .sb3 file as a downloadable binary attachment, with the
    block count in the ``X-Block-Count`` header.
    """
    from fastapi.responses import Response

    project_dir = _prepare_project_dir(req.source)
    output_path = os.path.join(project_dir, "project.sb3")

    # H4/L1: Unified try/finally to guarantee temp dir cleanup on all paths.
    try:
        try:
            success, block_count = compile_project(project_dir, output_path)
        except (LexError, ParseError) as exc:
            # Surface lex/parse errors with structured line/column info.
            offset = getattr(exc, "offset", getattr(exc, "pos", 0))
            line, col = _offset_to_linecol(req.source, offset)
            raise HTTPException(status_code=400, detail={
                "success": False,
                "error": exc.message,
                "line": line,
                "column": col,
                "kind": type(exc).__name__,
            })
        except Exception as exc:
            raise HTTPException(status_code=400, detail={
                "success": False,
                "error": str(exc),
                "kind": type(exc).__name__,
            })

        if not success or not os.path.exists(output_path):
            raise HTTPException(status_code=400, detail={
                "success": False,
                "error": "Compilation failed (stage.gs not found or unknown error)",
            })

        # H4: Read the output file inside the try block so that
        # any IO error also triggers cleanup via finally.
        with open(output_path, "rb") as f:
            sb3_data = f.read()
    finally:
        # H4/L1: Guaranteed cleanup regardless of success or failure.
        shutil.rmtree(project_dir, ignore_errors=True)

    return Response(
        content=sb3_data,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="project.sb3"',
            "X-Block-Count": str(block_count),
        },
    )


@app.post("/validate", response_model=ValidateResponse)
async def validate_endpoint(req: ValidateRequest, deep: bool = False):
    """Validate goboscript source without producing an .sb3.

    Returns structured errors with line/column information.

    M8: By default only does lex+parse (fast). Pass ``?deep=true`` to
    also run a full compile_project (catches visitor/codegen errors)
    at the cost of disk IO + CPU.
    """
    errors = _validate_source(req.source)

    # If lex + parse pass, and deep mode is requested, also try a full
    # compile to catch visitor/codegen errors.
    if not errors and deep:
        project_dir = _prepare_project_dir(req.source)
        output_path = os.path.join(project_dir, "project.sb3")
        try:
            compile_project(project_dir, output_path)
        except (LexError, ParseError) as e:
            offset = getattr(e, "offset", getattr(e, "pos", 0))
            line, col = _offset_to_linecol(req.source, offset)
            errors.append(ValidateError(
                line=line, column=col, message=str(e),
                kind=type(e).__name__,
            ))
        except Exception as e:
            errors.append(ValidateError(
                line=0, column=0, message=str(e),
                kind=type(e).__name__,
            ))
        finally:
            shutil.rmtree(project_dir, ignore_errors=True)

    return ValidateResponse(success=len(errors) == 0, errors=errors)


# ── F6.4: SB3 ZIP bomb / path traversal protection ──────────────────
# Safety limits applied to all incoming .sb3 uploads before they are
# unpacked or parsed by the decompiler.
SB3_MAX_TOTAL_UNCOMPRESSED = 50 * 1024 * 1024   # 50 MB
SB3_MAX_FILE_COUNT = 1000
SB3_MAX_PROJECT_JSON = 10 * 1024 * 1024          # 10 MB


def _validate_sb3_safety(sb3_bytes: bytes) -> None:
    """Validate raw .sb3 bytes for ZIP-bomb and path-traversal attacks.

    Raises ``ValueError`` with a human-readable message on any violation.
    This is called before ``sb3_to_goboscript`` so that a malicious
    archive can never reach the parser.
    """
    import io
    import zipfile

    # ── Pre-check: compressed payload size ──────────────────────────
    if len(sb3_bytes) > SB3_MAX_TOTAL_UNCOMPRESSED:
        raise ValueError(
            f"SB3 文件过大（{len(sb3_bytes) / 1024 / 1024:.1f}MB > "
            f"{SB3_MAX_TOTAL_UNCOMPRESSED / 1024 / 1024:.0f}MB 限制）"
        )

    # ── Open as ZIP ──────────────────────────────────────────────────
    try:
        zf = zipfile.ZipFile(io.BytesIO(sb3_bytes))
    except zipfile.BadZipFile as exc:
        raise ValueError(f"无效的 SB3 ZIP 文件：{exc}") from exc

    infos = zf.infolist()

    # ── File count limit ────────────────────────────────────────────
    if len(infos) > SB3_MAX_FILE_COUNT:
        raise ValueError(
            f"SB3 文件数过多（{len(infos)} > {SB3_MAX_FILE_COUNT} 限制）"
        )

    # ── Per-file: path traversal + cumulative uncompressed size ─────
    # M7: Use path-segment-based check instead of substring ".."
    # to avoid false positives on legitimate names like "a..b.svg".
    import re as _re_mod
    _win_drive_re = _re_mod.compile(r'^[A-Za-z]:')

    total_uncompressed = 0
    project_json_size = 0

    for info in infos:
        name = info.filename

        # Path traversal: reject absolute paths or ".." path segments.
        normalized = name.replace("\\", "/")
        segments = normalized.split("/")
        for seg in segments:
            if seg == "..":
                raise ValueError(
                    f"SB3 包含路径穿越的文件名：{name}"
                )
        if normalized.startswith("/"):
            raise ValueError(
                f"SB3 包含绝对路径文件名：{name}"
            )
        # Reject Windows-style absolute paths (C:\…)
        if _win_drive_re.match(name):
            raise ValueError(
                f"SB3 包含绝对路径文件名：{name}"
            )

        total_uncompressed += info.file_size
        if total_uncompressed > SB3_MAX_TOTAL_UNCOMPRESSED:
            raise ValueError(
                f"SB3 解压后总大小过大（"
                f"{total_uncompressed / 1024 / 1024:.1f}MB > "
                f"{SB3_MAX_TOTAL_UNCOMPRESSED / 1024 / 1024:.0f}MB 限制）"
            )

        if name == "project.json":
            project_json_size = info.file_size

    # ── project.json must exist and be within size limit ────────────
    if project_json_size == 0:
        raise ValueError("SB3 缺少 project.json")

    if project_json_size > SB3_MAX_PROJECT_JSON:
        raise ValueError(
            f"project.json 过大（"
            f"{project_json_size / 1024 / 1024:.1f}MB > "
            f"{SB3_MAX_PROJECT_JSON / 1024 / 1024:.0f}MB 限制）"
        )

    # S3: Streaming read verification — the central directory's file_size
    # can be forged by a malicious archive. We re-read project.json with
    # a streaming byte counter to ensure the actual decompressed size
    # matches the declared size and stays within limits.
    try:
        with zf.open("project.json") as pj_stream:
            actual_pj_size = 0
            while True:
                chunk = pj_stream.read(65536)
                if not chunk:
                    break
                actual_pj_size += len(chunk)
                if actual_pj_size > SB3_MAX_PROJECT_JSON:
                    raise ValueError(
                        f"project.json 实际解压大小超过限制"
                        f"（>{SB3_MAX_PROJECT_JSON / 1024 / 1024:.0f}MB）"
                    )
            if actual_pj_size != project_json_size:
                raise ValueError(
                    f"project.json 实际大小（{actual_pj_size}）与"
                    f"声明大小（{project_json_size}）不符，可能为 ZIP 炸弹"
                )
    except KeyError:
        raise ValueError("SB3 缺少 project.json")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"project.json 读取校验失败：{exc}") from exc


@app.post("/decompile")
async def decompile_endpoint(request: Request):
    """Decompile an .sb3 file back into goboscript source.

    Accepts the raw .sb3 bytes as the request body
    (Content-Type: application/octet-stream) or as a multipart file
    upload (field name ``file``).

    Returns ``{"source": str, "targets": list}``.
    """
    content_type = request.headers.get("content-type", "")

    # H2: Enforce request body size limit (50 MB) before reading.
    # The content-length header is advisory; we also check after read.
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > SB3_MAX_TOTAL_UNCOMPRESSED:
        raise HTTPException(status_code=413, detail={
            "error": "请求体过大",
            "detail": f"最大允许 {SB3_MAX_TOTAL_UNCOMPRESSED // (1024*1024)}MB",
        })

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=422, detail={
                "error": "No file uploaded",
                "detail": "Expected a multipart upload with field 'file'.",
            })
        sb3_bytes = await upload.read()
    else:
        # H2: Streaming read with cumulative byte count.
        sb3_bytes = b""
        async for chunk in request.stream():
            sb3_bytes += chunk
            if len(sb3_bytes) > SB3_MAX_TOTAL_UNCOMPRESSED:
                raise HTTPException(status_code=413, detail={
                    "error": "请求体过大",
                    "detail": f"最大允许 {SB3_MAX_TOTAL_UNCOMPRESSED // (1024*1024)}MB",
                })

    if not sb3_bytes:
        raise HTTPException(status_code=422, detail={
            "error": "Empty request body",
            "detail": "Expected .sb3 bytes (application/octet-stream or multipart).",
        })

    # ── F6.4: safety validation before decompilation ────────────────
    try:
        _validate_sb3_safety(sb3_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={
            "error": "SB3 安全校验失败",
            "detail": str(exc),
        })

    try:
        result = sb3_to_goboscript(sb3_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={
            "error": "SB3 parse error",
            "detail": str(exc),
        })
    except Exception as exc:
        raise HTTPException(status_code=422, detail={
            "error": type(exc).__name__,
            "detail": str(exc),
        })

    return {"source": result["source"], "targets": result.get("targets", [])}


# ── AI chat models ──────────────────────────────────────────────────


class AIChatMessage(BaseModel):
    # H5: Restrict role to a whitelist to prevent system message injection.
    role: Literal["user", "assistant"]
    # H2: Limit single message content to 32K characters.
    content: str = Field(max_length=32768)


class AIChatRequest(BaseModel):
    messages: list[AIChatMessage]
    project_context: str | None = None
    # ── BYOK (Bring Your Own Key) fields ──
    # When provided in the request body, these take **priority** over all
    # env-var config.  This lets the frontend pass user-supplied credentials
    # per-request without storing them server-side.
    # Supported providers (all OpenAI-compatible):
    #   - DeepSeek: base_url=https://api.deepseek.com, model=deepseek-chat
    #   - Kimi:     base_url=https://api.moonshot.cn/v1, model=moonshot-v1-8k
    #   - 智谱:     base_url=https://open.bigmodel.cn/api/paas/v4, model=glm-4-flash
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


class AIChatResponse(BaseModel):
    goboscript: str
    explanation: str


# ── AI chat helpers ─────────────────────────────────────────────────


def _parse_ai_response(raw: str) -> tuple[str, str]:
    """Split the model output into (goboscript, explanation).

    The system prompt instructs the model to output goboscript code
    followed by a line starting with ``EXPLANATION:``.  We also strip
    any markdown fences the model may have added despite instructions.
    """
    # Strip markdown code fences if present.
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first fence line.
        lines = lines[1:]
        # Remove trailing fence line if present.
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    # Split on EXPLANATION: marker.
    marker = "EXPLANATION:"
    # M3: Use find (first occurrence) instead of rfind (last occurrence)
    # so that an EXPLANATION line inside a string literal in the code
    # doesn't cause the split point to jump past it.
    idx = text.find(marker)
    if idx != -1:
        goboscript = text[:idx].strip()
        explanation = text[idx + len(marker):].strip()
    else:
        # No marker — treat everything as goboscript.
        goboscript = text.strip()
        explanation = ""

    return goboscript, explanation


# ── S1: SSRF prevention for BYOK base_url ───────────────────────────

# Private / internal network ranges that must never be reachable
# from a user-supplied BYOK base_url.
_PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # loopback
    ipaddress.ip_network("10.0.0.0/8"),         # private class A
    ipaddress.ip_network("172.16.0.0/12"),      # private class B
    ipaddress.ip_network("192.168.0.0/16"),     # private class C
    ipaddress.ip_network("169.254.0.0/16"),     # link-local (AWS metadata)
    ipaddress.ip_network("100.64.0.0/10"),      # CGNAT
    ipaddress.ip_network("0.0.0.0/8"),          # current network
    ipaddress.ip_network("::1/128"),            # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),           # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),          # IPv6 link-local
]


def _validate_byok_base_url(url: str) -> None:
    """Validate a user-supplied BYOK base_url to prevent SSRF.

    Rules:
    1. Scheme must be ``https`` (no http, file, gopher, etc.).
    2. Port must be 443 or unspecified (no internal-service ports).
    3. Hostname must not resolve to a private/internal IP range.

    Raises ``ValueError`` with a generic message on any violation.
    """
    from urllib.parse import urlparse
    import socket

    parsed = urlparse(url)

    # 1. Scheme whitelist: only https.
    if parsed.scheme != "https":
        raise ValueError(
            "base_url 必须使用 https 协议"
            f"（当前 scheme: {parsed.scheme or '空'}）"
        )

    # Must have a hostname.
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("base_url 缺少有效的主机名")

    # 2. Port must be 443 or unspecified.
    port = parsed.port
    if port is not None and port != 443:
        raise ValueError(
            f"base_url 端口必须为 443 或省略（当前: {port}）"
        )

    # 3. Resolve hostname and reject private/internal IPs.
    try:
        # getaddrinfo may return multiple records (A/AAAA); check all.
        addr_infos = socket.getaddrinfo(
            hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM
        )
    except socket.gaierror:
        raise ValueError(f"无法解析主机名: {hostname}")

    for family, _, _, _, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        for net in _PRIVATE_NETWORKS:
            if ip in net:
                raise ValueError(
                    f"base_url 主机名解析到内网地址 ({ip})，不允许"
                )

    # Reject if hostname is a raw IP that's private (even if
    # getaddrinfo somehow returned it).
    try:
        ip = ipaddress.ip_address(hostname)
        for net in _PRIVATE_NETWORKS:
            if ip in net:
                raise ValueError(
                    f"base_url 主机名是内网 IP ({ip})，不允许"
                )
    except ValueError:
        # hostname is not an IP address — that's fine.
        pass


@app.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(req: AIChatRequest):
    """Generate goboscript code from a natural-language chat.

    **BYOK (Bring Your Own Key)** — the request body can include optional
    ``base_url``, ``api_key``, and ``model`` fields.  When ``api_key`` is
    present in the request, the endpoint uses those values directly (taking
    priority over all env-var config) to call the user's chosen model via
    the OpenAI SDK.  This supports any OpenAI-compatible provider:

      - DeepSeek: base_url=https://api.deepseek.com, model=deepseek-chat
      - Kimi:     base_url=https://api.moonshot.cn/v1, model=moonshot-v1-8k
      - 智谱:     base_url=https://open.bigmodel.cn/api/paas/v4, model=glm-4-flash

    When ``api_key`` is absent, the endpoint returns a mock response so the
    pipeline still works end-to-end without credentials.

    **Security**: ``api_key`` is never written to any log.  Only the
    provider name / model / base_url host are logged for debugging.

    After generation, validates the goboscript source.  If validation
    fails, the errors are appended to the explanation.
    """
    # [F5.4 debug] Log project_context receipt (never log api_key)
    ctx_preview = (req.project_context or "")[:80].replace("\n", "\\n")
    logger.info(
        "ai_chat: project_context=%s (%d chars), messages=%d, byok=%s",
        "yes" if req.project_context else "no",
        len(req.project_context or ""),
        len(req.messages),
        "yes" if req.api_key else "no",
    )
    if req.project_context:
        logger.info("  context preview: %s", ctx_preview)

    # ── Resolve provider config ──
    # S2: When no BYOK api_key is provided in the request body, refuse
    # to use server-side env-var keys (prevents cross-origin key theft
    # via restricted CORS). Only BYOK triggers real API calls.
    # Set ALLOW_SERVER_KEY=true in env to explicitly enable server keys
    # for local development / testing.
    if req.api_key:
        # BYOK path: use user-supplied config from the request body.
        # Apply sensible defaults if base_url / model are omitted.
        byok_base_url = req.base_url or "https://api.deepseek.com"
        byok_model = req.model or "deepseek-chat"

        # S1: Validate BYOK base_url to prevent SSRF attacks.
        try:
            _validate_byok_base_url(byok_base_url)
        except ValueError as exc:
            logger.warning("ai_chat: BYOK base_url rejected: %s", exc)
            raise HTTPException(status_code=422, detail={
                "error": "base_url 校验失败",
                "detail": str(exc),
            })

        cfg = {
            "provider": "byok",
            "base_url": byok_base_url,
            "model": byok_model,
            "api_key": req.api_key,
        }
        # Log only the host, never the key.
        from urllib.parse import urlparse
        _host = urlparse(byok_base_url).hostname or byok_base_url
        logger.info(
            "ai_chat: BYOK mode, host=%s, model=%s",
            _host, byok_model,
        )
    else:
        # S2: No BYOK key — check if server keys are explicitly allowed.
        allow_server_key = os.environ.get(
            "ALLOW_SERVER_KEY", "false"
        ).lower() in ("true", "1", "yes")
        if not allow_server_key:
            logger.info(
                "ai_chat: no BYOK key and ALLOW_SERVER_KEY not set — "
                "returning mock"
            )
            return AIChatResponse(
                goboscript=_smart_mock_goboscript(
                    req.messages[-1].content if req.messages else "",
                    project_context=req.project_context,
                ),
                explanation=AI_MOCK_EXPLANATION,
            )
        # Env-var path (only when explicitly enabled).
        cfg = _get_ai_provider_config()

    provider = cfg["provider"]
    api_key = cfg["api_key"]

    # Mock / no-key fallback.
    if provider == "mock" or not api_key:
        missing = provider if provider != "mock" else "mock"
        if not api_key and provider != "mock":
            missing = f"{provider} (key env {cfg['api_key_env']} not set)"
        logger.warning(
            "AI provider=%s, no API key — returning mock goboscript", missing
        )
        return AIChatResponse(
            goboscript=_smart_mock_goboscript(
                req.messages[-1].content if req.messages else "",
                project_context=req.project_context,
            ),
            explanation=AI_MOCK_EXPLANATION,
        )

    # Build system prompt from /schema.
    system_prompt = _build_ai_system_prompt()

    # Build message list.
    messages = [{"role": "system", "content": system_prompt}]
    if req.project_context:
        messages.append({
            "role": "system",
            "content": f"Project context:\n{req.project_context}",
        })
    for msg in req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        # H1: Use AsyncOpenAI to avoid blocking the event loop.
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url=cfg["base_url"])
        completion = await client.chat.completions.create(
            model=cfg["model"],
            messages=messages,
            # M4: Increased from 512 to 2048 for complex programs.
            max_tokens=2048,
            temperature=0,
        )
        raw = completion.choices[0].message.content or ""
        usage = completion.usage
        if usage:
            logger.info(
                "AI call: provider=%s model=%s response_len=%d "
                "tokens: prompt=%d completion=%d total=%d",
                provider, cfg["model"], len(raw),
                usage.prompt_tokens, usage.completion_tokens,
                usage.total_tokens,
            )
        else:
            logger.info(
                "AI call: provider=%s model=%s response_len=%d",
                provider, cfg["model"], len(raw),
            )
    except Exception as exc:
        # H3: Return 502 (bad gateway) on AI call failure.
        # Do NOT leak the exception string to the client.
        logger.error("AI call failed (provider=%s): %s", provider, exc)
        raise HTTPException(
            status_code=502,
            detail={
                "error": "AI 调用失败",
                "detail": "上游 AI 服务不可用，请稍后重试或检查 api_key/base_url 配置",
            },
        )

    goboscript, explanation = _parse_ai_response(raw)

    if not explanation:
        explanation = "（模型未提供解释）"

    # Validate the generated goboscript.
    errors = _validate_source(goboscript)
    if errors:
        err_lines = [
            f"  L{e.line}:{e.column} {e.message}" for e in errors
        ]
        explanation += "\n\n⚠ 生成代码校验失败，请重试：\n" + "\n".join(err_lines)

    return AIChatResponse(
        goboscript=goboscript,
        explanation=explanation,
    )


# ── Schema endpoint ────────────────────────────────────────────────

@app.get("/schema")
async def schema_endpoint():
    """Return the complete goboscript syntax schema.

    Provides:
    - ``keywords``: all reserved keywords from the lexer
    - ``blocks``: statement + reporter block mappings with category,
      syntax, example, and argument list
    - ``examples``: 5 curated complete-program examples
    - ``grammar_notes``: short prose summary of grammar rules
    """
    return get_schema()

