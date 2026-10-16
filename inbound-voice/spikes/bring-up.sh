#!/bin/sh
# Brings the stack back after the Codespace has stopped and started again. Safe to run any time.
#   sh /workspaces/ClientDemo/inbound-voice/spikes/bring-up.sh
# It does NOT make port 8000 public: that is a step for a person (Ports tab, right-click 8000, Port Visibility, Public).
cd "$(dirname "$0")/.." || exit 1
DOGRAH=spikes/.work/dograh

echo "1/4 starting Dograh (containers do not restart on their own)"
(cd "$DOGRAH" && REGISTRY=ghcr.io/dograh-hq ENABLE_TELEMETRY=false docker compose -f docker-compose.yaml -f docker-compose.override.yaml -f docker-compose.ours.yaml up -d >/dev/null 2>&1)

echo "2/4 waiting for the database"
until docker exec dograh-postgres-1 pg_isready -U postgres >/dev/null 2>&1; do sleep 3; done
docker exec dograh-postgres-1 psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='callservice'" | grep -q 1 \
  || docker exec dograh-postgres-1 psql -U postgres -c "CREATE DATABASE callservice" >/dev/null

echo "3/4 starting the call-service"
pkill -f "src/main.ts" 2>/dev/null
PUBLIC="https://${CODESPACE_NAME:-bookish-adventure-q7wggwjrrrpg34gr4}-8000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
(cd call-service && \
  ARTIFACT_URL_REWRITE="${PUBLIC}=>http://localhost:8000" \
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/callservice \
  PORT=3100 PROVIDER_WEBHOOK_SECRET=unused \
  TENANTS_FILE="$PWD/../spikes/.work/tenants.json" ARTIFACT_DIR="$PWD/../spikes/.work/artifacts" \
  setsid nohup npx tsx src/main.ts > "$HOME/call-service.log" 2>&1 < /dev/null &)

echo "4/4 checking"
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 3
  curl -s -m 3 localhost:3100/healthz | grep -q ok && break
done
printf "call-service: "; curl -s -m 3 localhost:3100/healthz || printf "NOT ANSWERING (see ~/call-service.log)"; echo
printf "dograh api:   "; curl -s -m 5 -o /dev/null -w "%{http_code}\n" localhost:8000/api/v1/health
printf "dograh ui:    "; curl -s -m 5 -o /dev/null -w "%{http_code}\n" localhost:3010/
echo
echo "LAST STEP FOR A PERSON: Ports tab > right-click port 8000 > Port Visibility > Public (the phone line needs it)."
echo "Set it back to Private when you are done testing."
