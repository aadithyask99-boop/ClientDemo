"""raw/*.png (Seedream output) -> optimized web assets in public/img. Cut-outs get a real alpha via border flood-fill."""
import sys, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
RAW, OUT = "public/img/raw", "public/img"
CUT = ["cookie", "beans2", "sachet"] + [os.path.basename(f)[:-4] for f in glob.glob(RAW + "/flavour-*.png")]
PHOTO = {"polaroid-1": (1000, 82), "polaroid-2": (1000, 82), "polaroid-3": (1000, 82), "glass-bg": (2200, 78), "scoop": (1200, 84)}

def cutout(im, maxw=900):
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    # background = near-white, plus low-saturation light grey (cast shadows); both only where connected to the image edge
    sat = a.max(axis=2) - a.min(axis=2)
    white = (a.min(axis=2) >= 222) | ((sat < 14) & (a.min(axis=2) >= 150))
    lab, n = ndi.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = 1 - ndi.gaussian_filter(bg.astype(np.float32), 1.1)
    alpha = np.clip((alpha - 0.08) / 0.84, 0, 1)
    out = a.copy(); m = (alpha > 0.01) & (alpha < 0.99)
    out[m] = np.clip((a[m] - 255 * (1 - alpha[m, None])) / np.maximum(alpha[m, None], 0.05), 0, 255)   # remove white fringe
    rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(bbox); img.thumbnail((maxw, maxw), Image.LANCZOS); return img

for name in CUT:
    f = f"{RAW}/{name}.png"
    if not os.path.exists(f): continue
    img = cutout(Image.open(f)); img.save(f"{OUT}/{name}.webp", "WEBP", quality=88, method=6, alpha_quality=95)
    print("cut ", name, img.size, os.path.getsize(f"{OUT}/{name}.webp") // 1024, "KB")
for name, (w, q) in PHOTO.items():
    im = Image.open(f"{RAW}/{name}.png").convert("RGB"); im.thumbnail((w, w * 2), Image.LANCZOS)
    im.save(f"{OUT}/{name}.webp", "WEBP", quality=q, method=6); print("img ", name, im.size, os.path.getsize(f"{OUT}/{name}.webp") // 1024, "KB")

# ---- second pass: candid people photos, label cut-outs (ingredients + latte glass) ----
PEOPLE = {"ppl-c": "polaroid-1", "ppl-d": "polaroid-2", "ppl-a": "polaroid-3"}
for src, dst in PEOPLE.items():
    f = f"{RAW}/{src}.png"
    if os.path.exists(f):
        im = Image.open(f).convert("RGB"); im.thumbnail((1000, 1400), Image.LANCZOS)
        im.save(f"{OUT}/{dst}.webp", "WEBP", quality=82, method=6); print("img ", dst, im.size)
os.makedirs(f"{OUT}/label", exist_ok=True)
for name in ["caramel", "hazelnut", "vanilla", "fudge", "cinnamon"]:
    f = f"{RAW}/ing-{name}.png"
    if os.path.exists(f):
        img = cutout(Image.open(f), 700); img.save(f"{OUT}/label/ing-{name}.webp", "WEBP", quality=90, method=6, alpha_quality=95); print("cut ", name, img.size)
g = f"{OUT}/label/latte-photo.png"
if os.path.exists(g):
    img = cutout(Image.open(g), 900); img.save(f"{OUT}/label/latte-cut.webp", "WEBP", quality=90, method=6, alpha_quality=95); print("cut  latte", img.size)
