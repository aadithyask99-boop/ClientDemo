# Cuts the six runway people out (rembg) and normalises them: same height, feet on the floor line, centred.
# Output: public/img/rw-N.webp (1080x1920) and rw-N-640.webp (640x1138), both with alpha.
import os
from PIL import Image
from rembg import remove, new_session

sess = new_session('isnet-general-use')
W, H = 1080, 1920
FIG_H = 0.955  # figure height as a share of the canvas
for n in range(1, 7):
    src = f'raw/rw-{n}.png'
    if not os.path.exists(src):
        print('missing', src); continue
    im = Image.open(src).convert('RGB')
    cut = remove(im, session=sess)
    a = cut.split()[3].point(lambda v: 255 if v > 24 else 0)
    bb = a.getbbox()
    cut = cut.crop(bb)
    s = (H * FIG_H) / cut.height
    cut = cut.resize((round(cut.width * s), round(H * FIG_H)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(cut, ((W - cut.width) // 2, H - cut.height - round(H * 0.004)), cut)
    canvas.save(f'public/img/rw-{n}.webp', 'WEBP', quality=88, method=6)
    canvas.resize((640, 1138), Image.LANCZOS).save(f'public/img/rw-{n}-640.webp', 'WEBP', quality=86, method=6)
    print('ok', n, cut.size)
