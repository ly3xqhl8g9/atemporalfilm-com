"""Rama-vizor din metal vopsit (Modul Regie / chat, 02.11.2026, 18:15).
    python3 scripts/rama-metal.py LATIME INALTIME GEAM_L GEAM_I IESIRE/ [SUFIX] [--negru]
Scrie vizor{SUFIX}.webp (rama) și vizor-mask{SUFIX}.webp (geamul), la 3× (Retina),
de LATIME × INALTIME px CSS, cu geamul GEAM_L × GEAM_I px CSS în centru.

  • geamul = exact afișul + pista sonoră (237 × 315): niciun pixel de afiș
    acoperit, colțuri drepte, fără textură de geam;
  • rama: lateralele late (acoperă perforația), sus și jos subțire;
  • suprafața: textura din poza lui Ștefan cu metal vopsit (scripts/rama-metal-sursa.png,
    vopsea „ciocănită”, gri-oliv): lumina neuniformă din poză e netezită, iar
    textura e repetată în oglindă, ca să nu se vadă îmbinări; 1 px de poză =
    1 px de imagine (⅓ px CSS) — boabele vopselei au 2–4 px CSS;
  • --negru (02.11, 18:25): aceeași textură, vopsită negru — din poză se
    păstrează doar relieful (luminanța), adus la un negru mat-satinat: fondul
    ~#141414, iar vârfurile boabelor prind puțină lumină;
  • muchiile: colțurile exterioare rotunjite (5 px), o umbră fină pe marginea
    geamului (grosimea tablei) și o lumină fină pe muchia exterioară de sus.
Are nevoie de scipy."""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

flags = [a for a in sys.argv[1:] if a.startswith('--')]
args = [a for a in sys.argv[1:] if not a.startswith('--')]
W_CSS, H_CSS, GW, GH = (float(x) for x in args[0:4])
out = args[4]
suffix = args[5] if len(args) > 5 else ''
BLACK = '--negru' in flags
S = 3                       # pixeli de imagine pe px CSS
R_OUT = 5                   # raza colțurilor exterioare, px CSS

here = os.path.dirname(os.path.abspath(sys.argv[0]))
src = np.array(Image.open(f'{here}/rama-metal-sursa.png').convert('RGB')).astype(float) / 255
src = src[10:, :, :]                                   # fără eticheta albă din colțul de sus

# lumina din poză (mai închisă în stânga) → netezită: textura / lumina locală
lum = src.mean(axis=2)
low = nd.gaussian_filter(lum, 45)
flat = src * (lum.mean() / np.maximum(low, 1e-3))[..., None]

W, H = int(round(W_CSS * S)), int(round(H_CSS * S))
# petice din poză, luate din locuri diferite și cusute cu o trecere scurtă
# (24 px), ca rama să fie mai mare decât poza fără să se vadă repetiția
th, tw, _ = flat.shape
PH, PW, OV = min(300, th), min(600, tw), 24
rng = np.random.default_rng(23)
def ramp(n):
    w = np.ones(n)
    w[:OV] = np.linspace(0.02, 1, OV)
    w[-OV:] = np.minimum(w[-OV:], np.linspace(1, 0.02, OV))
    return w
win = ramp(PH)[:, None] * ramp(PW)[None, :]
acc = np.zeros((H + PH, W + PW, 3))
wsum = np.zeros((H + PH, W + PW))
for y in range(-OV, H, PH - OV):
    for x in range(-OV, W, PW - OV):
        oy = rng.integers(0, th - PH + 1)
        ox = rng.integers(0, tw - PW + 1)
        patch = flat[oy:oy + PH, ox:ox + PW]
        ys, xs = y + OV, x + OV
        acc[ys:ys + PH, xs:xs + PW] += patch * win[..., None]
        wsum[ys:ys + PH, xs:xs + PW] += win
tex = (acc / np.maximum(wsum, 1e-6)[..., None])[OV:OV + H, OV:OV + W]

if BLACK:
    # vopsea neagră: relieful din poză (luminanța, normalizată), pe un fond
    # aproape negru; puterea >1 face vârfurile mai lucioase decât văile
    L = tex.mean(axis=2)
    rel = L / L.mean()
    v = 0.078 * rel ** 1.8
    tex = np.repeat(np.clip(v, 0, 1)[..., None], 3, axis=2)

yy, xx = np.mgrid[0:H, 0:W] + 0.5
cx, cy = W / 2, H / 2
def rrect_sd(hx, hy, r):
    qx = np.maximum(np.abs(xx - cx) - (hx - r), 0)
    qy = np.maximum(np.abs(yy - cy) - (hy - r), 0)
    return np.hypot(qx, qy) - r

sd_out = rrect_sd(W / 2, H / 2, R_OUT * S)          # < 0 în interiorul conturului exterior
gw, gh = GW * S, GH * S
sd_in = np.maximum(np.abs(xx - cx) - gw / 2, np.abs(yy - cy) - gh / 2)   # < 0 în geam (colțuri drepte)
outer = np.clip(0.5 - sd_out, 0, 1)
inside = np.clip(0.5 - sd_in, 0, 1)
alpha = outer * (1 - inside)

# muchiile: umbra de pe marginea geamului (grosimea tablei, ~1,5 px CSS) …
d_in = np.clip(sd_in / (1.5 * S), 0, 1)               # 0 pe marginea geamului → 1 la 1,5 px
shade = 0.55 + 0.45 * d_in
# … și o lumină fină pe muchia exterioară, mai mult sus decât jos
d_out = np.clip(-sd_out / (1.2 * S), 0, 1)
top = np.clip(1 - (yy / H) * 2, 0, 1)
light = 1 + (1 - d_out) * (0.10 + 0.18 * top)
rgb = np.clip(tex * (shade * light)[..., None], 0, 1)

rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., :3] = (rgb * 255).round().astype(np.uint8)
rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{out}/vizor{suffix}.webp', quality=90, method=6)

m = np.zeros((H, W, 4), np.uint8)
m[..., :3] = 255
m[..., 3] = (inside * 255).round().astype(np.uint8)
Image.fromarray(m, 'RGBA').save(f'{out}/vizor-mask{suffix}.webp', lossless=True, method=6)
print(f'rama {W_CSS:.0f}×{H_CSS:.0f} px CSS, geamul {GW:.0f}×{GH:.0f}; '
      f'lateral {(W_CSS - GW) / 2:.0f} px, sus/jos {(H_CSS - GH) / 2:.0f} px')
