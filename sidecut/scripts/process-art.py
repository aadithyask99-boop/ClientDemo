"""Turn the generated sources in art-src into the web assets in public/art.
Frames: 73 orbit frames (webp). Portraits: front and back (webp). Props: magenta keyed to alpha (webp). Gift card and hair: webp."""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

G, OUT = 'art-src/gen', 'public/art'
os.makedirs(f'{OUT}/seq', exist_ok=True)
# the chair frames are made by scripts/make-chair.py (keyed from the magenta orbit); this script does not touch them
for n in ['kofi', 'raj', 'mateo', 'jin', 'luca', 'omar', 'ben', 'tom', 'dre']:
    for s in 'fb':
        Image.open(f'{G}/barber-{n}-{s}.png').convert('L').resize((720, 960), Image.LANCZOS).save(f'{OUT}/barber-{n}-{s}.webp', quality=76, method=6)
Image.open(f'{G}/fur.png').convert('RGB').resize((1920, 1080), Image.LANCZOS).save(f'{OUT}/hair.webp', quality=70, method=6)

def key(path, out, size=900):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = np.clip((np.minimum(r, b) - g) / 255.0 * 1.6, 0, 1)  # how magenta a pixel is
    solid = mag > 0.45
    lab, n = ndi.label(solid)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(edge))
    # enclosed backdrop (the holes in scissors, rings and handles) is cleared too when it is a real patch of magenta
    sizes = ndi.sum(solid, lab, range(1, n + 1)) if n else []
    for k, sz in enumerate(sizes, 1):
        if sz > 120: bg |= lab == k
    alpha = np.where(bg, 0.0, 1.0)
    alpha = ndi.gaussian_filter(alpha, 0.8)
    # remove magenta spill on the edge
    spill = np.clip((np.minimum(r, b) - g), 0, None)
    edgezone = (alpha > 0) & (alpha < 1) | ndi.binary_dilation(bg, iterations=2) & ~bg
    r2 = np.where(edgezone, np.minimum(r, g + 12), r); b2 = np.where(edgezone, np.minimum(b, g + 12), b)
    # magenta reflections on the black and chrome: pull red and blue back toward green where both exceed it
    m = (r2 > g) & (b2 > g)
    r2 = np.where(m, g + (r2 - g) * 0.25, r2); b2 = np.where(m, g + (b2 - g) * 0.25, b2)
    rgba = np.dstack([r2, g, b2, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bbox = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    im = im.crop(bbox)
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(out, quality=85, alpha_quality=90, method=6)
for n in ['kofi', 'raj', 'mateo', 'jin']:
    Image.open(f'{G}/mirror-{n}.png').convert('L').resize((1200, 800), Image.LANCZOS).save(f'{OUT}/mirror-{n}.webp', quality=74, method=6)
for n in ['scissors', 'razor', 'brush']:
    key(f'{G}/tool-{n}.png', f'{OUT}/tool-{n}.webp', 700)
for n in ['clay', 'oil', 'comb', 'brush']:
    key(f'{G}/shelf-{n}.png', f'{OUT}/shelf-{n}.webp', 700)
for n in ['spray', 'clock', 'pomade', 'clippers']:
    key(f'{G}/prop-{n}.png', f'{OUT}/prop-{n}.webp')
key(f'{G}/giftcard.png', f'{OUT}/giftcard.webp', 1200)
print('done')
