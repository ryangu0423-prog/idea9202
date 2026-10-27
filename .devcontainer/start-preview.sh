#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if node --input-type=module -e 'try {const r=await fetch("http://127.0.0.1:3000",{signal:AbortSignal.timeout(1500)});process.exit(r.ok&&(await r.text()).includes("Keep the Horses Safe")?0:1)}catch{process.exit(1)}'; then
  exit 0
fi
nohup npm run dev > /tmp/idea9202-server.log 2>&1 < /dev/null &
