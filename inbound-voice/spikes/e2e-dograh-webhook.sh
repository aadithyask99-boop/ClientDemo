#!/usr/bin/env bash
# End-to-end spike for the Dograh webhook -> call-service -> Twenty path. Run in a Codespace after the Twenty app-dev
# server (:2020, from `create-twenty-app`) has the call-ingest app applied. NOT cleaned up here: run dograh-down.sh after.
set -euo pipefail
cd "$(dirname "$0")"
WORK="$PWD/.work"
mkdir -p "$WORK/artifacts"

# 1. Dograh up (pauses the main Twenty stack only; the app-dev Twenty on :2020 stays).
bash ./dograh-up.sh > /tmp/dograh.log 2>&1 || { echo "dograh-up failed, see /tmp/dograh.log"; exit 1; }

# 2. One tenant that points at the dev Twenty and owns a random webhook token.
TOKEN="whk_$(openssl rand -hex 16)"
cat > "$WORK/tenants.json" <<JSON
[{"id":"client-a","name":"Client A","defaultRegion":"GB",
  "twenty":{"baseUrl":"http://localhost:2020","apiKey":"unused","ingestSecret":"spike-test-secret"},
  "numbers":[],"dograhWebhookToken":"$TOKEN"}]
JSON
chmod 600 "$WORK/tenants.json"

# 3. call-service on :3100 (a copy of the main stack uses :3000, so avoid it).
( cd ../call-service && npm install --no-audit --no-fund >/dev/null 2>&1 || true )
( cd ../call-service && PORT=3100 PROVIDER_WEBHOOK_SECRET=unused TENANTS_FILE="$WORK/tenants.json" ARTIFACT_DIR="$WORK/artifacts" \
    nohup npx tsx src/main.ts > /tmp/call-service.log 2>&1 & )
for i in $(seq 1 30); do curl -fs http://localhost:3100/healthz >/dev/null 2>&1 && break; sleep 2; done
echo "call-service: $(curl -s http://localhost:3100/healthz)"

# 4. Provision Dograh, run a text-chat call, and check Twenty.
node "./${E2E_SCRIPT:-e2e-dograh-webhook.mjs}" "$WORK"

echo "--- call-service log (tail) ---"
tail -5 /tmp/call-service.log | cut -c1-160
