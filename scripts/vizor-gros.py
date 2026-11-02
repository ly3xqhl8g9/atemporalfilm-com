"""Rama-vizor groasă, cu geamul pe marginea afișului (Modul Regie, 02.11.2026, a doua serie).
    python3 scripts/vizor-gros.py LATIME INALTIME SUFIX public/assets/ui/
Scrie vizor{SUFIX}.webp și vizor-mask{SUFIX}.webp, la 3× (Retina), de LATIME × INALTIME px CSS.

Din poza lui Ștefan (scripts/vizor-sursa.webp) păstrăm:
  • conturul exterior al ramei (laturile ușor bombate, colțurile rotunjite),
    întins la LATIME × INALTIME;
  • textura geamului (zgârieturile, vinieta), întinsă pe geamul nou.
Geamul nou = afișul + pista (280 + 36 = 316 × 420 px CSS), cu 1 px de ramă
peste ele pe fiecare latură, colțuri de 4 px (ca fereastra unei lase de
proiecție): marginile ramei sunt pline, în geam nu se vede pelicula.
Are nevoie de scipy."""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

W_CSS, H_CSS, suffix, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3], sys.argv[4]
S = 3                                         # pixeli de imagine pe px CSS
GW, GH, GR = 316 - 2, 420 - 2, 4              # geamul, px CSS
VIGNETTE_MAX = 0.4                            # vinieta geamului nu întunecă afișul mai mult de atât

here = os.path.dirname(os.path.abspath(sys.argv[0]))
a = np.array(Image.open(f'{here}/vizor-sursa.webp').convert('RGBA'))[..., 3] / 255
h0, w0 = a.shape

lab, _ = nd.label(a < 0.5)
glass0 = nd.binary_fill_holes(lab == lab[h0 // 2, w0 // 2])
outer0 = nd.binary_fill_holes((a >= 0.5) | glass0)

W, H = int(round(W_CSS * S)), int(round(H_CSS * S))

# conturul exterior, întins (antialias din redimensionare)
outer = np.array(Image.fromarray((outer0 * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)) / 255
outer = np.clip(outer, 0, 1)

# textura geamului: din dreptunghiul geamului vechi; colțurile din afara geamului
# vechi primesc valoarea celui mai apropiat punct din geam
ys, xs = np.where(glass0)
box = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
tex = a[box]
g = glass0[box]
_, (iy, ix) = nd.distance_transform_edt(~g, return_indices=True)
tex = np.minimum(tex[iy, ix], VIGNETTE_MAX)
gw, gh = int(round(GW * S)), int(round(GH * S))
tex = np.array(Image.fromarray((tex * 255).astype(np.uint8)).resize((gw, gh), Image.LANCZOS)) / 255

# geamul: dreptunghi cu colțuri de GR px, antialias
yy, xx = np.mgrid[0:H, 0:W] + 0.5
cx, cy = W / 2, H / 2
hx, hy, r = gw / 2, gh / 2, GR * S
qx = np.maximum(np.abs(xx - cx) - (hx - r), 0)
qy = np.maximum(np.abs(yy - cy) - (hy - r), 0)
sd = np.hypot(qx, qy) - r                   # distanța semnată față de marginea geamului
inside = np.clip(0.5 - sd, 0, 1)              # 1 în geam, 0 în ramă
glass_tex = np.ones((H, W))
y0, x0 = (H - gh) // 2, (W - gw) // 2
glass_tex[y0:y0 + gh, x0:x0 + gw] = tex

alpha = outer * (inside * glass_tex + (1 - inside))
rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{out}/vizor{suffix}.webp', quality=92, method=6)

m = np.zeros((H, W, 4), np.uint8)
m[..., :3] = 255
m[..., 3] = (inside * 255).round().astype(np.uint8)
Image.fromarray(m, 'RGBA').save(f'{out}/vizor-mask{suffix}.webp', lossless=True, method=6)
print(f'rama {W / S:.0f}×{H / S:.0f} px CSS, geamul {GW}×{GH}')
