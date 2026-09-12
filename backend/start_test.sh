#!/bin/bash
# L9: Test server startup script. Uses fake key for development.
# Usage: ./start_test.sh [port]

PORT="${PORT:-${1:-18750}}"
export MODEL_PROVIDER="${MODEL_PROVIDER:-deepseek}"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-test-fake-key}"
export ALLOW_SERVER_KEY="${ALLOW_SERVER_KEY:-true}"

cd /home/z/my-project/InstanceScratch/backend
nohup python3 -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=$PORT, log_level='info')" \
    > /tmp/gobs_backend2.log 2>&1 &
echo $! > /tmp/gobs_backend2.pid
echo "Test backend started on port $PORT (pid: $(cat /tmp/gobs_backend2.pid))"
