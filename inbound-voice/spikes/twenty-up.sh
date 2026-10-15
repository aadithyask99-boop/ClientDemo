#!/usr/bin/env bash
# Starts a single-workspace Twenty at http://localhost:3000 using its published self-host compose file.
# NOT YET RUN. Stops Cal.diy first because both want port 3000.
set -euo pipefail
cd "$(dirname "$0")"
DIR=.work/twenty
mkdir -p "$DIR"

[ -d .work/cal.diy ] && (cd .work/cal.diy && docker compose down 2>/dev/null || true)

BASE=https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker
curl -fsSL "$BASE/docker-compose.yml" -o "$DIR/docker-compose.yml"
if [ ! -f "$DIR/.env" ]; then
  curl -fsSL "$BASE/.env.example" -o "$DIR/.env"
  # Uncomment and fill the secrets the example asks for.
  sed -i "s|^#PG_DATABASE_PASSWORD=.*|PG_DATABASE_PASSWORD=$(openssl rand -hex 16)|" "$DIR/.env"
  sed -i "s|^# ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(openssl rand -base64 32)|" "$DIR/.env"
fi

cd "$DIR"
docker compose up -d
echo "Waiting for Twenty to report healthy..."
for i in $(seq 1 60); do
  if curl -fsS http://localhost:3000/healthz >/dev/null 2>&1; then echo "Twenty is up: http://localhost:3000"; exit 0; fi
  sleep 5
done
echo "Twenty did not become healthy in 5 minutes. Check: docker compose -f $DIR/docker-compose.yml logs server | tail -50" >&2
exit 1
