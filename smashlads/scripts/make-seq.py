"""Turn a generated cheese video into the scroll sequence.
Each frame is flat-fielded against its own measured background, and the background that touches the frame edge is keyed
to transparent (a soft alpha), so the burger and cheese sit on the page like a cut-out and hide whatever is behind them. Usage: python3 scripts/make-seq.py <video.mp4> <out_prefix d|m> [fps]"""
import sys, os, subprocess, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

video, pre = sys.argv[1], sys.argv[2]
fps = sys.argv[3] if len(sys.argv) > 3 else '15'
crop = tuple(float(x) for x in sys.argv[4].split(',')) if len(sys.argv) > 4 and sys.argv[4] != '-' else None  # e.g. 0.2,0.8
freeze = float(sys.argv[5]) if len(sys.argv) > 5 else None  # e.g. 0.29: share of the frame height kept frozen at frame 1
first = None
tmp = f'art-src/frames-{pre}'
os.makedirs(tmp, exist_ok=True)
for f in glob.glob(tmp + '/*'): os.remove(f)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', f'fps={fps}', f'{tmp}/raw-%03d.png'], check=True)
out = 'public/art/seq'
os.makedirs(out, exist_ok=True)
for f in glob.glob(f'{out}/{pre}-*.webp'): os.remove(f)
files = sorted(glob.glob(tmp + '/raw-*.png'))
T0, T1 = 7.0, 24.0
total = 0
for i, f in enumerate(files, 1):
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    s = int(min(H, W) * 0.04)
    border = np.concatenate([a[:s, :].reshape(-1, 3), a[-s:, :].reshape(-1, 3), a[:, :s].reshape(-1, 3), a[:, -s:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    norm = np.clip(a * (255.0 / bg), 0, 255)
    d = np.abs(norm - 255.0).max(axis=2)
    w = np.clip((T1 - d) / (T1 - T0), 0, 1)
    # only the background that touches the frame edge becomes transparent, so bright highlights inside the burger stay solid
    lab, n = ndi.label(w > 0.5)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    comp = np.isin(lab, list(edge))
    comp = ndi.binary_dilation(comp, iterations=3)
    alpha = np.where(comp, 1 - w, 1.0)
    rgba = np.dstack([norm, alpha * 255.0]).astype(np.uint8)
    if freeze:  # the bun never moves, so above its lower lip every frame reuses frame 1 (stops the model inventing cheese on top of the bun)
        if i == 1: first = rgba.copy()
        y0 = int(H * freeze); fe = 14
        rgba[:y0] = first[:y0]
        t = np.linspace(0, 1, fe)[None, :, None] if False else np.linspace(1, 0, fe)[:, None, None]
        rgba[y0:y0 + fe] = (first[y0:y0 + fe] * t + rgba[y0:y0 + fe] * (1 - t)).astype(np.uint8)
    if crop:  # keep only the middle band: the burger and its strands never reach the sides
        rgba = rgba[:, int(W * crop[0]):int(W * crop[1])]
    path = f'{out}/{pre}-{i:03d}.webp'
    Image.fromarray(rgba, 'RGBA').save(path, quality=80, alpha_quality=85, method=6)
    total += os.path.getsize(path)
print(pre, len(files), 'frames', W, 'x', H, round(total / 1e6, 2), 'MB')
