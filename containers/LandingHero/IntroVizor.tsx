'use client';

import { useEffect, useRef } from 'react';

import styles from './landing.module.css';
import { FILM_COLOR, FLANGE, WOUND_DOCK, WOUND_FULL } from './LogoReel';
import { VZ, clearVizor, logoBridge } from './intro';



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

   VERSIUNEA 2 — /?intro=vizor2 (16.11.2026, 13:48, după ce Ștefan a văzut-o pe prima):
   1. APROPIEREA — invers: pornim de la încadratura din poză și intrăm în
      imagine (clipul la viteza reală, cu cele trei trepte de diafragmă).
   2. RUPEREA — pe direcția peliculei de pe pagină: pe ecranele mari (pelicula
      verticală) cadrul fuge în sus–jos și capetele sar în sus și în jos; pe
      ecranele mici (pelicula orizontală, data-film='h') totul pe orizontală.
      În spatele peliculei nu mai e întuneric: e albul cu grain al paginii.
   3. ÎNCÂLCEALA — pe ecranul alb, toată pelicula încâlcită, liberă (fără rolă).
   4. ROLA intră din dreapta, învârtindu-se, absoarbe toate fâșiile în drum
      spre logo și rămâne lângă „Atemporal Film”.
   5. PAGINA — ca în versiunea 1.
   Prima versiune rămâne la /?intro=vizor.

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

/** versiunea 2: momentele care diferă (restul — strip, logo, dock, text, lamp, end — sunt cele din T) */
const T2 = {
    slip:   1150,   // sfârșitul apropierii: pelicula o ia din loc …
    tear:   1270,   // … și se rupe; apare pelicula încâlcită
    clear:  1450,   // capetele rupte au ieșit din cadru
    reelIn: 2040,   // rola intră din dreapta
};

/** versiunea 3: aceeași rupere, dar lampa din spatele peliculei orbește; fâșiile vin din
    afara ecranului abia după lumină, iar rola intră imediat după ele */
const T3 = {
    slip:   1150,
    tear:   1270,   // pelicula se rupe: lumina lămpii, în plin
    clear:  1450,
    fly:    1400,   // sub lumina care scade, fâșiile intră din toate părțile
    reelIn: 1900,   // rola
};
/** lumina lămpii: plină până la „hold”, stinsă la „out” */
const FLASH = { rise: 45, hold: 1440, out: 1800 };

/** versiunea 4: totul în 3 secunde; camera e în mișcare din primul cadru; rola intră cât
    lumina încă scade, iar la sfârșit strânge și pelicula de peste logo (LogoReel, prin logoBridge) */
const T4 = { slip: 800, tear: 900, clear: 1060, fly: 980, reelIn: 1150 };
const T4P = { strip: 1720, logo: 1000, dock: 2080, text: 2300, lamp: 2420, end: 3000 };
/** lumina: plină până la „hold”; albul de pe tot ecranul stins la „out”, raza de pe linia rupturii la „ray” */
const FLASH4 = { rise: 40, hold: 1040, out: 1330, ray: 1480 };
const GATHER = 660;          // cât strânge rola pelicula de peste logo (ms)
const SPIN4 = 1080;          // trei ture, de la intrare până se oprește lângă logo (lent: nu „bate” pe cadre)
const VIDEO_RATE4 = 1.4;     // clipul, puțin mai repede: treptele de diafragmă încap în 0,8 s

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
    video2:  '/assets/intro/vizor-scena-2.mp4?v=1',     // versiunea 2: viteza reală, treptele de diafragmă
    poster2: '/assets/intro/vizor-scena-2.jpg?v=1',
    rama:   '/assets/intro/vizor-rama.webp?v=1',
};
/** versiunea 3: peliculă reală, decupată din pozele de referință (scripts/intro-pelicula.py) */
const FILM_SRC = ['color', 'an', 'sepia', 'negru', 'albastru', 'an2'].map((n) => `/assets/intro/pelicula-${n}.webp?v=1`);
const PAGE_BG = '#f1f0ed';

type Pt = [number, number];

const clamp01  = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp     = (a: number, b: number, k: number) => a + (b - a) * k;
const easeIO   = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));
const easeOut3 = (v: number) => 1 - (1 - clamp01(v)) ** 3;
/** pornește și se oprește fără smucitură (viteza și accelerația sunt zero la capete) */
const ease5 = (v: number) => { const x = clamp01(v); return x * x * x * (x * (6 * x - 15) + 10); };
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
/** un fel de peliculă: th = după câți pixeli de textură se repetă; mips = cele trei mărimi */
type Film = { th: number; mips: Tex[] };

/** cele trei mărimi ale unei texturi, fiecare cu varianta „cu luciu” */
function mipsOf(big: HTMLCanvasElement, sheenA: number): Tex[] {
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
        s.fillStyle = `rgba(255, 252, 244, ${sheenA})`;
        s.fillRect(0, 0, sheen.width, sheen.height);
        out.push({ k, base, sheen });
    }
    return out;
}

/** versiunea 3: textura dintr-o fâșie de peliculă reală (imaginea se repetă pe înălțime) */
function buildFilm(img: HTMLImageElement): Film | null {
    if (!img.complete || !img.naturalWidth) return null;
    const H = Math.round((img.naturalHeight * TW) / img.naturalWidth);
    const big = document.createElement('canvas');
    big.width = TW;
    big.height = H + PITCH;                  // puțin în plus: feliile pot trece de capăt
    const g = big.getContext('2d');
    if (!g) return null;
    g.drawImage(img, 0, 0, TW, H);
    g.drawImage(img, 0, H, TW, H);
    const mips = mipsOf(big, 0.6);
    return mips.length ? { th: H, mips } : null;
}

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

    return mipsOf(big, 0.72);
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
    L: number;          // lungimea desenată acum (0 = nu se desenează)
    ws: number;         // lățimea, față de w (se subțiază când intră într-o rolă mică)
    // doar versiunea 2 (pelicula liberă): locul ei în încâlceală (față de centrul
    // ecranului), alunecarea lentă, rotirea lentă, când o prinde rola și cât durează
    cx: number; cy: number; cz: number;
    dvx: number; dvy: number; rot: number;
    tc: number; td: number;
    // doar versiunea 3: felul de peliculă și de unde intră (cât e de departe, în afara ecranului)
    tex: number; ex: number; ey: number;
    al: number;         // versiunea 4: cât de opacă se desenează (în mișcare: pe jumătate, de trei ori)
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
            L: 0, ws: 1, cx: 0, cy: 0, cz: 0, dvx: 0, dvy: 0, rot: 0, tc: 0, td: 0, tex: 0, ex: 0, ey: 0, al: 1,
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
    const n = rb.n, P = rb.P;
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
    return frame3(rb, hx, hy, hz);
}

