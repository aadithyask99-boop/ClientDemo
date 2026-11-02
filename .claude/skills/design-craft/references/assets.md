# Assets and the API budget

How generated images and video are made, what they cost, and how the cap works.

## Defaults

- **Images:** `bytedance-seed/seedream-5-0-flash` on OpenRouter (about 2 cents per image in earlier jobs).
- **Video:** `google/veo-3.1-lite`, 720p, 6 s, **audio off**. Chosen from the live catalog on 2026-11-02 for price and for first-frame plus last-frame control, which is how the Halcyon intro was made. It is unproven for our work, so the first real use is an A/B test (below). Wan 3.0, used for the Garden dance, was found not to be the best.
- Change either with `IMAGE_MODEL` and `VIDEO_MODEL` in the environment or `.env`.

### Video models compared (live OpenRouter catalog, 2026-11-02)

Prices are US dollars per second of output, without audio unless stated. A web clip is played muted, so use `"audio": false` and do not pay for sound. "Frames" = accepts a first frame and a last frame. Re-check before choosing, no key needed: `curl -s https://openrouter.ai/api/v1/videos/models`.

| Model | Frames | 720p $/s | 6 s clip | Notes |
| --- | --- | --- | --- | --- |
| `tbc/mischief-1` | first only | 0.01 (480p 0.005) | $0.06 | cheapest by far, 16:9, 3 to 5 s; unknown quality |
| `xai: grok-imagine-video-1.5-lite` | first only | 0.03 (480p 0.02) | $0.18 | cheap, 1 to 15 s, many aspects |
| **`google/veo-3.1-lite`** | **both** | **0.03** (0.05 with audio) | **$0.18** | **default**; 16:9 and 9:16, 4 to 8 s |
| `minimax/hailuo-3-max` | both | 480p 0.05, 768p 0.08 | $0.30 to $0.48 | 5 to 15 s, no audio |
| `alibaba/wan-3.0` | both | 0.10 (480p 0.05) | $0.30 to $0.60 | the one we used; found weaker |
| `bytedance/seedance-2.0-fast` | both | about 0.09 (estimate) | about $0.54 | token priced; same family as the Halcyon clip |
| `google/veo-3.1-fast` | both | 0.08 (0.10 with audio) | $0.48 | step up in quality from Lite |
| `kwaivgi/kling-v3.0-std` | both | 0.084 (0.126 with audio) | $0.50 | 3 to 15 s; Pro is 0.112 |
| `bytedance/seedance-2.5` | both | about 0.23 (estimate) | about $1.39 | long clips to 30 s; not cheap per second |
| `google/veo-3.1` | both | 0.20 (0.40 with audio) | $1.20 | top quality, expensive |

Seedance is priced per video token, not per second. The figures above are estimates using 24 fps and tokens = width x height x fps x seconds / 1024; confirm from the `cost` the tool prints on a real run.

### A/B test before trusting the default

With the same first frame and prompt, make one 6 s clip each on `google/veo-3.1-lite`, `bytedance/seedance-2.0-fast` and `kwaivgi/kling-v3.0-std` (about $1.20 in total at 720p, no audio). Compare motion, whether the last frame lands where intended, artefacts and loop quality. Record the winner and why in `feedback.md`, then set `VIDEO_MODEL`.

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
