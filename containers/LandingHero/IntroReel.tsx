'use client';

import { useEffect, useRef } from 'react';

import styles from './landing.module.css';
import { FILM_COLOR, FLANGE, WOUND_FULL } from './LogoReel';
import { INTRO_LOGO_EVENT, clearIntro } from './intro';



/* ============================================================
   INTRO „MASA LUMINATĂ” — varianta /?intro (03.11.2026, cerut de Ștefan)

   Momentul de încărcare al homepage-ului:
   1. masa se aprinde (pâlpâie ca un tub fluorescent); pe ea, mare, rola
      de lângă logo se învârte repede — cât se încarcă afișele;
   2. pelicula sare din rolă: iese pe muchie (o linie), se răsucește în zbor
      până stă plat, cu perforația și cadrele, iese pe sus și cade pe masă,
      unde se așază de sus până jos — banda de pe WORK;
   3. banda se oprește; restul peliculei e tras înapoi în rolă, iar rola
      se micșorează și zboară la locul ei de lângă logo; cât timp zboară,
      rama se lasă pe fotogramă ca o lupă și lampa se aprinde;
   4. rola ajunge lângă logo plină și pornește animația de acum (LogoReel):
      pelicula iese încâlcită și din încâlceală rămâne scris logo-ul;
      meniul, lista, creditul și bara de jos apar.
   Click, rotiță sau o tastă = sare peste intro (direct la pasul 4).

   Cum e făcută: un strat SVG peste pagină (z 45), desenat din JS cadru cu
   cadru. Pelicula din aer e o panglică pe o curbă Bézier (rolă → punctul
   unde atinge masa), cu lățimea după răsucire; găurile perforației sunt
   decupate (evenodd), cadrele sunt așezate exact pe grila galeriei, ca la
   aterizare să continue banda adevărată. Banda de pe masă e chiar galeria,
   dezvăluită de sus în jos (clip-path, --intro-y). Starea: intro.ts.
   ============================================================ */


type Pt = [number, number];
type Phase = 'spin' | 'launch' | 'lay' | 'rest' | 'retract';
type Curve = { L: number; at: (s: number) => { p: Pt; n: Pt; tg: Pt } };

const S_BIG     = 4.4;     // rola mare: Ø 34 × 4,4 ≈ 150 px
const WOUND_LOW = 8.6;     // cât rămâne pe rolă după ce s-a așezat banda
const SPIN_MAX  = 1300;    // °/s — „se rotește rapid”

/** durate, în ms */
const T = {
    minSpin: 950,    // rola se învârte cel puțin atât (masa se aprinde între timp)
    maxWait: 3200,   // … și cel mult atât, dacă afișele nu s-au încărcat
    launch:  480,    // pelicula sare din rolă până sus, deasupra benzii
    lay:     1000,   // banda se așază pe masă, de sus până jos
    rest:    280,    // banda stă
    retract: 1000,   // restul peliculei e tras înapoi; rola zboară la logo
    logo:    3600,   // cât ține încâlceala logo-ului (LogoReel), apoi curățenie
};

/** măsurile benzii de 289 px (cele din landing.module.css), față de centrul ei */
const STRIP0 = 289;
const IMG_A  = -91.5;     // afișul: de la marginea pistei sonore …
const IMG_B  = 118.5;     // … până la perforația din dreapta
const HOLE_A = 131.5;     // centrul găurilor, în cele două benzi de 26 px
const HOLE_W = 11;        // gaura: pe lățimea peliculei …
const HOLE_H = 7.2;       // … și în lungul ei
const FILM_BASE  = '#0e0e0e';
const FRAME_TONE = '#2d2924';   // fotogramele, în aer (nu sunt luminate de masă)

const clamp01  = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeIO   = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * v);
const easeOut3 = (v: number) => 1 - (1 - v) ** 3;
const smooth   = (v: number) => v * v * (3 - 2 * v);
const f1       = (v: number) => Math.round(v * 10) / 10;

const bez = (P: Pt[], t: number): Pt => {
    const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
            a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
};
const dbez = (P: Pt[], t: number): Pt => {
    const m = 1 - t, a = 3 * m * m, b = 6 * m * t, c = 3 * t * t;
    return [a * (P[1][0] - P[0][0]) + b * (P[2][0] - P[1][0]) + c * (P[3][0] - P[2][0]),
            a * (P[1][1] - P[0][1]) + b * (P[2][1] - P[1][1]) + c * (P[3][1] - P[2][1])];
};

