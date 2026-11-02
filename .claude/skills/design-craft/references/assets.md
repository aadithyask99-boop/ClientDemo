# Assets and the API budget

How generated images and video are made, what they cost, and how the cap works.

## Defaults

- **Images:** `bytedance-seed/seedream-5-0-flash` on OpenRouter (about 2 cents per image in earlier jobs).
- **Video:** `alibaba/wan-3.0` image-to-video at 480p (about $0.26 for 6 s in the Garden dance job). Halcyon's intro used `bytedance/seedance-1-5-pro`; use it only when the quality difference matters, and say so. Prices change; check the `cost` the tool prints.
- Change either with `IMAGE_MODEL` and `VIDEO_MODEL` in the environment or `.env`.

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
