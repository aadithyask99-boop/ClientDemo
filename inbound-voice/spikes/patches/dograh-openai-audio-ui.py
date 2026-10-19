"""Models screen: dropdowns for ElevenLabs (via OpenRouter) voice and hearing options on the OpenAI-type provider.

Dograh's "OpenAI" provider connection takes a Base Url, so pointing it at https://openrouter.ai/api/v1 with an OpenRouter key
reaches OpenRouter's ElevenLabs models. The Models screen is drawn from the backend schema (services/configuration/registry.py),
whose lists only offer OpenAI's own models and a plain text box for the voice. This extends the lists so everything can be
picked in the UI: TTS models (Eleven v4 Turbo, v4, v3 Conversational, v3, Flash v2.5, Flash v2, Turbo v2.5, Turbo v2,
Multilingual v2), STT models (Scribe v2, Scribe v2 Medical) and a voice dropdown (OpenAI's 13 plus ElevenLabs' 21 premade).
Custom values still work ("Enter Custom Value").

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-openai-audio-ui.py
Then restart the API:      docker restart dograh-api-1   (then reload the Dograh page)
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-openai-audio-ui.py
Safe to run again (each edit is checked on its own). Lost if the container is recreated (spikes/bring-up.sh re-applies it).
"""
import os
import shutil
import sys

F = "/app/api/services/configuration/registry.py"
BACKUP = F + ".pre-openai-audio-ui"
MARK = "# dograh-ours: openai audio ui"

TTS_MODELS = [
    "gpt-4o-mini-tts",
    "elevenlabs/eleven-v4-turbo", "elevenlabs/eleven-v4", "elevenlabs/eleven-v3-conversational", "elevenlabs/eleven-v3",
    "elevenlabs/eleven-flash-v2.5", "elevenlabs/eleven-flash-v2", "elevenlabs/eleven-turbo-v2.5", "elevenlabs/eleven-turbo-v2",
    "elevenlabs/eleven-multilingual-v2",
]
STT_MODELS = ["gpt-4o-transcribe", "elevenlabs/scribe-v2", "elevenlabs/scribe-v2-medical"]
VOICES = [
    "alloy", "ash", "ballad", "cedar", "coral", "echo", "fable", "marin", "nova", "onyx", "sage", "shimmer", "verse",
    "george", "sarah", "adam", "alice", "bella", "bill", "brian", "callum", "charlie", "chris", "daniel", "eric", "harry",
    "jessica", "laura", "liam", "lily", "matilda", "river", "roger", "will",
]

EDITS = [
    ('OPENAI_TTS_MODELS = ["gpt-4o-mini-tts"]',
     "OPENAI_TTS_MODELS = %r  %s\nOPENAI_TTS_VOICES = %r  %s" % (TTS_MODELS, MARK, VOICES, MARK)),
    ('OPENAI_STT_MODELS = ["gpt-4o-transcribe"]',
     "OPENAI_STT_MODELS = %r  %s" % (STT_MODELS, MARK)),
    ('description="OpenAI TTS voice name.",',
     'description="OpenAI TTS voice name.",\n        json_schema_extra={"examples": OPENAI_TTS_VOICES},  ' + MARK),
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
