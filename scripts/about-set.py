"""Pozele de pe platou pentru ABOUT (a doua peliculă, SetStrip) — 03.11.2026.

Sursa: folderul „selectie website poze pentru pagina about” (lângă repo),
ordinea = ordinea numelor din Finder (sortare naturală). HEIC / TIFF se
convertesc cu ImageMagick (`convert`, cu -auto-orient). Fiecare poză e
decupată la 2:3 în jurul subiectului (CROP: centrul tăieturii, 0…1, pe
orizontală pentru pozele mai late decât 2:3, pe verticală pentru cele mai
înalte) și salvată 800×1200 WebP q80 în public/assets/entities/about/set-NN.webp.

    python3 scripts/about-set.py "../selectie website poze pentru pagina about" /tmp/norm
"""
import os, re, subprocess, sys
from PIL import Image, ImageOps

SRC, TMP = sys.argv[1], sys.argv[2]
OUT = 'public/assets/entities/about'
W, H = 800, 1200

# centrul tăieturii, în ordinea pozelor (1 … 54)
CROP = [0.55, 0.55, 0.5, 0.6, 0.5, 0.58, 0.58, 0.45, 0.5, 0.5,
        0.68, 0.55, 0.65, 0.35, 0.4, 0.5, 0.5, 0.5, 0.55, 0.45,
        0.55, 0.5, 0.45, 0.55, 0.5, 0.4, 0.62, 0.5, 0.32, 0.42,
        0.55, 0.45, 0.4, 0.6, 0.38, 0.5, 0.6, 0.5, 0.5, 0.5,
        0.35, 0.55, 0.4, 0.5, 0.45, 0.5, 0.55, 0.5, 0.6, 0.6,
        0.55, 0.5, 0.55, 0.55]

def nat(s): return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', s)]
files = sorted((f for f in os.listdir(SRC) if not f.startswith('.')), key=nat)
assert len(files) == len(CROP), (len(files), len(CROP))
os.makedirs(TMP, exist_ok=True)
for old in os.listdir(OUT):
    if re.fullmatch(r'set-\d+\.webp', old): os.remove(os.path.join(OUT, old))
for i, (f, c) in enumerate(zip(files, CROP), 1):
    tmp = os.path.join(TMP, f'{i:02d}.jpg')
    subprocess.run(['convert', os.path.join(SRC, f) + '[0]', '-auto-orient', '-colorspace', 'sRGB',
                    '-resize', '2400x2400>', '-quality', '95', tmp], check=True)
    im = ImageOps.exif_transpose(Image.open(tmp)).convert('RGB')
    w, h = im.size
    if w / h > W / H:                       # mai lată: tai din lateral
        cw = round(h * W / H); x = min(max(round(c * w - cw / 2), 0), w - cw)
        im = im.crop((x, 0, x + cw, h))
    else:                                   # mai înaltă: tai sus / jos
        ch = round(w * H / W); y = min(max(round(c * h - ch / 2), 0), h - ch)
        im = im.crop((0, y, w, y + ch))
    im.resize((W, H), Image.LANCZOS).save(f'{OUT}/set-{i:02d}.webp', quality=80, method=6)
    print(i, f, (w, h))
