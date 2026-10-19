"""Make Dograh's OpenAI-type TTS service use the voice chosen in the model configuration.

Dograh v1.49's factory builds OpenAITTSService with only the model (OpenAITTSSettings(model=...)), so the voice falls back
to OpenAI's default "alloy" whatever the configuration says. With an OpenAI-compatible endpoint that does not know "alloy"
(for example OpenRouter's ElevenLabs voices) every request fails with 400 "Unknown voice". This passes the configured voice.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-openai-tts-voice.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-openai-tts-voice.py
Safe to run again. Lost if the container is recreated (spikes/bring-up.sh re-applies it).
"""
import os
import shutil
import sys

F = "/app/api/services/pipecat/service_factory.py"
BACKUP = F + ".pre-openai-voice"
MARKER = "# dograh-ours: openai tts voice"
OLD = "settings=OpenAITTSSettings(model=user_config.tts.model),"
NEW = 'settings=OpenAITTSSettings(model=user_config.tts.model, voice=(getattr(user_config.tts, "voice", None) or "alloy")),  ' + MARKER

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
    sys.exit("expected exactly one OpenAITTSSettings(model=...) line, found %d; not touching anything" % s.count(OLD))
new = s.replace(OLD, NEW)
compile(new, F, "exec")
shutil.copy(F, BACKUP)
open(F, "w").write(new)
print("patched", F)
