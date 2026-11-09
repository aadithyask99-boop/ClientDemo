# Turns the raw generated PNGs into the site's webp images, with cutouts (rembg) for products and models.
import os, sys
from PIL import Image
from rembg import remove, new_session
R='raw/'; O='public/img/'; os.makedirs(O,exist_ok=True)
sess=new_session('isnet-general-use')
def save(im,name,w,q=84):
    if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    im.save(O+name+'.webp','WEBP',quality=q,method=6)
def cut(src,name,w):
    if os.path.exists(O+name+'.webp') and '--force' not in sys.argv: return
    im=Image.open(R+src+'.png').convert('RGB')
    c=remove(im,session=sess)
    bb=c.split()[3].point(lambda v:255 if v>8 else 0).getbbox()
    if bb: c=c.crop(bb)
    save(c,name,w,86)
    return c
hero={'hero2-navy':'midnight','hero2-ivory':'snowfield','hero2-forest':'pine','hero2-oxblood':'hearth'}
for s,n in hero.items():
    c=cut(s,'hero-'+n,1500)
    if c is None: c=Image.open(O+'hero-'+n+'.webp')
    w,h=c.size
    # chest thumbnail
    box=(int(w*.18),int(h*.40),int(w*.82),int(h*.40+w*.64))
    t=c.crop(box).resize((220,220),Image.LANCZOS); t.save(O+'thumb-'+n+'.webp','WEBP',quality=84)
for n in ['pin-knit']+[f'acc-{x}' for x in 'scarf beanie gloves crew polo socks'.split()]+[f'col-{x}' for x in 'crew cardigan polo turtle oxzip fisher vest stripe'.split()]+['fig-sit','fig-lean','fig-jump','fig-lie']:
    if os.path.exists(R+n+'.png'): cut(n,n,1200 if n=='fig-lie' else 900)
    else: print('missing',n)
for n in 'ridge ridge-man night-peak porch-dusk porch-day valley'.split():
    if os.path.exists(R+n+'.png'): save(Image.open(R+n+'.png').convert('RGB'),n,2200,80)
for n in ['macro-cable','macro-fibre','macro-collar','macro-parcel','col-feature']+[f'look-{i}' for i in range(1,8)]:
    if os.path.exists(R+n+'.png'): save(Image.open(R+n+'.png').convert('RGB'),n,1100,82)
print('done')
