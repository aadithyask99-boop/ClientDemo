"""Instant acknowledgements ("Mm-hm", "Okay", "Right") while the model is still thinking.

Dograh only speaks a filler when a TOOL starts. This adds a small module that listens for the moment the call
decides the caller's turn is over (the same event that starts the model), and, on some turns, says one short
varied acknowledgement through Dograh's own speech queue (engine.queue_speech). It is never added to the
conversation the model sees, never written to the transcript, never interrupts speech already in progress, and
the caller can talk over it. Any failure is logged and swallowed, so it cannot break a call.

Run inside the container:  docker exec -i -u root dograh-api-1 python - < spikes/patches/dograh-ack-filler.py
Then restart the API:      docker restart dograh-api-1
Remove again:              docker exec -i -u root -e REMOVE=1 dograh-api-1 python - < spikes/patches/dograh-ack-filler.py
Safe to run again. Lost if the container is recreated (spikes/bring-up.sh re-applies it).
Check:  docker exec dograh-api-1 grep -c "dograh-ours: instant acknowledgements" /app/api/services/pipecat/run_pipeline.py
"""
import os
import shutil
import sys

PIPE = "/app/api/services/pipecat/run_pipeline.py"
MOD = "/app/api/services/pipecat/ack_filler.py"
BACKUP = PIPE + ".pre-ack"
MARKER = "# dograh-ours: instant acknowledgements"
ANCHOR = "    pipeline_metrics_aggregator = PipelineMetricsAggregator()\n"

MODULE = '''"""dograh-ours: instant acknowledgements. See spikes/patches/dograh-ack-filler.py."""
import asyncio
import os
import random
import time

import logging

log = logging.getLogger(__name__)

PHRASES = ["Mm-hm.", "Okay.", "Right.", "Yeah, okay.", "Ah, okay.", "Mm, okay.", "I see.", "Yeah, fair."]
PROBABILITY = float(os.environ.get("ACK_PROBABILITY", "0.6"))
MIN_GAP_S = float(os.environ.get("ACK_MIN_GAP_S", "6"))


class AckFiller:
    def __init__(self, engine):
        self.engine = engine
        self._last_at = 0.0
        self._last_text = None
        self._turns = 0
        self._tasks = set()

    def bind(self, aggregator):
        aggregator.user_turn_controller.add_event_handler("on_user_turn_inference_triggered", self._on_inference)

    def _busy(self):
        e = self.engine
        playback = getattr(e, "speech_playback", None)
        return bool(getattr(playback, "pending", False)) or bool(getattr(e, "_bot_is_speaking", False))

    async def _on_inference(self, *_args):
        try:
            self._turns += 1
            if self._turns == 1:
                return  # the first reply after the greeting stays plain
            now = time.monotonic()
            if now - self._last_at < MIN_GAP_S or random.random() > PROBABILITY or self._busy():
                return
            text = random.choice([p for p in PHRASES if p != self._last_text])
            self._last_at, self._last_text = now, text
            task = asyncio.create_task(self._say(text))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)
        except Exception:
            log.exception("ack filler skipped")

    async def _say(self, text):
        try:
            await self.engine.queue_speech(
                text=text,
                append_to_context=False,
                persist_to_logs=False,
                mute_user=False,
                timeout=5.0,
                can_queue=lambda: not self._busy(),
            )
        except Exception:
            log.exception("ack filler failed")
'''

INSERT = (
    "    try:  " + MARKER + "\n"
    "        from api.services.pipecat.ack_filler import AckFiller\n"
    "\n"
    "        AckFiller(engine).bind(user_context_aggregator)\n"
    "    except Exception:  # noqa: BLE001 - this must never break a call\n"
    "        import logging\n"
    "\n"
    '        logging.getLogger(__name__).exception("ack filler setup failed")\n'
    "\n"
)

if os.environ.get("REMOVE"):
    if os.path.exists(BACKUP):
        shutil.copy(BACKUP, PIPE)
        print("restored", PIPE, "from", BACKUP)
    if os.path.exists(MOD):
        os.remove(MOD)
        print("removed", MOD)
    sys.exit(0)

s = open(PIPE).read()
if MARKER in s:
    print("already patched")
    sys.exit(0)
if s.count(ANCHOR) != 1:
    sys.exit("expected exactly one anchor line, found %d; not touching anything" % s.count(ANCHOR))

compile(MODULE, MOD, "exec")
new = s.replace(ANCHOR, INSERT + ANCHOR)
compile(new, PIPE, "exec")
shutil.copy(PIPE, BACKUP)
open(MOD, "w").write(MODULE)
open(PIPE, "w").write(new)
print("patched", PIPE, "and wrote", MOD)
