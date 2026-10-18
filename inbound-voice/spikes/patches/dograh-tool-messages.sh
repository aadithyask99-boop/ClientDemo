#!/usr/bin/env bash
# Adds Dograh's tool "start message" feature (a short line spoken while a tool runs, so lookups do not feel like dead air)
# to the running API container. The image is older than the Dograh source checked out in the Codespace; that source already
# has the feature, so this copies the six files that carry it. Each existing file is backed up as <file>.pre-toolmsg first.
# The new files are import-tested in a separate process (the live API is untouched until you restart it); on any failure
# every file is put back. Safe to run again. Lost if the container is recreated, so bring-up.sh runs it.
#
#   bash spikes/patches/dograh-tool-messages.sh        then:  docker restart dograh-api-1
set -u
SRC=${SRC:-/workspaces/ClientDemo/inbound-voice/spikes/.work/dograh-src/api}
C=${C:-dograh-api-1}
D=/app/api
FILES="schemas/tool.py services/workflow/tool_execution.py services/workflow/agent_runtime.py services/workflow/pipecat_engine_custom_tools.py services/workflow/pipecat_engine.py services/workflow/tool_messages.py"

if docker exec "$C" test -f "$D/services/workflow/tool_messages.py"; then echo "already patched"; exit 0; fi
for f in $FILES; do [ -f "$SRC/$f" ] || { echo "missing in source: $f"; exit 1; }; done

fail=
for f in $FILES; do
  docker exec -u root "$C" sh -c "[ -f $D/$f ] && cp -n $D/$f $D/$f.pre-toolmsg" || true
  docker cp "$SRC/$f" "$C:$D/$f" || { echo "copy failed: $f"; fail=1; }
done

if [ -z "$fail" ] && docker exec "$C" python -c "import api.schemas.tool, api.services.workflow.tool_messages, api.services.workflow.tool_execution, api.services.workflow.agent_runtime, api.services.workflow.pipecat_engine_custom_tools, api.services.workflow.pipecat_engine; print('IMPORT-OK')"; then
  echo "patched. Restart the container to load it: docker restart $C"
else
  echo "IMPORT FAILED, restoring the originals"
  for f in $FILES; do
    if docker exec "$C" test -f "$D/$f.pre-toolmsg"; then docker exec -u root "$C" cp "$D/$f.pre-toolmsg" "$D/$f"; else docker exec -u root "$C" rm -f "$D/$f"; fi
  done
  exit 1
fi
