"""ElevenLabs voice controls (stability, similarity, style exaggeration, speaker boost, speed) for the OpenAI-type TTS.

ElevenLabs lets you tune a voice with stability, similarity, style exaggeration, speaker boost and speed. Dograh's OpenAI-type
voice only ever sends model and voice, so every ElevenLabs voice ran at its defaults. OpenRouter's speech endpoint accepts the
controls under provider.options.elevenlabs.voice_settings (and a top-level speed on Flash and Multilingual v2). This:
  1. registry.py       adds the five fields to the OpenAI-type TTS settings (blank = ElevenLabs' default)
  2. service_factory.py passes speed to the service and builds the extra request body for elevenlabs/* models
  3. pipecat openai/tts.py adds that extra body to the speech request
Needs dograh-openai-audio-ui.py first (it anchors on that patch's marker).

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-elevenlabs-voice-settings.py
Then restart the API:      docker restart dograh-api-1   (then reload the Dograh page)
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-elevenlabs-voice-settings.py
Safe to run again (each edit is checked on its own, files are compiled before writing). Re-applied by spikes/bring-up.sh.
"""
import importlib.util
import os
import shutil
import sys

REGISTRY = "/app/api/services/configuration/registry.py"
FACTORY = "/app/api/services/pipecat/service_factory.py"
TTS = importlib.util.find_spec("pipecat.services.openai.tts").origin
SUFFIX = ".pre-eleven-vs"
MARK = "# dograh-ours: elevenlabs voice settings"

FIELDS = (
    "    " + MARK + " (sent only for elevenlabs/* models)\n"
    "    stability: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="ElevenLabs stability: lower is more expressive and varied, higher is steadier. Blank = the voice default.",\n'
    "    )\n"
    "    similarity_boost: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="ElevenLabs similarity: how closely it sticks to the original voice. Blank = the voice default.",\n'
    "    )\n"
    "    style: float | None = Field(\n"
    "        default=None, ge=0, le=1,\n"
    '        description="ElevenLabs style exaggeration: higher exaggerates the speaking style (can add delay). Blank = the voice default.",\n'
    "    )\n"
    "    use_speaker_boost: bool | None = Field(\n"
    "        default=None,\n"
    '        description="ElevenLabs speaker boost: a little closer to the original speaker, a little slower. Blank = the voice default.",\n'
    "    )\n"
    "    speed: float | None = Field(\n"
    "        default=None, ge=0.7, le=1.2,\n"
    '        description="Speaking speed (0.7 to 1.2). Eleven Flash and Multilingual v2 only; v4 and v4 Turbo reject anything but blank.",\n'
    "    )\n"
)

REG_ANCHOR = 'json_schema_extra={"examples": OPENAI_TTS_VOICES},  # dograh-ours: openai audio ui\n    )\n'

FACTORY_SETTINGS_OLD = 'voice=(getattr(user_config.tts, "voice", None) or "alloy")),  # dograh-ours: openai tts voice'
FACTORY_SETTINGS_NEW = 'voice=(getattr(user_config.tts, "voice", None) or "alloy"), speed=getattr(user_config.tts, "speed", None)),  # dograh-ours: openai tts voice'

FACTORY_RET_OLD = "        return OpenAITTSService(\n"
FACTORY_RET_NEW = "        _dg_tts = OpenAITTSService(  " + MARK + "\n"

FACTORY_END_OLD = "            **kwargs,\n        )\n    elif user_config.tts.provider == ServiceProviders.GOOGLE.value:\n"
FACTORY_END_NEW = (
    "            **kwargs,\n        )\n"
    '        _dg_vs = {k: getattr(user_config.tts, k, None) for k in ("stability", "similarity_boost", "style", "use_speaker_boost")}\n'
    "        _dg_vs = {k: v for k, v in _dg_vs.items() if v is not None}\n"
    '        if _dg_vs and str(user_config.tts.model).startswith("elevenlabs/"):\n'
    '            _dg_tts._dograh_extra_body = {"provider": {"options": {"elevenlabs": {"voice_settings": _dg_vs}}}}\n'
    "        return _dg_tts\n"
    "    elif user_config.tts.provider == ServiceProviders.GOOGLE.value:\n"
)

TTS_OLD = "            async with self._client.audio.speech.with_streaming_response.create(\n"
TTS_NEW = (
    '            _eb = getattr(self, "_dograh_extra_body", None)  ' + MARK + "\n"
    "            if _eb:\n"
    '                create_params["extra_body"] = _eb\n\n' + TTS_OLD
)

PLAN = [
    (REGISTRY, [(REG_ANCHOR, REG_ANCHOR + FIELDS, FIELDS)]),
    (FACTORY, [
        (FACTORY_SETTINGS_OLD, FACTORY_SETTINGS_NEW, FACTORY_SETTINGS_NEW),
        (FACTORY_RET_OLD, FACTORY_RET_NEW, FACTORY_RET_NEW),
        (FACTORY_END_OLD, FACTORY_END_NEW, FACTORY_END_NEW),
    ]),
    (TTS, [(TTS_OLD, TTS_NEW, MARK)]),
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
