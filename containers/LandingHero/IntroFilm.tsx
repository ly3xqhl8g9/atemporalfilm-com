'use client';

import { useEffect, useRef } from 'react';

import styles from './landing.module.css';
import { VZ, clearVizor, logoBridge } from './intro';
import { BAND_TILE, exposureFilter, filmK } from './filmStrip';
import { WOUND_DOCK, WOUND_FULL } from './LogoReel';
import {
    type Camera, type FilmTex, type Path, type ReelDraw, type RibbonDraw, type Scene, type V3,
    PACK_W, add, bezierPath, createFilmGL, cross, dot, len, mul, norm, slerp, sub,
} from './filmGL';


/* ============================================================
   INTRO „VIZOR”, VERSIUNEA 7 — /?intro=vizor7 (18.11.2026)

   Cererea lui Ștefan, după versiunea 6: fără apropierea pe cadrul din vizor —
   „ceva mult mai simplu”: ecranul se deschide dintr-o dată, pelicula intră de
   jos (pe ABOUT una de sus și una de jos), iar rola o absoarbe, trăgând-o prin
   partea de sus, împreună cu pelicula de pe logo. Pelicula „extrem de
   realistă”, „nu ceva desenat”; mișcarea „mult mai naturală”.

   Ce se vede:
   1. ecranul se aprinde dintr-o dată (trei cadre de pâlpâit de proiector);
   2. sus în stânga, departe, o rolă de metal, întoarsă pe trei sferturi;
      din ea coboară spre noi pelicula — exact continuarea benzii din
      pagină, cu aceleași cadre, perforații și pista sonoră;
   3. rola trage: banda din pagină urcă de jos la locul ei; pelicula de
      deasupra ei se răsucește puțin spre rolă, se curbează spre fundal și se
      înfășoară pe rolă; rola se învârte cât film trage;
   4. când banda e aproape la loc, se desprinde de ce e deasupra ei (o
      lipitură, ca la pelicula adevărată); rola trage restul, tot mai repede,
      prin partea de sus a ecranului, până intră tot în ea;
   5. apoi rola, învârtindu-se tot mai încet, se îndepărtează — tot mai mică,
      se întoarce cu fața la noi — până lângă logo; acolo strânge și pelicula
      de pe logo (rămâne „Atemporal Film” scris) și se oprește exact cum stă
      iconița de lângă logo, care o înlocuiește în același cadru.

   Rola e „adevărată” ca mărime: pelicula de 289 px trebuie să încapă între
   flanșele ei, deci e o rolă mare (raza ~720 px), departe. Așa se îndepărtează
   și se micșorează firesc (perspectiva), fără să micșorăm pelicula pe drum.
   Și pelicula se poartă ca una adevărată: se îndoaie doar peste lățime și se
   răsucește unde drumul e drept (filmGL.ts › bezierPath).

   Desenul e în filmGL.ts (WebGL); aici e mișcarea și legătura cu pagina.
   Verificare: /?intro=vizor7&t=1.25 (stă pe secunda 1,25), &v=0.25 (mai încet),
   &ceas=timer + window.__vz (din consolă).
   ============================================================ */

export const V7_RE = /[?&]intro=vizor7(?:&|$)/;

/** momentele, în ms */
const T7 = {
    s0:      40,     // banda pornește (încă sub ecran)
    s1:      1640,   // banda e la locul ei
    cutPx:   10,     // câți px mai are banda până la loc când se desprinde pelicula de ea
    tail:    460,    // cât trage rola restul peliculei, după desprindere (tot mai repede)
    logo:    420,    // logo-ul, cu pelicula lui
    fly0:    1760,   // rola pornește spre logo (coada e aproape toată în ea)
    dock:    2300,   // rola ajunge lângă logo (cu fața la noi, cât iconița)
    gather0: 2190,   // rola strânge pelicula de pe logo…
    gather:  560,    // …în atât
    spinEnd: 2780,   // rola se oprește; iconița o înlocuiește
    text:    2330,
    lamp:    2450,
    end:     3050,
};
/** deschiderea ecranului: negrul, cadru cu cadru (24 fps) — lampa proiectorului se aprinde dintr-o dată */
const OPEN0 = 50;
const OPEN_STEPS = [0.6, 0.18, 0.05];
const OPEN_END = OPEN0 + OPEN_STEPS.length * (1000 / 24);

const PACK0 = 7.4;       // cât film e pe rolă la început (unități de rolă; iconița: 4,6 … 14)
const SHUTTER = 1000 / 48;   // obturatorul unei camere de film (24 fps, 180°): cât se estompează rola când se învârte
const N_TEX = 4;         // câte cadre are textura peliculei (se repetă mai departe)
const ALPHA = 0.88;      // ca galeria din pagină (masca ei, în afara ramei) — copt în textură
const SEAM = 1;          // pelicula intră 1 px peste capătul benzii: o lipitură
/** rola, la început: întoarsă pe trei sferturi — fața spre noi și puțin spre stânga-sus,
    ca pelicula să vină spre ea din dreapta-jos (dinspre bandă) chiar în planul ei */
