"""Rama-vizor îngroșată (Modul Regie, 02.11.2026, a doua serie).
Din rama făcută din poza lui Ștefan (vizor-sursa.webp + vizor-mask-sursa.webp,
788×1186, afișate la 368×465 px CSS) face rama groasă: geamul rămâne exact cum
era (cu zgârieturile și vinieta lui), iar marginea neagră crește în afară cu
GROS_X px CSS la stânga și la dreapta și GROS_Y px CSS sus și jos, păstrând
forma ramei (laturile ușor bombate, colțurile rotunjite).
    python3 scripts/vizor-gros.py GROS_X GROS_Y public/assets/ui/
Scrie vizor.webp și vizor-mask.webp, la 3× (Retina), de mărimea
(368 + 2·GROS_X) × (465 + 2·GROS_Y) px CSS. Are nevoie de scipy."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

GX, GY, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
S = 3                                # pixeli de imagine pe px CSS
W0, H0 = 368, 465                    # rama veche, px CSS
import os
here = os.path.dirname(os.path.abspath(sys.argv[0]))
v = Image.open(f'{here}/vizor-sursa.webp').convert('RGBA').resize((W0 * S, H0 * S), Image.LANCZOS)
m = Image.open(f'{here}/vizor-mask-sursa.webp').convert('RGBA').resize((W0 * S, H0 * S), Image.LANCZOS)

W, H = int(round((W0 + 2 * GX) * S)), int(round((H0 + 2 * GY) * S))
ox, oy = (W - W0 * S) // 2, (H - H0 * S) // 2
alpha = np.zeros((H, W))
alpha[oy:oy + H0 * S, ox:ox + W0 * S] = np.array(v)[..., 3] / 255
mask = np.zeros((H, W))
mask[oy:oy + H0 * S, ox:ox + W0 * S] = np.array(m)[..., 3] / 255

# geamul = tot ce e înăuntrul ramei (pornind din centru, prin pixelii transparenți)
lab, _ = nd.label(alpha < 0.5)
glass = nd.binary_fill_holes(lab == lab[H // 2, W // 2])
# rama veche, plină (cu tot cu geam): doar în afara ei crește rama
frame = nd.binary_fill_holes((alpha >= 0.5) | glass)
# creștere în afară, eliptică: distanța în px CSS, scalată pe fiecare axă
if GX > 0 or GY > 0:
    sy = 1 / (S * max(GY, 0.01)) if GY > 0 else 1 / S * 1e3
    sx = 1 / (S * max(GX, 0.01)) if GX > 0 else 1 / S * 1e3
    dist = nd.distance_transform_edt(~frame, sampling=(sy, sx))   # 1 = la GROS de rama veche
    aa = 1 / (S * max(GX, GY))                                    # antialias ≈ 1 px de imagine
    grown = np.clip((1 - dist) / aa + 0.5, 0, 1)
else:
    grown = frame.astype(float)
# în rama veche: plin negru, ca rama nouă, în afară de marginea moale a geamului
# (primii ~4 px de imagine de lângă geam rămân cum erau în poză)
gs = nd.gaussian_filter(glass.astype(float), 4) > 0.5          # conturul geamului, netezit
dg = nd.distance_transform_edt(~gs)
ring = np.maximum(alpha, np.clip((dg - 1) / 3, 0, 1))
new_alpha = np.where(glass, alpha, np.where(frame, ring, np.maximum(alpha, grown)))

rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., 3] = (new_alpha * 255).round().astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{out}/vizor.webp', quality=92, method=6)
mrgba = np.zeros((H, W, 4), np.uint8)
mrgba[..., :3] = 255
mrgba[..., 3] = (mask * 255).round().astype(np.uint8)
Image.fromarray(mrgba, 'RGBA').save(f'{out}/vizor-mask.webp', lossless=True, method=6)

# geamul, în px CSS (pentru CSS)
ys, xs = np.where(mask > 0.5)
print(f'rama {W / S:.1f}×{H / S:.1f} px CSS; geamul {(xs.max() - xs.min() + 1) / S:.1f}×{(ys.max() - ys.min() + 1) / S:.1f}')
