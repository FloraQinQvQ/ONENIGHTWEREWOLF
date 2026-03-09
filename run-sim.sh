#!/usr/bin/env bash
set -e

. /root/.nvm/nvm.sh

cd /mnt/d/Docs/Coding/OneNightWerewolf/server
mkdir -p data

npx ts-node --transpile-only -r dotenv/config src/index.ts > /tmp/onw-server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server (pid=$SERVER_PID)..."
for i in $(seq 1 25); do
  sleep 1
  if curl -sf http://localhost:3001/health > /dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
done

cd /mnt/d/Docs/Coding/OneNightWerewolf
node simulate.mjs
SIM_EXIT=$?

kill $SERVER_PID 2>/dev/null || true
exit $SIM_EXIT
