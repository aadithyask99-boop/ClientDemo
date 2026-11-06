"""Turn the generated burger photos (base + variants on the cream background) into transparent cut-outs for the builder.
Same edge-connected background keying as make-seq.py. Output: public/art/b/p{patties}c{cheese}b{bacon}s{salad}.webp"""
import os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
os.makedirs('public/art/b', exist_ok=True)
src = {'p2c1b0s1': 'art-src/base-burger.png'}
for f in glob.glob('art-src/gen/b-*.png'): src[os.path.basename(f)[2:-4]] = f
outs = {}
for k, f in sorted(src.items()):
    a = np.asarray(Image.open(f).convert('RGB').resize((1000, 1000), Image.LANCZOS)).astype(np.float32)
    s = 40
    border = np.concatenate([a[:s].reshape(-1, 3), a[-s:].reshape(-1, 3), a[:, :s].reshape(-1, 3), a[:, -s:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    norm = np.clip(a * (255.0 / bg), 0, 255)
    d = np.abs(norm - 255.0).max(axis=2)
    w = np.clip((26.0 - d) / (26.0 - 8.0), 0, 1)
    lab, n = ndi.label(w > 0.5)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    comp = ndi.binary_dilation(np.isin(lab, list(edge)), iterations=2)
    alpha = np.where(comp, 1 - w, 1.0)
    im = Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')
    # align every burger on its bottom bun: same bun width, same bottom edge, same centre, so crossfades do not jump
    A = np.asarray(im)[..., 3] > 128
    ys, xs = np.where(A); y0, y1 = ys.min(), ys.max()
    band = A[int(y1 - (y1 - y0) * 0.1):y1 + 1]
    bx = np.where(band.any(0))[0]; bw = bx.max() - bx.min(); bc = (bx.max() + bx.min()) / 2
    sc = 640.0 / bw
    im = im.resize((int(1000 * sc), int(1000 * sc)), Image.LANCZOS)
    out = Image.new('RGBA', (1000, 1000), (0, 0, 0, 0))
    out.paste(im, (int(500 - bc * sc), int(930 - y1 * sc)), im)
    outs[k] = out
# one shared crop for every burger: no empty space above the tallest one, none at the sides
tops = [np.where(np.asarray(o)[..., 3] > 40)[0].min() for o in outs.values()]
lefts = [np.where(np.asarray(o)[..., 3] > 40)[1].min() for o in outs.values()]
rights = [np.where(np.asarray(o)[..., 3] > 40)[1].max() for o in outs.values()]
cy0 = max(0, min(tops) - 14); cy1 = 962; cx0 = max(0, min(lefts) - 14); cx1 = min(1000, max(rights) + 14)
for k, o in outs.items():
    o.crop((cx0, cy0, cx1, cy1)).save(f'public/art/b/{k}.webp', quality=84, alpha_quality=90, method=6)
import json
json.dump({'w': int(cx1 - cx0), 'h': int(cy1 - cy0), 'bottom': round(float((930 - cy0) / (cy1 - cy0)), 4)}, open('src/data/burger-dims.json', 'w'))
print(len(src), 'burgers', cx1 - cx0, 'x', cy1 - cy0)