/** curba, parametrizată după lungime (ca găurile și cadrele să stea la distanțe egale) */
function makeCurve(P: Pt[]): Curve {
    const N = 220;
    const ts = new Float64Array(N + 1), cum = new Float64Array(N + 1);
    let prev = bez(P, 0);
    for (let i = 1; i <= N; i++) {
        const t = i / N, p = bez(P, t);
        cum[i] = cum[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        ts[i] = t;
        prev = p;
    }
    const L = cum[N];
    const at = (s0: number) => {
        const s = Math.max(0, Math.min(L, s0));
        let lo = 0, hi = N;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
        const span = cum[hi] - cum[lo] || 1;
        const t = ts[lo] + (ts[hi] - ts[lo]) * ((s - cum[lo]) / span);
        const p = bez(P, t), d = dbez(P, t), len = Math.hypot(d[0], d[1]) || 1;
        return { p, n: [-d[1] / len, d[0] / len] as Pt, tg: [d[0] / len, d[1] / len] as Pt };
    };
    return { L, at };
}

/** cum arată pelicula în aer la distanța s de rolă:
    • perspectiva (k): lângă rolă e mică (cât jumătate din rolă), pe masă are
      lățimea benzii — se mărește pe drum, ca și cum ar veni spre noi;
      găurile și cadrele se micșorează odată cu ea, și în lungul ei;
    • răsucirea (tw): iese din rolă pe muchie (o linie) și se întoarce plat
      pe primii ~180 px. */
type Look = {
    W: number;          // lățimea benzii pe masă (289 px)
    kReel: number;      // perspectiva la rolă
    edge: number;       // grosimea peliculei pe muchie (px)
    twistLen: number;   // pe câți px se răsucește
};
const kAt  = (s: number, L: number, k: Look) => k.kReel + (1 - k.kReel) * smooth(clamp01(s / (L || 1)));
const wAt  = (s: number, L: number, k: Look) => {
    const kk = kAt(s, L, k);
    const tw = Math.sin((Math.PI / 2) * smooth(clamp01(s / k.twistLen)));
    return Math.max(k.edge, k.W * kk * tw);
};

/** panglica de peliculă de la rolă (s = 0) până la s1: conturul (cu găurile
    decupate) și cadrele. Capătul de la s1 stă (sau va sta) pe masă la y = touch;
    lungimea de peliculă se socotește cu perspectiva, deci cadrele și găurile
    se potrivesc exact cu banda deja așezată. */
function filmPaths(c: Curve, s1: number, touch: number, top0: number, pitch: number, k: Look): { film: string; frames: string } {
    if (s1 < 0.5) return { film: '', frames: '' };
    const sc = k.W / STRIP0;
    const off = (p: Pt, n: Pt, a: number) => `${f1(p[0] - a * n[0])} ${f1(p[1] - a * n[1])}`;

    // eșantioane la ~3 px: punctul, normala, perspectiva, lățimea, y-ul pe masă
    const n = Math.max(2, Math.ceil(s1 / 3));
    const S: number[] = [], Y: number[] = [], K: number[] = [], Wd: number[] = [];
    const Ps: Pt[] = [], Ns: Pt[] = [], Tg: Pt[] = [];
    let mat = 0;
    for (let i = 0; i <= n; i++) {
        const s = (s1 * i) / n;
        const kk = kAt(s, c.L, k);
        if (i > 0) mat += (s - S[i - 1]) / ((kk + K[i - 1]) / 2);
        const { p, n: nn, tg } = c.at(s);
        S.push(s); K.push(kk); Wd.push(wAt(s, c.L, k)); Ps.push(p); Ns.push(nn); Tg.push(tg);
        Y.push(mat);
    }
    for (let i = 0; i <= n; i++) Y[i] = touch + mat - Y[i];   // capătul (i = n) e la touch

    // conturul
    const A: string[] = [], B: string[] = [];
    const idx: number[] = [];
    for (let i = 0; i < n; i += 2) idx.push(i);
    idx.push(n);
    for (const j of idx) {
        A.push(off(Ps[j], Ns[j], -Wd[j] / 2));
        B.push(off(Ps[j], Ns[j], Wd[j] / 2));
    }
    let film = `M${A.join('L')}L${B.reverse().join('L')}Z`;

    // perforația: 16 găuri pe cadru, pe grila galeriei (doar unde pelicula e destul de plată)
    const hs = pitch / 16;
    const hIdx = (y: number) => (y - top0) / hs - 0.5;
    for (let i = 1; i <= n; i++) {
        const ha = hIdx(Y[i - 1]), hb = hIdx(Y[i]);          // Y scade cu i
        for (let j = Math.floor(ha); j > hb; j--) {
            const f = (ha - j) / (ha - hb || 1);
            const ii = f < 0.5 ? i - 1 : i;
            const s = S[i - 1] + (S[i] - S[i - 1]) * f;
            if (s < 4 || s > s1 - 4) continue;
            const kk = K[ii], wd = Wd[ii];
            const flat = wd / (k.W * kk);
            if (flat < 0.3) continue;
            const p: Pt = [Ps[i - 1][0] + (Ps[i][0] - Ps[i - 1][0]) * f, Ps[i - 1][1] + (Ps[i][1] - Ps[i - 1][1]) * f];
            const nn = Ns[ii], tg = Tg[ii];
            const ax = (HOLE_W / 2) * sc * kk * flat, ay = (HOLE_H / 2) * sc * kk;
            for (const side of [-1, 1]) {
                const a = side * HOLE_A * sc * kk * flat;
                const cx = p[0] - a * nn[0], cy = p[1] - a * nn[1];
                const pt = (u: number, v: number) => `${f1(cx + u * ay * tg[0] + v * ax * nn[0])} ${f1(cy + u * ay * tg[1] + v * ax * nn[1])}`;
                film += `M${pt(-1, -1)}L${pt(1, -1)}L${pt(1, 1)}L${pt(-1, 1)}Z`;
            }
        }
    }

    // fotogramele: unde y-ul de pe masă cade pe un afiș (315 din pasul de 351)
    let frames = '';
    const imgH = (pitch * 315) / 351, imgOff = (pitch - imgH) / 2;
    const inImg = (y: number) => ((((y - top0 - imgOff) % pitch) + pitch) % pitch) < imgH;
    let E1: string[] = [], E2: string[] = [];
    const flush = () => {
        if (E1.length > 1) frames += `M${E1.join('L')}L${E2.reverse().join('L')}Z`;
        E1 = []; E2 = [];
    };
    for (let i = 0; i <= n; i++) {
        if (!inImg(Y[i])) { flush(); continue; }
        const flat = Wd[i] / (k.W * K[i]);
        const m = sc * K[i] * flat;
        E1.push(off(Ps[i], Ns[i], IMG_A * m));
        E2.push(off(Ps[i], Ns[i], IMG_B * m));
    }
    flush();
    return { film, frames };
}

/** afișele din dreptul ecranului s-au încărcat */
function imagesIn(gallery: HTMLElement, H: number): boolean {
    for (const img of Array.from(gallery.querySelectorAll('img'))) {
        const r = img.getBoundingClientRect();
        if (r.bottom > 0 && r.top < H && !img.complete) return false;
    }
    return true;
}


export default function IntroReel({ galleryRef, ready }: {
    galleryRef: React.RefObject<HTMLDivElement | null>;
    ready: boolean;
}) {
    const readyRef  = useRef(ready);
    useEffect(() => { readyRef.current = ready; }, [ready]);

    const filmRef   = useRef<SVGPathElement | null>(null);
    const framesRef = useRef<SVGPathElement | null>(null);
    const reelRef   = useRef<SVGGElement | null>(null);
    const woundRef  = useRef<SVGCircleElement | null>(null);
    const spinRef   = useRef<SVGGElement | null>(null);
    const flangeRef = useRef<SVGPathElement | null>(null);

    useEffect(() => {
        const html = document.documentElement;
        if (!html.hasAttribute('data-intro')) return;     // fără ?intro: nimic
        const gallery = galleryRef.current;
        if (!gallery) { clearIntro(); return; }
        html.setAttribute('data-intro-js', '');
        html.setAttribute('data-intro', 'spin');
        html.style.setProperty('--intro-y', '0px');

        const slotEl = gallery.querySelector<HTMLElement>(`.${styles.slot}`);
        const vfEl   = document.querySelector<HTMLElement>(`.${styles.viewfinder}`);
        const btnEl  = document.querySelector<HTMLElement>('[data-logo-reel-btn]');

        // /?intro=debug: ceasul animației stă pe loc; îl muți din consolă cu
        // window.__introT = window.__introT0 + ms (pentru verificarea cadru cu cadru)
        const dbg = /[?&]intro=debug/.test(window.location.search);
        const W_ = window as unknown as { __introT?: number; __introT0?: number };
        let phase: Phase = 'spin';
        const t0 = performance.now();
        if (dbg) { W_.__introT0 = t0; W_.__introT = t0; }
        let ph0 = t0, last = t0;
        let angle = 0, wound = WOUND_FULL, a0 = 0, aEnd = 0, w0 = WOUND_FULL;
        let lit = false, loaded = false, over = false;
        let raf = 0, logoTimer = 0;

        const setPhase = (p: Phase, now: number) => { phase = p; ph0 = now; html.setAttribute('data-intro', p); };
        const light = () => { if (!lit) { lit = true; html.setAttribute('data-intro-light', ''); } };

        const unlisten = () => {
            window.removeEventListener('pointerdown', skip, true);
            window.removeEventListener('wheel', skip, { capture: true });
            window.removeEventListener('keydown', skip, true);
        };
        const toLogo = () => {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            unlisten();
            light();
            html.style.removeProperty('--intro-y');
            html.removeAttribute('data-intro-ui');
            html.setAttribute('data-intro', 'logo');
            window.dispatchEvent(new Event(INTRO_LOGO_EVENT));
            logoTimer = window.setTimeout(clearIntro, T.logo);
        };
        function skip(ev: Event) {
            if (ev instanceof KeyboardEvent && (ev.metaKey || ev.ctrlKey || ev.altKey)) return;
            toLogo();
        }
        window.addEventListener('pointerdown', skip, true);
        window.addEventListener('wheel', skip, { capture: true, passive: true });
        window.addEventListener('keydown', skip, true);

        const empty = (s: string) => {
            filmRef.current?.setAttribute('d', s);
            framesRef.current?.setAttribute('d', s);
        };

        const frame = (rafNow: number) => {
            const now = dbg ? (W_.__introT ?? t0) : rafNow;
            const dt = Math.min(64, now - last) / 1000;
            last = now;
            const e = now - ph0;
            const H = window.innerHeight;

            // geometria, măsurată pe ecran la fiecare cadru (merge și la redimensionare)
            const gr = gallery.getBoundingClientRect();
            const W = gr.width || STRIP0, stripX = gr.left + gr.width / 2, stripL = stripX - W / 2;
            const sr = slotEl?.getBoundingClientRect();
            const pitch = sr?.height || 351, top0 = sr?.top ?? 0;
            const br = btnEl?.getBoundingClientRect();
            const logoC: Pt = br ? [br.left + br.width / 2, br.top + br.height / 2] : [224, 78];
            const bigR = 17 * S_BIG;
            const home: Pt = [Math.max(bigR + 24, Math.min((logoC[0] + stripL) / 2, stripL - bigR - 48)), H / 2];

            let pos: Pt = home, S = S_BIG, op = 1, omega = 0;
            let touch = -24, s1 = 0, draw = false;

            if (phase === 'spin') {
                op = easeIO(clamp01((now - t0) / 320));
                omega = SPIN_MAX * easeIO(clamp01(e / 520));
                if (!loaded && readyRef.current) loaded = imagesIn(gallery, H);
                if (readyRef.current && e >= T.minSpin && (loaded || e >= T.maxWait)) setPhase('launch', now);
            } else if (phase === 'launch') {
                const p = clamp01(e / T.launch);
                omega = SPIN_MAX;
                wound = Math.sqrt(WOUND_FULL ** 2 - (WOUND_FULL ** 2 - WOUND_LOW ** 2) * 0.15 * p);
                draw = true;
                if (p >= 1) setPhase('lay', now);
            } else if (phase === 'lay') {
                const p = clamp01(e / T.lay), pe = easeOut3(p);
                touch = -24 + (H + 64) * pe;
                omega = SPIN_MAX * (1 - pe) ** 1.2;
                wound = Math.sqrt(WOUND_FULL ** 2 - (WOUND_FULL ** 2 - WOUND_LOW ** 2) * (0.15 + 0.85 * pe));
                html.style.setProperty('--intro-y', `${Math.max(0, Math.round(touch))}px`);
                draw = true;
                if (p >= 1) setPhase('rest', now);
            } else if (phase === 'rest') {
                touch = H + 40;
                draw = true;
                if (e >= T.rest) {
                    a0 = angle;
                    // derulare înapoi: cel puțin două ture, oprită unde rola din antet stă la 0°
                    // (flanșa are cinci ferestre → la un multiplu de 72° arată la fel)
                    aEnd = a0 + 720 + (((72 - (((a0 + 720) % 72) + 72) % 72)) % 72);
                    w0 = wound;
                    setPhase('retract', now);
                }
            }

            let retractP = 0;
            if (phase === 'retract') {
                retractP = clamp01(e / T.retract);
                const m = easeIO(retractP);
                const ctrl: Pt = [home[0] - 0.1 * (home[0] - logoC[0]), logoC[1]];
                const u = 1 - m;
                pos = [u * u * home[0] + 2 * u * m * ctrl[0] + m * m * logoC[0],
                       u * u * home[1] + 2 * u * m * ctrl[1] + m * m * logoC[1]];
                S = S_BIG + (1 - S_BIG) * m;
                angle = a0 + (aEnd - a0) * m;
                wound = w0 + (WOUND_FULL - w0) * m;
                touch = H + 40;
                draw = true;
            } else {
                angle -= omega * dt;   // se desfășoară: invers acelor de ceas, ca rola din antet
            }

            // pelicula din aer
            if (draw) {
                const E: Pt = [pos[0] + wound * S, pos[1]];   // iese din marginea dreaptă a rolei, în sus
                const P: Pt[] = [
                    E,
                    [E[0] + 0.35 * (stripX - E[0]), -0.12 * H],
                    [stripX, touch - (140 + 0.3 * Math.max(0, touch))],
                    [stripX, touch],
                ];
                const c = makeCurve(P);
                const look: Look = { W, kReel: Math.min(1, (0.45 * 34 * S) / W), edge: 2.1 * S, twistLen: 41 * S };
                if (phase === 'launch') {
                    s1 = clamp01(e / T.launch) * c.L;      // capul zboară spre masă
                } else if (phase === 'retract') {
                    // restul e tras înapoi în rolă; capătul tăiat rămâne capătul tăiat
                    s1 = (1 - easeIO(clamp01(retractP / 0.85))) * c.L;
                } else {
                    s1 = c.L;
                }
                const { film, frames } = filmPaths(c, s1, touch, top0, pitch, look);
                filmRef.current?.setAttribute('d', film);
                framesRef.current?.setAttribute('d', frames);

                // rama se lasă pe fotogramă abia când pelicula din aer nu mai trece peste ea
                if (!lit && (phase === 'rest' || phase === 'retract') && vfEl) {
                    const v = vfEl.getBoundingClientRect();
                    let clear = true;
                    for (let s = 0; s <= s1 && clear; s += 18) {
                        const { p } = c.at(s), w = wAt(s, c.L, look) / 2 + 6;
                        if (p[0] > v.left - w && p[0] < v.right + w && p[1] > v.top - w && p[1] < v.bottom + w) clear = false;
                    }
                    if (clear) light();
                }
            } else {
                empty('');
            }

            // rola
            reelRef.current?.setAttribute('transform', `translate(${f1(pos[0])} ${f1(pos[1])}) scale(${S.toFixed(4)})`);
            reelRef.current?.setAttribute('opacity', op.toFixed(3));
            spinRef.current?.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
            woundRef.current?.setAttribute('r', wound.toFixed(2));
            if (flangeRef.current) flangeRef.current.style.strokeWidth = (1.1 / Math.sqrt(S)).toFixed(3);

            if (phase === 'retract' && retractP >= 1) { toLogo(); return; }
            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            unlisten();
            window.clearTimeout(logoTimer);
            if (over) { clearIntro(); return; }
            // React (dev, StrictMode) montează efectul de două ori: lăsăm intro-ul „în
            // așteptare” pentru a doua montare; dacă nu mai vine (ai plecat de pe pagină),
            // curățăm, ca pagina următoare să nu rămână goală
            html.setAttribute('data-intro', 'pending');
            html.removeAttribute('data-intro-js');
            window.setTimeout(() => { if (html.getAttribute('data-intro') === 'pending') clearIntro(); }, 300);
        };
    }, [galleryRef]);

    return (
        <div className={styles.introLayer} aria-hidden="true">
            {/* masa luminată se aprinde */}
            <div className={styles.introDim} />
            <svg className={styles.introSvg} focusable="false">
                <path ref={filmRef} fill={FILM_BASE} fillOpacity={0.92} fillRule="evenodd" />
                <path ref={framesRef} fill={FRAME_TONE} />
                {/* rola mare — aceeași rolă ca în antet, de 4,4 ori */}
                <g ref={reelRef} opacity={0}>
                    <circle ref={woundRef} r={WOUND_FULL} fill={FILM_COLOR} />
                    <g ref={spinRef}>
                        <path ref={flangeRef} d={FLANGE} fillRule="evenodd" className={styles.logoReelFlange} />
                        <circle r={2.3} fill={FILM_COLOR} />
                        <rect x={-0.9} y={-0.9} width={1.8} height={1.8} className={styles.logoReelSpindle} />
                    </g>
                </g>
            </svg>
        </div>
    );
}
