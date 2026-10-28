import sys, glob, os
from PIL import Image
# usage: to-webp.py <srcDir> <dstDir> <prefix> <quality>      numbered frames, no crop
#        to-webp.py --crop <srcDir> <dstDir> <quality>        <name>.png -> <name>.webp, trimmed to the alpha bounding box
if sys.argv[1] == "--crop":
    src, dst, q = sys.argv[2], sys.argv[3], int(sys.argv[4]); os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(src + "/*.png")):
        im = Image.open(f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
        out = f"{dst}/{os.path.basename(f)[:-4]}.webp"; im.save(out, "WEBP", quality=q, method=6, alpha_quality=92); print(out, im.size, os.path.getsize(out) // 1024, "KB")
else:
    src, dst, prefix, q = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]); os.makedirs(dst, exist_ok=True); tot = 0
    for i, f in enumerate(sorted(glob.glob(src + "/*.png"))):
        im = Image.open(f).convert("RGBA"); out = f"{dst}/{prefix}_{i}.webp"
        im.save(out, "WEBP", quality=q, method=6, alpha_quality=90); tot += os.path.getsize(out)
    print(f"{i+1} frames, {tot/1e6:.1f} MB total, {tot/(i+1)/1e3:.0f} KB avg")
