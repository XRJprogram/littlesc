#!/usr/bin/env bash
# start.sh — Start the InstanceScratch backend-js server
# Reads env vars: PORT, MODEL_PROVIDER, ALLOW_SERVER_KEY, CORS_ALLOW_ORIGINS, HOST
set -euo pipefail

# Resolve script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Environment defaults ──────────────────────────────────────────
export PORT="${PORT:-8000}"
export HOST="${HOST:-0.0.0.0}"
export MODEL_PROVIDER="${MODEL_PROVIDER:-mock}"
export ALLOW_SERVER_KEY="${ALLOW_SERVER_KEY:-false}"
export CORS_ALLOW_ORIGINS="${CORS_ALLOW_ORIGINS:-http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173}"

# ── Check node_modules ────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "[start.sh] node_modules not found, running npm install..."
  npm install
fi

# ── Start server ──────────────────────────────────────────────────
echo "[start.sh] Starting InstanceScratch backend-js on port $PORT..."
echo "[start.sh]   MODEL_PROVIDER=$MODEL_PROVIDER"
echo "[start.sh]   ALLOW_SERVER_KEY=$ALLOW_SERVER_KEY"
echo "[start.sh]   CORS_ALLOW_ORIGINS=$CORS_ALLOW_ORIGINS"

exec node src/server.js
