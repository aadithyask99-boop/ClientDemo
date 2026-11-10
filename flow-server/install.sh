#!/usr/bin/env bash
# Bootstrap for an Ubuntu server (an Oracle Cloud Always Free VM works). Safe to run again.
#   MCP_SECRET=<long random string> BROWSER_PASSWORD=<password> bash install.sh
# Optional: REPO_URL, REPO_BRANCH (default main).
set -euo pipefail
: "${MCP_SECRET:?set MCP_SECRET (16+ characters)}"
BROWSER_PASSWORD="${BROWSER_PASSWORD:-$(openssl rand -hex 12)}"
REPO_URL="${REPO_URL:-https://github.com/aadithyask99-boop/ClientDemo.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
DIR=/opt/flow-server
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y git curl openssl ca-certificates
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

# Oracle's Ubuntu images block inbound ports in iptables by default: open 80 and 443.
if command -v iptables >/dev/null; then
  for p in 80 443; do iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport $p -j ACCEPT; done
  echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
  echo iptables-persistent iptables-persistent/autosave_v6 boolean true | debconf-set-selections
  apt-get install -y iptables-persistent >/dev/null 2>&1 || true
  netfilter-persistent save >/dev/null 2>&1 || true
fi

TMP=$(mktemp -d)
git clone --depth 1 -b "$REPO_BRANCH" "$REPO_URL" "$TMP/src"
mkdir -p "$DIR" && cp -r "$TMP/src/flow-server/." "$DIR/"
rm -rf "$TMP"

IP=$(curl -fsS https://api.ipify.org)
SITE_HOST="${IP//./-}.sslip.io"
cat > "$DIR/.env" <<ENV
MCP_SECRET=$MCP_SECRET
BROWSER_PASSWORD=$BROWSER_PASSWORD
SITE_HOST=$SITE_HOST
PUBLIC_URL=https://$SITE_HOST
ENV
chmod 600 "$DIR/.env"
mkdir -p "$DIR/chrome-config" "$DIR/data"
chown -R 1000:1000 "$DIR/chrome-config"

cd "$DIR" && docker compose up -d --build
for i in $(seq 1 60); do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 3; done

cat > "$DIR/URLS.txt" <<URLS
Sign in to Google (user: flow, password in $DIR/.env): https://$SITE_HOST/browser/
MCP connector URL: https://$SITE_HOST/mcp/$MCP_SECRET
URLS
cat "$DIR/URLS.txt"
