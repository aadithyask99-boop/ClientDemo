"""Turn the magenta-background chair orbit into transparent frames (public/art/seq/c-001..073.webp).
Background = bright, strongly magenta pixels connected to the frame edge (so dark leather tinted by the backdrop stays solid);
magenta cast on chrome is pulled back toward neutral; frames are cropped to the union of the chair across all frames."""
import glob, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src = 'art-src/gen/chair-orbit-m.mp4'
tmp = 'art-src/frm'
os.makedirs(tmp, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', "select='not(mod(n,2))'", '-vsync', '0', f'{tmp}/r-%03d.png'], check=True)
files = sorted(glob.glob(f'{tmp}/r-*.png'))
out = 'public/art/seq'
os.makedirs(out, exist_ok=True)
rgba_all, boxes = [], []
for f in files:
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b)
    sat = (m - g) / np.maximum(m, 1)
    bgc = (m > 95) & (sat > 0.35)
    lab, n = ndi.label(bgc)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(edge))
    # holes of background that are enclosed but clearly backdrop (between legs and so on) are caught by a second pass: large bright magenta areas
    big = ndi.binary_opening(bgc, iterations=2) & ~bg
    lab2, n2 = ndi.label(big)
    if n2:
        sizes = ndi.sum(big, lab2, range(1, n2 + 1))
        for k, sz in enumerate(sizes, 1):
            if sz > 400: bg |= lab2 == k
    bg = ndi.binary_dilation(bg, iterations=1)
    alpha = ndi.gaussian_filter((~bg).astype(np.float32), 0.9)
    # cast removal on chrome and edges
    cast = np.clip(sat * 3.0, 0, 1) * ((r > g) & (b > g))
    near = ndi.binary_dilation(bg, iterations=3)
    k = np.where(near, np.maximum(cast, 0.9), cast * 0.92)
    r2 = r - (r - g) * k
    b2 = b - (b - g) * k
    rgba = np.dstack([r2, g, b2, alpha * 255]).clip(0, 255).astype(np.uint8)
    rgba_all.append(rgba)
    ys, xs = np.where(alpha > 0.5)
    boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
x0 = min(b[0] for b in boxes) - 14; y0 = min(b[1] for b in boxes) - 14
x1 = max(b[2] for b in boxes) + 14; y1 = max(b[3] for b in boxes) + 14
print('crop', x0, y0, x1, y1, 'size', x1 - x0, y1 - y0)
total = 0
for i, rgba in enumerate(rgba_all, 1):
    im = Image.fromarray(rgba, 'RGBA').crop((x0, y0, x1, y1))
    p = f'{out}/c-{i:03d}.webp'
    im.save(p, quality=80, alpha_quality=85, method=6)
    total += os.path.getsize(p)
print(len(rgba_all), 'frames', round(total / 1e6, 2), 'MB', (x1 - x0), 'x', (y1 - y0))
