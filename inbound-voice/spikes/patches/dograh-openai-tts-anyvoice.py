"""Let pipecat's OpenAI TTS service accept any voice name, so OpenAI-compatible endpoints can use their own voices.

pipecat/services/openai/tts.py refuses every voice that is not one of OpenAI's 13 ("OpenAI TTS voice 'george' is not
supported"). An OpenAI-compatible endpoint such as OpenRouter (ElevenLabs voices: george, sarah, ...) validates voices
itself and answers 400 with a clear message, so the client-side check only gets in the way.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-openai-tts-anyvoice.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-openai-tts-anyvoice.py
Safe to run again. Lost if the container is recreated (spikes/bring-up.sh re-applies it).
"""
import importlib.util
import os
import shutil
import sys

F = importlib.util.find_spec("pipecat.services.openai.tts").origin
BACKUP = F + ".pre-anyvoice"
MARKER = "# dograh-ours: any voice name"
OLD = "if voice not in VALID_VOICES:"
NEW = "if False and voice not in VALID_VOICES:  " + MARKER

if os.environ.get("REMOVE"):
    if os.path.exists(BACKUP):
        shutil.copy(BACKUP, F)
        print("restored", F)
    sys.exit(0)

s = open(F).read()
if MARKER in s:
    print("already patched")
    sys.exit(0)
if s.count(OLD) != 1:
    sys.exit("expected exactly one voice check, found %d; not touching anything" % s.count(OLD))
new = s.replace(OLD, NEW)
compile(new, F, "exec")
shutil.copy(F, BACKUP)
open(F, "w").write(new)
print("patched", F)
