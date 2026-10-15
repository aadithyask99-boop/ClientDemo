#!/usr/bin/env bash
# Reverts the Dograh test: removes its containers, volumes and files, then restarts the paused Twenty stacks.
set -uo pipefail
cd "$(dirname "$0")"
[ -d .work/dograh ] && (cd .work/dograh && docker compose down -v 2>&1 | tail -3)
rm -rf .work/dograh
[ -d .work/twenty ] && (cd .work/twenty && docker compose up -d 2>&1 | tail -3)
docker start twenty-app-dev 2>/dev/null || true
echo "Reverted. Remaining containers:"
docker ps --format '{{.Names}}\t{{.Status}}'
