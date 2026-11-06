"""Key the magenta-background food shots to transparent WebP, and turn the mascot ink into a mask sprite
(4 slightly wobbled frames, so the lines 'boil' like a hand-redrawn animation, cheap to play with CSS steps)."""
import numpy as np, sys, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
G='art-src/gen/'; O='public/art/'
def key(name, size=900):
    im=Image.open(f'{G}food-{name}.png').convert('RGB').resize((1400,1400),Image.LANCZOS)
    a=np.asarray(im).astype(np.float32)/255
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); sat=(mx-mn)/(mx+1e-6)
    # magenta-ness: r and b high relative to g
    import colorsys
    hsv=np.asarray(Image.fromarray((a*255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    hue=hsv[...,0]/255*360; sv=hsv[...,1]/255; vv=hsv[...,2]/255
    bg=((hue>282)&(hue<358)&(sv>0.55)&(vv>0.25))|(((hue>=315)|(hue<=4))&(vv<0.64)&(sv>0.6)&(vv>0.08))
    # keep only background connected to the border
    lab,n=ndi.label(bg)
    border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    bgm=np.isin(lab,list(border))
    fg=~bgm
    fg=ndi.binary_opening(fg,iterations=2)
    fg=ndi.binary_closing(fg,iterations=14)
    lab2,n2=ndi.label(fg); 
    if n2>1:
        sizes=ndi.sum(fg,lab2,range(1,n2+1)); fg=lab2==(1+int(np.argmax(sizes)))
    fg=ndi.binary_fill_holes(fg)
    fg=ndi.binary_erosion(fg,iterations=2)
    alpha=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    # despill magenta fringe on edge pixels
    arr=np.asarray(im).astype(np.float32)
    edge=ndi.binary_dilation(fg,iterations=6)&~ndi.binary_erosion(fg,iterations=6)
    spill=np.clip(np.minimum(arr[...,0],arr[...,2])-arr[...,1],0,255)*0.75
    for c in (0,2): arr[...,c]=np.where(edge,arr[...,c]-spill,arr[...,c])
    out=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).convert('RGBA'); out.putalpha(alpha)
    bbox=out.getbbox(); out=out.crop(bbox)
    out.thumbnail((size,size),Image.LANCZOS)
    out.save(f'{O}food-{name}.webp',quality=88,method=6)
    print(name,out.size)
for n in ['pizza','spritz','tiramisu','burrata','cannoli','espresso','pasta','gelato']: key(n)

# mascot: ink -> alpha
src=Image.open(G+'mascot-c.png').convert('L').resize((1024,1024),Image.LANCZOS)
a=np.asarray(src).astype(np.float32)/255
ink=np.clip((0.62-a)/0.40,0,1)            # dark = ink
H,W=ink.shape
rng=np.random.default_rng(7)
def noise(seed,scale):
    r=np.random.default_rng(seed).normal(size=(H//scale+2,W//scale+2)).astype(np.float32)
    return ndi.zoom(r,scale,order=3)[:H,:W]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
frames=[]
for k in range(4):
    dx=noise(100+k,64)*3.2; dy=noise(200+k,64)*3.2
    # flames (upper 45%) wobble more than the face
    wgt=np.clip((0.58-yy/H)/0.30,0.25,1.0)
    f=ndi.map_coordinates(ink,[yy+dy*wgt,xx+dx*wgt],order=1,mode='constant')
    frames.append(f)
strip=np.concatenate(frames,axis=1)
rgba=np.zeros((H,W*4,4),np.uint8); rgba[...,3]=(strip*255).astype(np.uint8)
Image.fromarray(rgba,'RGBA').save('src/assets/mascot-sprite.png',optimize=True)  # src/assets so Vite resolves it at any base path
print('mascot ok')
