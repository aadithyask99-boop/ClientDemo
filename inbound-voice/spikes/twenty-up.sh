#!/usr/bin/env bash
# Starts a single-workspace Twenty at http://localhost:3000 using its published self-host compose file.
set -euo pipefail
cd "$(dirname "$0")"
DIR=.work/twenty
mkdir -p "$DIR"


BASE=https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker
curl -fsSL "$BASE/docker-compose.yml" -o "$DIR/docker-compose.yml"
if [ ! -f "$DIR/.env" ]; then
  curl -fsSL "$BASE/.env.example" -o "$DIR/.env"
  # Uncomment and fill the secrets the example asks for.
  sed -i "s|^#PG_DATABASE_PASSWORD=.*|PG_DATABASE_PASSWORD=$(openssl rand -hex 16)|" "$DIR/.env"
  sed -i "s|^# ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(openssl rand -base64 32)|" "$DIR/.env"
fi

# Docker-in-Docker in Codespaces: containers on a bridge network could not reach each other (db:5432 timed out
# although Postgres was healthy). Host networking works around it. Found by running this script.
if [ -n "${CODESPACES:-}" ]; then
  printf 'services:
  db:
    network_mode: host
  redis:
    network_mode: host
  server:
    network_mode: host
  worker:
    network_mode: host
' > "$DIR/docker-compose.override.yml"
  sed -i 's|^#PG_DATABASE_HOST=.*|PG_DATABASE_HOST=localhost|; s|^#REDIS_URL=.*|REDIS_URL=redis://localhost:6379|' "$DIR/.env"
  # The browser reaches Twenty through the forwarded URL, so the server must advertise that URL.
  sed -i "s|^SERVER_URL=.*|SERVER_URL=https://${CODESPACE_NAME}-3000.app.github.dev|" "$DIR/.env"
fi

cd "$DIR"
docker compose up -d
echo "Waiting for Twenty to report healthy..."
for i in $(seq 1 90); do
  if curl -fsS http://localhost:3000/healthz >/dev/null 2>&1; then echo "Twenty is up: http://localhost:3000"; exit 0; fi
  sleep 5
done
echo "Twenty did not become healthy in 5 minutes. Check: docker compose -f $DIR/docker-compose.yml logs server | tail -50" >&2
exit 1
