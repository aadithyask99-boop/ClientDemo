"""Alibaba Qwen models: switch their "thinking" off so replies start straight away.

Newer Qwen models (qwen-plus now points at qwen3.6-plus) can think before they answer. The thinking runs first and is not spoken, so the
caller hears several seconds of silence: measured gaps of 5 to 10 s on a plain question. Alibaba's OpenAI-compatible endpoint turns it
off with the request field enable_thinking=false. Dograh has no place to set that, so for a provider connection whose base URL is on
dashscope.aliyuncs.com this adds it to every request. Other providers are not touched.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-qwen-no-thinking.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-qwen-no-thinking.py
Safe to run again. Lost if the container is recreated (spikes/bring-up.sh re-applies it).
Check:  docker exec dograh-api-1 grep -c "dograh-ours: qwen no thinking" /app/api/services/pipecat/service_factory.py
"""
import os
import shutil
import sys

FACTORY = "/app/api/services/pipecat/service_factory.py"
BACKUP = FACTORY + ".pre-qwen-think"
MARKER = "# dograh-ours: qwen no thinking"

OLD = "            settings=OpenAILLMSettings(model=model, **sampling_settings),\n            **kwargs,\n"
NEW = (
    "            settings=OpenAILLMSettings(\n"
    "                model=model,\n"
    "                **sampling_settings,\n"
    "                " + MARKER + "\n"
    "                **({\"extra\": {\"extra_body\": {\"enable_thinking\": False}}} if \"dashscope\" in str(base_url or \"\") else {}),\n"
    "            ),\n"
    "            **kwargs,\n"
)

if os.environ.get("REMOVE"):
    if os.path.exists(BACKUP):
        shutil.copy(BACKUP, FACTORY)
        print("restored", FACTORY)
    sys.exit(0)

s = open(FACTORY).read()
if MARKER in s:
    print("already patched")
    sys.exit(0)
if s.count(OLD) != 1:
    sys.exit("expected exactly one place to patch, found %d; nothing was changed" % s.count(OLD))
new = s.replace(OLD, NEW)
compile(new, FACTORY, "exec")
shutil.copy(FACTORY, BACKUP)
open(FACTORY, "w").write(new)
print("patched", FACTORY)
