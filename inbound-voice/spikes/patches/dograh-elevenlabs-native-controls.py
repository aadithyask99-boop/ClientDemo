"""Native ElevenLabs voice: make stability, similarity, style and speaker boost adjustable, and log why the voice list fails.

Dograh v1.49 builds its ElevenLabs voice with the controls hard-coded: stability 0.8 and similarity 0.75 (and stability 0.8 on the
v3 / v4 models that understand audio tags). A stability of 0.8 is steady and flat, which works against expressive tags, and none of
it can be changed in the UI. This:
  1. registry.py             adds Stability, Similarity, Style and Speaker Boost to the ElevenLabs voice settings (blank = the old
                             hard-coded value). v3 / v4 only use stability, so the others are greyed out for those models.
  2. service_factory.py      uses the chosen values (style and speaker boost are only passed when set).
  3. voice_catalog_adapters  logs the response body when a voice-list request fails (it only logged "400 Bad Request").

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-elevenlabs-native-controls.py
Then restart the API:      docker restart dograh-api-1   (then reload the Dograh page)
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-elevenlabs-native-controls.py
Safe to run again (each edit is checked on its own, files are compiled before writing). Re-applied by spikes/bring-up.sh.
"""
import os
import shutil
import sys

REGISTRY = "/app/api/services/configuration/registry.py"
FACTORY = "/app/api/services/pipecat/service_factory.py"
ADAPTERS = "/app/api/services/configuration/voice_catalog_adapters.py"
SUFFIX = ".pre-eleven-native"
MARK = "# dograh-ours: elevenlabs native controls"

NOT_ON_V34 = '{"model_constraints": [{"pattern": ELEVENLABS_DIALOGUE_TTS_MODEL_PATTERN, "supported": False}]}'
FIELDS = (
    "    " + MARK + "\n"
    "    stability: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="Stability: lower is more expressive and reacts more to audio tags, higher is steadier. Blank = 0.8 (the old fixed value). The only voice control Eleven v3 and v4 use.",\n'
    "    )\n"
    "    similarity_boost: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="Similarity: how closely it sticks to the original voice. Blank = 0.75. Not used by Eleven v3 and v4.",\n'
    "        json_schema_extra=" + NOT_ON_V34 + ",\n"
    "    )\n"
    "    style: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="Style exaggeration: higher exaggerates the speaking style (can add delay). Blank = off. Not used by Eleven v3 and v4.",\n'
    "        json_schema_extra=" + NOT_ON_V34 + ",\n"
    "    )\n"
    "    use_speaker_boost: bool | None = Field(\n"
    "        default=None,\n"
    '        description="Speaker boost: a little closer to the original speaker, a little slower. Blank = off. Not used by Eleven v3 and v4.",\n'
    "        json_schema_extra=" + NOT_ON_V34 + ",\n"
    "    )\n"
)
REG_ANCHOR = '    model: str = Field(\n        default="eleven_flash_v2_5",\n'

STAB = '(getattr(user_config.tts, "stability", None) if getattr(user_config.tts, "stability", None) is not None else 0.8)'
SIM = '(getattr(user_config.tts, "similarity_boost", None) if getattr(user_config.tts, "similarity_boost", None) is not None else 0.75)'
EXTRA = '**{k: v for k, v in (("style", getattr(user_config.tts, "style", None)), ("use_speaker_boost", getattr(user_config.tts, "use_speaker_boost", None))) if v is not None}'

A_OLD = "                model=user_config.tts.model,\n                stability=0.8,\n            )\n"
A_NEW = "                model=user_config.tts.model,\n                stability=" + STAB + ",  " + MARK + "\n            )\n"
B_OLD = "                stability=0.8,\n                speed=user_config.tts.speed,\n                similarity_boost=0.75,\n            )\n"
B_NEW = ("                stability=" + STAB + ",  " + MARK + "\n                speed=user_config.tts.speed,\n"
         "                similarity_boost=" + SIM + ",\n                " + EXTRA + ",\n            )\n")

AD_OLD = "        response = await client.get(self.url, headers=self.headers, params=params)\n        response.raise_for_status()\n"
AD_NEW = (
    "        response = await client.get(self.url, headers=self.headers, params=params)\n"
    "        if response.status_code >= 400:  " + MARK + "\n"
    "            import logging\n\n"
    '            logging.getLogger(__name__).error("voice catalog %s answered %s: %s", self.url, response.status_code, response.text[:300])\n'
    "        response.raise_for_status()\n"
)

PLAN = [
    (REGISTRY, [(REG_ANCHOR, FIELDS + REG_ANCHOR, FIELDS)]),
    (FACTORY, [(A_OLD, A_NEW, A_NEW), (B_OLD, B_NEW, B_NEW)]),
    (ADAPTERS, [(AD_OLD, AD_NEW, AD_NEW)]),
]

if os.environ.get("REMOVE"):
    for path, _ in PLAN:
        if os.path.exists(path + SUFFIX):
            shutil.copy(path + SUFFIX, path)
            print("restored", path)
    sys.exit(0)

pending = []
for path, edits in PLAN:
    text = open(path).read()
    new = text
    done = []
    for old, repl, detect in edits:
        if detect in new:
            done.append("already")
            continue
        if new.count(old) != 1:
            sys.exit("%s: expected exactly one %r, found %d; nothing was changed" % (path, old[:60], new.count(old)))
        new = new.replace(old, repl)
        done.append("patched")
    compile(new, path, "exec")
    pending.append((path, text, new, done))

for path, text, new, done in pending:
    if new != text:
        if not os.path.exists(path + SUFFIX):
            shutil.copy(path, path + SUFFIX)
        open(path, "w").write(new)
    print(path.split("/")[-1] + ":", ", ".join(done))
