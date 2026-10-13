#!/usr/bin/env bash
# Install the tools used for lead research. Safe to re-run. Works in a cloud session and on a Mac/Linux desktop.
# Usage: bash _template/research-report/setup.sh      (tools go to $TOOLS_DIR, default ~/lead-research-tools)
set -uo pipefail
TOOLS="${TOOLS_DIR:-$HOME/lead-research-tools}"
mkdir -p "$TOOLS" && cd "$TOOLS" || exit 1
echo "== Python environment"
[ -d venv ] || python3 -m venv venv
# shellcheck disable=SC1091
. venv/bin/activate
pip install -q --upgrade pip >/dev/null 2>&1
pip install -q markdown playwright wappalyzer pypdf && echo "ok: markdown, playwright, wappalyzer-next, pypdf"
echo "== Open-source projects"
[ -d jev-seo ] || git clone -q --depth 1 https://github.com/AgriciDaniel/jev-seo && echo "cloned jev-seo (MIT)"
[ -f jev-seo/requirements.txt ] && pip install -q -r jev-seo/requirements.txt && echo "ok: jev-seo requirements"
[ -d marketingskills ] || git clone -q --depth 1 https://github.com/coreyhaines31/marketingskills && echo "cloned marketingskills (MIT)"
echo "== Lighthouse and Pa11y (needs node)"
if command -v npm >/dev/null 2>&1; then
  [ -f package.json ] || npm init -y >/dev/null 2>&1
  npm i --silent lighthouse pa11y && echo "ok: lighthouse, pa11y"
else
  echo "SKIPPED: node/npm not found. Install Node.js to run Lighthouse and Pa11y."
fi
echo "== Browser for screenshots"
if [ -n "${CHROMIUM_PATH:-}" ] || [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  echo "using the existing browser (CHROMIUM_PATH or PLAYWRIGHT_BROWSERS_PATH is set). In a cloud session do not run 'playwright install'."
else
  python -m playwright install chromium && echo "ok: chromium installed"
fi
echo "== Check"
python --version; command -v wappalyzer >/dev/null && echo "wappalyzer: found"; [ -x node_modules/.bin/lighthouse ] && echo "lighthouse: found"; [ -x node_modules/.bin/pa11y ] && echo "pa11y: found"; [ -f jev-seo/bin/jevseo ] && echo "jev-seo: found"
echo "Done. Activate with: . $TOOLS/venv/bin/activate"
