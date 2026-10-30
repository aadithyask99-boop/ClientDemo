"""Cut chroma-keyed artwork out to transparent webp and write the rest as webp.

    python3 -I scripts/key.py RAW_DIR   (writes ../public/art relative to this file)
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageFilter

raw = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'art'
out.mkdir(parents=True, exist_ok=True)

# name -> (key colour, max width) ; None key = opaque photo
JOBS = {
    'linen': (None, 1000), 'villa': (None, 1100),
    'seal': ((0, 255, 0), 700), 'swans': ((0, 255, 0), 900),
    'garland': ((255, 0, 255), 1500), 'roses': ((255, 0, 255), 1500), 'arch': ((255, 0, 255), 900),
}

def border_colour(a):
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return tuple(np.median(edge, axis=0))

def key_out(im, rgb, lo=60, hi=140):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    kc = border_colour(a)  # the model rarely returns the exact key colour, so sample it
    rgb_family = rgb
    rgb = kc
    d = np.sqrt(((a - np.array(rgb, np.float32)) ** 2).sum(-1))
    alpha = np.clip((d - lo) / (hi - lo), 0, 1)
    # despill: pull the key channel(s) down where the pixel is partly transparent
    if rgb_family == (0, 255, 0):
        a[..., 1] = np.minimum(a[..., 1], (a[..., 0] + a[..., 2]) / 2 + 12)
    else:
        a[..., [0, 2]] = np.minimum(a[..., [0, 2]], (a[..., 1] + 70)[..., None])
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    res = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    res.putalpha(al)
    return res

for p in sorted(raw.iterdir()):
    name = p.stem
    if name not in JOBS: continue
    rgb, w = JOBS[name]
    im = Image.open(p)
    if rgb: im = key_out(im, rgb)
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out / f'{name}.webp', quality=82 if not rgb else 88, method=6)
    print(name, im.size, (out / f'{name}.webp').stat().st_size // 1024, 'KB')