const AXIS0: V3 = norm([-0.6, -0.2, 0.77]);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
const ease5 = (v: number) => { const x = clamp01(v); return x * x * x * (x * (6 * x - 15) + 10); };
/** banda: pornește repede și se așază lung (viteza cea mai mare la o treime din drum) */
const pStrip = (u: number) => { const x = clamp01(u); return 1 - (1 - x) ** 3 * (1 + 3 * x); };


/* ── PELICULA DIN PAGINĂ, CA TEXTURĂ ──
   Cadrele de deasupra capătului benzii, desenate la fel ca în pagină: negrul
   peliculei, perforația (aceleași imagini), afișul subexpus (același filtru),
   pista sonoră întunecată. Și transparența ca în pagină: acolo galeria și pista
   sonoră sunt două straturi, fiecare cu masca de 0,88 — deci pista e mai
   opacă decât restul; la fel aici. Pe orizontală (telefon) textura e întoarsă:
   u = de-a latul peliculei (0 = marginea de jos), v = în lungul ei. */
type StripTex = { canvas: HTMLCanvasElement; w: number; h: number; vOf: (c: number) => number };

const urlOf = (bg: string): string | null => {
    const m = /url\(["']?([^"')]+)["']?\)/.exec(bg || '');
    return m ? m[1] : null;
};
const loadImg = (src: string | null): Promise<HTMLImageElement | null> => new Promise((res) => {
    if (!src) { res(null); return; }
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).then(() => res(im), () => res(im)); };
    im.onerror = () => res(null);
    im.src = src;
});
const pot = (x: number) => 2 ** Math.round(Math.log2(Math.max(1, x)));

/** afișul ca în pagină: „object-fit: cover”, apoi filtrul din afara ramei (filmStrip.ts › exposureFilter(0)) */
function exposedPoster(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement | null {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g || !img.naturalWidth) return null;
    const ir = img.naturalWidth / img.naturalHeight, tr = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (ir > tr) { sw = sh * tr; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / tr; sy = (img.naturalHeight - sh) / 2; }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    // grayscale(1) contrast(1.15) brightness(0.15) — scris de mână, ca în orice browser
    const f = /contrast\(([\d.]+)\).*brightness\(([\d.]+)\)/.exec(exposureFilter(0));
    const con = f ? parseFloat(f[1]) : 1.15, bri = f ? parseFloat(f[2]) : 0.15;
    try {
        const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
        for (let i = 0; i < a.length; i += 4) {
            const y = (0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2]) / 255;
            const v = Math.max(0, Math.min(1, ((y - 0.5) * con + 0.5) * bri)) * 255;
            a[i] = v; a[i + 1] = v; a[i + 2] = v;
        }
        g.putImageData(d, 0, 0);
    } catch { /* imagine de pe alt domeniu: rămâne nefiltrată (nu e cazul aici) */ }
    return c;
}

