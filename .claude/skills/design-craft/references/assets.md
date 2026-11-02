# Assets and the API budget

How generated images and video are made, what they cost, and how the cap works.

## Defaults

- **Images:** `bytedance-seed/seedream-5-0-flash` on OpenRouter (about 2 cents per image in earlier jobs).
- **Video:** `bytedance/seedance-1-5-pro`, 720p, 6 s, **audio off**. Cheapest model with first-frame plus last-frame control in the live catalog on 2026-11-02 (about $0.026 per second at 720p without audio, about $0.16 per 6 s clip), and the one that made the approved Halcyon intro. Challengers are Veo 3.1 Lite and Seedance 2.0 Fast (A/B test below). Wan 3.0, used for the Garden dance, was found not to be the best.
- Change either with `IMAGE_MODEL` and `VIDEO_MODEL` in the environment or `.env`.

### Video models compared (live OpenRouter catalog, 2026-11-02)

US dollars per second of output, **without audio** (a web clip is played muted, so use `"audio": false`). "Frames" = accepts a first and a last frame. The website's headline "Priced from $X" is the **lowest resolution**, usually 480p: compare at the same resolution. Re-check before choosing, no key needed: `curl -s https://openrouter.ai/api/v1/videos/models`.

| Model | Frames | 480p $/s | 720p $/s | 6 s at 720p | Notes |
| --- | --- | --- | --- | --- | --- |
| `tbc/mischief-1` | first | 0.005 | 0.01 | $0.06 | cheapest; 16:9 only, 3 to 5 s; quality unknown |
| **`bytedance/seedance-1-5-pro`** | both | about 0.012 | about 0.026 | **about $0.16** | **default**; made the Halcyon intro; 4 to 12 s |
| `google/veo-3.1-lite` | both | n/a | 0.03 | $0.18 | 16:9 and 9:16, up to 8 s; main challenger |
| `x-ai/grok-imagine-video-1.5-lite` | first | 0.02 | 0.03 | $0.18 | 1 to 15 s |
| `bytedance/seedance-2.0-mini` | both | about 0.034 | about 0.076 | about $0.45 | 4 to 15 s |
| `bytedance/seedance-2.0-fast` | both | about 0.040 | about 0.091 | about $0.54 | challenger |
| `alibaba/wan-3.0` | both | 0.05 | 0.10 | $0.60 | found weaker |
| `minimax/hailuo-3-max` | both | 0.05 | 768p 0.08 | $0.48 at 768p | no audio option |
| `google/veo-3.1-fast` | both | n/a | 0.08 | $0.48 | step up from Lite |
| `kwaivgi/kling-v3.0-std` | both | n/a | 0.084 | $0.50 | 720p; Pro is 0.112 |
| `bytedance/seedance-2.0` | both | about 0.067 | about 0.151 | about $0.91 | |
| `bytedance/seedance-2.5` | both | 0.1028 | about 0.231 | about $1.39 | long clips to 30 s; its "from $0.1028" is the 480p price |
| `google/veo-3.1` | both | n/a | 0.20 | $1.20 | top quality |

Seedance is priced per video token. The estimates use 24 fps and tokens = width x height x fps x seconds / 1024; this reproduces OpenRouter's displayed Seedance 2.5 price of $0.1028 per second at 480p exactly, so the formula can be trusted. Confirm from the `cost` the tool prints on a real run. Cheap does not mean good: price says nothing about quality.

### A/B test before trusting the default

With the same first frame and prompt, make one 6 s clip each on `bytedance/seedance-1-5-pro`, `google/veo-3.1-lite`, `bytedance/seedance-2.0-fast` and `kwaivgi/kling-v3.0-std` (about $1.40 in total at 720p, no audio). Compare motion, whether the last frame lands where intended, artefacts and loop quality. Record the winner and why in `feedback.md`, then set `VIDEO_MODEL`.

## The key and the $2 cap

- The key is `OPENROUTER_API_KEY`. It must never be pasted into chat or committed.
- **Cloud sessions:** the owner adds it as an environment variable (or API credential) in the cloud environment settings: the environment menu in the session's title bar, then Edit. A new session picks it up.
- **Local use:** copy the root `.env.example` to `.env` (git-ignored) and fill it in. There is also `secrets/env.age` (an age-encrypted copy opened by `scripts/env.sh`), which needs a private key that is not in the repo.
- **Two layers of cap:**
  1. Set a credit limit of $2 on the key itself when creating it on OpenRouter. That is the hard stop. (Check the key's settings; I cannot verify the limit from here.)
  2. `scripts/gen-media.mjs` stops a run when its spend reaches `BUDGET_USD` (default 2) and logs every call to `spend-ledger.jsonl`. It runs jobs one at a time, so it can overshoot by at most one job.

## How to use it

```
node .claude/skills/design-craft/scripts/gen-media.mjs jobs.json --out <folder> [--budget 2] [--dry]
```

Run with `--dry` first to see the plan. `scripts/example-jobs.json` shows the job format. The tool is built from two scripts that already worked (`more-coffee/scripts/gen.mjs` and `garden/scripts/gen-dance.mjs`) but has not been run against the live API yet; treat the first real run as a test and read its output.

## Rules for assets

- One shared style prompt per site so a set stays consistent. Save the prompts that gave approved results in the site's case study.
- Use the owner's own photos where they exist. Generated likenesses of real people need their approval.
- Anything that must look identical from every angle (product, label, type) is rendered in code, not generated.
- Pieces that need transparency are generated on a flat colour and keyed out (see `garden/scripts/key.py`, `more-coffee/scripts/optimize.py`).
- Generated art usually cannot be copyrighted; say so to clients who expect exclusivity.
- Check every image at full size before using it.

## Rendered 3D (like the Brew More tub)

The tub was built in code as a three.js scene (`more-coffee/render/jar.html`) and baked into frame sequences with headless Chromium. That works well for simple, mostly cylindrical products where the label is drawn on a canvas.

For a car, aircraft or truck this will not scale: modelling those shapes procedurally in code looks poor. Realistic options, in order of preference:
1. A licensed or CC0 glTF model, rendered in three.js with the same frame-baking pipeline. Confirm the licence first.
2. An image-to-video model from a clean product still (cheap and quick, but the model cannot guarantee exact detail from every angle).
3. A photographed or supplied product shoot.

Ask the owner which fits the client before spending anything.
