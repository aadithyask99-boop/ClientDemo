"""Show Deepgram Flux voices and an Expressivity field in Dograh's model settings screen.

Dograh v1.49 draws the voice settings from the API: the fields come from DeepgramTTSConfiguration in
services/configuration/registry.py and the voice dropdown from DeepgramVoiceCatalog in
services/configuration/voice_catalog_adapters.py (which asks Deepgram's /v1/models, a list that has
no Flux voices yet). This adds both, so no screen (frontend) change or Dograh upgrade is needed.
Pairs with dograh-flux-tts.py, which makes the call use a "flux-*" voice.

Run:  docker exec -u root -i dograh-api-1 python - < spikes/patches/dograh-flux-ui.py   (then restart the container)
Safe to run again. Lost if the container is recreated; check with:
  docker exec dograh-api-1 grep -c "dograh-ours: flux voices" /app/api/services/configuration/voice_catalog_adapters.py
"""
import re
import sys

BASE = "/app/api/services/configuration/"
MARK = "dograh-ours: flux voices"

# Names, accents and genders as listed on Deepgram's text-to-speech playground (Flux, English).
FLUX = (
    "Hannah:American:F;Kit:British:M;Alexis:American:F;Cliff:American:M;Sienna:American:F;Cole:American:M;"
    "Colin:British:M;Gemma:British:F;Haley:American:F;Heather:American:F;Miles:American:M;Sean:British:M;"
    "Bree:American:F;Brittany:American:F;Brooke:American:F;Bruce:American:M;Conor:Irish:M;Donovan:American:M;"
    "Drew:American:M;Elise:American:F;Jack:British:M;Kai:Singaporean:M;Kelsey:American:F;Maeve:Irish:F;"
    "Marcelo:Filipino:M;Marcus:American:M;Meena:Indian:F;Meghan:American:F;Naveen:Indian:M;Paige:American:F;"
    "Priya:Indian:F;Rufus:British:M;Sharon:Australian:F;Tanner:British:M;Wade:American:M;Wes:American:M"
)


def patch(path, edit):
    s = open(BASE + path).read()
    if MARK in s:
        print(path, "already patched")
        return
    out = edit(s)
    compile(out, path, "exec")
    open(BASE + path, "w").write(out)
    print(path, "patched")


def catalog(s):
    m = list(re.finditer(r"^        return voices\n(?:[ \t]*\n)*class RimeVoiceCatalog", s, re.M))
    if len(m) != 1:
        sys.exit("catalog anchor count %d" % len(m))
    i = m[0].start()
    block = (
        "        # " + MARK + ": Deepgram's model list has no Flux voices yet, so add them here.\n"
        "        if (not query.language or query.language == 'en') and (not query.model or query.model in ('aura-2', 'flux')):\n"
        "            for _item in '" + FLUX + "'.split(';'):\n"
        "                _name, _accent, _g = _item.split(':')\n"
        "                voices.append(\n"
        "                    VoiceInfo(\n"
        "                        voice_id='flux-' + _name.lower() + '-en',\n"
        "                        name=_name + ' (Flux)',\n"
        "                        description=_accent + ' ' + ('feminine' if _g == 'F' else 'masculine') + ', Flux',\n"
        "                        accent=_accent,\n"
        "                        gender='female' if _g == 'F' else 'male',\n"
        "                        language='en',\n"
        "                        preview_url=None,\n"
        "                    )\n"
        "                )\n"
    )
    return s[:i] + block + s[i:]


def registry(s):
    anchor = "\"0.9–1.5 is recommended for Spanish.\"\n        ),\n    )\n"
    if s.count(anchor) != 1:
        sys.exit("registry anchor count %d" % s.count(anchor))
    field = (
        "    # " + MARK + "\n"
        "    expressivity: float | None = Field(\n"
        "        default=None,\n"
        "        ge=-2,\n"
        "        le=2,\n"
        "        description=(\n"
        "            \"Flux voices only: -2 is calmer, 0 is Deepgram's default, 2 is more animated. \"\n"
        "            \"Leave blank to use 1 (a little more expressive than default).\"\n"
        "        ),\n"
        "    )\n"
    )
    return s.replace(anchor, anchor + field)


patch("voice_catalog_adapters.py", catalog)
patch("registry.py", registry)

# The call code needs a whole number for expressivity.
F = "/app/api/services/pipecat/service_factory.py"
s = open(F).read()
a, b = "else user_config.tts.expressivity),", "else int(user_config.tts.expressivity)),"
if a in s:
    open(F, "w").write(s.replace(a, b))
    print("service_factory expressivity cast to int")
else:
    print("service_factory: nothing to change")
