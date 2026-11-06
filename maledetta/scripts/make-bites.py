"""Three 'bite' masks for the mascot's slice (same 1024 frame as the sprite). The page subtracts one from the sprite with
CSS mask-composite, so each click takes a visible bite out of the pizza and the third finishes the slice."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
S = 1024
TRI = [(498, 656), (568, 656), (644, 796), (386, 796)]          # the slice, under the lips, above the crust
STAGES = {
    1: [(515, 700, 40), (556, 694, 34), (532, 676, 30)],
    2: [(520, 724, 66), (566, 716, 52), (478, 736, 40), (538, 690, 46)],
    3: [(520, 746, 98), (590, 744, 70), (456, 752, 62), (535, 700, 70)],
}
tri = Image.new('L', (S, S), 0); ImageDraw.Draw(tri).polygon(TRI, fill=255)
for k, discs in STAGES.items():
    m = Image.new('L', (S, S), 0); d = ImageDraw.Draw(m)
    for x, y, r in discs: d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(tri)))
    m = m.filter(ImageFilter.GaussianBlur(0.8)).point(lambda v: 255 if v > 128 else 0)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0)); out.putalpha(m)
    out.save(f'src/assets/bite-{k}.png', optimize=True)
    print(k, out.getbbox())
