"""Perforația peliculei — din poza de 35 mm trimisă de Ștefan (02.11.2026).
    python3 scripts/perforatie.py scripts/perforatie-sursa.jpg public/assets/ui/
Scrie perforatie-st.webp și perforatie-dr.webp: benzile laterale ale peliculei
din poză (marginea, găurile, marcajele portocalii), întoarse pe verticală,
câte un cadru al galeriei (351 px CSS = 16 găuri) pe 26 px CSS, la 3×.
(02.11, 15:00: tot ansamblul ×0,75 și perforația mai subțire, cu mai multe găuri:
16 găuri pe cadru = exact două perioade ale marcajelor din poză, deci tile-ul
se leagă și la marcaje.)
Găurile și ce e dincolo de marginea peliculei devin transparente (prin ele
se vede fundalul paginii).

ATENȚIE: poza e o previzualizare Adobe Stock (nr. 446668068), cu filigran.
E folosită doar ca machetă, pe site-ul local. Înainte de publicare: licența
de la Adobe Stock și rularea scriptului pe fișierul licențiat (fără filigran)."""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
S = 3
TILE_CSS, BAND_CSS = 351, 26            # un cadru al galeriei, lățimea benzii
HOLES = 16                              # găuri pe cadru
PITCH = 41.04                           # pasul găurilor în poză (măsurat pe 23 de găuri)
im = Image.open(src).convert('RGB')

# (început, y0, y1): tăieturile cad între găuri și între marcaje, ca tile-ul să se lege
BANDS = {
    'dr': (341.0, 42, 90),     # banda de sus a pozei (codul de bare) → dreapta
    'st': (334.0, 310, 358),   # banda de jos a pozei (▷22A 23 ▷23A 24) → stânga
}
for name, (x0, y0, y1) in BANDS.items():
    box = (x0, y0, x0 + HOLES * PITCH, y1)
    band = im.resize((TILE_CSS * S, BAND_CSS * S), Image.LANCZOS, box=box)
    a = np.array(band).astype(float)
    mn = a.min(2)
    alpha = np.clip((200 - mn) / 80, 0, 1)             # alb (găuri, fundal) → transparent
    base = np.array([14, 14, 14.])
    rgb = np.where(alpha[..., None] < 1, base, a)      # marginile găurilor: negrul peliculei
    rgba = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)
    # vertical: 90° în sensul acelor de ceasornic → timpul curge în jos,
    # marginea de sus a pozei ajunge la dreapta, cea de jos la stânga
    Image.fromarray(rgba, 'RGBA').transpose(Image.Transpose.ROTATE_270) \
        .save(f'{out}/perforatie-{name}.webp', quality=92, method=6)
print('ok')
