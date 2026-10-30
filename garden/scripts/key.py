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
    'couple': (None, 900), 'venue': (None, 900),
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

def petal_sprites(path):
    # six loose pieces laid out 3 columns x 2 rows: crop each cell, key it, trim to the piece
    im = Image.open(path)
    w, h = im.size
    for i in range(6):
        c, r = i % 3, i // 3
        cell = im.crop((c * w // 3, r * h // 2, (c + 1) * w // 3, (r + 1) * h // 2))
        sp = key_out(cell, (0, 255, 0))
        sp = sp.crop(sp.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
        sp.thumbnail((140, 140), Image.LANCZOS)
        sp.save(out / f'petal-{i}.webp', quality=90, method=6)
        print(f'petal-{i}', sp.size)

def trim(sp, thresh=24):
    return sp.crop(sp.getchannel('A').point(lambda v: 255 if v > thresh else 0).getbbox())

def cells(path, cols, rows, names, family, longest):
    """Slice a sheet of separate pieces laid out in a grid, key each and trim it to the piece."""
    im = Image.open(path)
    w, h = im.size
    for i, name in enumerate(names):
        c, r = i % cols, i // cols
        sp = trim(key_out(im.crop((c * w // cols, r * h // rows, (c + 1) * w // cols, (r + 1) * h // rows)), family))
        sp.thumbnail((longest, longest), Image.LANCZOS)
        sp.save(out / f'{name}.webp', quality=88, method=6)
        print(name, sp.size, (out / f'{name}.webp').stat().st_size // 1024, 'KB')

SHEETS = {
    'scenery': (3, 1, ['church', 'tree', 'bench'], (255, 0, 255), 760),
    'flutter': (3, 2, ['fly-0', 'fly-1', 'fly-2', 'fly-3', 'fly-4', 'fly-5'], (255, 0, 255), 150),
}
TRIMMED = {'hills': 1700, 'vine': 1100}  # keyed, trimmed to the artwork, longest side

for p in sorted(raw.iterdir()):
    name = p.stem
    if name in SHEETS: cells(p, *SHEETS[name][:4], SHEETS[name][4]); continue
    if name in TRIMMED:
        sp = trim(key_out(Image.open(p), (255, 0, 255)))
        sp.thumbnail((TRIMMED[name], TRIMMED[name]), Image.LANCZOS)
        sp.save(out / f'{name}.webp', quality=86, method=6)
        print(name, sp.size, (out / f'{name}.webp').stat().st_size // 1024, 'KB'); continue
    if name == 'petals': petal_sprites(p); continue
    if name not in JOBS: continue
    rgb, w = JOBS[name]
    im = Image.open(p)
    if rgb: im = key_out(im, rgb)
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out / f'{name}.webp', quality=82 if not rgb else 88, method=6)
    print(name, im.size, (out / f'{name}.webp').stat().st_size // 1024, 'KB')
