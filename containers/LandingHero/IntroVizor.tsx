'use client';

import { useEffect, useRef } from 'react';

import styles from './landing.module.css';
import { FILM_COLOR, FLANGE, WOUND_FULL } from './LogoReel';
import { VZ, clearVizor } from './intro';



/* ============================================================
   INTRO „VIZOR” — varianta /?intro=vizor (16.11.2026, cerut de Ștefan)

   Patru secunde, de la intrarea pe site până apare tot textul:
   1. ÎNDEPĂRTAREA — pornim din interiorul imaginii (clipul MVI_0395, în
      vizorul din poza lui Ștefan) și ne îndepărtăm până la încadratura din
      poză: rama neagră, liniile de cadru, „200”, obiectivul din colț.
      Nu ne oprim: când ajungem acolo, pelicula se rupe.
   2. RUPEREA — cadrul alunecă din grifă, pelicula se rupe, lumina lămpii,
      apoi întuneric.
   3. ROLA — lumina se aprinde; rola împrăștie pelicula: spirale care vin
      spre noi, capete libere care trec peste tot ecranul, bucle. Pe
      fotograme e imaginea din clip.
   4. ÎNAPOI — rola se rotește invers și trage pelicula în ea, se face mică
      și ajunge la locul ei de lângă logo; logo-ul rămâne.
   5. PAGINA — pelicula cu filmele intră de jos în sus (pe ABOUT: una de jos
      în sus, una de sus în jos), rama și lampa se aprind, apare textul.
   Click, rotiță sau o tastă = sare peste intro.

   Cum e făcut: un <canvas> peste pagină (z 900, sub grain), desenat din JS.
   Totul e o funcție de timp (ms), deci se poate opri pe orice cadru:
     /?intro=vizor&t=1.25   stă pe secunda 1,25
     /?intro=vizor&v=0.25   rulează de patru ori mai încet
     (&ceas=timer + window.__vz: doar pentru verificarea din consolă)
   Imaginea din vizor: public/assets/intro/ (scripts/intro-vizor.py).
   Pelicula: panglici în spațiu (centrul + direcția lățimii), proiectate în
   perspectivă și desenate felie cu felie dintr-o textură (perforații,
   pista sonoră, fotograme), de la cea mai îndepărtată la cea mai apropiată.
   Starea paginii stă pe <html> (data-vz*, vezi intro.ts); așezarea în
   pagină e în landing.module.css („INTRO VIZOR”).
   ============================================================ */


/** momentele (ms) */
const T = {
    pull:   1150,   // îndepărtarea: din imagine până la încadratura din poză
    brk:    1150,   // pelicula se rupe …
    dark:   1400,   // … întuneric
    spill:  1340,   // rola începe să împrăștie pelicula (încă pe întuneric)
    rewind: 2450,   // rola se rotește invers, pelicula e trasă înapoi
    strip:  2760,   // pelicula cu filmele intră în pagină
    logo:   2900,   // logo-ul
    dock:   3260,   // rola a ajuns lângă logo
    text:   3300,   // meniul, lista, creditul, bara de jos
    lamp:   3440,   // rama și lampa
    end:    4000,
};

/** lumina se aprinde ca un tub fluorescent: [ms, cât de întuneric] */
const VEIL: [number, number][] = [
    [1400, 1], [1470, 1], [1510, 0.5], [1550, 0.92], [1610, 0.22], [1660, 0.6],
    [1730, 0.08], [1790, 0.3], [1880, 0],
];

/** cadrul din scripts/intro-vizor.py (px): tot cadrul, dreptunghiul imaginii, geamul, „200” */
const C = {
    w: 1920, h: 1112,
    sx: 312, sy: 134, sw: 1248, sh: 832,
    wl: 362, wr: 1532, wt: 175, wb: 937,
    led: [868, 822, 180, 92] as const,
};
const ASSET = {
    video:  '/assets/intro/vizor-scena.mp4?v=1',
    poster: '/assets/intro/vizor-scena.jpg?v=1',
    rama:   '/assets/intro/vizor-rama.webp?v=1',
};
const PAGE_BG = '#f1f0ed';

type Pt = [number, number];

const clamp01  = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp     = (a: number, b: number, k: number) => a + (b - a) * k;
const easeIO   = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));
const easeOut3 = (v: number) => 1 - (1 - clamp01(v)) ** 3;
/** iese cu elan și trece puțin de capăt (pelicula „sare”) */
const springOut = (v: number) => {
    const x = clamp01(v) - 1;
    return 1 + 2.1 * x * x * x + 1.1 * x * x;
};
/** zgomot stabil: aceeași valoare pentru același număr (cadrul de 1/24 s) */
const hash = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};
const mulberry = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};


/* ────────────────────────── PELICULA: textura ──────────────────────────
   O bucată de peliculă de 35 mm, văzută prin transparență: baza închisă,
   perforațiile (găuri adevărate), pista sonoră optică, fotogramele cu
   imaginea din clip. Trei mărimi (pentru panglicile îndepărtate) și, pentru
   fiecare, varianta „cu luciu” (lumina care alunecă pe peliculă). */
const TW     = 256;                          // lățimea peliculei, în textură
const PITCH  = Math.round(TW * 0.543);       // un cadru = 4 perforații
const FRAMES = 4;
const TH     = PITCH * FRAMES;

type Tex = { k: number; base: HTMLCanvasElement; sheen: HTMLCanvasElement };

