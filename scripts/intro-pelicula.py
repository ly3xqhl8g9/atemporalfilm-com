#!/usr/bin/env python3
"""
INTRO „VIZOR”, versiunea 3 (16.11.2026) — pelicula reală pentru fâșiile care zboară.

Fâșiile sunt decupate din pozele de referință trimise de Ștefan (nu desenate):
o bucată dreaptă din fiecare, îndreptată (p0 → p1 = mijlocul fâșiei, w = lățimea ei
în poză), adusă la 256 px lățime. Perforațiile devin găuri adevărate (transparente).
Ca să se poată repeta la nesfârșit, fiecare bucată e pusă cap la cap cu ea însăși
în oglindă. Două sunt tonuri puse peste alb-negrul real (sepia, albastru).

ATENȚIE: pozele de referință sunt luate de pe internet (una are filigran dreamstime).
Ca machetă pe site-ul local e în regulă; înainte de publicare trebuie înlocuite cu
peliculă proprie / licențiată (se schimbă doar tabelul de mai jos și se rulează din nou).

Folosire:  python3 scripts/intro-pelicula.py <folderul cu pozele> public/assets/intro
"""
import os, sys
import cv2
import numpy as np

W = 256
# nume: (poza, p0, p1, lățimea, benzile perforației [de la, până la] din lățime, pragul de alb, ton)
STRIPS = {
    'pelicula-color': ('12053e34', (619, 0), (629, 225), 104, [(0.56, 0.92)], 205, None),
    'pelicula-an':    ('f0d63efd', (571, 560), (554, 940), 88, [(0.0, 0.09), (0.86, 1.0)], 150, None),
    'pelicula-an2':   ('f0d63efd', (344, 622), (331, 898), 80, [(0.0, 0.12), (0.88, 1.0)], 170, None),
    'pelicula-negru': ('12053e34', (330, 262), (791, 336), 100, [(0.08, 0.42)], 200, None),
    'pelicula-sepia': ('f0d63efd', (344, 622), (331, 898), 80, [(0.0, 0.12), (0.88, 1.0)], 170, (0.46, 0.72, 1.0)),     # B, G, R
    'pelicula-albastru': ('f0d63efd', (571, 560), (554, 940), 88, [(0.0, 0.09), (0.86, 1.0)], 150, (1.0, 0.80, 0.56)),
}

def cut(src_dir, name, p0, p1, width):
    im = cv2.imread(os.path.join(src_dir, name + '-image.jpg'))
    if im is None:
        sys.exit('lipsește poza ' + name)
    p0 = np.array(p0, float); p1 = np.array(p1, float)
    d = p1 - p0; L = np.linalg.norm(d); t = d / L; n = np.array([-t[1], t[0]])
    h = width / 2
    src = np.float32([p0 - n * h, p0 + n * h, p1 + n * h, p1 - n * h])
    oh = int(round(W * L / width))
    dst = np.float32([[0, 0], [W, 0], [W, oh], [0, oh]])
    return cv2.warpPerspective(im, cv2.getPerspectiveTransform(src, dst), (W, oh), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)

def build(src_dir, key):
    name, p0, p1, w, bands, thr, tone = STRIPS[key]
    s = cut(src_dir, name, p0, p1, w).astype(np.float32)
    # puțină claritate (bucățile sunt mici în poze)
    s = np.clip(s + 0.6 * (s - cv2.GaussianBlur(s, (0, 0), 1.6)), 0, 255)
    lum = s.min(axis=2)
    alpha = np.full(s.shape[:2], 255, np.float32)
    for a, b in bands:
        x0, x1 = int(a * W), int(b * W)
        hole = (lum[:, x0:x1] > thr).astype(np.uint8)
        hole = cv2.morphologyEx(hole, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        alpha[:, x0:x1] = np.where(hole > 0, 0, 255)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
    if tone is not None:
        g = s.mean(axis=2, keepdims=True)
        s = np.clip(g * np.array(tone, np.float32) * 1.1 + np.array(tone, np.float32) * 8, 0, 255)
    rgba = np.dstack([s, alpha]).astype(np.uint8)
    return np.vstack([rgba, rgba[::-1]])        # cap la cap cu ea însăși în oglindă → se repetă fără cusătură

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src_dir, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for key in STRIPS:
        t = build(src_dir, key)
        cv2.imwrite(os.path.join(out, key + '.webp'), t, [cv2.IMWRITE_WEBP_QUALITY, 84])
        print(key, t.shape[1], 'x', t.shape[0])

if __name__ == '__main__':
    main()
