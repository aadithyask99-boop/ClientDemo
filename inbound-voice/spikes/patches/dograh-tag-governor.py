"""Tag governor: stops the model from overusing ElevenLabs audio tags, and keeps tags away from voices that would read them aloud.

A model told to "use a tag now and then" often opens every reply with [short pause]. Prompts cannot be trusted to hold a rule like
that, so this enforces it in code, on the text that is about to be spoken (one sentence at a time):
  - Voices that understand tags (ElevenLabs Eleven v3 / v4 / v4 Turbo): only the allowed tags survive; a [short pause] at the very start of a
    sentence is dropped (other tags may lead a sentence, as ElevenLabs intends); at most one tag is kept per TAG_MIN_SENTENCES sentences (default 3). The exception is a [short pause] placed
    just before a time or a price (a digit or a pound sign soon after it), which always stays.
  - Every other voice: all bracketed tags are removed, so nothing is ever read out as "short pause".
The words the model wrote are not changed, only the tags. Any failure leaves the text untouched and is logged, so it cannot break a call.

Hooks the pipecat TTSService constructor (/opt/venv/.../pipecat/services/tts_service.py) with one transform and adds a small module.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-tag-governor.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-tag-governor.py
Safe to run again. Lost if the container is recreated (spikes/bring-up.sh re-applies it).
Check:  docker exec dograh-api-1 grep -c "dograh-ours: tag governor" /opt/venv/lib/python3.13/site-packages/pipecat/services/tts_service.py
"""
import os
import shutil
import sys

TTS = "/opt/venv/lib/python3.13/site-packages/pipecat/services/tts_service.py"
MOD = "/app/api/services/pipecat/tag_governor.py"
BACKUP = TTS + ".pre-tag-governor"
MARKER = "# dograh-ours: tag governor"
ANCHOR = "        self._processing_text: bool = False\n"

MODULE = '''"""dograh-ours: tag governor. See spikes/patches/dograh-tag-governor.py."""
import logging
import os
import re

log = logging.getLogger(__name__)

TAG = re.compile(r"\\s*\\[([A-Za-z][A-Za-z \\-]{0,30})\\]\\s*")
ALLOWED = {"short pause", "thoughtful", "warmly", "sighs", "clears throat", "sympathetic", "softly", "reassuring", "curious", "exhales", "chuckles", "keyboard typing", "excited", "content", "trusting", "optimistic", "slowly", "gasps", "laughs"}
MIN_SENTENCES = int(os.environ.get("TAG_MIN_SENTENCES", "2"))
FILLERS = {"mm-hm", "mm", "hmm", "um", "uh", "okay", "right", "ah"}
NUMBER_NEAR = re.compile(r"^.{0,30}?(\\d|\\u00a3)")


class TagGovernor:
    def __init__(self, service):
        self.service = service
        self.since_kept = MIN_SENTENCES  # the first allowed tag may appear early

    def _reads_tags(self):
        name = type(self.service).__name__.lower()
        model = str(getattr(self.service, "model_name", "") or getattr(getattr(self.service, "_settings", None), "model", "") or "").lower()
        if "elevenlabs" in name:
            return "v3" in model or "v4" in model or "dialogue" in name
        # ElevenLabs reached through an OpenAI-compatible endpoint (OpenRouter): the model name carries the vendor.
        return model.startswith("elevenlabs/") and ("v3" in model or "v4" in model)

    async def __call__(self, text, aggregation_type=None):
        try:
            return self._govern(text)
        except Exception:
            log.exception("tag governor skipped")
            return text

    def _govern(self, text):
        if "[" not in text:
            self.since_kept += 1
            return text
        reads = self._reads_tags()
        out = []
        pos = 0
        kept_here = False
        for m in TAG.finditer(text):
            out.append(text[pos:m.start()])
            tag = m.group(1).strip().lower()
            if tag in FILLERS:
                out.append(" " + m.group(1).strip() + ("," if text[m.end():m.end() + 1].strip()[:1].isalnum() else "") + " ")
                pos = m.end()
                continue
            before = "".join(out)
            rest = text[m.end():]
            keep = False
            if reads and tag in ALLOWED:
                if tag == "short pause" and NUMBER_NEAR.match(rest):
                    keep = True
                elif (tag != "short pause" or before.strip()) and not kept_here and self.since_kept >= MIN_SENTENCES:
                    keep = True
                    kept_here = True
            if keep:
                out.append(" [" + tag + "] ")
            else:
                out.append(" " if before.strip() and rest.strip() else "")
            pos = m.end()
        out.append(text[pos:])
        result = re.sub(r"  +", " ", "".join(out)).strip()
        self.since_kept = 0 if kept_here else self.since_kept + 1
        if result != text.strip():
            log.info("tag governor: %r -> %r", text[:80], result[:80])
        return result
'''

INSERT = (
    "        try:  " + MARKER + "\n"
    "            from api.services.pipecat.tag_governor import TagGovernor\n"
    "\n"
    "            self._text_transforms.append((\"*\", TagGovernor(self)))\n"
    "        except Exception:  # noqa: BLE001 - this must never break a call\n"
    "            import logging\n"
    "\n"
    '            logging.getLogger(__name__).exception("tag governor setup failed")\n'
)

if os.environ.get("REMOVE"):
    if os.path.exists(BACKUP):
        shutil.copy(BACKUP, TTS)
        print("restored", TTS, "from", BACKUP)
    if os.path.exists(MOD):
        os.remove(MOD)
        print("removed", MOD)
    sys.exit(0)

s = open(TTS).read()
if MARKER in s:
    print("already patched")
    sys.exit(0)
if s.count(ANCHOR) != 1:
    sys.exit("expected exactly one anchor line, found %d; not touching anything" % s.count(ANCHOR))

compile(MODULE, MOD, "exec")
new = s.replace(ANCHOR, ANCHOR + INSERT)
compile(new, TTS, "exec")
shutil.copy(TTS, BACKUP)
open(MOD, "w").write(MODULE)
open(TTS, "w").write(new)
print("patched", TTS, "and wrote", MOD)
