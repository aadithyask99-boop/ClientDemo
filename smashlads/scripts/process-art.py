"""Key the magenta-background shots to transparent WebP, and turn the line-art mascot into a recolourable mask."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
G='art-src/gen/'; O='public/art/'
def key(src, dst, size):
    im=Image.open(G+src+'.png').convert('RGB').resize((1400,1400),Image.LANCZOS)
    a=np.asarray(im).astype(np.float32)/255
    hsv=np.asarray(Image.fromarray((a*255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    hue=hsv[...,0]/255*360; sv=hsv[...,1]/255; vv=hsv[...,2]/255
    bg=(hue>285)&(hue<345)&(sv>0.42)&(vv>0.3)   # magenta only, anywhere (also inside holes)
    fg=~bg
    fg=ndi.binary_opening(fg,iterations=2)
    lab2,n2=ndi.label(fg)
    if n2>1:
        sizes=ndi.sum(fg,lab2,range(1,n2+1)); fg=lab2==(1+int(np.argmax(sizes)))
    fg=ndi.binary_erosion(fg,iterations=1)
    alpha=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    arr=np.asarray(im).astype(np.float32)
    edge=ndi.binary_dilation(fg,iterations=6)&~ndi.binary_erosion(fg,iterations=6)
    spill=np.clip(np.minimum(arr[...,0],arr[...,2])-arr[...,1],0,255)*0.75
    for c in (0,2): arr[...,c]=np.where(edge,arr[...,c]-spill,arr[...,c])
    out=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).convert('RGBA'); out.putalpha(alpha)
    out=out.crop(out.getbbox()); out.thumbnail((size,size),Image.LANCZOS)
    out.save(O+dst+'.webp',quality=88,method=6); print(dst,out.size)
for k in ['hero','og','jalapeno','bacon','green','bbq','truffle']: key('burger-'+k,'burger-'+k,1100 if k=='hero' else 800)
for k in ['patty','tomato','lettuce','cheese','onion','pickle','bomb']: key('ing-'+k,'ing-'+k,420)
key('mascot-glove','mascot-glove',1000)
def ink(name,dst):
    src=Image.open(G+name+'.png').convert('L').resize((1400,1400),Image.LANCZOS)
    a=np.asarray(src).astype(np.float32)/255
    m=np.clip((0.62-a)/0.40,0,1)
    rgba=np.zeros(m.shape+(4,),np.uint8); rgba[...,3]=(m*255).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA'); im=im.crop(im.getbbox()); im.thumbnail((1100,1100),Image.LANCZOS); im.save('src/assets/'+dst+'.png',optimize=True); print(dst,im.size)
ink('mascot-kid','mascot-kid'); ink('mascot-kid2','mascot-kid2')
