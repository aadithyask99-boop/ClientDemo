#!/usr/bin/env bash
# Builds and starts Cal.diy (web on :3000, API v2 on :5555) from source with its compose file.
# NOT YET RUN. The build is heavy (several GB of images, many minutes). Stops Twenty first (port 3000).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .work

[ -d .work/twenty ] && (cd .work/twenty && docker compose down 2>/dev/null || true)

[ -d .work/cal.diy ] || git clone --depth 1 --recursive https://github.com/calcom/cal.diy.git .work/cal.diy
cd .work/cal.diy

if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$(openssl rand -base64 32)|" .env
  sed -i "s|^CALENDSO_ENCRYPTION_KEY=.*|CALENDSO_ENCRYPTION_KEY=$(openssl rand -base64 24)|" .env
  # Compose reads these to build the database URL for the web container.
  grep -q '^POSTGRES_USER=' .env || cat >> .env <<'EOF'
POSTGRES_USER=unicorn_user
POSTGRES_PASSWORD=magical_password
POSTGRES_DB=calendso
DATABASE_HOST=database:5432
API_PORT=5555
EOF
  sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://unicorn_user:magical_password@database:5432/calendso"|' .env
  sed -i 's|^DATABASE_DIRECT_URL=.*|DATABASE_DIRECT_URL="postgresql://unicorn_user:magical_password@database:5432/calendso"|' .env
fi

# The Cal.diy README says to build with DOCKER_BUILDKIT=0, but its Dockerfile uses --platform=$BUILDPLATFORM,
# which the legacy builder rejects ("failed to parse platform"). Verified in the Codespace: build with BuildKit.
docker compose build calcom calcom-api
docker compose up -d
echo "Started. Web: http://localhost:3000  API v2: http://localhost:5555/v2 (check docker compose ps)"
