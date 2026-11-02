"""Pista sonoră — banda din vizor, din forma de undă trimisă de Ștefan (02.11.2026).
Generează public/assets/ui/soundtrack.webp:
    python3 scripts/pista-sonora.py scripts/pista-sonora-sursa.png public/assets/ui/soundtrack.webp
Captura (verde, orizontală) devine alb pe negru și verticală; forma rămâne cea din captură,
cu antialias-ul și linia de zero. Timpul: 1 coloană din captură = 1 px CSS (2 px Retina);
amplitudinea: toată înălțimea capturii = lățimea benzii (36 px CSS, 72 px Retina).
Tile-ul = forma de undă + aceeași, oglindită → se repetă fără cusătură.
TILE (afișat la final) trebuie să fie egal cu BAND_TILE din containers/LandingHero/index.tsx."""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGB')).astype(float)[2:420, 12:1996]   # fără rama și mânerele selecției
bg, wv = np.array([68, 143, 100.]), np.array([219, 240, 228.])                # verde închis / verde deschis
d = wv - bg
t = np.clip(((im - bg) @ d) / (d @ d), 0, 1)                                  # 0 = fundal, 1 = formă de undă
img = Image.fromarray((t * 255).astype(np.uint8), 'L').transpose(Image.Transpose.TRANSPOSE)
img = img.resize((72, img.height * 2), Image.LANCZOS)
a = np.array(img).astype(float) / 255
a = np.concatenate([a, a[::-1]], 0)
lo, hi = np.array([11, 10, 9.]), np.array([244, 241, 234.])                    # negrul și albul benzii
rgb = (lo + (hi - lo) * a[..., None]).round().astype(np.uint8)
Image.fromarray(rgb, 'RGB').save(dst, lossless=True, quality=100, method=6)
print('TILE', rgb.shape[0] // 2)
