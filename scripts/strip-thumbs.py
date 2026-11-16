#!/usr/bin/env python3
"""
IMAGINILE MICI ALE PELICULEI (16.11.2026)

Ștefan: „dacă dau scroll foarte repede pe peliculă, nu reușește să se încarce
rapid și rămâne blocată până se încarcă”. Pelicula afișa fișierele originale
(afișe de până la 1689 × 2534 px, 1,2 MB), deși un cadru are cel mult
~210 × 315 px CSS (× --film-k: telefonul ≤ 1, tableta 1,3; Retina 2–3×).
Pe telefon, decodarea lor în timpul derulării oprea desenul.

Scriptul face, doar pentru peliculă, variante WebP care acoperă cutia
640 × 960 (afișe, oameni) sau 480 × 720 (pozele de pe platou, mai mici pe
ABOUT) — fără mărire. Originalele rămân pentru fereastra filmului (close-up).

Rulare (din atemporalfilm-com/):   python3 scripts/strip-thumbs.py
Scrie:   public/assets/strip/…   și   containers/LandingHero/stripThumbs.ts
De rulat din nou după ce se adaugă / se schimbă un afiș sau o poză de pe platou.
"""
import glob
import os
import re

from PIL import Image, ImageOps

ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TSX     = os.path.join(ROOT, 'containers', 'LandingHero', 'index.tsx')
PUBLIC  = os.path.join(ROOT, 'public')
OUT_TS  = os.path.join(ROOT, 'containers', 'LandingHero', 'stripThumbs.ts')

BOX_POSTER = (640, 960)
BOX_SET    = (480, 720)
QUALITY    = 82


def sources():
    tsx = open(TSX, encoding='utf-8').read()
    out = []
    for src in re.findall(r"image:\s*'(/assets/[^']+)'", tsx):
        if src not in [s for s, _ in out]:
            out.append((src, BOX_POSTER))
    for p in sorted(glob.glob(os.path.join(PUBLIC, 'assets', 'entities', 'about', 'set-*.webp'))):
        out.append(('/' + os.path.relpath(p, PUBLIC).replace(os.sep, '/'), BOX_SET))
    return out


def thumb(src, box):
    path = os.path.join(PUBLIC, src.lstrip('/'))
    if not os.path.exists(path):
        print('  lipsește:', src)
        return None
    im = ImageOps.exif_transpose(Image.open(path))
    w, h = im.size
    s = max(box[0] / w, box[1] / h)          # acoperă cutia (object-fit: cover)
    ext = os.path.splitext(src)[1].lower()
    if s >= 1 and ext == '.webp':
        return None                           # deja mic și WebP: rămâne originalul
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    rel = os.path.splitext(src.lstrip('/').replace('assets/', '', 1))[0] + '.webp'
    dst_url = '/assets/strip/' + rel
    dst = os.path.join(PUBLIC, dst_url.lstrip('/'))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=QUALITY, method=6)
    a, b = os.path.getsize(path), os.path.getsize(dst)
    print(f'  {src}  {w}×{h} {a // 1024} KB  →  {im.size[0]}×{im.size[1]} {b // 1024} KB')
    return dst_url


def main():
    pairs = []
    for src, box in sources():
        t = thumb(src, box)
        if t:
            pairs.append((src, t))
    lines = [
        '/* GENERAT de scripts/strip-thumbs.py (16.11.2026) — nu se editează de mână.',
        '   Imaginile mici ale peliculei: originalul → varianta pentru peliculă.',
        '   Fereastra filmului (close-up) folosește în continuare originalul. */',
        'const THUMBS: Record<string, string> = {',
    ] + [f"    '{a}': '{b}'," for a, b in pairs] + [
        '};',
        '',
        '/** imaginea pentru peliculă (mică); dacă nu are variantă, originalul */',
        'export const stripSrc = (src: string): string => THUMBS[src] ?? src;',
        '',
    ]
    open(OUT_TS, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{len(pairs)} variante; {os.path.relpath(OUT_TS, ROOT)} scris.')


if __name__ == '__main__':
    main()
