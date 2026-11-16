#!/usr/bin/env python3
"""
INTRO „VIZOR” (16.11.2026) — piesele făcute din poza cu vizorul și din MVI_0395.MOV

Poza de referință (scripts/intro-vizor-referinta.jpg, 1199×695): un vizor de
aparat foto — geamul cu marginile moi, liniile de cadru crem, dreptunghiul din
centru, „200” roșu jos, obiectivul neclar în colțul din dreapta-jos, totul pe
negru, cu grain. Scriptul păstrează încadratura și look-ul și pune în geam
imaginea din clip.

Ce face (alegi cu primul argument):
  clip   → clipul întreg, „copt” (ramă + imagine + grain), 1600×926, H.264
  site   → piesele pentru intro-ul site-ului, în public/assets/intro/:
             vizor-scena.mp4   imaginea din geam (cu marginile moi), scurtă
             vizor-scena.jpg   primul ei cadru (rezervă, dacă videoul nu pornește)
             vizor-rama.webp   liniile de cadru, „200”, obiectivul — cu transparență
  cadru  → un singur cadru PNG, pentru verificare (argument: secunda)

Folosire:
  python3 scripts/intro-vizor.py clip  MVI_0395.MOV  vizor-MVI_0395.mp4
  python3 scripts/intro-vizor.py site  MVI_0395.MOV  public/assets/intro
  python3 scripts/intro-vizor.py cadru MVI_0395.MOV  cadru.png  4.0

Are nevoie de: ffmpeg, numpy, opencv (cv2).
Măsurile sunt luate din poză, în pixelii ei (1199×695), și înmulțite cu K.
"""
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.environ.get('VIZOR_REF', os.path.join(HERE, 'intro-vizor-referinta.jpg'))

RW, RH = 1199, 695            # poza de referință
OW, OH = 1920, 1112           # cadrul de ieșire (același raport)
K = OW / RW

# ── geamul (în pixelii pozei): marginile și cât de moi sunt, pe fiecare latură
WIN = dict(l=226.0, r=957.0, t=109.0, b=585.0)
SOFT = dict(l=46.0, r=22.0, t=42.0, b=26.0)
CORNER = 26.0

# ── dreptunghiul în care stă imaginea din clip (în pixelii de ieșire), 3:2
SX, SY, SW, SH = 312, 134, 1248, 832
# ── decuparea din clip (1920×1080 → 3:2): soarele rămâne aproape de mijloc
CROP_X, CROP_W = 60, 1620

# ── aberația cromatică a vizorului: albastrul iese puțin spre margini
CA_B, CA_R = 1.0046, 1.0014

SURROUND = np.array([6, 6, 8], np.float32) / 255.0
LINE = np.array([232, 222, 196], np.float32) / 255.0     # liniile de cadru (crem)
PATCH = np.array([236, 240, 226], np.float32) / 255.0    # dreptunghiul din centru


