#!/usr/bin/env python3
"""Puts a reference and a build side by side so they can be judged by eye.

  python3 compare-sheets.py <reference-capture-dir> <build-capture-dir> <out.png> [--cols 4] [--width 480]

Both folders come from capture-site.mjs (desktop-01.png, desktop-02.png ...). The output has the reference sheet on top and the build
sheet underneath at the same scale, plus a second image <out>-first.png with the two first screens at full width, one above the other.
Look at both. For recreate and high-fidelity jobs the build must read as the same site: same composition per section, same type scale,
same spacing, same colour balance. If it does not, fix the build and run this again.
"""
import glob, sys
from PIL import Image, ImageDraw

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = lambda n, d: int(sys.argv[sys.argv.index(f'--{n}') + 1]) if f'--{n}' in sys.argv else d
if len(args) < 3:
    sys.exit(__doc__)
ref, build, out = args[:3]
cols, w = opt('cols', 4), opt('width', 480)

def sheet(folder, label):
    files = sorted(glob.glob(f'{folder}/desktop-[0-9][0-9].png'))
    if not files:
        sys.exit(f'no desktop-NN.png files in {folder}')
    ims = [Image.open(f).convert('RGB') for f in files]
    h = int(w * ims[0].height / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    img = Image.new('RGB', (cols * w + (cols + 1) * 6, rows * h + (rows + 1) * 6 + 22), 'white')
    ImageDraw.Draw(img).text((8, 5), f'{label}  ({len(ims)} screens)', fill='black')
    for i, im in enumerate(ims):
        img.paste(im.resize((w, h)), (6 + (i % cols) * (w + 6), 28 + (i // cols) * (h + 6)))
    return img

a, b = sheet(ref, 'REFERENCE'), sheet(build, 'BUILD')
W = max(a.width, b.width)
sheet_img = Image.new('RGB', (W, a.height + b.height + 12), 'white')
sheet_img.paste(a, (0, 0)); sheet_img.paste(b, (0, a.height + 12))
sheet_img.save(out)

fa, fb = Image.open(f'{ref}/desktop-01.png').convert('RGB'), Image.open(f'{build}/desktop-01.png').convert('RGB')
first = Image.new('RGB', (max(fa.width, fb.width), fa.height + fb.height + 12), 'white')
first.paste(fa, (0, 0)); first.paste(fb, (0, fa.height + 12))
first.save(out.replace('.png', '') + '-first.png')
print('wrote', out, 'and', out.replace('.png', '') + '-first.png')
