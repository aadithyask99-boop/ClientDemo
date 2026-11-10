#!/bin/bash
# Paste into Oracle's "Cloud-init script" box (with your own values). Do not commit real values.
export MCP_SECRET="CHANGE-ME-long-random-string"
export BROWSER_PASSWORD="CHANGE-ME-password-for-the-sign-in-window"
export REPO_BRANCH="main"
curl -fsSL "https://raw.githubusercontent.com/aadithyask99-boop/ClientDemo/${REPO_BRANCH}/flow-server/install.sh" | bash
