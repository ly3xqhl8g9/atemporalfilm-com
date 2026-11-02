"""Pista sonoră — banda din vizor, din forma de undă stereo trimisă de Ștefan (02.11.2026, a doua).
Generează public/assets/ui/soundtrack.webp:
    python3 scripts/pista-sonora.py scripts/pista-sonora-sursa.jpg public/assets/ui/soundtrack.webp

Ca pista optică stereo de pe pelicula de 35 mm: două piste una lângă alta,
L în stânga și R în dreapta, fiecare cu linia ei de zero.

Nu redimensionăm captura (asta o făcea să pară în rezoluție mică). Din fiecare
coloană a capturii citim cât urcă și cât coboară forma de undă față de zero
(cu precizie sub un pixel, din antialias), apoi o desenăm din nou, curat,
la 3× (Retina), cu margini netede.

Timpul: 1 coloană din captură = 1 px CSS. Lățimea benzii: 36 px CSS =
1 px margine · 16 px L · 2 px între piste · 16 px R · 1 px margine.
Tile-ul = forma de undă + aceeași, oglindită → se repetă fără cusătură.
TILE (afișat la final) trebuie să fie egal cu BAND_TILE din containers/LandingHero/index.tsx."""
import sys
import numpy as np
from PIL import Image

SCALE = 3                       # pixeli de imagine pe px CSS
BAND = 36                       # lățimea benzii, px CSS
CH_HALF = 8.0                   # jumătate din lățimea unei piste, px CSS
CENTERS = (9.0, 27.0)           # linia de zero a lui L și a lui R, px CSS
MIN_HALF = 0.3                  # linia de zero rămâne vizibilă în liniște, px CSS

src, dst = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGB')).astype(float)
H, W = im.shape[:2]

# 0 = fundalul (bleumarin, cu grila), 1 = forma de undă (gri)
bg, wv = np.array([18, 19, 40.]), np.array([146, 147, 150.])
d = wv - bg
t = np.clip(((im - bg) @ d) / (d @ d), 0, 1)
# fără titlul pistei (stânga-sus) și triunghiul din colțul stânga-jos
t[:10, :280] = 0
t[236:, :30] = 0

def envelope(r0, r1):
    """cât urcă (sus) și cât coboară (jos) forma de undă față de zero, pe fiecare coloană"""
    ch = t[r0:r1]
    rows = np.arange(r0, r1)[:, None] + 0.5
    # zero = mijlocul formei de undă în coloanele liniștite
    quiet = ch.sum(0) < 4
    zero = np.median(((ch * rows).sum(0) / np.maximum(ch.sum(0), 1e-6))[quiet])
    up = (ch * np.clip(zero - (rows - 0.5), 0, 1)).sum(0)
    down = (ch * np.clip((rows + 0.5) - zero, 0, 1)).sum(0)
    return up, down

chans = [envelope(0, 126), envelope(127, 252)]
peak = max(max(u.max(), d_.max()) for u, d_ in chans)
k = CH_HALF / peak

# tile-ul: forma de undă + aceeași, oglindită
n = W
tile = 2 * n
ys = (np.arange(tile * SCALE) + 0.5) / SCALE            # timpul, în px CSS
s = np.where(ys < n, ys, 2 * n - ys) - 0.5              # coloana din captură (oglindit în a doua jumătate)
s = np.clip(s, 0, n - 1)
i0 = np.floor(s).astype(int)
i1 = np.minimum(i0 + 1, n - 1)
f = s - i0

xs = (np.arange(BAND * SCALE) + 0.5) / SCALE            # px CSS, centrul fiecărui pixel
a = np.zeros((tile * SCALE, BAND * SCALE))
for (up, down), c in zip(chans, CENTERS):
    u = np.maximum((up[i0] * (1 - f) + up[i1] * f) * k, MIN_HALF)
    dn = np.maximum((down[i0] * (1 - f) + down[i1] * f) * k, MIN_HALF)
    left, right = c - u, c + dn                          # sus → stânga, jos → dreapta
    px = 1 / SCALE                                       # antialias: un pixel de imagine
    cov = np.clip((xs[None, :] - left[:, None]) / px + 0.5, 0, 1) * \
          np.clip((right[:, None] - xs[None, :]) / px + 0.5, 0, 1)
    a = np.maximum(a, cov)

lo, hi = np.array([11, 10, 9.]), np.array([244, 241, 234.])   # negrul și albul benzii
rgb = (lo + (hi - lo) * a[..., None]).round().astype(np.uint8)
Image.fromarray(rgb, 'RGB').save(dst, lossless=True, quality=100, method=6)
print('TILE', tile, 'px CSS ·', rgb.shape[1], '×', rgb.shape[0], 'px')
