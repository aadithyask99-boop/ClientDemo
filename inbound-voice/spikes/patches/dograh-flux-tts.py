"""Let the running Dograh API container use Deepgram Flux voices (for example flux-gemma-en).

Dograh v1.49's factory only builds the older Aura voice service (/v1/speak). The installed pipecat
already ships DeepgramFluxTTSService (/v2/speak), and newer Dograh source wires it in, so this
ports that wiring: any Deepgram voice whose name starts with "flux-" is sent to the Flux service,
every other voice is untouched. It does not depend on which language model is chosen.

Run inside the container:  docker exec -i dograh-api-1 python - < spikes/patches/dograh-flux-tts.py
Safe to run again. Lost if the container is recreated; check with:
  docker exec dograh-api-1 grep -c "dograh-ours: flux voices" /app/api/services/pipecat/service_factory.py
"""
import re
import sys

F = "/app/api/services/pipecat/service_factory.py"
MARKER = "# dograh-ours: flux voices"

import os

# SENTENCE = wait for a whole sentence before speaking (Dograh's own choice, safest);
# TOKEN = speak as words stream in (starts sooner, but it sounded chopped). Default is SENTENCE; set FLUX_AGGREGATION=TOKEN to try it.
MODE = os.environ.get("FLUX_AGGREGATION", "SENTENCE").upper()
if MODE not in ("TOKEN", "SENTENCE"):
    sys.exit("FLUX_AGGREGATION must be TOKEN or SENTENCE")

s = open(F).read()
if MARKER in s:
    want = "text_aggregation_mode=TextAggregationMode.%s," % MODE
    other = "text_aggregation_mode=TextAggregationMode.%s," % ("SENTENCE" if MODE == "TOKEN" else "TOKEN")
    if want in s:
        print("already patched, mode", MODE)
    elif s.count(other) == 1:
        open(F + ".pre-aggmode", "w").write(s)
        open(F, "w").write(s.replace(other, want))
        print("switched aggregation mode to", MODE)
    else:
        sys.exit("patched file has an unexpected aggregation line; not touching it")
    sys.exit(0)
hits = list(re.finditer(r"^( +)return DeepgramTTSService\(\n", s, re.M))
if len(hits) != 1:
    sys.exit("expected exactly one DeepgramTTSService return, found %d" % len(hits))
m = hits[0]
i = m.group(1)
j = i + "    "
NEW = (
    i + 'if str(getattr(user_config.tts, "voice", "") or "").startswith("flux-"):  ' + MARKER + "\n"
    + j + "from pipecat.services.deepgram.flux.tts import DeepgramFluxTTSService, DeepgramFluxTTSSettings\n"
    + j + "from pipecat.services.tts_service import TextAggregationMode\n\n"
    + j + "return DeepgramFluxTTSService(\n"
    + j + "    api_key=user_config.tts.api_key,\n"
    + j + '    url=_deepgram_websocket_url(deepgram_base_url, "/v2/speak"),\n'
    + j + "    settings=DeepgramFluxTTSSettings(\n"
    + j + "        voice=user_config.tts.voice,\n"
    + j + '        speed=getattr(user_config.tts, "speed", None),\n'
    + j + '        expressivity=(1 if getattr(user_config.tts, "expressivity", None) is None else user_config.tts.expressivity),\n'
    + j + "    ),\n"
    + j + "    text_aggregation_mode=TextAggregationMode.%s,\n" % MODE
    + j + "    text_filters=[xml_function_tag_filter],\n"
    + j + '    skip_aggregator_types=["recording_router", "recording"],\n'
    + j + "    silence_time_s=1.0,\n"
    + j + ")\n"
)
open(F, "w").write(s[: m.start()] + NEW + s[m.start():])
print("patched", F)
