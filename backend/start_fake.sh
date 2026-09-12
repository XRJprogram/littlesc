#!/bin/bash
# L9: Fake/mock server startup script. Uses mock provider for UI testing.
# Usage: ./start_fake.sh [port]

PORT="${PORT:-${1:-18780}}"
export MODEL_PROVIDER="${MODEL_PROVIDER:-deepseek}"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-test-fake}"
export ALLOW_SERVER_KEY="${ALLOW_SERVER_KEY:-true}"

cd /home/z/my-project/InstanceScratch/backend
nohup python3 -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=$PORT, log_level='info')" \
    > /tmp/gobs_fake.log 2>&1 &
echo $! > /tmp/gobs_fake.pid
sleep 3
echo "Fake backend started on port $PORT (pid: $(cat /tmp/gobs_fake.pid))"
