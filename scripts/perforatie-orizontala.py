"""Pelicula ORIZONTALĂ de pe telefon / tabletă (09.11.2026) — perforația și pista sonoră.
    python3 scripts/perforatie-orizontala.py scripts/perforatie-sursa.jpg public/assets/ui/

Pe ecranele mici pelicula curge stânga ↔ dreapta, sub meniu. E pelicula de pe
desktop întoarsă cu 90° în sens invers acelor de ceasornic: perforația cu codul
de bare (banda de sus a pozei) ajunge SUS, cea cu marcajele „▷22A 23” (banda de
jos a pozei) ajunge JOS — exact cum sunt în poză, deci marcajele se citesc drept;
pista sonoră (pe desktop în stânga afișului) ajunge sub afiș.

Scrie, la 3× (Retina):
  • perforatie-sus.webp, perforatie-jos.webp — câte un cadru al galeriei
    orizontale: 11 găuri = 242 px CSS (SLOT_W), pe 26 px CSS înălțime.
    Fereastra din poză: de la mijlocul golului dinaintea lui „▷22A” până după
    „23”, plus 3 găuri; marcajele care ar intra tăiate în cele 3 găuri
    („▷23A” jos, codul de bare de sus) sunt acoperite cu negrul peliculei, ca
    fiecare cadru să aibă un singur „▷22A 23” și un singur cod de bare, iar
    tile-ul să se lege fără cusătură (tăieturile cad la mijlocul golurilor).
  • soundtrack-h.webp — pista sonoră de pe desktop (soundtrack.webp), întoarsă
    la fel (90° invers acelor): timpul curge spre dreapta, L jos, R sus.

ATENȚIE: poza e o previzualizare Adobe Stock (nr. 446668068), cu filigran — ca
la perforatie.py: de rulat din nou pe fișierul licențiat înainte de publicarea finală."""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

src, out = sys.argv[1], sys.argv[2]
S = 3
SLOT_W, BAND_CSS = 242, 26             # un cadru al galeriei orizontale, înălțimea benzii
HOLES = 11
PITCH = 41.04                          # pasul găurilor în poză
X0 = 375.0                             # mijlocul golului dintre găurile de la 354,5 și 395,5
CLEAN_FROM = X0 + 8 * PITCH - 4        # după „23”: ultimele 3 găuri fără marcaje
im = np.array(Image.open(src).convert('RGB')).astype(float)

BANDS = {
    'sus': (42, 90),     # banda de sus a pozei (codul de bare)
    'jos': (310, 358),   # banda de jos a pozei (▷22A 23)
}
for name, (y0, y1) in BANDS.items():
    a = im.copy()
    # marcajele portocalii din ultimele 3 găuri → negrul peliculei
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    orange = (R - B > 45) & (R > 90)
    orange = nd.binary_dilation(orange, iterations=2)
    xs = np.arange(a.shape[1])[None, :]
    kill = orange & (xs >= CLEAN_FROM)
    kill[:y0] = False
    kill[y1:] = False
    a[kill] = [14, 14, 14]
    pil = Image.fromarray(a.round().clip(0, 255).astype(np.uint8), 'RGB')
    box = (X0, y0, X0 + HOLES * PITCH, y1)
    band = pil.resize((SLOT_W * S, BAND_CSS * S), Image.LANCZOS, box=box)
    b = np.array(band).astype(float)
    mn = b.min(2)
    alpha = np.clip((200 - mn) / 80, 0, 1)             # alb (găuri, fundal) → transparent
    base = np.array([14, 14, 14.])
    rgb = np.where(alpha[..., None] < 1, base, b)      # marginile găurilor: negrul peliculei
    rgba = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(f'{out}/perforatie-{name}.webp', quality=92, method=6)

st = Image.open(os.path.join(out, 'soundtrack.webp')).convert('RGB')
st.transpose(Image.Transpose.ROTATE_90).save(f'{out}/soundtrack-h.webp', lossless=True, quality=100, method=6)
print('ok', SLOT_W, 'px CSS pe cadru,', HOLES, 'găuri')
