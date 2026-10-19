"""Let pipecat's OpenAI TTS service accept any voice name, so OpenAI-compatible endpoints can use their own voices.

pipecat/services/openai/tts.py (1) refuses every voice that is not one of OpenAI's 13 ("OpenAI TTS voice 'george' is not
supported") and (2) then looks the voice up in a table (VALID_VOICES[voice]), which raises KeyError for any other name.
An OpenAI-compatible endpoint such as OpenRouter (ElevenLabs voices: george, sarah, ...) validates voices itself and answers
400 with a clear message, so both client-side steps only get in the way. This skips the check and uses the name as given.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-openai-tts-anyvoice.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-openai-tts-anyvoice.py
Safe to run again (each edit is checked on its own). Lost if the container is recreated (spikes/bring-up.sh re-applies it).
"""
import importlib.util
import os
import shutil
import sys

F = importlib.util.find_spec("pipecat.services.openai.tts").origin
BACKUP = F + ".pre-anyvoice"
MARKER = "# dograh-ours: any voice name"
EDITS = [
    ("if voice not in VALID_VOICES:", "if False and voice not in VALID_VOICES:  " + MARKER),
    ('"voice": VALID_VOICES[voice],', '"voice": VALID_VOICES.get(voice, voice),  ' + MARKER),
]

if os.environ.get("REMOVE"):
    if os.path.exists(BACKUP):
        shutil.copy(BACKUP, F)
        print("restored", F)
    sys.exit(0)

s = open(F).read()
new = s
done = []
for old, repl in EDITS:
    if repl in new:
        done.append("already")
        continue
    if new.count(old) != 1:
        sys.exit("expected exactly one %r, found %d; not touching anything" % (old, new.count(old)))
    new = new.replace(old, repl)
    done.append("patched")
if new == s:
    print("already patched")
    sys.exit(0)
compile(new, F, "exec")
if not os.path.exists(BACKUP):
    shutil.copy(F, BACKUP)
open(F, "w").write(new)
print("edits:", ", ".join(done), "->", F)
