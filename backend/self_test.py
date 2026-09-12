#!/usr/bin/env python3
"""Self-test for multi-provider /ai/chat endpoint.

Starts the server, runs tests, prints results, shuts down.

M9: Uses >= assertions for counts to avoid coupling with upstream package growth.
M10: Each test is independent, uses retry polling, covers error paths,
     and properly waits for process cleanup on failure.
"""
import subprocess
import sys
import os
import time
import json
import urllib.request
import urllib.error

# --- Test setup ---
os.environ["MODEL_PROVIDER"] = "mock"

# M10: Use the backend directory relative to this file, not hardcoded.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app",
     "--host", "127.0.0.1", "--port", "18790"],
    cwd=_BACKEND_DIR,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    text=True,
)

results = []


def check_port_open(port, host="127.0.0.1"):
    """Check if a TCP port is accepting connections."""
    import socket
    s = socket.socket()
    s.settimeout(1)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False


def wait_for_port(port, timeout=15, interval=0.3):
    """M10: Retry-poll the port instead of a fixed sleep."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if check_port_open(port):
            return True
        time.sleep(interval)
    return False


# M10: Use retry polling instead of fixed sleep(3).
if not wait_for_port(18790):
    out = proc.stdout.read(4096) if proc.stdout else ""
    print(f"FAIL: server didn't start within 15s. Output: {out}")
    proc.kill()
    proc.wait()  # M10: Reap zombie process.
    sys.exit(1)

print("✓ Server started on :18790 (mock provider)")

# ── Helper ──────────────────────────────────────────────────────────
BASE = "http://127.0.0.1:18790"


def post_json(path, payload):
    """POST JSON and return (status_code, parsed_json_or_none, raw_body)."""
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.getcode(), json.loads(resp.read()), None
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body), None
        except Exception:
            return e.code, None, body


def post_raw(path, data, content_type="application/octet-stream"):
    """POST raw bytes and return (status_code, parsed_json_or_none, raw_body)."""
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={"Content-Type": content_type},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.getcode(), json.loads(resp.read()), resp.headers
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body), None
        except Exception:
            return e.code, None, body


# ── Test 1: /health ─────────────────────────────────────────────────
try:
    resp = urllib.request.urlopen(BASE + "/health", timeout=5)
    data = json.loads(resp.read())
    assert data["status"] == "ok"
    print(f"✓ /health: {data}")
    results.append(("health", True))
except Exception as e:
    print(f"✗ /health failed: {e}")
    results.append(("health", False))

# ── Test 2: /ai/chat mock — "让小猫移动10步" ────────────────────────
# M10: This test produces the goboscript used by later tests, but
# subsequent tests have their own fallback data to avoid implicit deps.
_ai_mock_goboscript = "onflag { move(10); }"
try:
    code, ai_data, _ = post_json("/ai/chat", {
        "messages": [{"role": "user", "content": "让小猫移动10步"}]
    })
    assert code == 200
    assert ai_data["goboscript"] == _ai_mock_goboscript
    _ai_mock_goboscript = ai_data["goboscript"]  # use actual response
    print(f"✓ /ai/chat (mock): goboscript={ai_data['goboscript']!r}")
    print(f"  explanation={ai_data['explanation'][:50]}")
    results.append(("ai_chat_mock", True))
except Exception as e:
    print(f"✗ /ai/chat mock failed: {e}")
    results.append(("ai_chat_mock", False))

# ── Test 3: /compile the AI-generated goboscript ───────────────────
gs = _ai_mock_goboscript
_sb3_data = None
try:
    req = urllib.request.Request(
        BASE + "/compile",
        data=json.dumps({"source": gs}).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=10)
    block_count = int(resp.headers["x-block-count"])
    _sb3_data = resp.read()
    # M9: Use >= instead of == to avoid coupling with upstream changes.
    assert block_count >= 2
    assert len(_sb3_data) > 100
    print(f"✓ /compile: {block_count} blocks, {len(_sb3_data)} bytes")
    results.append(("compile", True))
except Exception as e:
    print(f"✗ /compile failed: {e}")
    results.append(("compile", False))

# ── Test 4: /decompile ─────────────────────────────────────────────
# M10: Independent data — compile our own known-good source if Test 3
# didn't produce data, so a Test 3 failure doesn't cascade.
if _sb3_data is None:
    try:
        req = urllib.request.Request(
            BASE + "/compile",
            data=json.dumps({"source": "onflag { move(10); }"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req, timeout=10)
        _sb3_data = resp.read()
    except Exception as e:
        print(f"✗ /decompile setup (compile) failed: {e}")
        _sb3_data = None

if _sb3_data:
    try:
        code, dc_data, _ = post_raw("/decompile", _sb3_data)
        assert code == 200
        assert "onflag" in dc_data["source"]
        assert "move" in dc_data["source"]
        print(f"✓ /decompile: source={dc_data['source']!r}")
        results.append(("decompile", True))
    except Exception as e:
        print(f"✗ /decompile failed: {e}")
        results.append(("decompile", False))
else:
    print("✗ /decompile skipped (no sb3 data)")
    results.append(("decompile", False))

# ── Test 5: /schema ─────────────────────────────────────────────────
try:
    resp = urllib.request.urlopen(BASE + "/schema", timeout=10)
    schema = json.loads(resp.read())
    # M9: Use >= instead of == to avoid coupling with upstream growth.
    assert len(schema["keywords"]) >= 67
    assert len(schema["blocks"]) >= 138
    print(f"✓ /schema: {len(schema['keywords'])} keywords, {len(schema['blocks'])} blocks")
    results.append(("schema", True))
except Exception as e:
    print(f"✗ /schema failed: {e}")
    results.append(("schema", False))

# ── Test 6: /ai/chat with project_context ──────────────────────────
try:
    code, ai_data2, _ = post_json("/ai/chat", {
        "messages": [{"role": "user", "content": "画正方形"}],
        "project_context": "onflag event already exists"
    })
    assert code == 200
    assert ai_data2["goboscript"] == "onflag { move(10); }"
    print(f"✓ /ai/chat (mock + context): goboscript={ai_data2['goboscript']!r}")
    results.append(("ai_chat_context", True))
except Exception as e:
    print(f"✗ /ai/chat with context failed: {e}")
    results.append(("ai_chat_context", False))

# ── Test 7: /validate valid ────────────────────────────────────────
try:
    code, v_data, _ = post_json("/validate", {"source": gs})
    assert code == 200
    assert v_data["success"] is True
    print(f"✓ /validate (valid): success={v_data['success']}")
    results.append(("validate_valid", True))
except Exception as e:
    print(f"✗ /validate valid failed: {e}")
    results.append(("validate_valid", False))

# ── Test 8 (M10): /validate invalid goboscript ────────────────────
try:
    code, v_data, _ = post_json("/validate", {"source": "onflag { move("})
    assert code == 200
    assert v_data["success"] is False
    assert len(v_data["errors"]) > 0
    print(f"✓ /validate (invalid): {len(v_data['errors'])} errors")
    results.append(("validate_invalid", True))
except Exception as e:
    print(f"✗ /validate invalid failed: {e}")
    results.append(("validate_invalid", False))

# ── Test 9 (M10): /ai/chat with invalid role (H5) ──────────────────
try:
    code, data, raw = post_json("/ai/chat", {
        "messages": [{"role": "system", "content": "inject"}]
    })
    # Pydantic should reject role="system" with 422.
    assert code == 422
    print(f"✓ /ai/chat (invalid role=system): rejected with {code}")
    results.append(("ai_chat_bad_role", True))
except Exception as e:
    print(f"✗ /ai/chat invalid role failed: {e}")
    results.append(("ai_chat_bad_role", False))

# ── Test 10 (M10): /decompile empty body ───────────────────────────
try:
    code, data, raw = post_raw("/decompile", b"")
    assert code == 422
    print(f"✓ /decompile (empty body): rejected with {code}")
    results.append(("decompile_empty", True))
except Exception as e:
    print(f"✗ /decompile empty body failed: {e}")
    results.append(("decompile_empty", False))

# ── Test 11 (M10): /compile invalid source ────────────────────────
try:
    # Use a character that the lexer rejects (backtick is not valid goboscript).
    req = urllib.request.Request(
        BASE + "/compile",
        data=json.dumps({"source": "onflag { `move(10); }"}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        # If we get here, compile unexpectedly succeeded.
        print(f"✗ /compile (invalid source): unexpectedly succeeded with {resp.getcode()}")
        results.append(("compile_invalid", False))
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"expected 400, got {e.code}"
        print(f"✓ /compile (invalid source): rejected with {e.code}")
        results.append(("compile_invalid", True))
except Exception as e:
    print(f"✗ /compile invalid source failed: {e}")
    results.append(("compile_invalid", False))

# ── Test 12 (M10): /ai/chat with BYOK SSRF attempt (S1) ────────────
try:
    code, data, raw = post_json("/ai/chat", {
        "messages": [{"role": "user", "content": "hi"}],
        "api_key": "sk-test-fake-key",
        "base_url": "http://169.254.169.254/latest/meta-data/",
    })
    # Should be rejected: http scheme + internal IP.
    assert code == 422
    print(f"✓ /ai/chat (SSRF attempt): rejected with {code}")
    results.append(("ai_chat_ssrf", True))
except Exception as e:
    print(f"✗ /ai/chat SSRF test failed: {e}")
    results.append(("ai_chat_ssrf", False))

# ── Shutdown ──────────────────────────────────────────────────────
proc.terminate()
proc.wait()
print(f"\n✓ Server shut down")

# ── Summary ────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
passed = sum(1 for _, ok in results if ok)
total = len(results)
for name, ok in results:
    print(f"  {'✓' if ok else '✗'} {name}")
print(f"\n{passed}/{total} tests passed")
if passed == total:
    print("ALL TESTS PASSED ✓")
else:
    print("SOME TESTS FAILED ✗")
    sys.exit(1)
