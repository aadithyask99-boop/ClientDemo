"""Turn art-raw/dance.mp4 into a frame sequence the page scrubs with scroll.

    python3 -I scripts/dance-frames.py RAW_DIR [clip-name]   (clip-name defaults to "dance")

Frames are levelled so the clip's ivory background becomes exactly the page paper colour (#f5efe4); the page
shows them inside an oval embroidery hoop of that same colour, so the fabric and the hoop match.
Writes public/art/dance/d-00.webp ... and re-levels public/art/couple.webp (the still / fallback).
"""
import subprocess, sys, pathlib, tempfile
import numpy as np
from PIL import Image

raw = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'art'
(out / 'dance').mkdir(parents=True, exist_ok=True)
FPS, W = 12, 400  # 12 fps; the last frame lands back on the start pose so the loop is seamless
clip = sys.argv[2] if len(sys.argv) > 2 else 'dance'

PAPER = np.array([245, 239, 228], np.float32)

def level(im, bg):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    return Image.fromarray(np.clip(a * PAPER / bg, 0, 255).astype(np.uint8))

def border_white(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    edge = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    return np.percentile(edge, 50, axis=0)

with tempfile.TemporaryDirectory() as t:
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(raw / f'{clip}.mp4'), '-vf', f'fps={FPS},scale={W}:-1', f'{t}/f-%03d.png'], check=True)
    frames = sorted(pathlib.Path(t).glob('f-*.png'))
    white = border_white(Image.open(frames[0]))
    for i, f in enumerate(frames):
        level(Image.open(f), white).save(out / 'dance' / f'd-{i:02d}.webp', quality=74, method=6)
    print(len(frames), 'frames')

still = Image.open(raw / 'couple.jpg')
still = still.resize((720, round(still.height * 720 / still.width)), Image.LANCZOS)
level(still, border_white(still)).save(out / 'couple.webp', quality=82, method=6)
