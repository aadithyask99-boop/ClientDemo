import sys, glob, os
from PIL import Image
src, dst, prefix, q = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
os.makedirs(dst, exist_ok=True); tot = 0
for i, f in enumerate(sorted(glob.glob(src + "/*.png"))):
    im = Image.open(f).convert("RGBA"); out = f"{dst}/{prefix}_{i}.webp"
    im.save(out, "WEBP", quality=q, method=6, alpha_quality=90); tot += os.path.getsize(out)
print(f"{i+1} frames, {tot/1e6:.1f} MB total, {tot/(i+1)/1e3:.0f} KB avg")