/** 2. din centrul panglicii (P) și răsucirea ei (ținută în G): tangenta, direcția
    lățimii (perpendiculară pe tangentă, pornind de la H = hx, hy, hz), luciul, lungimea */
function frame3(rb: Rib, hx: number, hy: number, hz: number): number {
    const n = rb.n, P = rb.P, B = rb.B, S = rb.S;
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


/* ────────────────────────── VERSIUNEA 2: pelicula încâlcită ──────────────────────────
   Aceleași trei feluri de panglici, dar libere (fără rolă): bucăți de spirală,
   fâșii lungi care unduiesc și se răsucesc, bucle. Sar din linia rupturii spre
   locul lor și apoi plutesc încet. Când rola ajunge la ele, capul fiecăreia e
   tras în rolă și restul vine după el (se scurtează de la cap). */
function makeTangle(vw: number, vh: number, v3: boolean, o = { fly: T3.fly, spread: 180, d0: 430, d1: 560, td: 1 }): Rib[] {
    // versiunea 3: din ce parte intră fiecare (stânga, dreapta, sus, jos) și, pentru
    // fâșiile lungi, direcția (intră în lungul lor, ca aruncate)
    const SIDE = 'LRTR' + 'LRBTB' + 'LTRBB';
    const DEG3: Record<number, number> = { 6: 76, 7: 104, 8: 58 };
    const dg = Math.hypot(vw, vh) / 2, vmin = Math.min(vw, vh);
    const R = mulberry(7120);
    const rnd = (a: number, b: number) => a + (b - a) * R();
    const out: Rib[] = [];
    // fx, fy = locul în ecran (0…1); deg = direcția
    const add = (kind: 0 | 1 | 2, fx: number, fy: number, deg: number, p: Partial<Rib>, n: number) => {
        const i = out.length;
        const rb: Rib = {
            kind, phi: (deg * Math.PI) / 180,
            len: 0.6 * dg, w: 0.05 * vmin, z: 0.2, a: 0.1, b: 0.1 * dg, turns: 2, tw: 1,
            ph: rnd(0, 6.283), ph2: rnd(0, 6.283),
            t0: T2.tear + rnd(0, 120), dur: rnd(300, 440), r0: 0, rd: 0,
            n,
            P: new Float32Array(3 * (n + 1)), B: new Float32Array(3 * (n + 1)),
            S: new Float32Array(n + 1), E: new Float32Array(4 * (n + 1)), G: new Float32Array(n + 1),
            L: 0, ws: 1,
            cx: (fx - 0.5) * vw, cy: (fy - 0.5) * vh, cz: 0,
            dvx: rnd(-42, 42), dvy: rnd(-30, 30), rot: rnd(-0.45, 0.45),
            tc: 0, td: rnd(300, 420),
            tex: 0, ex: 0, ey: 0, al: 1,
            ...p,
        };
        if (v3) {
            const side = SIDE[i % SIDE.length];
            if (DEG3[i] !== undefined) rb.phi = (DEG3[i] * Math.PI) / 180;
            rb.tex = i;
            rb.w *= 1.3;                        // pelicula reală: puțin mai lată, să i se vadă cadrele
            rb.t0 = o.fly + rnd(0, o.spread);
            rb.dur = rnd(o.d0, o.d1);
            rb.td *= o.td;
            const horiz = side === 'L' || side === 'R';
            const reach = (kind === 1 ? rb.len * (0.5 * Math.abs(horiz ? Math.cos(rb.phi) : Math.sin(rb.phi)) + 0.2)
                : kind === 0 ? 0.5 * rb.len + rb.b : 1.2 * rb.b) + 2 * rb.w;
            const dist = side === 'L' ? vw / 2 + rb.cx : side === 'R' ? vw / 2 - rb.cx : side === 'T' ? vh / 2 + rb.cy : vh / 2 - rb.cy;
            const off = (dist + reach) * 1.5;   // sigur în afara ecranului (și cu perspectiva)
            rb.ex = side === 'L' ? -off : side === 'R' ? off : 0;
            rb.ey = side === 'T' ? -off : side === 'B' ? off : 0;
        }
        out.push(rb);
    };
    // bucăți de spirală
    add(0, 0.20, 0.30,  18, { len: 0.42 * dg, z: 0.84, a: 0.10,  b: 0.100 * dg, turns: 2.6, tw: 1.8 }, 100);
    add(0, 0.74, 0.70, 204, { len: 0.46 * dg, z: 0.80, a: -0.10, b: 0.120 * dg, turns: 2.4, tw: -1.6, w: 0.046 * vmin }, 96);
    add(0, 0.54, 0.20,  96, { len: 0.34 * dg, z: 0.88, a: 0.08,  b: 0.085 * dg, turns: 2.2, tw: 2.2, w: 0.054 * vmin }, 88);
    add(0, 0.88, 0.18, 250, { len: 0.28 * dg, z: 0.82, a: 0.06,  b: 0.070 * dg, turns: 2.0, tw: -2.0, w: 0.042 * vmin }, 78);
    // fâșii lungi (trec peste tot ecranul)
    add(1, 0.50, 0.50,  12, { len: 1.50 * dg, z: 0.10, a: 0.070, b: 0.05,  turns: 2.4, tw: 1.2, w: 0.046 * vmin }, 120);
    add(1, 0.45, 0.62, 158, { len: 1.30 * dg, z: 0.20, a: 0.090, b: -0.04, turns: 3.0, tw: -1.5, w: 0.058 * vmin }, 116);
    add(1, 0.30, 0.76,  62, { len: 0.90 * dg, z: 0.16, a: 0.100, b: 0.06,  turns: 2.2, tw: 1.8, w: 0.040 * vmin }, 96);
    add(1, 0.78, 0.30, 118, { len: 0.85 * dg, z: -0.12, a: 0.080, b: 0.03, turns: 2.6, tw: -1.0, w: 0.038 * vmin }, 92);
    // una lată, în prim-plan
    add(1, 0.52, 0.44,  34, { len: 1.60 * dg, z: 0.06, a: 0.060, b: 0.04,  turns: 1.8, tw: 0.8, w: 0.050 * vmin, cz: 0.36 * dg }, 124);
    // bucle
    add(2, 0.34, 0.52,  20, { b: 0.160 * dg, turns: 1.35, z: 0.70, a: 0.5, tw: 1 }, 92);
    add(2, 0.63, 0.42, 140, { b: 0.130 * dg, turns: 1.20, z: 0.80, a: 0.6, tw: -1, w: 0.044 * vmin }, 84);
    add(2, 0.85, 0.54, 260, { b: 0.110 * dg, turns: 1.50, z: 0.66, a: 0.5, tw: 1, w: 0.040 * vmin }, 84);
    add(2, 0.13, 0.72,  80, { b: 0.120 * dg, turns: 1.30, z: 0.76, a: 0.6, tw: -1, w: 0.052 * vmin }, 84);
    add(2, 0.56, 0.82, 310, { b: 0.100 * dg, turns: 1.60, z: 0.80, a: 0.5, tw: 1, w: 0.042 * vmin }, 84);
    return out;
}

/** pelicula liberă la momentul t: g = cât a sărit din ruptură (0…1), c = cât a înghițit
    rola din ea (de la cap), a = cât de prinsă e de rolă; (rx, ry) = rola, față de centrul
    ecranului. horiz = pelicula orizontală (ruptura e verticală: fâșiile pornesc din ea) */
function shapeFree(rb: Rib, t: number, g: number, c: number, a: number, rx: number, ry: number, horiz: boolean): number {
    const n = rb.n, P = rb.P;
    const ts = Math.max(0, (t - rb.t0) / 1000);
    const phi = rb.phi + rb.rot * ts;
    const cf = Math.cos(phi), sf = Math.sin(phi);
    // versiunea 3: vine întreagă din afara ecranului (ex, ey) până la locul ei
    const fly = rb.ex !== 0 || rb.ey !== 0;
    const L = fly ? rb.len : rb.len * g, sz = fly ? 1 : 0.3 + 0.7 * g;
    // locul: din linia rupturii spre locul ei din încâlceală, apoi alunecă încet
    const ox = horiz ? 0 : rb.cx * 0.55, oy = horiz ? rb.cy * 0.55 : 0;
    const px = fly ? rb.cx + rb.ex * (1 - g) + rb.dvx * ts : ox + (rb.cx - ox) * g + rb.dvx * ts;
    const py = fly ? rb.cy + rb.ey * (1 - g) + rb.dvy * ts : oy + (rb.cy - oy) * g + rb.dvy * ts;
    const pz = fly ? rb.cz : rb.cz * g;
    let hx = 0, hy = 0, hz = 1;
    if (rb.kind === 0) {
        const ah = Math.sqrt(1 - rb.z * rb.z);
        hx = cf * ah; hy = sf * ah; hz = rb.z;
    } else if (rb.kind === 2) {
        hx = sf * rb.z; hy = -cf * rb.z; hz = Math.sqrt(1 - rb.z * rb.z);
    }
    for (let k = 0; k <= n; k++) {
        const u = c + (1 - c) * (k / n);
        let x = 0, y = 0, z = 0, tau = 0;
        if (rb.kind === 0) {
            const d = L * (u - 0.5), bend = rb.a * L * (u - 0.5) * (u - 0.5) * 2;
            const rho = rb.b * sz * (0.6 + 0.4 * Math.sin(Math.PI * u));
            const th = rb.ph + 6.2832 * rb.turns * u - rb.tw * ts;
            const co = Math.cos(th), si = Math.sin(th);
            x = hx * d - sf * bend + rho * (-co * sf - si * hz * cf);
            y = hy * d + cf * bend + rho * (co * cf - si * hz * sf);
            z = hz * d + rho * si * Math.sqrt(1 - hz * hz);
            tau = 0.22 * Math.sin(rb.ph2 + 3 * u + 2 * ts);
        } else if (rb.kind === 1) {
            const d = L * (u - 0.5);
            const wv = rb.a * L * Math.sin(rb.turns * Math.PI * u + rb.ph - 3.0 * ts);
            x = cf * d - sf * wv;
            y = sf * d + cf * wv + rb.b * L * (u - 0.5) * (u - 0.5);
            z = rb.z * L * (u - 0.5) + 0.09 * L * Math.sin(2.2 * Math.PI * u + rb.ph2 - 2.4 * ts);
            tau = rb.ph2 + rb.tw * 6.2832 * u - 2.0 * ts;
        } else {
            const th = rb.ph + 6.2832 * rb.turns * u + rb.tw * 0.5 * ts;
            const r = rb.b * sz * (0.72 + 0.28 * u) * (1 + 0.07 * Math.sin(3 * th + rb.ph2));
            const co = Math.cos(th), si = Math.sin(th);
            const st = rb.z, ct = hz;
            // planul buclei: e1 = (cf, sf, 0), e2 = (−sf·ct, cf·ct, st); lățimea = normala lui
            x = r * (co * cf - si * sf * ct);
            y = r * (co * sf + si * cf * ct);
            z = r * si * st + rb.a * rb.b * sz * (u - 0.5);     // puțin în spirală: capetele nu se ating
            tau = 0.3 * Math.sin(rb.ph2 + 4 * u + 1.6 * ts);
        }
        P[3 * k] = px + x; P[3 * k + 1] = py + y; P[3 * k + 2] = pz + z;
        rb.G[k] = tau;
    }
    // prinsă de rolă: capul e în rolă, coada e trasă spre ea; forma ei rămâne, tot mai întinsă
    if (a > 0) {
        const j = 3 * n;
        const h0x = P[0], h0y = P[1], h0z = P[2], t0x = P[j], t0y = P[j + 1], t0z = P[j + 2];
        const drag = Math.pow(c, 1.5), keep = 1 - 0.5 * c;
        const tlx = t0x + (rx - t0x) * drag, tly = t0y + (ry - t0y) * drag, tlz = t0z * (1 - drag);
        for (let k = 0; k <= n; k++) {
            const v = k / n, i = 3 * k;
            const gx = rx + (tlx - rx) * v + (P[i] - (h0x + (t0x - h0x) * v)) * keep;
            const gy = ry + (tly - ry) * v + (P[i + 1] - (h0y + (t0y - h0y) * v)) * keep;
            const gz = tlz * v + (P[i + 2] - (h0z + (t0z - h0z) * v)) * keep;
            P[i] += (gx - P[i]) * a;
            P[i + 1] += (gy - P[i + 1]) * a;
            P[i + 2] += (gz - P[i + 2]) * a;
        }
    }
    return frame3(rb, hx, hy, hz);
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

        // versiunea 2: /?intro=vizor2 ; pelicula orizontală (ecranele mici): totul pe orizontală
        // versiunea 3: /?intro=vizor3 = versiunea 2 + peliculă reală, lumina lămpii, fâșii din afară
        const V3 = /[?&]intro=vizor[34](?:&|$)/.test(window.location.search);
        const V2 = V3 || /[?&]intro=vizor2(?:&|$)/.test(window.location.search);
        // versiunea 4: /?intro=vizor4 = versiunea 3 în 3 secunde, cu mișcarea netezită
        const V4 = /[?&]intro=vizor4(?:&|$)/.test(window.location.search);
        const TT = V4 ? T4 : V3 ? T3 : { ...T2, fly: T2.tear };
        const TM = V4 ? { ...T, ...T4P } : T;
        const VR = V4 ? VIDEO_RATE4 : 1;
        /** versiunea 4: unghiul rolei, o singură curbă de la intrare până se oprește lângă logo */
        const spin4 = (t: number) => { const x = clamp01((t - T4.reelIn) / (T4P.dock + GATHER - T4.reelIn)); return SPIN4 * (1.5 * x - 0.5 * x * x * x); };
        const filmHoriz = () => html.getAttribute('data-film') === 'h';

        /* ── piesele ── */
        const rama = new Image();
        const poster = new Image();
        rama.decoding = 'async';
        poster.decoding = 'async';
        rama.src = ASSET.rama;
        poster.src = V2 ? ASSET.poster2 : ASSET.poster;
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.preload = 'auto';
        video.className = styles.vzVideo;
        video.src = V2 ? ASSET.video2 : ASSET.video;
        layer.appendChild(video);
        const grain = buildGrain();
        const flange = new Path2D(FLANGE);
        let films: Film[] = [];
        const filmImgs = V3 ? FILM_SRC.map((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; return im; }) : [];
        const makeFilms = () => {
            const real = filmImgs.map(buildFilm).filter((f): f is Film => f !== null);
            if (real.length) return real;
            const mips = buildTextures(poster.complete && poster.naturalWidth ? poster : null);
            return mips.length ? [{ th: TH, mips }] : [];
        };

        /* ── ecranul ── */
        let vw = 0, vh = 0, q = 1;
        let ribs: Rib[] = [];
        let planned = false;      // versiunea 2: s-a hotărât când prinde rola fiecare fâșie
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
            ribs = V2 ? makeTangle(vw, vh, V3, V4 ? { fly: T4.fly, spread: 170, d0: 520, d1: 640, td: 0.9 } : undefined) : makeRibbons(Math.hypot(vw, vh) / 2, Math.min(vw, vh));
            planned = false;
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
            const p = clamp01((t - T.rewind) / (TM.dock - T.rewind));
            const f = clamp01((t - T.rewind - 230) / (TM.dock - T.rewind - 230));
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

        /** panglicile pregătite (P, B, S, G, L, ws) → pe ecran: proiectate în perspectivă față de
            (ox, oy), tăiate în felii și desenate de la cea mai îndepărtată la cea mai apropiată;
            rola, dacă e, stă între ele */
        const renderFilm = (ox: number, oy: number, reel: Reel | null, light: number, shOff: number, ghost = false) => {
            if (!films.length) { if (reel) drawReel(reel); return; }
            const D = 1.15 * (Math.hypot(vw, vh) / 2);     // distanța privitorului
            let count = 0;

            for (let ri = 0; ri < ribs.length; ri++) {
                const rb = ribs[ri];
                if (rb.L <= 0) continue;
                const n = rb.n, P = rb.P, B = rb.B, E = rb.E;
                const half = 0.5 * rb.w * rb.ws;
                for (let k = 0; k <= n; k++) {
                    const x = P[3 * k], y = P[3 * k + 1], z = P[3 * k + 2];
                    const bx = B[3 * k] * half, by = B[3 * k + 1] * half, bz = B[3 * k + 2] * half;
                    const pa = D / (D - Math.min(0.72 * D, z - bz)), pb = D / (D - Math.min(0.72 * D, z + bz));
                    E[4 * k]     = ox + (x - bx) * pa;
                    E[4 * k + 1] = oy + (y - by) * pa;
                    E[4 * k + 2] = ox + (x + bx) * pb;
                    E[4 * k + 3] = oy + (y + by) * pb;
                    if (k < n) {
                        segZ[count] = (z + P[3 * k + 5]) / 2;
                        segRib[count] = ri;
                        segK[count] = k;
                        segOrder[count] = count;
                        count++;
                    }
                }
            }
            if (!count) { if (reel) drawReel(reel); return; }
            const order = segOrder.subarray(0, count);
            order.sort((a, b) => segZ[a] - segZ[b]);

            // umbra pe masă (doar când e lumină)
            if (!ghost && shCtx && light > 0.05) {
                shCtx.setTransform(1 / SH, 0, 0, 1 / SH, 0, 0);
                shCtx.clearRect(0, 0, vw + SH, vh + SH);
                shCtx.fillStyle = '#000';
                for (const rb of ribs) {
                    if (rb.L <= 0) continue;
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
                ctx.drawImage(shadow, 0, 0, shadow.width, shadow.height, 7 * shOff, 13 * shOff, shadow.width * SH, shadow.height * SH);
                ctx.globalAlpha = 1;
            }

            // pelicula iese de sub rolă: ce e în dreptul rolei sau în spatele ei se desenează
            // întâi; ce vine spre noi, dincolo de marginea rolei, se desenează peste ea
            const zSplit = reel ? (22 * reel.S) / bigScale() : 0, rim = reel ? (15.2 * reel.S) ** 2 : 0;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#17130f';
            for (let pass = 0; pass < (reel ? 2 : 1); pass++) {
                if (pass === 1 && reel) { drawReel(reel); ctx.lineCap = 'round'; ctx.strokeStyle = '#17130f'; }
                for (let i = 0; i < count; i++) {
                    const id = order[i];
                    const rb = ribs[segRib[id]], k = segK[id], E = rb.E;
                    if (reel) {
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
                        ctx.lineWidth = Math.max(1.25, Math.min(3.2, 0.045 * rb.w * rb.ws * (wS / (rb.w * rb.ws + 0.01) + 0.6)));
                        ctx.beginPath();
                        ctx.moveTo(m0x, m0y);
                        ctx.lineTo(m0x + vx, m0y + vy);
                        ctx.globalAlpha = rb.al;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                        continue;
                    }
                    // felia de textură: de la S[k] la S[k+1], socotit de la capătul liber (curge din rolă)
                    const txw = rb.w * rb.ws;
                    const a0 = ((rb.S[k] - rb.L) / txw) * TW;
                    const a1 = ((rb.S[k + 1] - rb.L) / txw) * TW;
                    const th = Math.max(0.5, a1 - a0);
                    const fm = films[rb.tex % films.length], tex = fm.mips;
                    const ty = ((a0 % fm.th) + fm.th) % fm.th;
                    const tx = wS * q > 120 ? tex[0] : wS * q > 54 || tex.length < 3 ? tex[Math.min(1, tex.length - 1)] : tex[2];
                    const kk = tx.k, e = 0.7 / vl;
                    ctx.setTransform((q * ux) / (TW * kk), (q * uy) / (TW * kk), (q * vx) / (th * kk), (q * vy) / (th * kk),
                                     q * (m0x - ux / 2), q * (m0y - uy / 2));
                    const sy = Math.min(ty * kk, tx.base.height - th * kk - 0.01);
                    ctx.globalAlpha = rb.al;
                    ctx.drawImage(tx.base, 0, sy, TW * kk, th * kk, 0, -e * th * kk, TW * kk, th * kk * (1 + 2 * e));
                    const gl = (rb.G[k] + rb.G[k + 1]) / 2;
                    if (gl > 0.03) {
                        ctx.globalAlpha = (gl > 1 ? 1 : gl) * rb.al;
                        ctx.drawImage(tx.sheen, 0, sy, TW * kk, th * kk, 0, -e * th * kk, TW * kk, th * kk * (1 + 2 * e));
                    }
                    ctx.globalAlpha = 1;
                }
            }
            ctx.setTransform(q, 0, 0, q, 0, 0);
        };

        /** versiunea 1: pelicula prinsă de rolă (sare din ea, apoi e trasă înapoi) */
        const drawFilm = (t: number, reel: Reel, light: number) => {
            const sc = reel.S / bigScale();                // pelicula se micșorează odată cu rola
            const tm = (t - T.spill) / 1000;
            const swirl = (reel.ang / 360) * 0.32;         // pelicula e aruncată în vârtej, după rolă
            for (const rb of ribs) {
                const g = growth(rb, t);
                rb.ws = sc;
                rb.L = g < 0.012 ? 0 : shape(rb, g, tm, sc, swirl);
            }
            renderFilm(reel.x, reel.y, reel, light, sc);
        };


        /* ══════════════ VERSIUNEA 2 (/?intro=vizor2) ══════════════ */

        /** cât de strâns ajungem: geamul (fără marginile lui moi) acoperă tot ecranul */
        const tightScale = () => Math.max(startScale() * 1.03, endScale() * 1.5);

        /** 1. apropierea: de la încadratura din poză până în imagine */
        const drawPush = (t: number) => {
            const S1 = endScale(), St = tightScale();
            const x = clamp01(t / TT.slip);
            // pornește încet (se vede încadratura din poză), apoi tot mai repede: intrăm în imagine
            // versiunea 4: în mișcare din primul cadru (pornește cu peste jumătate din viteza medie)
            const e = V4 ? 0.55 * x + 0.45 * x * x * x : 0.2 * x + 0.8 * x * x * x;
            const s = S1 * Math.pow(St / S1, e);
            const fx = lerp(C.w / 2, winCx, e), fy = lerp(C.h / 2, winCy, e);
            const tick = Math.floor(t / (1000 / 24));
            const wob = 0.35 + 1.9 * x * x * x;
            // versiunea 4: fără tremurul sărit de la cadru la cadru — o legănare lină
            const jx = V4 ? 0.4 * wob * (Math.sin(t * 0.0113 + 0.6) + 0.5 * Math.sin(t * 0.0271)) : (hash(tick * 3 + 1) - 0.5) * wob;
            const jy = V4 ? 0.4 * wob * (Math.sin(t * 0.0091 + 2.1) + 0.5 * Math.sin(t * 0.0233 + 1)) : (hash(tick * 3 + 2) - 0.5) * wob * 1.6;
            const ox = vw / 2 - fx * s + jx, oy = vh / 2 - fy * s + jy;
            // semnele vizorului se sting pe măsură ce intrăm în imagine
            const m = 1 - clamp01((x - 0.5) / 0.38);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, vw, vh);
            comp(s, ox, oy, m * m * (3 - 2 * m));
            // neclaritatea de mișcare: aceeași imagine, puțin mai mică (de unde venim)
            const blur = Math.min(1, (V4 ? 0.8 + 1.9 * x * x : 0.2 + 2.4 * x * x) * Math.log(St / S1) * 0.42);
            if (blur > 0.04) {
                for (let k = 1; k <= 3; k++) {
                    const s2 = s * (1 - 0.012 * k * blur * 2.2);
                    ctx.globalAlpha = 0.3;
                    comp(s2, vw / 2 - fx * s2 + jx, vh / 2 - fy * s2 + jy, 0);
                }
                ctx.globalAlpha = 1;
            }
            grainOver(ox + C.sx * s, oy + C.sy * s, C.sw * s, C.sh * s, tick, 0.38);
            const dim = V4 ? 0.025 * hash(tick + 500) : 0.05 * hash(tick + 500) + 0.1 * x * x * hash(tick + 900);
            ctx.fillStyle = `rgba(0, 0, 0, ${dim.toFixed(3)})`;
            ctx.fillRect(0, 0, vw, vh);
        };

        /** 2. ruperea, pe direcția peliculei de pe pagină (verticală; orizontală pe ecranele
            mici): cadrul o ia din loc în lungul peliculei, apoi pelicula se rupe de-a
            curmezișul și capetele fug în lungul ei. În spate: pagina (albul cu grain). */
        const drawBreak2 = (t: number) => {
            const horiz = filmHoriz();
            const all = clamp01((t - TT.slip) / (TT.clear - TT.slip));
            // versiunea 4: apropierea nu se oprește la rupere — continuă cu viteza cu care a ajuns și se stinge lin
            const zoomV = (Math.log(tightScale() / endScale()) * 1.9) / TT.slip;
            const s = V4 ? tightScale() * Math.exp(zoomV * 120 * (1 - Math.exp(-(t - TT.slip) / 120))) : tightScale() * (1 + 0.035 * all);
            const ox = vw / 2 - winCx * s, oy = vh / 2 - winCy * s;
            const X = ox + C.sx * s, Y = oy + C.sy * s, W = C.sw * s, H = C.sh * s;
            const pitch = horiz ? W : H;                 // un cadru, în lungul peliculei
            const tick = Math.floor(t / (1000 / 48));
            const src = sceneSrc();
            const rollAt = (k: number) => (V4 ? 1.15 * k * k * k : 0.035 * Math.sin(k * 26) * k + 1.25 * k * k * k) * pitch;
            /** imaginea, fugită cu „off” în lungul peliculei, cu cadrul vecin lipit de ea */
            const film = (off: number, jit: number) => {
                if (!src) return;
                const o = ((off % pitch) + pitch) % pitch;
                for (const d of [o - pitch, o]) {
                    if (horiz) ctx.drawImage(src, X + d, Y + jit, W, H);
                    else ctx.drawImage(src, X + jit, Y + d, W, H);
                }
            };

            if (t < TT.tear) {
                // 2a. pelicula o ia din loc: cadrul fuge tot mai repede; linia neagră dintre cadre trece prin ecran
                const k = clamp01((t - TT.slip) / (TT.tear - TT.slip));
                const jit = V4 ? 0 : (hash(tick + 3) - 0.5) * 14 * k;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, vw, vh);
                for (let m = 0; m < 3; m++) {
                    ctx.globalAlpha = m === 0 ? 1 : 0.34;
                    film(rollAt(k) - m * 0.03 * k * pitch, jit);
                }
                ctx.globalAlpha = 1;
                grainOver(0, 0, vw, vh, tick, 0.38);
                const fl = V4 ? 0.4 : hash(tick + 40);       // versiunea 4: fără pâlpâit (lumina vine din drawFlash4)
                if (fl > 0.62) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = `rgba(255, 236, 200, ${(0.2 * k * (fl - 0.62) * 2.6).toFixed(3)})`;
                    ctx.fillRect(0, 0, vw, vh);
                    ctx.restore();
                } else if (fl < 0.2) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${(0.28 * k).toFixed(3)})`;
                    ctx.fillRect(0, 0, vw, vh);
                }
                return;
            }

            // 2b. ruptura: de-a curmezișul peliculei, în zigzag; capetele fug în lungul ei
            const k = clamp01((t - TT.tear) / (TT.clear - TT.tear));
            const span = horiz ? vw : vh, wide = horiz ? vh : vw;
            const fly = (0.1 * k + 1.2 * k * k) * span;
            const N = 14;
            const zig: number[] = [];
            for (let i = 0; i <= N; i++) {
                zig.push(span * 0.5 + (i % 2 ? 1 : -1) * span * 0.02 * (0.5 + hash(i + 21)) + span * 0.028 * Math.sin(i * 0.9 + 0.4));
            }
            for (const side of [-1, 1]) {
                ctx.save();
                ctx.translate(vw / 2, vh / 2);
                ctx.rotate(side * 0.03 * k * (horiz ? -1 : 1));
                ctx.translate(-vw / 2, -vh / 2);
                if (horiz) ctx.translate(side * fly, 0); else ctx.translate(0, side * fly);
                const far = side < 0 ? -span : 2 * span;        // marginea îndepărtată a bucății
                ctx.beginPath();
                if (horiz) {
                    ctx.moveTo(far, -0.3 * wide);
                    for (let i = 0; i <= N; i++) ctx.lineTo(zig[i], -0.2 * wide + (1.4 * wide * i) / N);
                    ctx.lineTo(far, 1.3 * wide);
                } else {
                    ctx.moveTo(-0.3 * wide, far);
                    for (let i = 0; i <= N; i++) ctx.lineTo(-0.2 * wide + (1.4 * wide * i) / N, zig[i]);
                    ctx.lineTo(1.3 * wide, far);
                }
                ctx.closePath();
                ctx.save();
                ctx.clip();
                ctx.fillStyle = '#0b0a09';
                ctx.fillRect(-vw, -vh, 3 * vw, 3 * vh);
                film(rollAt(1) + side * 0.02 * k * pitch, 0);
                ctx.restore();
                // muchia ruptă prinde lumină
                ctx.beginPath();
                for (let i = 0; i <= N; i++) {
                    const along = -0.2 * wide + (1.4 * wide * i) / N;
                    if (horiz) { if (i) ctx.lineTo(zig[i], along); else ctx.moveTo(zig[i], along); }
                    else if (i) ctx.lineTo(along, zig[i]); else ctx.moveTo(along, zig[i]);
                }
                ctx.strokeStyle = 'rgba(255, 248, 232, 0.55)';
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.restore();
            }
        };

        /** 4. rola: intră din dreapta, traversează ecranul și urcă la logo */
        const reelPath = (p: number): Pt => {
            const rb = 17 * bigScale();
            const P0: Pt = [vw + 1.25 * rb, 0.6 * vh], P1: Pt = [0.68 * vw, 0.76 * vh], P2: Pt = [0.3 * vw, 0.6 * vh];
            const m = 1 - p, a = m * m * m, b = 3 * m * m * p, c = 3 * m * p * p, d = p * p * p;
            return [a * P0[0] + b * P1[0] + c * P2[0] + d * logoC[0], a * P0[1] + b * P1[1] + c * P2[1] + d * logoC[1]];
        };
        const reelAt2 = (t: number): Reel => {
            const x = clamp01((t - TT.reelIn) / (TM.dock - TT.reelIn));
            if (V4) {
                // intră cu viteză și se așază lin lângă logo; mare până aproape de jumătatea drumului, apoi se micșorează
                const [qx, qy] = reelPath(0.3 * x * (2 - x) + 0.7 * x * x * (3 - 2 * x));
                const sh = clamp01((x - 0.42) / 0.58);
                const kk = 1 - sh * sh * (3 - 2 * sh);
                return { x: qx, y: qy, S: logoS + (bigScale() - logoS) * kk, ang: spin4(t), wound: 6.2, k: kk };
            }
            const [px, py] = reelPath(0.3 * x + 0.7 * easeIO(x));
            const k = 1 - easeIO(clamp01((x - 0.52) / 0.48));       // mare până la jumătatea drumului, apoi se micșorează
            // cinci ture, tot mai încet; se oprește cum stă rola de lângă logo
            return { x: px, y: py, S: logoS + (bigScale() - logoS) * k, ang: 1800 * (1 - Math.pow(1 - x, 1.7)), wound: 6.2, k };
        };
        /** când prinde rola fiecare fâșie: puțin înainte să treacă pe lângă ea */
        const planCapture = () => {
            for (const rb of ribs) {
                let best = Infinity, at = TT.reelIn;
                for (let i = 0; i <= 50; i++) {
                    const tt = TT.reelIn + ((TM.dock - TT.reelIn) * i) / 50;
                    const r = reelAt2(tt);
                    const d = (r.x - vw / 2 - rb.cx) ** 2 + (r.y - vh / 2 - rb.cy) ** 2;
                    if (d < best) { best = d; at = tt; }
                }
                rb.tc = V4 ? Math.min(TM.dock - rb.td - 110, Math.max(TT.reelIn + 40, at - 230))
                    : Math.min(TM.dock - rb.td - 190, Math.max(TT.reelIn + 60, at - 170));
            }
        };

        /** pelicula încâlcită la momentul t (rola, dacă e, o absoarbe fâșie cu fâșie); întoarce cât a înghițit rola */
        const poseTangle = (t: number, reel: Reel | null, horiz: boolean): number => {
            const SB = bigScale();
            let eaten = 0;
            for (const rb of ribs) {
                rb.L = 0;
                rb.al = 1;
                if (t <= rb.t0) continue;
                const x = (t - rb.t0) / rb.dur;
                // versiunea 4: intră repede și se așază lin, fără să treacă de locul ei
                const g = x >= 1 ? 1 : V4 ? 1 - (1 - x) ** 4 : springOut(x);
                let a = 0, c = 0;
                if (t >= TT.reelIn && t > rb.tc) {
                    if (V4) {
                        a = ease5((t - rb.tc) / 240);
                        const cc = clamp01((t - rb.tc - 70) / rb.td);
                        c = cc * cc * (3 - 2 * cc);
                    } else {
                        a = easeIO((t - rb.tc) / 120);
                        c = Math.pow(clamp01((t - rb.tc - 50) / rb.td), 1.7);
                    }
                }
                eaten += c;
                if (c >= 0.995 || (!reel && a > 0)) continue;
                rb.ws = reel ? lerp(1, Math.max(0.3, reel.S / SB), a) : 1;
                rb.L = shapeFree(rb, t, g, c, a, reel ? reel.x - vw / 2 : 0, reel ? reel.y - vh / 2 : 0, horiz);
                if (V4) {
                    // cât de repede se mișcă: la intrare și cât e trasă în rolă
                    const mv = Math.max(x < 1 ? (1 - x) ** 2 : 0, a > 0 ? 0.25 * a + 0.75 * Math.sin(Math.PI * c) : 0);
                    rb.al = 1 - 0.5 * clamp01(mv);
                }
            }
            return eaten;
        };

        /** 3 + 4. pelicula încâlcită; când vine rola, o absoarbe fâșie cu fâșie */
        const drawTangle = (t: number) => {
            if (!planned) { measureLogo(); planCapture(); planned = true; }
            const horiz = filmHoriz();
            const live = (tt: number) => (tt >= TT.reelIn && tt < TM.dock ? reelAt2(tt) : null);
            if (V4) {
                // neclaritatea de mișcare: fâșiile care se mișcă repede se desenează și cum erau cu
                // 12 și cu 6 ms mai devreme, pe jumătate transparente (ca un obturator deschis)
                for (const back of [12, 6]) {
                    poseTangle(t - back, live(t - back), horiz);
                    let moving = false;
                    for (const rb of ribs) { if (rb.al > 0.97) rb.L = 0; else if (rb.L > 0) moving = true; }
                    if (moving) renderFilm(vw / 2, vh / 2, null, 1, 1, true);
                }
            }
            const reel = live(t);
            const eaten = poseTangle(t, reel, horiz);
            if (reel) reel.wound = lerp(6.2, V4 ? WOUND_DOCK : WOUND_FULL, easeIO(eaten / ribs.length));
            renderFilm(vw / 2, vh / 2, reel, 1, 1);
        };

        /** versiunea 4 — lumina: răzbate prin peliculă (din mijloc și pe linia unde se va rupe);
            la rupere o lamă de lumină se deschide din linia rupturii și umple ecranul; apoi albul
            se retrage și rămâne, o clipă, raza de pe linia rupturii */
        const drawFlash4 = (t: number) => {
            if (t < TT.slip || t >= FLASH4.ray) return;
            const horiz = filmHoriz();
            const span = horiz ? vw : vh, cx = vw / 2, cy = vh / 2, dg = Math.hypot(vw, vh) / 2;
            const white = (a: number) => `rgba(255, 253, 247, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
            const blade = (half: number, a: number) => {
                if (a <= 0.003 || half <= 0.5) return;
                const gr = horiz ? ctx.createLinearGradient(cx - half, 0, cx + half, 0) : ctx.createLinearGradient(0, cy - half, 0, cy + half);
                gr.addColorStop(0, white(0));
                gr.addColorStop(0.28, white(0.5 * a));
                gr.addColorStop(0.5, white(a));
                gr.addColorStop(0.72, white(0.5 * a));
                gr.addColorStop(1, white(0));
                ctx.fillStyle = gr;
                if (horiz) ctx.fillRect(cx - half, 0, 2 * half, vh); else ctx.fillRect(0, cy - half, vw, 2 * half);
            };
            const core = (R: number, a: number) => {
                if (a <= 0.003) return;
                const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
                gr.addColorStop(0, white(a));
                gr.addColorStop(0.45, white(0.5 * a));
                gr.addColorStop(1, white(0));
                ctx.fillStyle = gr;
                ctx.fillRect(0, 0, vw, vh);
            };
            const all = (a: number) => { ctx.fillStyle = white(a); ctx.fillRect(0, 0, vw, vh); };
            if (t < TT.tear) {
                const k = (t - TT.slip) / (TT.tear - TT.slip);
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                core((0.25 + 0.9 * k) * dg, Math.pow(k, 1.5));
                blade((0.03 + 0.12 * k * k) * span, k * k);
                ctx.restore();
                return;
            }
            const u = t - TT.tear;
            if (u < FLASH4.rise) {
                const o = ease5(u / FLASH4.rise);
                all(0.5 + 0.5 * o);
                blade((0.15 + 1.2 * o) * span, 1);
                return;
            }
            if (t < FLASH4.hold) { all(1); return; }
            all(1 - ease5((t - FLASH4.hold) / (FLASH4.out - FLASH4.hold)));
            const r = 1 - ease5((t - FLASH4.hold) / (FLASH4.ray - FLASH4.hold));
            blade((0.04 + 0.5 * r * r) * span, r);
            core((0.1 + 0.5 * r) * dg, 0.8 * r);
        };

        /** versiunea 4 — pelicula de peste logo (LogoReel), pe ceasul intro-ului: apare odată
            cu pagina, iar când rola ajunge lângă logo o strânge și pe ea; rămâne logo-ul scris */
        let logoPhase = 0;
        const logoStep = (t: number) => {
            const ph = t < TM.logo ? 0 : t < TM.dock ? 1 : t < TM.dock + GATHER ? 2 : 3;
            if (ph === 2) logoBridge.gather?.((t - TM.dock) / GATHER, spin4(t));
            else if (ph !== logoPhase) { if (ph === 1) logoBridge.lay?.(); else logoBridge.rest?.(); }
            logoPhase = ph;
        };

        /** versiunea 3 — lampa din spatele peliculei. Cât pelicula o ia din loc, lumina
            răzbate prin ea (din mijloc, tot mai tare); la rupere umple ecranul și orbește;
            apoi scade până la albul paginii, iar fâșiile care intră se văd prin ea. */
        const drawFlash = (t: number) => {
            if (V4) { drawFlash4(t); return; }
            if (t < TT.slip || t >= FLASH.out) return;
            if (t < TT.tear) {
                const k = (t - TT.slip) / (TT.tear - TT.slip);
                const tick = Math.floor(t / (1000 / 48));
                const a = k * k * (0.72 + 0.28 * hash(tick + 61));
                const R = (0.2 + 0.85 * k) * Math.hypot(vw, vh) * 0.5;
                const gr = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, R);
                gr.addColorStop(0, `rgba(255, 250, 236, ${a.toFixed(3)})`);
                gr.addColorStop(0.45, `rgba(255, 240, 210, ${(0.55 * a).toFixed(3)})`);
                gr.addColorStop(1, 'rgba(255, 232, 190, 0)');
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = gr;
                ctx.fillRect(0, 0, vw, vh);
                ctx.restore();
                return;
            }
            let a = 1;
            if (t < TT.tear + FLASH.rise) a = lerp(0.6, 1, (t - TT.tear) / FLASH.rise);
            else if (t > FLASH.hold) { const x = 1 - (t - FLASH.hold) / (FLASH.out - FLASH.hold); a = x * x * (3 - 2 * x); }
            ctx.fillStyle = `rgba(255, 254, 250, ${a.toFixed(3)})`;
            ctx.fillRect(0, 0, vw, vh);
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
            if (V2) {
                if (t < TT.slip) drawPush(t);
                else if (t < TT.clear) drawBreak2(t);
                if (t >= TT.fly && t < TM.dock) drawTangle(t);
                if (V3) drawFlash(t);
            } else if (t < T.brk) {
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
            if (!V2 && t >= T.spill && t < TM.end) {
                if (t >= T.dark) {
                    if (stage < 1) measureLogo();
                    const reel = reelAt(t);
                    const light = 1 - veilAt(t);
                    if (t < TM.dock) {
                        drawFilm(t, reel, light);
                    }
                }
            }
            // pagina
            if (stage < 1 && t >= (V2 ? TT.tear : T.dark)) { stage = 1; html.setAttribute(VZ.state, 'film'); }
            if (stage < 2 && t >= TM.strip) { stage = 2; html.setAttribute(VZ.strip, ''); }
            if (stage < 3 && t >= TM.logo) { stage = 3; html.setAttribute(VZ.logo, ''); }
            if (stage < 4 && t >= TM.dock) { stage = 4; html.setAttribute(VZ.reel, ''); }
            if (stage < 5 && t >= TM.text) { stage = 5; html.removeAttribute(VZ.ui); html.setAttribute(VZ.state, 'out'); }
            if (stage < 6 && t >= TM.lamp) { stage = 6; html.setAttribute(VZ.lamp, ''); }
            if (V4) logoStep(t);
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
            if (V4 && (logoPhase === 1 || logoPhase === 2)) logoBridge.rest?.();
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
                    video.playbackRate = speed * VR;
                    video.play().catch(() => { /* fără redare automată: rămâne imaginea fixă */ });
                }
            }
            const t = hold !== null ? hold : (now - t0) * speed;
            const vEnd = V2 ? TT.clear : T.dark;           // până când se vede imaginea din clip
            if (hold !== null && video.readyState >= 1 && Math.abs(video.currentTime - (Math.min(hold, vEnd) * VR) / 1000) > 0.03) {
                try { video.currentTime = (Math.min(hold, vEnd) * VR) / 1000 + 0.001; } catch { /* încă nu se poate căuta */ }
            }
            if (hold === null && t >= vEnd && !video.paused) video.pause();
            const p0 = performance.now();
            paint(t);
            const dt = performance.now() - p0;
            stats.frames++;
            stats.ms += dt;
            if (dt > stats.worst) stats.worst = dt;
            stats.last = t;
            if (hold === null && t >= TM.end) { finish(); return; }
            raf = nextFrame(frame);
        };
        const start = () => {
            if (started || over) return;
            started = true;
            window.clearTimeout(waitTimer);
            films = makeFilms();
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
            const imgs = rama.complete && poster.complete && filmImgs.every((im) => im.complete);
            if (imgs && (video.readyState >= 3 || !poster.naturalWidth)) start();
        };
        rama.onload = ready;
        poster.onload = ready;
        rama.onerror = ready;
        for (const im of filmImgs) { im.onload = ready; im.onerror = ready; }
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
                T: TM,
                stats,
                reel: (ms: number) => { measureLogo(); return V2 ? reelAt2(ms) : reelAt(ms); },
                draw: (ms: number) => { hold = ms; if (!films.length) films = makeFilms(); measureLogo(); paint(ms); },
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