function buildTextures(scene: HTMLImageElement | null): Tex[] {
    const big = document.createElement('canvas');
    big.width = TW;
    big.height = TH + PITCH;                 // un cadru în plus: feliile pot trece de capăt
    const g = big.getContext('2d');
    if (!g) return [];
    const R = mulberry(35);

    g.fillStyle = 'rgba(17, 14, 11, 0.95)';
    g.fillRect(0, 0, TW, big.height);

    const ix = TW * 0.262, iw = TW * 0.596;          // fotograma
    const ih = TW * 0.452;
    const sx0 = TW * 0.168, sw0 = TW * 0.066;        // pista sonoră
    const hw = TW * 0.078, hh = TW * 0.055, hr = TW * 0.011;
    const hxL = TW * 0.088, hxR = TW * 0.912;

    for (let f = 0; f <= FRAMES; f++) {
        const y0 = f * PITCH;
        const iy = y0 + (PITCH - ih) / 2;
        if (scene && scene.naturalWidth) {
            // aceeași imagine, puțin altfel decupată pe fiecare cadru (ca la cadre succesive)
            const k = (f % FRAMES) * 0.012;
            const sw = scene.naturalWidth * (0.8 - k), sh = sw * (ih / iw);
            g.drawImage(scene, scene.naturalWidth * (0.1 + k / 2), (scene.naturalHeight - sh) * 0.46, sw, sh, ix, iy, iw, ih);
            g.fillStyle = 'rgba(34, 20, 8, 0.26)';   // densitatea peliculei
            g.fillRect(ix, iy, iw, ih);
        } else {
            const gr = g.createLinearGradient(ix, iy, ix + iw, iy + ih);
            gr.addColorStop(0, '#5b5246');
            gr.addColorStop(1, '#2c2620');
            g.fillStyle = gr;
            g.fillRect(ix, iy, iw, ih);
        }
    }
    // pista sonoră: două urme albe, cu lățimea după „sunet”
    g.fillStyle = 'rgba(6, 5, 4, 0.9)';
    g.fillRect(sx0, 0, sw0, big.height);
    g.fillStyle = 'rgba(232, 226, 208, 0.82)';
    const env: number[] = [];
    for (let y = 0; y < TH; y += 2) {
        const slow = 0.5 + 0.5 * Math.sin(y * 0.021 + 1.3) * Math.sin(y * 0.0071 + 0.4);
        env.push(Math.max(0.06, slow * (0.35 + 0.65 * R())));
    }
    for (let y = 0; y < big.height; y += 2) {
        const a = env[(y % TH) >> 1] * sw0 * 0.21;
        g.fillRect(sx0 + sw0 * 0.27 - a, y, 2 * a, 2);
        g.fillRect(sx0 + sw0 * 0.73 - a, y, 2 * a, 2);
    }
    // marcajele de pe margine (portocalii, ca pe pelicula din pagină)
    g.fillStyle = 'rgba(226, 142, 58, 0.7)';
    for (let f = 0; f <= FRAMES; f++) {
        g.fillRect(TW * 0.972, f * PITCH + PITCH * 0.08, TW * 0.012, PITCH * 0.2);
        g.fillRect(TW * 0.972, f * PITCH + PITCH * 0.36, TW * 0.012, PITCH * 0.07);
    }
    // perforațiile: găuri adevărate
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    const hole = (cx: number, cy: number) => {
        const x = cx - hw / 2, y = cy - hh / 2;
        g.beginPath();
        g.moveTo(x + hr, y);
        g.arcTo(x + hw, y, x + hw, y + hh, hr);
        g.arcTo(x + hw, y + hh, x, y + hh, hr);
        g.arcTo(x, y + hh, x, y, hr);
        g.arcTo(x, y, x + hw, y, hr);
        g.closePath();
        g.fill();
    };
    for (let j = 0; j < (FRAMES + 1) * 4; j++) {
        const cy = (j + 0.5) * (PITCH / 4);
        hole(hxL, cy);
        hole(hxR, cy);
    }
    g.globalCompositeOperation = 'source-over';

    const out: Tex[] = [];
    for (const k of [1, 0.5, 0.25]) {
        const base = document.createElement('canvas');
        base.width = Math.round(TW * k);
        base.height = Math.round(big.height * k);
        const b = base.getContext('2d');
        const sheen = document.createElement('canvas');
        sheen.width = base.width;
        sheen.height = base.height;
        const s = sheen.getContext('2d');
        if (!b || !s) continue;
        b.imageSmoothingQuality = 'high';
        b.drawImage(big, 0, 0, base.width, base.height);
        s.drawImage(base, 0, 0);
        s.globalCompositeOperation = 'source-atop';
        s.fillStyle = 'rgba(255, 252, 244, 0.72)';
        s.fillRect(0, 0, sheen.width, sheen.height);
        out.push({ k, base, sheen });
    }
    return out;
}

/** grain: o bucată de zgomot gri, pusă peste imagine cu „overlay” (bobul se vede
    în tonurile medii, nu în negru și nu în alb — ca în poza cu vizorul) */
