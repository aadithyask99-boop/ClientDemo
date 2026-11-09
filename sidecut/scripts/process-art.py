"""Turn the generated sources in art-src into the web assets in public/art.
Frames: 73 orbit frames (webp). Portraits: front and back (webp). Props: magenta keyed to alpha (webp). Gift card and hair: webp."""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

G, OUT = 'art-src/gen', 'public/art'
os.makedirs(f'{OUT}/seq', exist_ok=True)
# native resolution: the chair sits in x 120..880, y 60..1040 of the 1080 square cut from the 1080p clip (no downscale)
for i, f in enumerate(sorted(glob.glob('art-src/fr-hi/f-*.png')), 1):
    Image.open(f).convert('RGB').crop((120, 60, 880, 1040)).save(f'{OUT}/seq/c-{i:03d}.webp', quality=80, method=6)
for n in ['kofi', 'raj', 'mateo', 'jin']:
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
for n in ['clay', 'oil', 'comb', 'brush']:
    key(f'{G}/shelf-{n}.png', f'{OUT}/shelf-{n}.webp', 700)
for n in ['spray', 'clock', 'pomade', 'clippers']:
    key(f'{G}/prop-{n}.png', f'{OUT}/prop-{n}.webp')
key(f'{G}/giftcard.png', f'{OUT}/giftcard.webp', 1200)
print('done')