def sm(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def window_alpha():
    """geamul: dreptunghi cu colțuri rotunde, margini moi (mai moi sus și în stânga)"""
    y, x = np.mgrid[0:OH, 0:OW].astype(np.float32)
    x = x / K + 0.5 / K
    y = y / K + 0.5 / K
    cx, cy = (WIN['l'] + WIN['r']) / 2, (WIN['t'] + WIN['b']) / 2
    hw, hh = (WIN['r'] - WIN['l']) / 2, (WIN['b'] - WIN['t']) / 2
    qx = np.abs(x - cx) - (hw - CORNER)
    qy = np.abs(y - cy) - (hh - CORNER)
    sd = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - CORNER
    wx = SOFT['l'] + (SOFT['r'] - SOFT['l']) * sm((x - cx) / (2 * hw) + 0.5)
    wy = SOFT['t'] + (SOFT['b'] - SOFT['t']) * sm((y - cy) / (2 * hh) + 0.5)
    w = wy + (wx - wy) * sm((qx - qy) / 60.0 + 0.5)
    a = sm(0.5 - sd / w)
    # spre margini, înăuntru, imaginea se întunecă puțin (vignetare)
    vig = 1.0 - 0.14 * sm(1.0 + sd / 110.0) ** 2
    return a.astype(np.float32), vig.astype(np.float32)


def rects(items, blur=0.9, glow=0.22):
    """dreptunghiuri (x0, y0, x1, y1, tărie) din pixelii pozei → strat 0..1, ușor moale"""
    ss = 4
    big = np.zeros((OH * ss, OW * ss), np.float32)
    for (x0, y0, x1, y1, v) in items:
        p0 = (int(round(x0 * K * ss)), int(round(y0 * K * ss)))
        p1 = (int(round(x1 * K * ss)) - 1, int(round(y1 * K * ss)) - 1)
        cv2.rectangle(big, p0, p1, float(v), -1)
    m = cv2.resize(big, (OW, OH), interpolation=cv2.INTER_AREA)
    s = cv2.GaussianBlur(m, (0, 0), blur)
    if glow:
        s = np.maximum(s, 0) + glow * cv2.GaussianBlur(m, (0, 0), 5.0)
    return np.clip(s, 0, 1)


def framelines():
    return rects([
        (365, 110, 852.5, 116.5, 1.0),        # linia de sus
        (369, 570, 458.5, 577.0, 1.0),        # liniuța de jos, stânga
        (766, 570, 855.0, 577.0, 1.0),        # liniuța de jos, dreapta
        (950, 178, 955.6, 508.0, 0.95),       # verticala din dreapta
        (264, 178, 271.0, 508.0, 0.46),       # verticala din stânga (mai stinsă, ca în poză)
        (525, 286, 528.4, 309.0, 0.34), (528, 286, 533.0, 291.0, 0.34),   # semnul „┌”
        (692, 288, 695.4, 311.0, 0.34), (687, 288, 692.0, 293.0, 0.34),   # semnul „┐”
    ])


def patch():
    return 0.6 * rects([(582, 328, 638.5, 363.0, 1.0)], blur=1.3, glow=0.0)


def led(ref):
    """„200”: decupat din poză după roșu (cifrele rămân exact cele din vizor)"""
    x0, y0, x1, y1 = 546, 516, 650, 566
    c = ref[y0:y1, x0:x1].astype(np.float32)
    r, g, b = c[..., 2], c[..., 1], c[..., 0]
    a = np.clip((r - np.maximum(g, b) - 28.0) / 80.0, 0, 1)
    w, h = int(round((x1 - x0) * K)), int(round((y1 - y0) * K))
    a = cv2.resize(a, (w, h), interpolation=cv2.INTER_CUBIC)
    a = np.clip(a, 0, 1)
    full = np.zeros((OH, OW), np.float32)
    X, Y = int(round(x0 * K)), int(round(y0 * K))
    full[Y:Y + h, X:X + w] = a
    core = np.clip(cv2.GaussianBlur(full, (0, 0), 0.6) * 1.15, 0, 1)
    halo = cv2.GaussianBlur(full, (0, 0), 4.5) * 0.5
    return core, halo


LED_CORE = np.array([255, 92, 58], np.float32) / 255.0
LED_HALO = np.array([255, 40, 20], np.float32) / 255.0


def barrel(ref):
    """obiectivul neclar din colțul din dreapta-jos: culorile luate din poză
       (doar din interiorul lui), marginea moale refăcută"""
    cx, cy, r = 982.0, 688.0, 259.0
    y, x = np.mgrid[0:RH, 0:RW].astype(np.float32)
    d = np.hypot(x - cx, y - cy)
    inside = ((d < r - 15) & (x < 950) & (y < 578) & (x > 700) & (y > 380)).astype(np.float32)
    img = ref.astype(np.float32) / 255.0
    num = cv2.GaussianBlur(img * inside[..., None], (0, 0), 4.0)
    den = cv2.GaussianBlur(inside, (0, 0), 4.0)[..., None]
    wide_n = cv2.GaussianBlur(img * inside[..., None], (0, 0), 22.0)
    wide_d = cv2.GaussianBlur(inside, (0, 0), 22.0)[..., None]
    col = np.where(den > 0.05, num / np.maximum(den, 1e-4), wide_n / np.maximum(wide_d, 1e-4))
    a = sm((r - 3 - d) / 30.0)
    col = cv2.resize(col, (OW, OH), interpolation=cv2.INTER_CUBIC)
    a = cv2.resize(a, (OW, OH), interpolation=cv2.INTER_LINEAR)
    return np.clip(col, 0, 1)[..., ::-1].copy(), a      # BGR → RGB


def scale_about(ch, s, cx, cy):
    M = np.array([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]], np.float32)
    return cv2.warpAffine(ch, M, (ch.shape[1], ch.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def chroma(img, cx, cy):
    out = img.copy()
    out[..., 2] = scale_about(img[..., 2], CA_B, cx, cy)
    out[..., 0] = scale_about(img[..., 0], CA_R, cx, cy)
    return out


class Look:
    def __init__(self):
        ref = cv2.imread(REF, cv2.IMREAD_COLOR)
        if ref is None or ref.shape[1] != RW:
            sys.exit(f'nu găsesc poza de referință ({REF})')
        self.win, self.vig = window_alpha()
        self.fl = framelines()
        self.patch = patch()
        self.led_core, self.led_halo = led(ref)
        self.bar_rgb, self.bar_a = barrel(ref)
        self.cx = (WIN['l'] + WIN['r']) / 2 * K
        self.cy = (WIN['t'] + WIN['b']) / 2 * K
        self.rng = np.random.default_rng(395)

    # imaginea din clip: decupată 3:2, puțin moale, cu negrul ridicat puțin (voal de vizor)
    def scene(self, frame_rgb):
        f = frame_rgb[:, CROP_X:CROP_X + CROP_W]
        f = cv2.resize(f, (SW, SH), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        f = cv2.GaussianBlur(f, (0, 0), 0.85)
        lum = f.mean(axis=2, keepdims=True)
        f = lum + (f - lum) * 1.06                       # culoarea puțin mai plină
        f = 0.022 + 0.978 * np.power(np.clip(f, 0, 1), 0.94)   # voal + umbre puțin deschise
        return np.clip(f, 0, 1)

    def inside(self, sc, with_scene=True, with_marks=True):
        """tot ce se vede prin vizor, înaintea geamului: imagine, obiectiv, linii, „200”"""
        img = np.zeros((OH, OW, 3), np.float32)
        if with_scene:
            img[SY:SY + SH, SX:SX + SW] = sc
            img *= self.vig[..., None]
        if with_marks:
            a = self.bar_a[..., None]
            img = img * (1 - a) + self.bar_rgb * a
            a = self.patch[..., None]
            img = img * (1 - a) + PATCH * a
            a = self.fl[..., None]
            img = img * (1 - a) + LINE * a
            a = self.led_core[..., None]
            img = img * (1 - a) + LED_CORE * a
            img = img + LED_HALO * self.led_halo[..., None]
        return img

    def through(self, img):
        """geamul (margini moi) + aberația cromatică; în afară, negrul ramei"""
        out = chroma(img * self.win[..., None], self.cx, self.cy)
        return out

    def grain(self, img):
        """grain: mai tare în tonurile închise-medii, aproape deloc în negru și în alb"""
        h, w = img.shape[:2]
        small = self.rng.standard_normal((h * 5 // 8, w * 5 // 8), dtype=np.float32)
        g = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC) * 0.75
        g += self.rng.standard_normal((h, w), dtype=np.float32) * 0.55
        chroma_n = self.rng.standard_normal((h // 2, w // 2, 3), dtype=np.float32)
        chroma_n = cv2.resize(chroma_n, (w, h), interpolation=cv2.INTER_LINEAR) * 0.35
        lum = np.clip(img.mean(axis=2), 0, 1)
        amp = 0.092 * np.sqrt(lum + 0.004) * np.power(1.0 - lum, 1.2) + 0.0022
        return img + (g[..., None] + chroma_n) * amp[..., None]

    def baked(self, frame_rgb):
        img = self.through(self.inside(self.scene(frame_rgb)))
        img = img + SURROUND * (1 - self.win[..., None])
        img = self.grain(img)
        return (np.clip(img, 0, 1) * 255.0 + 0.5).astype(np.uint8)

    def site_scene(self, frame_rgb):
        """doar imaginea din geam (cu marginile moi), pe negru — fără linii, fără grain"""
        img = self.through(self.inside(self.scene(frame_rgb), with_marks=False))
        img = img[SY:SY + SH, SX:SX + SW]
        return (np.clip(img, 0, 1) * 255.0 + 0.5).astype(np.uint8)

    def site_overlay(self):
        """liniile, „200”, obiectivul — peste imagine. Transparența = cât acoperă."""
        ones = np.ones((SH, SW, 3), np.float32)
        col = self.through(self.inside(np.zeros((SH, SW, 3), np.float32)))                 # ce adaugă
        t0 = self.through(self.inside(ones, with_marks=False))                             # geamul gol
        t1 = self.through(self.inside(ones)) - col                                          # cât lasă să treacă
        trans = np.where(t0 > 1e-3, np.clip(t1 / np.maximum(t0, 1e-3), 0, 1), 1.0)
        alpha = np.clip(1.0 - trans.mean(axis=2), 0, 1)
        # culoarea adăugată, neînmulțită cu transparența; halo-ul lui „200” e lumină (alfa mic)
        alpha = np.maximum(alpha, np.clip(col.max(axis=2) * 1.0, 0, 1) * (alpha < 0.999))
        rgb = np.where(alpha[..., None] > 1e-3, col / np.maximum(alpha[..., None], 1e-3), 0)
        rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
        return (rgba * 255.0 + 0.5).astype(np.uint8)


def frames(src, start=None, dur=None, speed=1.0, fps=25):
    """cadrele clipului, RGB 1920×1080"""
    cmd = ['ffmpeg', '-v', 'error']
    if start is not None:
        cmd += ['-ss', str(start)]
    if dur is not None:
        cmd += ['-t', str(dur)]
    cmd += ['-i', src]
    vf = f'setpts=PTS/{speed},fps={fps}' if speed != 1.0 else f'fps={fps}'
    cmd += ['-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = 1920 * 1080 * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(1080, 1920, 3)
    p.wait()


def encoder(out, w, h, fps, extra_in=(), extra_out=()):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-']
    cmd += list(extra_in) + list(extra_out) + [out]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    mode, src, out = sys.argv[1:4]
    look = Look()

    if mode == 'cadru':
        t = float(sys.argv[4]) if len(sys.argv) > 4 else 4.0
        fr = next(frames(src, start=t, dur=0.2))
        cv2.imwrite(out, look.baked(fr)[..., ::-1])
        return

    if mode == 'clip':
        # clipul întreg, FĂRĂ sunet (cerut de Ștefan, 16.11), la 1600×926; -tune grain păstrează grain-ul la
        # comprimare (crf 27 ≈ 7,5 MB pentru 14,6 s; sub crf 29 grain-ul se topește)
        enc = encoder(out, OW, OH, 25,
                      extra_out=['-an', '-vf', 'scale=1600:926:flags=lanczos',
                                 '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
                                 '-tune', 'grain', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
        for i, fr in enumerate(frames(src)):
            enc.stdin.write(look.baked(fr).tobytes())
            if i % 50 == 0:
                print('cadru', i, flush=True)
        enc.stdin.close()
        enc.wait()
        return

    if mode == 'site':
        os.makedirs(out, exist_ok=True)
        # scena scurtă: secundele 1,5 – 5,3 ale clipului, de 2,2 ori mai repede —
        # expunerea coboară de la „ars” la apus cât ține îndepărtarea (≈ 1,7 s)
        VW, VH = 1440, 960
        enc = encoder(os.path.join(out, 'vizor-scena.mp4'), SW, SH, 25,
                      extra_out=['-vf', f'scale={VW}:{VH}:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'veryslow',
                                 '-crf', '27', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '12',
                                 '-movflags', '+faststart'])
        first = None
        for i, fr in enumerate(frames(src, start=1.5, dur=3.8, speed=2.2)):
            sc = look.site_scene(fr)
            if first is None:
                first = sc
            enc.stdin.write(sc.tobytes())
        enc.stdin.close()
        enc.wait()
        poster = cv2.resize(first, (VW, VH), interpolation=cv2.INTER_LANCZOS4)
        cv2.imwrite(os.path.join(out, 'vizor-scena.jpg'), poster[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 72])
        rgba = look.site_overlay()
        cv2.imwrite(os.path.join(out, 'vizor-rama.png'), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(out, 'vizor-rama.png'),
                        '-c:v', 'libwebp', '-quality', '86', '-compression_level', '6',
                        os.path.join(out, 'vizor-rama.webp')], check=True)
        os.remove(os.path.join(out, 'vizor-rama.png'))
        # măsurile de care are nevoie IntroVizor.tsx
        print(f'cadru {OW}x{OH}; scena la ({SX},{SY}) {SW}x{SH}; '
              f'geam {WIN["l"] * K:.0f}..{WIN["r"] * K:.0f} x {WIN["t"] * K:.0f}..{WIN["b"] * K:.0f}')
        return

    sys.exit(__doc__)


if __name__ == '__main__':
    main()