async function stripTexture(gal: HTMLElement, band: HTMLElement | null, horiz: boolean, dpr: number, maxTex: number): Promise<StripTex | null> {
    const slots = Array.from(gal.children).filter((el) => el.classList.contains(styles.slot)) as HTMLElement[];
    if (slots.length < N_TEX + 1) return null;
    const k = filmK(gal);
    const pitch = horiz ? slots[0].offsetWidth : slots[0].offsetHeight;
    const across = horiz ? gal.clientHeight : gal.clientWidth;
    const pad = horiz ? slots[0].offsetLeft : slots[0].offsetTop;
    const S = horiz ? gal.scrollLeft : gal.scrollTop;
    if (!(pitch > 0 && across > 0)) return null;
    const kS = Math.floor((S - pad) / pitch);
    const k0 = kS - (N_TEX - 1);
    const at = (i: number) => slots[((i % slots.length) + slots.length) % slots.length];

    // geometria cadrului, măsurată (afișul, cu deplasarea lui) sau din CSS
    const s0 = at(k0), r0 = s0.getBoundingClientRect();
    const img0 = s0.querySelector('img');
    const ir = img0 ? img0.getBoundingClientRect() : null;
    const imgW = ir && ir.width > 0 ? ir.width : 210 * k;
    const imgH = ir && ir.height > 0 ? ir.height : 315 * k;
    const imgX = ir && ir.width > 0 ? ir.left - r0.left : horiz ? (pitch - imgW) / 2 : (across - imgW) / 2 + 13.5 * k;
    const imgY = ir && ir.height > 0 ? ir.top - r0.top : horiz ? 26 * k : (pitch - imgH) / 2;
    const bandW = 27 * k;
    const perf = horiz ? (across - imgH - bandW) / 2 : (across - imgW - bandW) / 2;

    // imaginile: aceleași ca în CSS (perforația din pseudo-elementele cadrului, pista din bandă)
    const pick = (el: Element, pseudo: string) => urlOf(getComputedStyle(el, pseudo).backgroundImage);
    const [perfA, perfB, sound, ...posters] = await Promise.all([
        loadImg(pick(s0, '::before')),
        loadImg(pick(s0, '::after')),
        loadImg(band ? urlOf(getComputedStyle(band).backgroundImage) : null),
        ...Array.from({ length: N_TEX }, (_, j) => {
            const im = at(k0 + j).querySelector('img');
            return loadImg(im ? im.currentSrc || im.getAttribute('src') : null);
        }),
    ]);

    const W = Math.min(1024, Math.max(256, pot(across * dpr * 1.1)));
    const H = Math.min(maxTex, 4096, Math.max(512, pot((N_TEX * pitch * W) / across)));
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const canvas = mk(), filmC = mk(), soundC = mk();
    const g = filmC.getContext('2d'), gs = soundC.getContext('2d'), gf = canvas.getContext('2d');
    if (!g || !gs || !gf) return null;
    const sx = W / across, sy = H / (N_TEX * pitch);
    g.imageSmoothingQuality = 'high';
    gs.imageSmoothingQuality = 'high';

    // faza pistei sonore (banda e mutată de pagină după derularea galeriei)
    let shift = 0;
    if (band) {
        try {
            const m = new DOMMatrixReadOnly(getComputedStyle(band).transform === 'none' ? undefined : getComputedStyle(band).transform);
            shift = horiz ? m.m41 : m.m42;
        } catch { shift = 0; }
    }
    const tile = BAND_TILE * k;

    for (let j = 0; j < N_TEX; j++) {
        const ks = k0 + j;
        const c0 = pad + ks * pitch;             // coordonata (în conținutul galeriei) de unde începe cadrul
        // în coordonatele cadrului: x de-a latul / în lungul, după axă (vezi transformarea)
        for (const c of [g, gs]) {
            if (horiz) c.setTransform(0, sy, -sx, 0, across * sx, j * pitch * sy);
            else c.setTransform(sx, 0, 0, sy, 0, j * pitch * sy);
        }
        // negrul peliculei, între perforații
        g.fillStyle = '#0e0e0e';
        if (horiz) g.fillRect(-0.5, perf, pitch + 1, across - 2 * perf);
        else g.fillRect(perf, -0.5, across - 2 * perf, pitch + 1);
        // afișul, subexpus
        const pi = posters[j];
        if (pi) {
            const pc = exposedPoster(pi, imgW * 2, imgH * 2);
            if (pc) g.drawImage(pc, imgX, imgY, imgW, imgH);
        }
        // pista sonoră (stratul ei): imaginea pistei, întunecată ca în afara ramei
        if (sound && sound.naturalWidth) {
            const nat = horiz ? sound.naturalWidth : sound.naturalHeight;
            const ratio = nat / tile;
            let t0 = (((c0 - S - shift) % tile) + tile) % tile;
            let y = 0;
            const bx = horiz ? perf + imgH : perf;
            while (y < pitch - 0.01) {
                const run = Math.min(pitch - y, tile - t0);
                if (horiz) gs.drawImage(sound, t0 * ratio, 0, run * ratio, sound.naturalHeight, y, bx, run, bandW);
                else gs.drawImage(sound, 0, t0 * ratio, sound.naturalWidth, run * ratio, bx, y, bandW, run);
                y += run;
                t0 = 0;
            }
            gs.fillStyle = 'rgba(0, 0, 0, 0.6)';
            if (horiz) gs.fillRect(-0.5, bx, pitch + 1, bandW);
            else gs.fillRect(bx, -0.5, bandW, pitch + 1);
        }
        // perforația, de o parte și de alta
        if (perfA) { if (horiz) g.drawImage(perfA, 0, 0, pitch, perf); else g.drawImage(perfA, 0, 0, perf, pitch); }
        if (perfB) { if (horiz) g.drawImage(perfB, 0, across - perf, pitch, perf); else g.drawImage(perfB, across - perf, 0, perf, pitch); }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    gs.setTransform(1, 0, 0, 1, 0, 0);
    // cele două straturi, fiecare cu transparența lui din pagină
    gf.globalAlpha = ALPHA;
    gf.drawImage(filmC, 0, 0);
    gf.drawImage(soundC, 0, 0);
    gf.globalAlpha = 1;
    const base = pad + k0 * pitch, span = N_TEX * pitch;
    return { canvas, w: W, h: H, vOf: (c: number) => (c - base) / span };
}


/* ── RODA DE PE PACHET: punctul în care pelicula atinge rola ── */
function packTangent(C: V3, a: V3, R: number, Q: V3, branch: number): { T: V3; t: V3; u: V3 } {
    const q = sub(Q, C);
    const qp = sub(q, mul(a, dot(q, a)));
    const d = Math.max(len(qp), R * 1.0001);
    const w = mul(qp, 1 / (len(qp) || 1));
    const cphi = R / d, sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
    const w2 = cross(a, w);
    const u = norm(add(mul(w, cphi), mul(w2, branch * sphi)));
    const T = add(C, mul(u, R));
    const t = norm(sub(T, add(C, qp)));
    return { T, t, u };
}


export default function IntroFilm() {
    const layerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!V7_RE.test(window.location.search)) return;
        const html = document.documentElement;
        if (!html.hasAttribute(VZ.state)) return;           // „mai puțină mișcare” sau altă pagină
        const layer = layerRef.current;
        if (!layer) { clearVizor(); return; }
        const canvas = document.createElement('canvas');
        canvas.className = styles.vzCanvas;
        layer.appendChild(canvas);
        const GL = createFilmGL(canvas);
        if (!GL) { canvas.remove(); clearVizor(); return; }   // fără WebGL: fără intro
        html.setAttribute(VZ.js, '');

        const q0 = new URLSearchParams(window.location.search);
        let hold: number | null = q0.has('t') ? Math.max(0, parseFloat(q0.get('t') || '0') * 1000) : null;
        const speed = q0.has('v') ? Math.min(4, Math.max(0.05, parseFloat(q0.get('v') || '1') || 1)) : 1;
        const byTimer = q0.get('ceas') === 'timer';
        const nextFrame = (cb: (now: number) => void): number =>
            byTimer ? window.setTimeout(() => cb(performance.now()), 16) : requestAnimationFrame(cb);
        const stopFrame = (id: number) => { if (byTimer) window.clearTimeout(id); else cancelAnimationFrame(id); };
        const stats = { frames: 0, ms: 0, worst: 0, last: 0 };
        const horiz = () => html.getAttribute('data-film') === 'h';
        // culoarea paginii (pătratul din butucul rolei e „gaură” prin care se vede pagina, ca la iconiță):
        // --bg din pagină; altfel, fundalul primului părinte care are unul (stratul intro-ului e
        // încă negru acum, body e negru, pagina e pe LandingHero)
        const bgC: V3 = (() => {
            const hex = /^#([0-9a-f]{6})$/i.exec(getComputedStyle(layer).getPropertyValue('--bg').trim());
            if (hex) {
                const n = parseInt(hex[1], 16);
                return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
            }
            for (let el: HTMLElement | null = layer.parentElement; el; el = el.parentElement) {
                const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(getComputedStyle(el).backgroundColor || '');
                if (m && (m[4] === undefined || parseFloat(m[4]) > 0.5)) return [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255];
            }
            return [0.945, 0.941, 0.929];
        })();

        /* ── ecranul ── */
        let vw = 1, vh = 1, q = 1;
        let cam: Camera = { vw: 1, vh: 1, D: 1000 };
        const size = () => {
            // stratul e fix, cât fereastra fără bara de derulare (unde există una): în aceleași
            // coordonate ca getBoundingClientRect al benzilor — altfel pelicula s-ar desena mai îngustă
            vw = layer.clientWidth || document.documentElement.clientWidth || window.innerWidth;
            vh = layer.clientHeight || document.documentElement.clientHeight || window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            // cel mult ~3,5 milioane de pixeli (cu antialiasing 4×), ca să meargă lin oriunde
            q = Math.max(1, Math.min(dpr, 2, Math.sqrt(3.5e6 / (vw * vh))));
            GL.resize(vw, vh, q);
            cam = { vw, vh, D: 1.15 * Math.hypot(vw / 2, vh / 2) };
        };
        size();

        /* ── benzile din pagină ── */
        type Strip = { gal: HTMLElement; band: HTMLElement | null; els: HTMLElement[]; x: number; y: number; w: number; h: number; dir: 1 | -1; set: string };
        let strips: Strip[] = [];
        const measureStrips = () => {
            const gs = Array.from(document.querySelectorAll<HTMLElement>('.' + styles.gallery));
            const ss = Array.from(document.querySelectorAll<HTMLElement>('.' + styles.soundtrack));
            strips = gs.map((gal, i) => {
                const els = ss[i] ? [gal, ss[i]] : [gal];
                for (const el of els) el.style.translate = '';
                const r = gal.getBoundingClientRect();
                const band = ss[i] ? ss[i].querySelector<HTMLElement>('.' + styles.soundtrackStrip) : null;
                return { gal, band, els, x: r.left, y: r.top, w: r.width, h: r.height, dir: i === 0 ? 1 : -1, set: '' };
            });
        };
        measureStrips();
        if (!strips.length) { canvas.remove(); GL.dispose(); clearVizor(); return; }
        const lead = strips[0];      // banda trasă de rolă (pe ABOUT: cea cu oamenii)

        const offAt = (t: number) => 1.04 * (horiz() ? vw : vh) * (1 - pStrip((t - T7.s0) / (T7.s1 - T7.s0)));
        const placeStrips = (t: number) => {
            const off = Math.round(offAt(t) * 10) / 10;
            for (const st of strips) {
                const d = st.dir * off;
                const v = horiz() ? `${d}px 0` : `0 ${d}px`;
                if (v === st.set) continue;
                st.set = v;
                for (const el of st.els) el.style.translate = v;
            }
            return off;
        };
        const freeStrips = () => { for (const st of strips) { st.set = ''; for (const el of st.els) el.style.translate = ''; } };
        // când se desprinde pelicula de bandă
        let tCut = T7.s1;
        {
            let lo = T7.s0, hi = T7.s1;
            for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (offAt(mid) > T7.cutPx) lo = mid; else hi = mid; }
            tCut = hi;
        }

        /* ── cât film a intrat în rolă ──
           banda trasă în sus + coada de după desprindere (tot mai repede: pornește lin
           și intră în rolă cu viteza cea mai mare, cum se întâmplă când se eliberează) */
        let Ltail = 3000;                       // lungimea peliculei de deasupra benzii, la desprindere (settle)
        const pTail = (x: number) => 1 - Math.cos((Math.PI / 2) * clamp01(x));
        const woundAt = (t: number) => offAt(T7.s0) - offAt(Math.min(t, tCut)) + (t > tCut ? pTail((t - tCut) / T7.tail) * Ltail : 0);
        const packAt = (t: number) => {
            const f = clamp01(woundAt(t) / (offAt(T7.s0) - offAt(tCut) + Ltail));
            let pack = Math.sqrt(PACK0 * PACK0 + (WOUND_DOCK * WOUND_DOCK - PACK0 * PACK0) * f);
            if (t >= T7.gather0) pack = Math.max(pack, WOUND_DOCK + (WOUND_FULL - WOUND_DOCK) * ease5((t - T7.gather0) / T7.gather));
            return pack;
        };
        /* rotația: unghiul crește cu filmul tras împărțit la raza peliculei înfășurate;
           după ce intră toată coada, rola se rotește din inerție tot mai încet și se
           oprește după un număr întreg de ture (exact cum stă iconița) — tabel din ms în ms */
        let spin = new Float32Array(0);
        const spinAt = (t: number) => {
            const n = spin.length;
            if (!n || t <= 0) return 0;
            if (t >= n - 1) return spin[n - 1];
            const i = Math.floor(t);
            return spin[i] + (spin[i + 1] - spin[i]) * (t - i);
        };
        const spinRate = (t: number) => (spinAt(t + 6) - spinAt(t - 6)) / 12;     // rad / ms

        /* ── logo-ul și rola de lângă el ── */
        let logoC: [number, number] = [190, 46], logoR = 16;
        const measureLogo = () => {
            const btn = document.querySelector<HTMLElement>('[data-logo-reel-btn]');
            if (!btn) return;
            const r = btn.getBoundingClientRect();
            if (r.width > 0) { logoC = [r.left + r.width / 2, r.top + r.height / 2]; logoR = (16 * r.width) / 34; }
        };
        measureLogo();

        /* ── rola: unde e, cât de mare, cum stă ── */
        const filmW = () => (horiz() ? lead.h : lead.w);
        const reelScale = () => filmW() / PACK_W;          // px adevărați pe unitate de rolă
        const startOf = () => {
            const h = horiz();
            const r0 = h ? Math.max(56, Math.min(0.2 * vw, 110)) : Math.max(80, Math.min(0.19 * vh, 0.12 * vw, 210));
            if (h) {
                // telefon: sub benzi, în stânga
                const bottom = Math.max(...strips.map((s) => s.y + s.h));
                return { S: [Math.max(r0 + 12, 0.3 * vw), Math.min(vh - r0 - 20, bottom + 0.42 * (vh - bottom))] as [number, number], r0 };
            }
            const left = Math.min(...strips.map((s) => s.x));
            const x = Math.max(r0 + 24, Math.min(left - r0 - 0.07 * vw, 0.42 * vw));
            return { S: [x, 0.35 * vh] as [number, number], r0 };
        };
        let START = startOf();
        /** drumul rolei pe ecran (0 → 1): puțin cât trage, apoi spre logo */
        const reelProg = (t: number) => 0.12 * smooth(t / 1700) + 0.88 * ease5((t - T7.fly0) / (T7.dock - T7.fly0));
        const reelAt = (t: number, spinSign: number) => {
            const p = reelProg(t);
            const [x0, y0] = START.S, [x1, y1] = logoC;
            const mx = 0.5 * (x0 + x1) + 0.12 * (y0 - y1), my = 0.5 * (y0 + y1) + 0.1 * (x0 - x1);
            const m = 1 - p;
            const S: [number, number] = [m * m * x0 + 2 * m * p * mx + p * p * x1, m * m * y0 + 2 * m * p * my + p * p * y1];
            // mărimea: aceeași cât trage, apoi se îndepărtează (micșorare „de perspectivă”)
            const e = ease5((t - T7.fly0) / (T7.dock - T7.fly0));
            const r = START.r0 * Math.pow(logoR / START.r0, e);
            const s = reelScale();
            const mg = r / (16 * s);
            const C: V3 = [vw / 2 + (S[0] - vw / 2) / mg, vh / 2 + (S[1] - vh / 2) / mg, cam.D - cam.D / mg];
            const A = slerp(AXIS0, [0, 0, 1], ease5((t - (T7.fly0 - 120)) / (T7.dock - T7.fly0 + 120)));
            // reperul flanșei: „în jos” pe fața rolei, apoi rotit cu rola
            const e2: V3 = norm(sub([0, 1, 0], mul(A, A[1])));
            const e1 = cross(e2, A);
            const th = spinSign * spinAt(t);
            const c = Math.cos(th), sn = Math.sin(th);
            const E1 = add(mul(e1, c), mul(e2, sn)), E2 = add(mul(e1, -sn), mul(e2, c));
            const shade = 1 - ease5((t - (T7.dock - 420)) / 420);
            const blur = Math.abs(spinRate(t)) * SHUTTER;
            // lângă logo se turtește odată cu culorile: iconița e plată (altfel i s-ar vedea marginea în perspectivă)
            const reel: ReelDraw = { C, A, E1, E2, s, pack: packAt(t), shade, blur, depth: shade };
            return { reel, th, r };
        };
        const buildSpin = () => {
            const s = reelScale();
            const nA = Math.max(2, Math.min(T7.spinEnd - 240, Math.floor(tCut + T7.tail)));
            const n = Math.ceil(T7.spinEnd) + 2;
            const tab = new Float32Array(n);
            let th = 0, w0 = woundAt(0);
            for (let ms = 1; ms <= nA; ms++) {
                const w = woundAt(ms);
                th += (w - w0) / (packAt(ms) * s);
                w0 = w;
                tab[ms] = th;
            }
            // oprirea: Hermite cubic de la viteza de acum la 0, într-un număr întreg de ture
            const dt = T7.spinEnd - nA;
            const m0 = (tab[nA] - tab[nA - 1]) * dt;
            const turn = 2 * Math.PI;
            let goal = Math.round((th + 0.5 * m0) / turn) * turn;
            while (goal - th < m0 / 3) goal += turn;          // fără să se întoarcă din drum
            const d = goal - th;
            for (let ms = nA + 1; ms < n; ms++) {
                const x = Math.min(1, (ms - nA) / dt);
                tab[ms] = th + (x * x * x - 2 * x * x + x) * m0 + (3 * x * x - 2 * x * x * x) * d;
            }
            spin = tab;
        };

        /* ── pelicula de deasupra benzii ── */
        let tex: FilmTex | null = null;
        let texV: ((c: number) => number) | null = null;
        let texDbg: StripTex | null = null;           // doar pentru verificare (window.__vz)
        let S0 = 0;                 // coordonata (în galerie) a capătului benzii
        let branch = 1, bSign = 1, spinSign = 1;
        let prevTwist: number | null = null;
        const seamAt = (t: number): { E: V3; tE: V3; bE: V3 } => {
            const off = offAt(Math.min(t, tCut));
            // începe cu SEAM px înăuntrul benzii (se suprapune peste capătul ei: o lipitură)
            if (horiz()) return { E: [lead.x + off + SEAM, lead.y + lead.h / 2, 0], tE: [-1, 0, 0], bE: [0, -1, 0] };
            return { E: [lead.x + lead.w / 2, lead.y + off + SEAM, 0], tE: [0, -1, 0], bE: [1, 0, 0] };
        };
        /* drumul: pelicula iese drept din bandă (aici se răsucește puțin, ca să se poată
           îndoi spre rolă), se curbează lin spre fundal (pelicula adevărată nu se îndoaie
           brusc), apoi intră pe pachet tangent, în planul rolei */
        const hintOf = (E: V3, tE: V3) => add(E, mul(tE, 0.33 * (horiz() ? vw : vh)));
        const leadPath = (t: number, reel: ReelDraw): Path => {
            const { E, tE, bE } = seamAt(t);
            const span = horiz() ? vw : vh;
            const R = reel.pack * reel.s;
            const { T, t: tT } = packTangent(reel.C, reel.A, R, hintOf(E, tE), branch);
            const h2 = 2.2 * 16 * reel.s;
            const Rb = Math.max(110, Math.min(250, 0.26 * span));
            const l0 = 0.45 * Rb;
            const E1 = add(E, mul(tE, l0));
            const Ar = sub(T, mul(tT, h2));
            const dir = norm(sub(Ar, E1));
            const cphi = Math.max(-1, Math.min(1, dot(tE, dir))), phi = Math.acos(cphi);
            const straight: [V3, V3, V3, V3] = [E, add(E, mul(tE, l0 / 3)), add(E, mul(tE, (2 * l0) / 3)), E1];
            let segs: [V3, V3, V3, V3][];
            if (phi < 0.04) {
                const dT = len(sub(T, E1));
                segs = [straight, [E1, add(E1, mul(tE, 0.35 * dT)), sub(T, mul(tT, Math.min(h2, 0.5 * dT))), T]];
            } else {
                const nb = norm(sub(dir, mul(tE, cphi)));
                const K = add(E1, mul(nb, Rb));
                const M = add(K, add(mul(nb, -Rb * Math.cos(phi)), mul(tE, Rb * Math.sin(phi))));
                const hk = (4 / 3) * Math.tan(phi / 4) * Rb;
                const dM = len(sub(T, M));
                segs = [
                    straight,
                    [E1, add(E1, mul(tE, hk)), sub(M, mul(dir, hk)), M],
                    [M, add(M, mul(dir, 0.35 * dM)), sub(T, mul(tT, Math.min(h2, 0.5 * dM))), T],
                ];
            }
            const path = bezierPath(cam, segs, bE, mul(reel.A, bSign), prevTwist);
            prevTwist = path.twist;
            return path;
        };
        /** alegerile făcute o singură dată: pe ce parte atinge pelicula rola, cu ce față, încotro se învârte */
        const settle = () => {
            const { reel } = reelAt(0, 1);
            const { E, tE } = seamAt(0);
            const P1 = hintOf(E, tE);
            let best = Infinity;
            for (const br of [1, -1]) {
                const { T, t: tT, u } = packTangent(reel.C, reel.A, reel.pack * reel.s, P1, br);
                // pelicula vine de jos-dreapta: alegem atingerea care o face să intre „pe dedesubt”, spre noi
                const score = -T[2] - 0.2 * T[1];
                if (score < best) { best = score; branch = br; spinSign = Math.sign(dot(cross(u, tT), reel.A)) || 1; }
            }
            bSign = 1;
            prevTwist = null;
            const p1 = leadPath(0, reelAt(0, spinSign).reel);
            const p2 = (() => { bSign = -1; prevTwist = null; return leadPath(0, reelAt(0, spinSign).reel); })();
            bSign = Math.abs(p1.twist) <= Math.abs(p2.twist) ? 1 : -1;
            // cât film e deasupra benzii când se desprinde — de aici, cât se învârte rola
            prevTwist = null;
            Ltail = leadPath(tCut, reelAt(tCut, spinSign).reel).L;
            buildSpin();
            prevTwist = null;
        };

        /* ── un cadru, la momentul t (ms) ── */
        let stage = 0;
        let logoPhase = 0;
        const ribbons: RibbonDraw[] = [];
        const paint = (t: number) => {
            placeStrips(t);
            const { reel, th } = reelAt(t, spinSign);
            ribbons.length = 0;
            if (tex && texV) {
                const half = filmW() / 2;
                const vOf = texV;
                if (t < tCut) {
                    const path = leadPath(t, reel);
                    ribbons.push({ path, sFrom: 0, half, vAt: (s) => vOf(S0 + SEAM - s), opacity: 1, tex });
                } else {
                    // coada: capătul liber alunecă pe drum spre rolă
                    const pt = pTail((t - tCut) / T7.tail);
                    if (pt < 0.9995) {
                        const path = leadPath(t, reel);
                        const sFrom = pt * path.L;
                        ribbons.push({ path, sFrom, half, vAt: (s) => vOf(S0 + SEAM - (s - sFrom)), opacity: 1, tex });
                    }
                }
            }
            const off = offAt(t);
            const occluders: [number, number, number, number][] = strips.map((st) => horiz()
                ? [st.x + st.dir * off, st.y, st.w, st.h] : [st.x, st.y + st.dir * off, st.w, st.h]);
            let black = 0;
            if (t < OPEN0) black = 1;
            else if (t < OPEN_END) black = OPEN_STEPS[Math.min(OPEN_STEPS.length - 1, Math.floor((t - OPEN0) / (1000 / 24)))];
            const scene: Scene = { cam, ribbons, reel: t < T7.spinEnd ? reel : null, occluders, black, bg: bgC };
            GL.draw(scene);

            // pagina
            if (stage < 1 && t >= OPEN_END) { stage = 1; html.setAttribute(VZ.state, 'film'); }
            if (stage < 2 && t >= T7.logo) { stage = 2; html.setAttribute(VZ.logo, ''); }
            if (stage < 3 && t >= T7.text) { stage = 3; html.removeAttribute(VZ.ui); html.setAttribute(VZ.state, 'out'); }
            if (stage < 4 && t >= T7.lamp) { stage = 4; html.setAttribute(VZ.lamp, ''); }
            if (stage < 5 && t >= T7.spinEnd) { stage = 5; html.setAttribute(VZ.reel, ''); }
            // pelicula de pe logo: stă încâlcită, apoi rola o strânge (cu unghiul ei)
            const ph = t < T7.logo ? 0 : t < T7.gather0 ? 1 : t < T7.gather0 + T7.gather ? 2 : 3;
            if (ph === 2) logoBridge.gather?.((t - T7.gather0) / T7.gather, (th * 180) / Math.PI);
            else if (ph !== logoPhase) { if (ph === 1) logoBridge.lay?.(); else if (ph === 3) logoBridge.rest?.(); }
            logoPhase = ph;
        };

        /* ── ceasul ── */
        let raf = 0, t0 = -1, over = false, started = false, waitTimer = 0, tailTimer = 0;
        function unlisten() {
            window.removeEventListener('pointerdown', skip, true);
            window.removeEventListener('wheel', skip, { capture: true });
            window.removeEventListener('keydown', skip, true);
            window.removeEventListener('resize', onResize);
        }
        const finish = () => {
            if (over) return;
            over = true;
            stopFrame(raf);
            window.clearTimeout(waitTimer);
            cancelAnimationFrame(readyRaf);
            unlisten();
            if (logoPhase === 1 || logoPhase === 2) logoBridge.rest?.();
            freeStrips();
            GL.dispose();
            canvas.remove();
            clearVizor();
        };
        function skip(ev: Event) {
            if (ev instanceof KeyboardEvent && (ev.metaKey || ev.ctrlKey || ev.altKey)) return;
            if (hold !== null) return;
            finish();
        }
        function onResize() {
            size();
            measureStrips();
            measureLogo();
            START = startOf();
            if (hold !== null && started) paint(hold);
        }
        const frame = (now: number) => {
            if (t0 < 0) t0 = now;
            const t = hold !== null ? hold : (now - t0) * speed;
            const p0 = performance.now();
            paint(t);
            const dt = performance.now() - p0;
            stats.frames++;
            stats.ms += dt;
            if (dt > stats.worst) stats.worst = dt;
            stats.last = t;
            if (hold === null && t >= T7.end) { finish(); return; }
            raf = nextFrame(frame);
        };
        const start = () => {
            if (started || over) return;
            started = true;
            window.clearTimeout(waitTimer);
            settle();
            html.setAttribute(VZ.pull, '');
            html.setAttribute(VZ.strip, '');
            paint(hold ?? 0);
            html.setAttribute(VZ.state, 'run');      // de acum negrul îl desenează canvas-ul
            raf = nextFrame(frame);
        };

        // textura peliculei (din imaginile benzii) — apoi pornim; dacă nu vine în 1,6 s, fără intro
        const maxTex = GL.maxTexture;
        // pagina alege filmul de start (și derulează galeria la el) după ce se montează
        // intro-ul: așteptăm să fie gata (.notReady dispare), apoi citim pelicula
        let readyRaf = 0;
        const build = () => {
            if (over || started) return;
            if (document.querySelector('.' + styles.notReady)) { readyRaf = requestAnimationFrame(build); return; }
            measureStrips();
            S0 = horiz() ? lead.gal.scrollLeft : lead.gal.scrollTop;
            stripTexture(lead.gal, lead.band, horiz(), Math.min(2, window.devicePixelRatio || 1), maxTex).then((st) => {
                if (over || started) return;
                if (st) {
                    tex = GL.texture(st.canvas, st.w, st.h);
                    texV = st.vOf;
                    if (hold !== null || byTimer) texDbg = st;
                }
                if (tex) start(); else finish();
            }, () => { if (!over && !started) finish(); });
        };
        readyRaf = requestAnimationFrame(build);
        waitTimer = window.setTimeout(() => { if (!started) finish(); }, 1600);

        window.addEventListener('pointerdown', skip, true);
        window.addEventListener('wheel', skip, { capture: true, passive: true });
        window.addEventListener('keydown', skip, true);
        window.addEventListener('resize', onResize);

        // verificarea cadru cu cadru: window.__vz.draw(2300) desenează momentul 2,3 s
        const W_ = window as unknown as { __vz?: unknown };
        if (hold !== null || byTimer) {
            W_.__vz = {
                T: { ...T7, cut: tCut },
                stats,
                draw: (ms: number) => { hold = ms; if (started) paint(ms); },
                crop: (ms: number, x = 0, y = 0, w = vw, h = vh) => {
                    hold = ms;
                    if (started) paint(ms);
                    const c = document.createElement('canvas');
                    c.width = Math.round(w * q);
                    c.height = Math.round(h * q);
                    const g = c.getContext('2d');
                    if (!g) return '';
                    g.fillStyle = `rgb(${bgC.map((v) => Math.round(v * 255)).join(',')})`;
                    g.fillRect(0, 0, c.width, c.height);
                    g.drawImage(canvas, x * q, y * q, w * q, h * q, 0, 0, c.width, c.height);
                    return c.toDataURL('image/png');
                },
                texRow: (dc = 0) => {
                    // pixelii texturii pe rândul lipiturii (+dc rânduri), de-a latul: [r, g, b, a] la 9 puncte
                    if (!texDbg) return null;
                    const g = texDbg.canvas.getContext('2d');
                    if (!g) return null;
                    const v = texDbg.vOf(S0 + SEAM);
                    const y = Math.max(0, Math.min(texDbg.h - 1, Math.floor(v * texDbg.h) + dc));
                    const row = g.getImageData(0, y, texDbg.w, 1).data;
                    const out: number[][] = [];
                    for (let k = 0; k <= 8; k++) {
                        const x = Math.min(texDbg.w - 1, Math.round((k / 8) * (texDbg.w - 1)));
                        out.push([row[4 * x], row[4 * x + 1], row[4 * x + 2], row[4 * x + 3]]);
                    }
                    return { v, y, h: texDbg.h, out };
                },
                info: (ms: number) => {
                    const { reel, r, th } = reelAt(ms, spinSign);
                    const p = tex ? leadPath(ms, reel) : null;
                    return {
                        r, C: reel.C, A: reel.A, pack: reel.pack, blur: reel.blur, th, rate: spinRate(ms),
                        L: p?.L, twist: p?.twist, branch, bSign, spinSign, tCut, Ltail, S0,
                    };
                },
            };
        }

        return () => {
            stopFrame(raf);
            cancelAnimationFrame(readyRaf);
            window.clearTimeout(waitTimer);
            window.clearTimeout(tailTimer);
            unlisten();
            freeStrips();
            if (over) return;
            GL.dispose();
            canvas.remove();
            // React (dev, StrictMode) montează efectul de două ori: lăsăm intro-ul „în așteptare”
            for (const a of [VZ.js, VZ.strip, VZ.logo, VZ.reel, VZ.lamp, VZ.pull]) html.removeAttribute(a);
            html.setAttribute(VZ.state, 'pending');
            html.setAttribute(VZ.ui, 'off');
            tailTimer = window.setTimeout(() => { if (!html.hasAttribute(VZ.js)) clearVizor(); }, 300);
        };
    }, []);

    return <div ref={layerRef} className={styles.vzLayer} aria-hidden="true" />;
}
