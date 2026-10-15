#!/usr/bin/env bash
# Starts Dograh (open-source voice AI platform) in a Codespace for a short test, without its public tunnel.
# Verified in Codespaces. Stops the Twenty stacks first to free memory; `dograh-down.sh` reverts everything.
#   UI: http://localhost:3010   API: http://localhost:8000
set -euo pipefail
cd "$(dirname "$0")"
DIR=.work/dograh
mkdir -p "$DIR"

# Free memory: pause (not delete) the main Twenty stack. The small app-dev Twenty (:2020) stays unless STOP_APP_DEV=1.
[ -d .work/twenty ] && (cd .work/twenty && docker compose stop 2>/dev/null || true)
[ "${STOP_APP_DEV:-0}" = "1" ] && docker stop twenty-app-dev 2>/dev/null || true

BASE=https://raw.githubusercontent.com/dograh-hq/dograh/main
curl -fsSL "$BASE/docker-compose.yaml" -o "$DIR/docker-compose.yaml"
curl -fsSL "$BASE/scripts/start_docker.sh" -o "$DIR/start_docker.sh"

# Codespaces: bridge networking between containers is broken, so use host networking (see SPIKES.md).
cat > "$DIR/docker-compose.override.yaml" <<'EOF'
services:
  postgres:
    network_mode: host
    networks: !reset []
  redis:
    network_mode: host
    networks: !reset []
  minio:
    network_mode: host
    networks: !reset []
  api:
    network_mode: host
    networks: !reset []
    environment:
      DATABASE_URL: "postgresql+asyncpg://postgres:${POSTGRES_PASSWORD:-postgres}@localhost:5432/postgres"
      REDIS_URL: "redis://:${REDIS_PASSWORD:-redissecret}@localhost:6379"
      MINIO_ENDPOINT: "localhost:9000"
  ui:
    network_mode: host
    networks: !reset []
    environment:
      BACKEND_URL: "http://localhost:8000"
EOF

cd "$DIR"
# Reaching Dograh from a browser or Twilio outside the Codespace: set PUBLIC_API_URL to the forwarded, public port 8000 address.
# Without it the web page calls http://localhost:8000 from the visitor's own machine and sign-in fails (verified).
if [ -n "${PUBLIC_API_URL:-}" ]; then
  touch .env; sed -i '/^BACKEND_API_ENDPOINT=/d' .env; echo "BACKEND_API_ENDPOINT=$PUBLIC_API_URL" >> .env
fi
# The upstream script ends with `docker compose --profile tunnel up` (attached, public tunnel). Run it detached and tunnel-free.
sed -i 's|docker compose --profile tunnel up --pull always$|docker compose up -d --pull always|' start_docker.sh
chmod +x start_docker.sh
ENABLE_TELEMETRY=false ./start_docker.sh || true
# Non-interactive shells: the upstream script only prepares .env and prints the launch command, so launch here (no tunnel).
REGISTRY=ghcr.io/dograh-hq ENABLE_TELEMETRY=false docker compose up -d --pull always

echo "Waiting for the API on :8000 ..."
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/health 2>/dev/null || true)
  if [ "$code" != "000" ] && [ -n "$code" ]; then echo "API answered http $code"; break; fi
  sleep 5
done
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
