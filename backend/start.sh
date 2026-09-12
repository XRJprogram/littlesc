#!/bin/bash
# L9: Unified startup script. Reads configuration from env vars.
# Usage: ./start.sh [port]
# Env vars:
#   PORT          - port to listen on (default 18702)
#   MODEL_PROVIDER - AI provider (default deepseek)
#   DEEPSEEK_API_KEY - API key for DeepSeek
#   CORS_ALLOW_ORIGINS - comma-separated list of allowed origins
#   ALLOW_SERVER_KEY  - set to "true" to allow server-side env keys without BYOK

PORT="${PORT:-${1:-18702}}"
export MODEL_PROVIDER="${MODEL_PROVIDER:-deepseek}"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}"
export ALLOW_SERVER_KEY="${ALLOW_SERVER_KEY:-false}"

cd /home/z/my-project/InstanceScratch/backend
nohup python3 -m uvicorn main:app \
    --host 127.0.0.1 --port "$PORT" \
    --limit-request-body 52428800 \
    > /tmp/gobs_backend.log 2>&1 &
echo $! > /tmp/gobs_backend.pid
echo "Backend started on port $PORT (pid: $(cat /tmp/gobs_backend.pid))"
