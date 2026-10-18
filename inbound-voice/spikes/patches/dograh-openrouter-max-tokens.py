"""Cap the reply size Dograh asks OpenRouter for.

Dograh sends no max_tokens, so OpenRouter reserves credit for the model's maximum reply (65k to 131k tokens) and refuses
small balances with 402. This adds max_tokens=2048 to OpenRouter requests.

Run:  docker exec -u root -i dograh-api-1 python - < spikes/patches/dograh-openrouter-max-tokens.py   (then restart the container)
Safe to run again. Lost if the container is recreated; check with:
  docker exec dograh-api-1 grep -c "cap OpenRouter reply size" /app/api/services/pipecat/service_factory.py
"""
import sys

F = "/app/api/services/pipecat/service_factory.py"
MARKER = "# dograh-ours: cap OpenRouter reply size"
ANCHOR = "        return OpenRouterLLMService(\n"

s = open(F).read()
if MARKER in s:
    print("already patched")
    sys.exit(0)
if s.count(ANCHOR) != 1:
    sys.exit("expected exactly one OpenRouterLLMService return, found %d" % s.count(ANCHOR))
NEW = (
    "        " + MARKER + ": without a limit OpenRouter reserves credit for the model's maximum reply (65k to 131k tokens) and refuses small balances.\n"
    '        extra["extra_body"] = {**extra.get("extra_body", {}), "max_tokens": 2048}\n'
)
compile(s.replace(ANCHOR, NEW + ANCHOR), F, "exec")
open(F, "w").write(s.replace(ANCHOR, NEW + ANCHOR))
print("patched", F)