function buildGrain(): HTMLCanvasElement | null {
    const n = 256;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const g = c.getContext('2d');
    if (!g) return null;
    const im = g.createImageData(n, n);
    const R = mulberry(200);
    for (let i = 0; i < n * n; i++) {
        const v = 128 + 52 * Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(6.2832 * R());
        const b = v < 0 ? 0 : v > 255 ? 255 : v;
        im.data[4 * i] = b;
        im.data[4 * i + 1] = b;
        im.data[4 * i + 2] = b * 0.98;
        im.data[4 * i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return c;
}


/* ────────────────────────── PELICULA: panglicile ──────────────────────────
   Trei feluri, toate prinse de rolă:
   0 spirală — spirele sărite de pe rolă, cu axa spre privitor (vin spre noi);
   1 capăt   — capătul rupt: zboară până dincolo de marginea ecranului,
               unduind și răsucindu-se;
   2 buclă   — o buclă ieșită din rolă, cu amândouă capetele în ea; lângă rolă
               se vede pe muchie, la vârf stă cu fața. */
type Rib = {
    kind: 0 | 1 | 2;
    phi: number;        // direcția, în planul ecranului
    len: number;        // cât de departe ajunge (px)
    w: number;          // lățimea peliculei (px)
    z: number;          // cât vine spre privitor
    a: number;          // 0: curbura axei · 1: unduirea · 2: lățimea buclei
    b: number;          // 0: raza spirelor · 1: greutatea
    turns: number;
    tw: number;         // răsucirea
    ph: number;
    ph2: number;
    t0: number;         // când sare (ms)
    dur: number;
    r0: number;         // când e trasă înapoi (ms)
    rd: number;
    n: number;          // câte felii
    P: Float32Array;    // centrul (x, y, z), față de rolă
    B: Float32Array;    // direcția lățimii
    S: Float32Array;    // lungimea de la rolă
    E: Float32Array;    // marginile pe ecran: Lx, Ly, Rx, Ry
    G: Float32Array;    // luciul
};

function makeRibbons(dg: number, vmin: number): Rib[] {
    const R = mulberry(3950);
    const rnd = (a: number, b: number) => a + (b - a) * R();
    const out: Rib[] = [];
    const add = (kind: 0 | 1 | 2, deg: number, p: Partial<Rib>, n: number) => {
        const t0 = T.spill + rnd(0, 250);
        out.push({
            kind, phi: (deg * Math.PI) / 180,
            len: 0.6 * dg, w: 0.048 * vmin, z: 0.3, a: 0.2, b: 0.1, turns: 3, tw: 1,
            ph: rnd(0, 6.283), ph2: rnd(0, 6.283),
            t0, dur: rnd(420, 640), r0: T.rewind + rnd(0, 140), rd: rnd(430, 560),
            n,
            P: new Float32Array(3 * (n + 1)), B: new Float32Array(3 * (n + 1)),
            S: new Float32Array(n + 1), E: new Float32Array(4 * (n + 1)), G: new Float32Array(n + 1),
            ...p,
        });
    };
    // spiralele (spirele sărite de pe rolă, cu axa aproape spre privitor: se văd rotunde și cresc spre noi)
    add(0, 204, { len: 0.56 * dg, z: 0.84, a: 0.10,  b: 0.150 * dg, turns: 3.2, tw: 2.4,  w: 0.050 * vmin }, 124);
    add(0, 338, { len: 0.60 * dg, z: 0.80, a: -0.12, b: 0.165 * dg, turns: 2.8, tw: -2.0, w: 0.046 * vmin }, 112);
    add(0,  96, { len: 0.48 * dg, z: 0.88, a: 0.08,  b: 0.125 * dg, turns: 2.6, tw: 2.8,  w: 0.054 * vmin }, 104);
    // capetele libere (trec peste tot ecranul)
    add(1,  24, { len: 1.18 * dg, z: 0.24,  a: 0.125, b: 0.06,  turns: 2.6, tw: 1.5,  w: 0.046 * vmin }, 110);
    add(1, 150, { len: 1.12 * dg, z: 0.34,  a: 0.150, b: 0.08,  turns: 2.2, tw: -1.2, w: 0.060 * vmin }, 110);
    add(1, 262, { len: 0.98 * dg, z: 0.14,  a: 0.110, b: -0.03, turns: 3.0, tw: 2.0,  w: 0.040 * vmin }, 100);
    add(1, 308, { len: 1.20 * dg, z: -0.08, a: 0.090, b: 0.04,  turns: 2.4, tw: -1.0, w: 0.036 * vmin }, 100);
    // buclele
    add(2,   4, { len: 0.52 * dg, a: 0.28, z: 0.30, tw: 1, w: 0.044 * vmin }, 84);
    add(2,  70, { len: 0.74 * dg, a: 0.20, z: 0.46, tw: 0, w: 0.052 * vmin }, 90);
    add(2, 128, { len: 0.44 * dg, a: 0.34, z: 0.20, tw: 1, w: 0.040 * vmin }, 80);
    add(2, 184, { len: 0.80 * dg, a: 0.22, z: 0.38, tw: 0, w: 0.048 * vmin }, 92);
    add(2, 238, { len: 0.58 * dg, a: 0.30, z: 0.52, tw: 1, w: 0.056 * vmin }, 86);
    add(2, 292, { len: 0.46 * dg, a: 0.32, z: 0.12, tw: 0, w: 0.038 * vmin }, 80);
    // două bucle mari care vin până lângă noi și ies din cadru (fâșiile late din prim-plan)
    add(2,  42, { len: 1.25 * dg, a: 0.46, z: 0.60, tw: 0, w: 0.050 * vmin }, 140);
    add(2, 218, { len: 1.10 * dg, a: 0.42, z: 0.66, tw: 1, w: 0.046 * vmin }, 132);
    return out;
}

/** cât a ieșit panglica din rolă la momentul t (0 = toată în rolă) */
function growth(rb: Rib, t: number): number {
    if (t <= rb.t0) return 0;
    const x = (t - rb.t0) / rb.dur;
    const out = x < 1 ? springOut(x) : 1 + 0.07 * (1 - Math.exp(-(x - 1) * 0.9));   // după salt, mai alunecă puțin
    const back = 1 - Math.pow(clamp01((t - rb.r0) / rb.rd), 1.8);
    return out * back;
}

/** forma panglicii la momentul dat: centrul, direcția lățimii, lungimea */
function shape(rb: Rib, g: number, tm: number, sc: number, swirl: number): number {
    const n = rb.n, P = rb.P, B = rb.B, S = rb.S;
    const cf = Math.cos(rb.phi + swirl), sf = Math.sin(rb.phi + swirl);
    const L = rb.len * g * sc;
    // 1. centrul + direcția de referință a lățimii (H) + răsucirea (tau, ținută în G)
    let hx = 0, hy = 0, hz = 1;
    if (rb.kind === 0) {
        const az = rb.z, ah = Math.sqrt(1 - az * az);
        hx = cf * ah; hy = sf * ah; hz = az;
    }
    for (let k = 0; k <= n; k++) {
        const u = k / n;
        let x = 0, y = 0, z = 0, tau = 0;
        if (rb.kind === 0) {
            const d = L * u, bend = rb.a * L * u * u;
            const rho = rb.b * sc * (0.22 + 0.78 * Math.pow(u, 0.7)) * (0.3 + 0.7 * g);
            const th = rb.ph + 6.2832 * rb.turns * u - rb.tw * tm;
            const c = Math.cos(th), s = Math.sin(th);
            // n1 = (−sf, cf, 0) ; n2 = axa × n1 = (−az·cf, −az·sf, ah)
            x = hx * d - sf * bend + rho * (-c * sf - s * hz * cf);
            y = hy * d + cf * bend + rho * (c * cf - s * hz * sf);
            z = hz * d + rho * s * Math.sqrt(1 - hz * hz);
            tau = 0.22 * Math.sin(rb.ph2 + 3 * u + 2 * tm);
        } else if (rb.kind === 1) {
            const d = L * u;
            const wv = rb.a * L * Math.pow(u, 0.8) * Math.sin(rb.turns * Math.PI * u + rb.ph - 5.2 * tm);
            x = cf * d - sf * wv;
            y = sf * d + cf * wv + rb.b * L * u * u;
            z = rb.z * L * u + 0.11 * L * u * Math.sin(2.2 * Math.PI * u + rb.ph2 - 3.8 * tm);
            tau = rb.ph2 + rb.tw * 6.2832 * u - 3.0 * tm;
        } else {
            const sp = Math.sin(Math.PI * u);
            const d = L * Math.pow(sp, 0.85);
            const wd = rb.a * L * Math.sin(6.2832 * u) * (1 + 0.15 * Math.sin(3 * tm + rb.ph));
            x = cf * d - sf * wd;
            y = sf * d + cf * wd;
            z = rb.z * L * Math.pow(sp, 1.4) + 0.05 * L * Math.sin(12.566 * u + rb.ph2 + 3 * tm);
            tau = 1.5708 * Math.pow(sp, 0.5) + rb.tw * Math.PI * u + 0.35 * Math.sin(2.4 * tm + rb.ph);
        }
        P[3 * k] = x; P[3 * k + 1] = y; P[3 * k + 2] = z;
        rb.G[k] = tau;
    }
    // 2. tangenta, lățimea (perpendiculară pe tangentă, răsucită cu tau), lungimea
    let px = 0, py = 0, pz = 1;
    S[0] = 0;
    for (let k = 0; k <= n; k++) {
        const i0 = 3 * Math.max(0, k - 1), i1 = 3 * Math.min(n, k + 1);
        let tx = P[i1] - P[i0], ty = P[i1 + 1] - P[i0 + 1], tz = P[i1 + 2] - P[i0 + 2];
        const tl = Math.hypot(tx, ty, tz) || 1;
        tx /= tl; ty /= tl; tz /= tl;
        const dot = hx * tx + hy * ty + hz * tz;
        let bx = hx - dot * tx, by = hy - dot * ty, bz = hz - dot * tz;
        const bl = Math.hypot(bx, by, bz);
        if (bl < 0.05) { bx = px; by = py; bz = pz; } else { bx /= bl; by /= bl; bz /= bl; }
        px = bx; py = by; pz = bz;
        const nx = ty * bz - tz * by, ny = tz * bx - tx * bz, nz = tx * by - ty * bx;   // T × B
        const tau = rb.G[k], c = Math.cos(tau), s = Math.sin(tau);
        const wx = c * bx + s * nx, wy = c * by + s * ny, wz = c * bz + s * nz;
        B[3 * k] = wx; B[3 * k + 1] = wy; B[3 * k + 2] = wz;
        // normala feței (T × lățimea) → luciul: lumina vine din stânga-sus, din față
        const fx = ty * wz - tz * wy, fy = tz * wx - tx * wz, fz = tx * wy - ty * wx;
        const sp = Math.abs(-0.187 * fx - 0.294 * fy + 0.937 * fz);
        rb.G[k] = 0.06 + 0.8 * Math.pow(sp, 22);
        if (k > 0) {
            const j = 3 * (k - 1), i = 3 * k;
            S[k] = S[k - 1] + Math.hypot(P[i] - P[j], P[i + 1] - P[j + 1], P[i + 2] - P[j + 2]);
        }
    }
    return S[n];
}


export default function IntroVizor() {
    const layerRef  = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const html = document.documentElement;
        if (!html.hasAttribute(VZ.state)) return;          // fără ?intro=vizor: nimic
        const layer = layerRef.current, canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d') ?? null;
        if (!layer || !canvas || !ctx) { clearVizor(); return; }
        html.setAttribute(VZ.js, '');

        // /?intro=vizor&t=1.25 → stă pe secunda 1,25 ;  &v=0.25 → de patru ori mai încet
        const q0 = new URLSearchParams(window.location.search);
        let hold: number | null = q0.has('t') ? Math.max(0, parseFloat(q0.get('t') || '0') * 1000) : null;
        const speed = q0.has('v') ? Math.min(4, Math.max(0.05, parseFloat(q0.get('v') || '1') || 1)) : 1;
        // &ceas=timer: cadrele vin de la un cronometru, nu de la requestAnimationFrame
        // (doar pentru verificare — într-o filă ascunsă rAF nu rulează)
        const byTimer = q0.get('ceas') === 'timer';
        const nextFrame = (cb: (now: number) => void): number =>
            byTimer ? window.setTimeout(() => cb(performance.now()), 16) : requestAnimationFrame(cb);
        const stopFrame = (id: number) => { if (byTimer) window.clearTimeout(id); else cancelAnimationFrame(id); };
        const stats = { frames: 0, ms: 0, worst: 0, last: 0 };

        /* ── piesele ── */
        const rama = new Image();
        const poster = new Image();
        rama.decoding = 'async';
        poster.decoding = 'async';
        rama.src = ASSET.rama;
        poster.src = ASSET.poster;
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.preload = 'auto';
        video.className = styles.vzVideo;
        video.src = ASSET.video;
        layer.appendChild(video);
        const grain = buildGrain();
        const flange = new Path2D(FLANGE);
        let tex: Tex[] = [];

        /* ── ecranul ── */
        let vw = 0, vh = 0, q = 1;
        let ribs: Rib[] = [];
        let segMax = 0;
        let segZ = new Float32Array(0), segOrder = new Int32Array(0), segRib = new Int32Array(0), segK = new Int32Array(0);
        const shadow = document.createElement('canvas');
        const shCtx = shadow.getContext('2d');
        const SH = 8;   // umbra peliculei: desenată de 8 ori mai mic, apoi mărită (iese moale)
        const size = () => {
            vw = window.innerWidth;
            vh = window.innerHeight;
            q = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5.5e6 / (vw * vh))));
            canvas.width = Math.round(vw * q);
            canvas.height = Math.round(vh * q);
            shadow.width = Math.ceil(vw / SH);
            shadow.height = Math.ceil(vh / SH);
            ribs = makeRibbons(Math.hypot(vw, vh) / 2, Math.min(vw, vh));
            segMax = ribs.reduce((a, r) => a + r.n, 0);
            segZ = new Float32Array(segMax);
            segOrder = new Int32Array(segMax);
            segRib = new Int32Array(segMax);
            segK = new Int32Array(segMax);
        };
        size();

        /* ── 1 + 2: vizorul ── */
        const winW = C.wr - C.wl, winH = C.wb - C.wt;
        const winCx = (C.wl + C.wr) / 2, winCy = (C.wt + C.wb) / 2;
        /** încadratura din poză: cadrul acoperă ecranul; pe ecranele înalte, geamul încape pe lățime */
        const endScale = () => Math.min(Math.max(vw / C.w, vh / C.h), (0.94 * vw) / winW, (0.9 * vh) / winH);
        /** din interiorul imaginii: geamul (fără marginile lui moi) acoperă tot ecranul */
        const startScale = () => Math.max(vw / (winW - 170), vh / (winH - 150)) * 1.1;
        const sceneSrc = (): CanvasImageSource | null => {
            if (video.readyState >= 2 && video.currentTime > 0) return video;
            return poster.complete && poster.naturalWidth ? poster : null;
        };
        /** imaginea + liniile de cadru, la scara s, cu colțul cadrului la (ox, oy) */
        const comp = (s: number, ox: number, oy: number, marks = 1) => {
            const src = sceneSrc();
            if (src) ctx.drawImage(src, ox + C.sx * s, oy + C.sy * s, C.sw * s, C.sh * s);
            if (marks > 0 && rama.complete && rama.naturalWidth) {
                const a = ctx.globalAlpha;
                ctx.globalAlpha = a * marks;
                ctx.drawImage(rama, ox, oy, C.w * s, C.h * s);
                ctx.globalAlpha = a;
            }
        };
        const grainOver = (x: number, y: number, w: number, h: number, tick: number, a: number) => {
            if (!grain) return;
            const pat = ctx.createPattern(grain, 'repeat');
            if (!pat) return;
            const gx = Math.floor(hash(tick) * 256), gy = Math.floor(hash(tick + 77) * 256);
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = a;
            ctx.translate(-gx, -gy);
            ctx.fillStyle = pat;
            ctx.fillRect(x + gx, y + gy, w, h);
            ctx.restore();
        };

        const drawPull = (t: number) => {
            const S1 = endScale(), S0 = Math.max(startScale(), S1 * 3);
            // încetinește, dar nu se oprește (0,96 din curbă): când ajunge, pelicula se rupe
            const x = clamp01(t / T.pull);
            const ease = (v: number) => 1 - Math.pow(1 - v, 1.7);
            const e = ease(x * 0.96) / ease(0.96);
            const s = S1 * Math.pow(S0 / S1, 1 - e);
            const fx = lerp(winCx, C.w / 2, e), fy = lerp(winCy, C.h / 2, e);
            // trepidația din grifă, la 24 de cadre pe secundă — crește spre rupere
            const tick = Math.floor(t / (1000 / 24));
            const wob = 0.35 + 1.9 * x * x * x;
            const jx = (hash(tick * 3 + 1) - 0.5) * wob, jy = (hash(tick * 3 + 2) - 0.5) * wob * 1.6;
            const ox = vw / 2 - fx * s + jx, oy = vh / 2 - fy * s + jy;

            // la început suntem în imagine; semnele vizorului (liniile, dreptunghiul din
            // centru, „200”) apar pe măsură ce ne îndepărtăm
            const marks = clamp01((x - 0.1) / 0.36);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, vw, vh);
            comp(s, ox, oy, marks * marks * (3 - 2 * marks));
            // neclaritatea de mișcare, cât ne îndepărtăm repede: aceeași imagine, puțin mai mare
            const vel = Math.pow(1 - x * 0.96, 0.7) * Math.log(S0 / S1);
            const blur = Math.min(1, vel * 0.8);
            if (blur > 0.04) {
                for (let k = 1; k <= 3; k++) {
                    const s2 = s * (1 + 0.012 * k * blur * 2.2);
                    ctx.globalAlpha = 0.3;
                    comp(s2, vw / 2 - fx * s2 + jx, vh / 2 - fy * s2 + jy, 0);
                }
                ctx.globalAlpha = 1;
            }
            grainOver(ox + C.sx * s, oy + C.sy * s, C.sw * s, C.sh * s, tick, 0.38);
            // pâlpâirea lămpii
            const dim = 0.05 * hash(tick + 500) + 0.1 * x * x * hash(tick + 900);
            ctx.fillStyle = `rgba(0, 0, 0, ${dim.toFixed(3)})`;
            ctx.fillRect(0, 0, vw, vh);
        };

        /** colțul geamului, pe ecran, în încadratura din poză */
        const frameAt = (s: number): { ox: number; oy: number } => ({ ox: vw / 2 - (C.w / 2) * s, oy: vh / 2 - (C.h / 2) * s });
        const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        };

        const drawBreak = (t: number) => {
            const p = clamp01((t - T.brk) / (T.dark - T.brk));
            const s = endScale() * (1 - 0.01 * p);
            const { ox, oy } = frameAt(s);
            const tick = Math.floor(t / (1000 / 48));
            const X = ox + C.sx * s, Y = oy + C.sy * s, W = C.sw * s, H = C.sh * s;       // imaginea
            const gx = ox + C.wl * s, gy = oy + C.wt * s, gw = winW * s, gh = winH * s;   // geamul
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, vw, vh);

            if (p < 0.5) {
                // 2a. cadrul alunecă din grifă: fuge în jos tot mai repede; linia neagră
                //     dintre cadre trece prin geam (marginea moale a imaginii e chiar ea)
                const k = p / 0.5;
                const roll = (0.04 * Math.sin(k * 30) * k + 1.55 * k * k * k) * H;
                const jx = (hash(tick + 3) - 0.5) * 18 * k * s;
                ctx.save();
                ctx.beginPath();
                ctx.rect(gx - 30 * s, gy - 26 * s, gw + 60 * s, gh + 52 * s);
                ctx.clip();
                const src = sceneSrc();
                if (src) {
                    const smear = 3;
                    for (let m = 0; m < smear; m++) {
                        ctx.globalAlpha = m === 0 ? 1 : 0.34;
                        const off = (((roll - m * 0.035 * k * H) % H) + H) % H;
                        ctx.drawImage(src, X + jx, Y + off, W, H);
                        ctx.drawImage(src, X + jx, Y + off - H, W, H);
                    }
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
                // marginile moi ale geamului, sus și jos (imaginea care alunecă le-a luat cu ea)
                for (const [y0, y1] of [[gy - 28 * s, gy + 34 * s], [gy + gh + 28 * s, gy + gh - 34 * s]] as Pt[]) {
                    const gr = ctx.createLinearGradient(0, y0, 0, y1);
                    gr.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = gr;
                    ctx.fillRect(X - 4, Math.min(y0, y1), W + 8, Math.abs(y1 - y0));
                }
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, vw, Math.max(0, gy - 28 * s));
                ctx.fillRect(0, gy + gh + 28 * s, vw, vh);
                if (rama.complete && rama.naturalWidth) ctx.drawImage(rama, ox, oy, C.w * s, C.h * s);
                grainOver(X, Y, W, H, tick, 0.38);
                // expunerea sare de la cadru la cadru
                const fl = hash(tick + 40);
                if (fl > 0.62) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = `rgba(255, 236, 200, ${(0.22 * k * (fl - 0.62) * 2.6).toFixed(3)})`;
                    roundRect(gx, gy, gw, gh, 40 * s);
                    ctx.fill();
                    ctx.restore();
                } else if (fl < 0.2) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${(0.3 * k).toFixed(3)})`;
                    ctx.fillRect(0, 0, vw, vh);
                }
                return;
            }

            // 2b. pelicula se rupe: în geam rămâne lumina lămpii; bucățile rupte fug din cadru
            const k = clamp01((p - 0.5) / 0.26);          // ruperea
            const off = clamp01((p - 0.76) / 0.24);        // lampa se stinge
            const glow = (1 - off) ** 2;
            // halou în jurul geamului
            const hg = ctx.createRadialGradient(gx + gw / 2, gy + gh / 2, gh * 0.3, gx + gw / 2, gy + gh / 2, gw * 0.95);
            hg.addColorStop(0, `rgba(255, 226, 170, ${(0.55 * glow).toFixed(3)})`);
            hg.addColorStop(1, 'rgba(255, 190, 120, 0)');
            ctx.fillStyle = hg;
            ctx.fillRect(0, 0, vw, vh);
            // geamul gol: alb-cald, cu marginea moale
            ctx.save();
            ctx.shadowColor = `rgba(255, 240, 210, ${glow.toFixed(3)})`;
            ctx.shadowBlur = 26 * s * q;
            ctx.fillStyle = `rgba(${Math.round(255 - 40 * off)}, ${Math.round(248 - 90 * off)}, ${Math.round(232 - 150 * off)}, ${glow.toFixed(3)})`;
            roundRect(gx + 8 * s, gy + 8 * s, gw - 16 * s, gh - 16 * s, 34 * s);
            ctx.fill();
            ctx.restore();
            // cele două bucăți de peliculă: ruptura în zigzag, de sus până jos
            const src = sceneSrc();
            if (src && k < 1) {
                const zig: Pt[] = [];
                for (let i = 0; i <= 10; i++) {
                    zig.push([X + W * (0.54 - 0.1 * (i / 10)) + (i % 2 ? 1 : -1) * W * 0.018 * (0.6 + hash(i + 9)), Y + (H * i) / 10]);
                }
                const piece = (side: -1 | 1) => {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(gx - 30 * s, gy - 26 * s, gw + 60 * s, gh + 52 * s);
                    ctx.clip();
                    const kk = k * k;
                    ctx.translate(X + W / 2, Y + H / 2);
                    ctx.rotate(side * 0.16 * kk);
                    ctx.translate(side * 0.62 * W * kk, (side < 0 ? -0.5 : 0.75) * H * kk);
                    ctx.translate(-(X + W / 2), -(Y + H / 2));
                    ctx.beginPath();
                    ctx.moveTo(side < 0 ? X - 40 : X + W + 40, Y - 40);
                    for (const [zx, zy] of zig) ctx.lineTo(zx, zy);
                    ctx.lineTo(side < 0 ? X - 40 : X + W + 40, Y + H + 40);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(src, X, Y, W, H);
                    // pelicula în lumina lămpii: tot mai arsă
                    ctx.fillStyle = `rgba(255, 214, 150, ${(0.5 * k).toFixed(3)})`;
                    ctx.fillRect(X - 40, Y - 40, W + 80, H + 80);
                    ctx.restore();
                };
                piece(-1);
                piece(1);
            }
            if (rama.complete && rama.naturalWidth) {
                ctx.globalAlpha = 1 - off;
                ctx.drawImage(rama, ox, oy, C.w * s, C.h * s);
                ctx.globalAlpha = 1;
            }
        };

        /** „200” mai arde o clipă pe întuneric */
        const drawLed = (t: number) => {
            const a = 1 - clamp01((t - T.dark) / 130);
            if (a <= 0 || !rama.complete || !rama.naturalWidth) return;
            const s = endScale() * 0.99;
            const { ox, oy } = frameAt(s);
            const [lx, ly, lw, lh] = C.led;
            ctx.globalAlpha = a * (hash(Math.floor(t / 30)) > 0.25 ? 1 : 0.5);
            ctx.drawImage(rama, lx, ly, lw, lh, ox + lx * s, oy + ly * s, lw * s, lh * s);
            ctx.globalAlpha = 1;
        };

        /* ── 3 + 4: rola și pelicula ── */
        let logoC: Pt = [224, 78], logoS = 1;
        const measureLogo = () => {
            const r = document.querySelector<HTMLElement>('[data-logo-reel-btn]')?.getBoundingClientRect();
            if (r && r.width > 0) { logoC = [r.left + r.width / 2, r.top + r.height / 2]; logoS = r.width / 34; }
        };
        const bigScale = () => Math.max(4.2, Math.min(8.6, (0.26 * Math.min(vw, vh)) / 34));

        type Reel = { x: number; y: number; S: number; ang: number; wound: number; k: number };
        const reelAt = (t: number): Reel => {
            const SB = bigScale();
            const home: Pt = [vw / 2, vh / 2];
            if (t < T.rewind) {
                // împrăștie: patru ture, tot mai încet; apare „sărind” puțin
                const p = clamp01((t - T.spill) / (T.rewind - T.spill));
                const pop = 0.82 + 0.18 * springOut(clamp01((t - T.spill) / 260));
                const shake = (1 - p) ** 3 * 5;
                return {
                    x: home[0] + shake * Math.sin(t * 0.09), y: home[1] + shake * Math.cos(t * 0.11),
                    S: SB * pop,
                    ang: -1440 * (1 - (1 - p) ** 2.2),
                    wound: lerp(WOUND_FULL, 7.4, easeOut3(p)),
                    k: 1,
                };
            }
            // derulează înapoi: trei ture, se micșorează și zboară lângă logo
            const p = clamp01((t - T.rewind) / (T.dock - T.rewind));
            const f = clamp01((t - T.rewind - 230) / (T.dock - T.rewind - 230));
            const m = easeIO(f), u = 1 - m;
            const ctrl: Pt = [home[0] - 0.12 * (home[0] - logoC[0]), logoC[1] + 0.05 * (home[1] - logoC[1])];
            const k = 1 - easeIO(f);
            return {
                x: u * u * home[0] + 2 * u * m * ctrl[0] + m * m * logoC[0],
                y: u * u * home[1] + 2 * u * m * ctrl[1] + m * m * logoC[1],
                S: logoS + (SB - logoS) * k,
                ang: -1440 + 1080 * easeIO(p),
                wound: lerp(7.4, WOUND_FULL, easeIO(clamp01(p / 0.86))),
                k,
            };
        };

        const drawReel = (r: Reel) => {
            const S = r.S;
            ctx.setTransform(q * S, 0, 0, q * S, q * r.x, q * r.y);
            if (r.k > 0.02) {
                // umbra rolei pe masă
                const sg = ctx.createRadialGradient(1.6, 2.6, 9, 1.6, 2.6, 20);
                sg.addColorStop(0, `rgba(0, 0, 0, ${(0.3 * r.k).toFixed(3)})`);
                sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = sg;
                ctx.beginPath();
                ctx.arc(1.6, 2.6, 20, 0, 6.2832);
                ctx.fill();
            }
            if (r.k > 0.02) {
                // flanșa din spate (rola are grosime cât e mare; dispare când redevine semnul de lângă logo)
                ctx.save();
                ctx.translate(0.55 * r.k, 0.95 * r.k);
                ctx.rotate((r.ang * Math.PI) / 180);
                ctx.fillStyle = '#a9a7a2';
                ctx.fill(flange, 'evenodd');
                ctx.restore();
            }
            ctx.fillStyle = FILM_COLOR;
            ctx.beginPath();
            ctx.arc(0, 0, r.wound, 0, 6.2832);
            ctx.fill();
            if (r.k > 0.02) {
                // spirele peliculei înfășurate
                ctx.strokeStyle = `rgba(255, 244, 226, ${(0.09 * r.k).toFixed(3)})`;
                ctx.lineWidth = 0.14;
                for (let rr = 5.4; rr < r.wound - 0.3; rr += 0.62) {
                    ctx.beginPath();
                    ctx.arc(0, 0, rr, 0, 6.2832);
                    ctx.stroke();
                }
            }
            ctx.rotate((r.ang * Math.PI) / 180);
            ctx.fillStyle = '#d3d1cd';
            ctx.fill(flange, 'evenodd');
            if (r.k > 0.02) {
                // metalul: o lumină moale dinspre stânga-sus (se stinge când rola redevine semnul de lângă logo)
                ctx.save();
                ctx.rotate((-r.ang * Math.PI) / 180);
                ctx.clip(flange, 'evenodd');
                const mg = ctx.createLinearGradient(-12, -14, 12, 14);
                mg.addColorStop(0, `rgba(255, 255, 255, ${(0.5 * r.k).toFixed(3)})`);
                mg.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                mg.addColorStop(1, `rgba(0, 0, 0, ${(0.2 * r.k).toFixed(3)})`);
                ctx.fillStyle = mg;
                ctx.fillRect(-17, -17, 34, 34);
                ctx.restore();
            }
            ctx.strokeStyle = '#15110d';
            ctx.lineWidth = 1.1 / Math.sqrt(S / logoS);
            ctx.stroke(flange);
            ctx.fillStyle = FILM_COLOR;
            ctx.beginPath();
            ctx.arc(0, 0, 2.3, 0, 6.2832);
            ctx.fill();
            ctx.fillStyle = PAGE_BG;
            ctx.fillRect(-0.9, -0.9, 1.8, 1.8);
            ctx.setTransform(q, 0, 0, q, 0, 0);
        };

        const drawFilm = (t: number, reel: Reel, light: number) => {
            if (!tex.length) { drawReel(reel); return; }
            const SB = bigScale();
            const sc = reel.S / SB;                       // pelicula se micșorează odată cu rola
            const tm = (t - T.spill) / 1000;
            const D = 1.15 * (Math.hypot(vw, vh) / 2);     // distanța privitorului
            const swirl = (reel.ang / 360) * 0.32;         // pelicula e aruncată în vârtej, după rolă
            let count = 0;

            for (let ri = 0; ri < ribs.length; ri++) {
                const rb = ribs[ri];
                const g = growth(rb, t);
                if (g < 0.012) { rb.S[rb.n] = 0; continue; }
                const Ltot = shape(rb, g, tm, sc, swirl);
                const n = rb.n, P = rb.P, B = rb.B, E = rb.E;
                const half = 0.5 * rb.w * sc;
                for (let k = 0; k <= n; k++) {
                    const x = P[3 * k], y = P[3 * k + 1], z = P[3 * k + 2];
                    const bx = B[3 * k] * half, by = B[3 * k + 1] * half, bz = B[3 * k + 2] * half;
                    const pa = D / (D - Math.min(0.72 * D, z - bz)), pb = D / (D - Math.min(0.72 * D, z + bz));
                    E[4 * k]     = reel.x + (x - bx) * pa;
                    E[4 * k + 1] = reel.y + (y - by) * pa;
                    E[4 * k + 2] = reel.x + (x + bx) * pb;
                    E[4 * k + 3] = reel.y + (y + by) * pb;
                    if (k < n) {
                        segZ[count] = (z + P[3 * k + 5]) / 2;
                        segRib[count] = ri;
                        segK[count] = k;
                        segOrder[count] = count;
                        count++;
                    }
                }
                rb.S[0] = -Ltot;    // ținut minte: de aici „curge” textura (pelicula iese din rolă)
            }
            if (!count) { drawReel(reel); return; }
            const order = segOrder.subarray(0, count);
            order.sort((a, b) => segZ[a] - segZ[b]);

            // umbra pe masă (doar când e lumină)
            if (shCtx && light > 0.05) {
                shCtx.setTransform(1 / SH, 0, 0, 1 / SH, 0, 0);
                shCtx.clearRect(0, 0, vw + SH, vh + SH);
                shCtx.fillStyle = '#000';
                for (const rb of ribs) {
                    if (rb.S[rb.n] <= 0) continue;
                    const E = rb.E, n = rb.n;
                    shCtx.beginPath();
                    shCtx.moveTo(E[0], E[1]);
                    for (let k = 1; k <= n; k++) shCtx.lineTo(E[4 * k], E[4 * k + 1]);
                    for (let k = n; k >= 0; k--) shCtx.lineTo(E[4 * k + 2], E[4 * k + 3]);
                    shCtx.closePath();
                    shCtx.fill();
                }
                ctx.globalAlpha = 0.2 * light;
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(shadow, 0, 0, shadow.width, shadow.height, 7 * sc, 13 * sc, shadow.width * SH, shadow.height * SH);
                ctx.globalAlpha = 1;
            }

            // pelicula iese de sub rolă: ce e în dreptul rolei sau în spatele ei se desenează
            // întâi; ce vine spre noi, dincolo de marginea rolei, se desenează peste ea
            const zSplit = 22 * sc, rim = (15.2 * reel.S) ** 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#17130f';
            for (let pass = 0; pass < 2; pass++) {
                if (pass === 1) { drawReel(reel); ctx.lineCap = 'round'; ctx.strokeStyle = '#17130f'; }
                for (let i = 0; i < count; i++) {
                    const id = order[i];
                    const rb = ribs[segRib[id]], k = segK[id], E = rb.E;
                    {
                        const mx = (E[4 * k] + E[4 * k + 2] + E[4 * k + 4] + E[4 * k + 6]) / 4 - reel.x;
                        const my = (E[4 * k + 1] + E[4 * k + 3] + E[4 * k + 5] + E[4 * k + 7]) / 4 - reel.y;
                        const over = segZ[id] >= zSplit && mx * mx + my * my > rim;
                        if (over !== (pass === 1)) continue;
                    }
                    const l0x = E[4 * k], l0y = E[4 * k + 1], r0x = E[4 * k + 2], r0y = E[4 * k + 3];
                    const l1x = E[4 * k + 4], l1y = E[4 * k + 5], r1x = E[4 * k + 6], r1y = E[4 * k + 7];
                    const ux = (r0x - l0x + r1x - l1x) / 2, uy = (r0y - l0y + r1y - l1y) / 2;
                    const m0x = (l0x + r0x) / 2, m0y = (l0y + r0y) / 2;
                    const vx = (l1x + r1x) / 2 - m0x, vy = (l1y + r1y) / 2 - m0y;
                    const wS = Math.hypot(ux, uy), vl = Math.hypot(vx, vy);
                    if (vl < 0.05) continue;
                    // în afara ecranului: nu se desenează
                    if ((m0x < -wS - vl && m0x + vx < -wS - vl) || (m0x > vw + wS + vl && m0x + vx > vw + wS + vl)
                        || (m0y < -wS - vl && m0y + vy < -wS - vl) || (m0y > vh + wS + vl && m0y + vy > vh + wS + vl)) continue;
                    // pe muchie: o linie (grosimea peliculei)
                    const cross = Math.abs(ux * vy - uy * vx) / vl;     // lățimea văzută, perpendicular pe direcție
                    if (cross < 1.7) {
                        ctx.setTransform(q, 0, 0, q, 0, 0);
                        ctx.lineWidth = Math.max(1.25, Math.min(3.2, 0.045 * rb.w * sc * (wS / (rb.w * sc + 0.01) + 0.6)));
                        ctx.beginPath();
                        ctx.moveTo(m0x, m0y);
                        ctx.lineTo(m0x + vx, m0y + vy);
                        ctx.stroke();
                        continue;
                    }
                    // felia de textură: de la S[k] la S[k+1], socotit de la capătul liber (curge din rolă)
                    const txw = rb.w * sc;
                    const a0 = ((k === 0 ? 0 : rb.S[k]) + rb.S[0]) / txw * TW;
                    const a1 = (rb.S[k + 1] + rb.S[0]) / txw * TW;
                    const th = Math.max(0.5, a1 - a0);
                    const ty = ((a0 % TH) + TH) % TH;
                    const tx = wS * q > 120 ? tex[0] : wS * q > 54 || tex.length < 3 ? tex[Math.min(1, tex.length - 1)] : tex[2];
                    const kk = tx.k, e = 0.7 / vl;
                    ctx.setTransform((q * ux) / (TW * kk), (q * uy) / (TW * kk), (q * vx) / (th * kk), (q * vy) / (th * kk),
                                     q * (m0x - ux / 2), q * (m0y - uy / 2));
                    const sy = Math.min(ty * kk, tx.base.height - th * kk - 0.01);
                    ctx.drawImage(tx.base, 0, sy, TW * kk, th * kk, 0, -e * th * kk, TW * kk, th * kk * (1 + 2 * e));
                    const gl = (rb.G[k] + rb.G[k + 1]) / 2;
                    if (gl > 0.03) {
                        ctx.globalAlpha = gl > 1 ? 1 : gl;
                        ctx.drawImage(tx.sheen, 0, sy, TW * kk, th * kk, 0, -e * th * kk, TW * kk, th * kk * (1 + 2 * e));
                        ctx.globalAlpha = 1;
                    }
                }
            }
            ctx.setTransform(q, 0, 0, q, 0, 0);
        };

        const veilAt = (t: number): number => {
            if (t <= VEIL[0][0]) return 1;
            for (let i = 1; i < VEIL.length; i++) {
                if (t < VEIL[i][0]) {
                    const [ta, va] = VEIL[i - 1], [tb, vb] = VEIL[i];
                    return lerp(va, vb, (t - ta) / (tb - ta));
                }
            }
            return 0;
        };

        /* ── un cadru, la momentul t (ms) ── */
        let stage = 0;          // până unde a ajuns pagina (ca să nu atingem <html> la fiecare cadru)
        const paint = (t: number) => {
            ctx.setTransform(q, 0, 0, q, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, vw, vh);
            if (t < T.brk) {
                drawPull(t);
            } else if (t < T.dark) {
                drawBreak(t);
            } else {
                const veil = veilAt(t);
                if (veil > 0) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${veil.toFixed(3)})`;
                    ctx.fillRect(0, 0, vw, vh);
                    drawLed(t);
                }
            }
            if (t >= T.spill && t < T.end) {
                if (t >= T.dark) {
                    if (stage < 1) measureLogo();
                    const reel = reelAt(t);
                    const light = 1 - veilAt(t);
                    if (t < T.dock) {
                        drawFilm(t, reel, light);
                    }
                }
            }
            // pagina
            if (stage < 1 && t >= T.dark) { stage = 1; html.setAttribute(VZ.state, 'film'); }
            if (stage < 2 && t >= T.strip) { stage = 2; html.setAttribute(VZ.strip, ''); }
            if (stage < 3 && t >= T.logo) { stage = 3; html.setAttribute(VZ.logo, ''); }
            if (stage < 4 && t >= T.dock) { stage = 4; html.setAttribute(VZ.reel, ''); }
            if (stage < 5 && t >= T.text) { stage = 5; html.removeAttribute(VZ.ui); html.setAttribute(VZ.state, 'out'); }
            if (stage < 6 && t >= T.lamp) { stage = 6; html.setAttribute(VZ.lamp, ''); }
        };

        /* ── ceasul ── */
        let raf = 0, t0 = -1, over = false, started = false, waitTimer = 0, tailTimer = 0;
        const unlisten = () => {
            window.removeEventListener('pointerdown', skip, true);
            window.removeEventListener('wheel', skip, { capture: true });
            window.removeEventListener('keydown', skip, true);
            window.removeEventListener('resize', onResize);
        };
        const finish = () => {
            if (over) return;
            over = true;
            stopFrame(raf);
            window.clearTimeout(waitTimer);
            unlisten();
            video.pause();
            video.remove();
            clearVizor();
        };
        function skip(ev: Event) {
            if (ev instanceof KeyboardEvent && (ev.metaKey || ev.ctrlKey || ev.altKey)) return;
            if (hold !== null) return;
            finish();
        }
        function onResize() { size(); measureLogo(); if (hold !== null && started) paint(hold); }

        const frame = (now: number) => {
            // ceasul pornește la primul cadru desenat (o filă deschisă în fundal
            // începe intro-ul abia când o vezi)
            if (t0 < 0) {
                t0 = now;
                if (hold === null) {
                    video.playbackRate = speed;
                    video.play().catch(() => { /* fără redare automată: rămâne imaginea fixă */ });
                }
            }
            const t = hold !== null ? hold : (now - t0) * speed;
            if (hold !== null && video.readyState >= 1 && Math.abs(video.currentTime - Math.min(hold, T.dark) / 1000) > 0.03) {
                try { video.currentTime = Math.min(hold, T.dark) / 1000 + 0.001; } catch { /* încă nu se poate căuta */ }
            }
            if (hold === null && t >= T.dark && !video.paused) video.pause();
            const p0 = performance.now();
            paint(t);
            const dt = performance.now() - p0;
            stats.frames++;
            stats.ms += dt;
            if (dt > stats.worst) stats.worst = dt;
            stats.last = t;
            if (hold === null && t >= T.end) { finish(); return; }
            raf = nextFrame(frame);
        };
        const start = () => {
            if (started || over) return;
            started = true;
            window.clearTimeout(waitTimer);
            tex = buildTextures(poster.complete && poster.naturalWidth ? poster : null);
            measureLogo();
            paint(hold ?? 0);
            html.setAttribute(VZ.state, 'run');     // de acum negrul îl desenează canvas-ul
            raf = nextFrame(frame);
        };
        // pornim când imaginea, rama și primul cadru al videoului sunt gata; dacă videoul
        // întârzie mai mult de 1,5 s (pe telefon nu se încarcă dinainte), pornim cu imaginea
        // fixă — videoul o înlocuiește de cum pornește
        const ready = () => {
            if (started || over) return;
            const imgs = rama.complete && poster.complete;
            if (imgs && (video.readyState >= 3 || !poster.naturalWidth)) start();
        };
        rama.onload = ready;
        poster.onload = ready;
        rama.onerror = ready;
        poster.onerror = ready;
        video.addEventListener('canplay', ready);
        video.addEventListener('loadeddata', ready);
        waitTimer = window.setTimeout(() => {
            // dacă nici imaginea fixă nu a venit: fără intro
            if (poster.complete && poster.naturalWidth) start(); else finish();
        }, 1500);
        ready();

        window.addEventListener('pointerdown', skip, true);
        window.addEventListener('wheel', skip, { capture: true, passive: true });
        window.addEventListener('keydown', skip, true);
        window.addEventListener('resize', onResize);

        // pentru verificarea cadru cu cadru din consolă (și când fila e ascunsă):
        // window.__vz.draw(2300) desenează momentul 2,3 s; .shot(640) = imaginea, ca text
        const W_ = window as unknown as { __vz?: unknown };
        if (hold !== null || byTimer) {
            W_.__vz = {
                T,
                stats,
                reel: (ms: number) => { measureLogo(); return reelAt(ms); },
                draw: (ms: number) => { hold = ms; if (!tex.length) tex = buildTextures(poster.naturalWidth ? poster : null); measureLogo(); paint(ms); },
                seek: (ms: number) => { video.currentTime = ms / 1000; },
                shot: (w = 640, x = 0, y = 0, cw = vw, ch = vh) => {
                    const c = document.createElement('canvas');
                    c.width = w;
                    c.height = Math.round((w * ch) / cw);
                    const g = c.getContext('2d');
                    if (!g) return '';
                    g.fillStyle = PAGE_BG;
                    g.fillRect(0, 0, c.width, c.height);
                    g.drawImage(canvas, x * q, y * q, cw * q, ch * q, 0, 0, c.width, c.height);
                    return c.toDataURL('image/jpeg', 0.72);
                },
            };
        }

        return () => {
            stopFrame(raf);
            window.clearTimeout(waitTimer);
            window.clearTimeout(tailTimer);
            unlisten();
            video.pause();
            video.removeAttribute('src');
            video.load();
            video.remove();
            if (over) return;
            // React (dev, StrictMode) montează efectul de două ori: lăsăm intro-ul „în
            // așteptare” pentru a doua montare; dacă nu mai vine (ai plecat de pe pagină),
            // curățăm, ca pagina următoare să nu rămână goală
            for (const a of [VZ.js, VZ.strip, VZ.logo, VZ.reel, VZ.lamp]) html.removeAttribute(a);
            html.setAttribute(VZ.state, 'pending');
            html.setAttribute(VZ.ui, 'off');
            tailTimer = window.setTimeout(() => { if (!html.hasAttribute(VZ.js)) clearVizor(); }, 300);
        };
    }, []);

    return (
        <div ref={layerRef} className={styles.vzLayer} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.vzCanvas} />
        </div>
    );
}
