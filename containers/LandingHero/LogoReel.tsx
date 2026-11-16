'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './landing.module.css';
import { INTRO_LOGO_EVENT, introPending, logoBridge, vizorPending } from './intro';
import { LOGO_WORDS } from './logoGlyphs';



/* ============================================================
   ROLA DE LÂNGĂ LOGO (03.11.2026, cerut de Ștefan, după poza cu rola de
   peliculă din care iese banda): la încărcarea paginii rola se învârte,
   pelicula iese din ea, se încâlcește peste logo și urmărește conturul
   literelor; când iese toată, coada e trasă în încâlceală, buclele se sting
   și din încâlceală rămâne scris logo-ul, exact ca acum. Rola rămâne goală,
   lângă logo; click pe ea = animația din nou (de fiecare dată altă încâlceală).

   Cum e făcută: SVG desenat din JS (requestAnimationFrame), fără biblioteci.
   Literele sunt contururile fontului logo-ului (logoGlyphs.ts), suprapuse
   peste textul HTML; la final textul HTML reapare în același cadru în care
   umplutura SVG dispare. Pelicula = căi SVG desenate cu stroke-dasharray
   (de la coadă la cap). Autoplay o singură dată pe încărcarea paginii (nu și
   la trecerea WORK → PEOPLE → ABOUT) și niciodată dacă sistemul cere „mai
   puțină mișcare” (click-ul pe rolă o pornește oricum).
   ============================================================ */


const NS = 'http://www.w3.org/2000/svg';

/** rola: centrul și raza, în px, în coordonatele logo-ului (colțul lui din stânga-sus) */
const REEL = { cx: 160, cy: 20, r: 16 };
export const WOUND_FULL  = 14;    // raza peliculei înfășurate, la început
const WOUND_EMPTY = 4.6;   // butucul — rola goală
export const WOUND_DOCK = 11.2;   // intro-ul „vizor”, versiunea 4: rola ajunge lângă logo aproape plină; restul peliculei e pe logo
const HOLE_R      = 3.7;   // cele cinci ferestre din flanșă
const HOLE_AT     = 9.4;
const TURNS       = 7;     // câte ture face rola cât iese pelicula

/** durate, în ms */
const T = {
    delay: 140,
    draw:  2500,   // capul peliculei: de la rolă până la ultima literă
    pull:  560,    // coada iese din rolă și e trasă în încâlceală
    fill:  560,    // literele se umplu
    fade:  560,    // conturul de peliculă de pe litere se stinge
};
const END = T.draw + Math.max(T.pull, 220 + T.fill, 300 + T.fade) + 40;

export const FILM_COLOR = '#15110d';
const FILM_W     = 2.1;

/** o singură dată pe încărcarea paginii (variabila modulului supraviețuiește
    navigării între paginile site-ului, dar nu și reîncărcării) */
let autoplayed = false;

type Piece = { d: string; kind: 'intro' | 'conn' | 'glyph'; el?: SVGPathElement; len?: number; at?: number };

const rnd    = (a: number, b: number) => a + Math.random() * (b - a);
const clamp  = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeIO = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * v);
const easeO  = (v: number) => 1 - (1 - v) * (1 - v);
/** pornește și se oprește fără smucitură (viteza și accelerația sunt zero la capete) */
const ease5  = (v: number) => v * v * v * (v * (6 * v - 15) + 10);
/** varianta netezită a încâlcelii — deocamdată doar cu /?intro=vizor4 (16.11.2026), ca să
    poată fi comparată cu cea de pe site: aceeași durată, pornire și oprire mai line, iar rola
    face 3 ture în loc de 7 (la 7, ferestrele flanșei „bat” pe cadre și rola pare că tremură) */
const SMOOTH_RE = /[?&]intro=vizor[456](?:&|$)/;
const TURNS_SMOOTH = 3;
const f2     = (v: number) => Math.round(v * 100) / 100;

/** ieșirea din rolă: pelicula zboară încâlcită peste logo — un drum la
    întâmplare prin câteva puncte (deasupra, prin și sub litere), cu bucle
    mari, cu o ondulație mică peste ele (se încrucișează, fără colțuri), până în stânga logo-ului */
function introPath(): { d: string; end: [number, number] } {
    const S: [number, number] = [REEL.cx - 11, REEL.cy + 11];
    const E: [number, number] = [rnd(-18, -10), rnd(34, 46)];
    const way: [number, number][] = [S];
    const n = 4;
    for (let k = 1; k <= n; k++) {
        const x = REEL.cx - 20 - (k / (n + 1)) * (REEL.cx + 10) + rnd(-18, 18);
        const y = k % 2 ? rnd(46, 66) : rnd(-6, 14);   // sub litere / deasupra lor, pe rând
        way.push([x, y]);
    }
    way.push(E);
    // Catmull-Rom prin puncte
    const P = [way[0], ...way, way[way.length - 1]];
    const base = (u: number): [number, number] => {
        const segs = way.length - 1;
        const t = Math.min(segs - 1e-6, u * segs);
        const i = Math.floor(t), f = t - i;
        const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]];
        const c = (a: number, b: number, cc: number, d: number) =>
            0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f);
        return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
    };
    const loops = rnd(9, 12);
    const R1 = rnd(8, 12), R2 = rnd(1.5, 3);
    const ph = rnd(0, Math.PI * 2), ph2 = rnd(0, Math.PI * 2);
    const N = 420;
    const pts: string[] = [];
    for (let k = 0; k <= N; k++) {
        const u = k / N;
        const [bx, by] = base(u);
        const env = Math.pow(Math.sin(Math.PI * u), 0.4);
        const a = ph + u * loops * Math.PI * 2;
        const x = bx + env * (R1 * Math.cos(a) + R2 * Math.cos(2.3 * a + ph2));
        const y = by + env * (R1 * 0.8 * Math.sin(a) + R2 * Math.sin(2.3 * a + ph2));
        pts.push(`${f2(x)} ${f2(y)}`);
    }
    return { d: `M${pts.join('L')}`, end: E };
}

/** o buclă de legătură între două puncte (sfârșitul unei litere → începutul următoarei) */
function connector(p: [number, number], q: [number, number]): string {
    const a1 = rnd(0, Math.PI * 2), l1 = rnd(12, 28);
    const a2 = rnd(0, Math.PI * 2), l2 = rnd(10, 22);
    return `M${f2(p[0])} ${f2(p[1])}C${f2(p[0] + l1 * Math.cos(a1))} ${f2(p[1] + l1 * Math.sin(a1))} `
         + `${f2(q[0] + l2 * Math.cos(a2))} ${f2(q[1] + l2 * Math.sin(a2))} ${f2(q[0])} ${f2(q[1])}`;
}

/** flanșa rolei: cerc cu cinci ferestre (fill-rule evenodd) */
function flangePath(): string {
    const circ = (cx: number, cy: number, r: number) =>
        `M${f2(cx - r)} ${f2(cy)}a${r} ${r} 0 1 0 ${f2(2 * r)} 0a${r} ${r} 0 1 0 ${f2(-2 * r)} 0Z`;
    let d = circ(0, 0, REEL.r);
    for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        d += circ(HOLE_AT * Math.cos(a), HOLE_AT * Math.sin(a), HOLE_R);
    }
    return d;
}
export const FLANGE = flangePath();


/** golește un element — replaceChildren() lipsește în Safari mai vechi de 14 */
const clear = (el: Element) => { while (el.firstChild) el.removeChild(el.firstChild); };

export default function LogoReel({ label }: { label: string }) {
    // starea inițială e aceeași pe server și la hidratare ('wait'); după
    // aceea e schimbată direct în DOM (data-state), în același cadru cu SVG-ul
    const [initial] = useState<'wait' | 'done'>(() => (autoplayed ? 'done' : 'wait'));
    const rootRef  = useRef<HTMLSpanElement | null>(null);
    const stripRef = useRef<SVGGElement | null>(null);
    const fillRef  = useRef<SVGGElement | null>(null);
    const spinRef  = useRef<SVGGElement | null>(null);
    const woundRef = useRef<SVGCircleElement | null>(null);
    const rafRef   = useRef<number | null>(null);

    const laidRef  = useRef<{ pieces: Piece[]; total: number } | null>(null);

    const setReel = (p: number, turns = TURNS) => {
        const r = Math.sqrt(WOUND_FULL ** 2 - (WOUND_FULL ** 2 - WOUND_EMPTY ** 2) * p);
        woundRef.current?.setAttribute('r', f2(r).toString());
        spinRef.current?.setAttribute('transform', `rotate(${f2(-p * turns * 360)})`);
    };

    const finish = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        laidRef.current = null;
        if (stripRef.current) clear(stripRef.current);
        if (fillRef.current) fillRef.current.style.opacity = '0';
        if (rootRef.current) rootRef.current.dataset.state = 'done';
        setReel(1);
    };

    /** intro-ul „vizor” (16.11.2026): rola tocmai a tras toată pelicula înapoi —
        rămâne plină, cu logo-ul scris; click pe ea pornește încâlceala ca de obicei */
    const rest = () => {
        finish();
        setReel(0);
    };

    /** pelicula: ieșirea din rolă, apoi literă cu literă, legate prin bucle (de fiecare dată alta) */
    const build = (): { pieces: Piece[]; total: number } | null => {
        const strip = stripRef.current, fill = fillRef.current;
        if (!strip || !fill) return null;
        // umplutura literelor: o singură dată
        if (!fill.childElementCount) {
            for (const word of LOGO_WORDS) {
                const p = document.createElementNS(NS, 'path');
                p.setAttribute('d', word.flat().map((c) => c.d).join(''));
                fill.appendChild(p);
            }
        }
        const pieces: Piece[] = [];
        const intro = introPath();
        pieces.push({ d: intro.d, kind: 'intro' });
        let last: [number, number] = intro.end;
        for (const word of LOGO_WORDS) {
            for (const glyph of word) {
                for (const c of glyph) {
                    pieces.push({ d: connector(last, [c.x, c.y]), kind: 'conn' });
                    pieces.push({ d: c.d, kind: 'glyph' });
                    last = [c.x, c.y];
                }
            }
        }
        clear(strip);
        let total = 0;
        for (const pc of pieces) {
            const el = document.createElementNS(NS, 'path');
            el.setAttribute('d', pc.d);
            el.setAttribute('visibility', 'hidden');
            strip.appendChild(el);
            pc.el = el;
            pc.len = el.getTotalLength();
            pc.at = total;
            total += pc.len;
        }
        return { pieces, total };
    };

    /** intro-ul „vizor”, versiunea 4 — rola strânge pelicula de peste logo. p = 0: toată
        pelicula e întinsă (încâlceala + conturul literelor); p = 1: e toată în rolă și a rămas
        logo-ul scris. Capătul îndepărtat (ultima literă) vine înapoi pe același drum; literele
        se umplu pe măsură ce pelicula pleacă de pe ele. ang = cum stă rola (grade). */
    const gather = (p: number, ang: number) => {
        const fill = fillRef.current, L = laidRef.current;
        if (!fill || !L) return;
        if (p >= 1) { rest(); return; }
        const e = ease5(clamp(p));
        const head = (1 - e) * L.total;
        const glyphO = 1 - ease5(clamp((p - 0.1) / 0.55));
        fill.style.opacity = ease5(clamp(p / 0.5)).toFixed(3);
        for (const pc of L.pieces) {
            const len = pc.len ?? 0, at = pc.at ?? 0;
            const b = Math.min(len, Math.max(0, head - at));
            if (b > 0) {
                pc.el?.setAttribute('stroke-dasharray', `${f2(b)} ${f2(len + 1)}`);
                pc.el?.setAttribute('stroke-dashoffset', '0');
                pc.el?.setAttribute('visibility', 'visible');
            } else {
                pc.el?.setAttribute('visibility', 'hidden');
            }
            if (pc.kind === 'glyph') pc.el?.setAttribute('opacity', glyphO.toFixed(3));
        }
        woundRef.current?.setAttribute('r', f2(WOUND_DOCK + (WOUND_FULL - WOUND_DOCK) * e).toString());
        spinRef.current?.setAttribute('transform', `rotate(${f2(ang)})`);
    };

    /** … și starea de dinainte: pelicula încâlcită stă peste logo (rola încă nu a ajuns) */
    const lay = () => {
        const root = rootRef.current, fill = fillRef.current;
        if (!root || !fill) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        const b = build();
        if (!b) return;
        laidRef.current = b;
        root.dataset.state = 'play';
        gather(0, 0);
    };

    const play = () => {
        const fill = fillRef.current, root = rootRef.current;
        if (!fill || !root) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        laidRef.current = null;
        const built = build();
        if (!built) return;
        const { pieces, total } = built;
        const tailEnd = pieces[0].len ?? 0;
        const smooth = SMOOTH_RE.test(window.location.search);
        const ez = smooth ? ease5 : easeIO;
        const turns = smooth ? TURNS_SMOOTH : TURNS;

        root.dataset.state = 'play';
        fill.style.opacity = '0';
        setReel(0, turns);
        const t0 = performance.now();

        const frame = (now: number) => {
            const e = now - t0 - T.delay;
            const p = ez(clamp(e / T.draw));
            const head = p * total;
            const tail = ez(clamp((e - T.draw) / T.pull)) * tailEnd;
            const connO  = 1 - easeO(clamp((e - T.draw + 60) / T.pull));
            const glyphO = 1 - ez(clamp((e - T.draw - 300) / T.fade));
            fill.style.opacity = ez(clamp((e - T.draw - 220) / T.fill)).toFixed(3);

            for (const pc of pieces) {
                const L = pc.len ?? 0, at = pc.at ?? 0;
                const a = Math.min(L, Math.max(0, tail - at));
                const b = Math.min(L, Math.max(0, head - at));
                // segmentul vizibil [a, b] — cu offset, nu cu o liniuță de lungime 0
                // la început (cu capetele rotunde, aceea s-ar vedea ca un punct)
                if (b > a) {
                    pc.el?.setAttribute('stroke-dasharray', `${f2(b - a)} ${f2(L + 1)}`);
                    pc.el?.setAttribute('stroke-dashoffset', f2(-a).toString());
                    pc.el?.setAttribute('visibility', 'visible');
                } else {
                    pc.el?.setAttribute('visibility', 'hidden');
                }
                if (pc.kind === 'conn')  pc.el?.setAttribute('opacity', connO.toFixed(3));
                if (pc.kind === 'glyph') pc.el?.setAttribute('opacity', glyphO.toFixed(3));
            }
            setReel(p, turns);

            if (e >= END) { finish(); return; }
            rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
    };

    useEffect(() => {
        // varianta /?intro (IntroReel): rola mare zboară până aici și abia
        // atunci pornește încâlceala
        const onIntro = () => play();
        window.addEventListener(INTRO_LOGO_EVENT, onIntro);
        logoBridge.lay = lay;
        logoBridge.gather = gather;
        logoBridge.rest = rest;
        if (initial === 'wait') {
            autoplayed = true;
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (vizorPending()) rest();
            else if (!introPending()) { if (reduce) finish(); else play(); }
        }
        return () => {
            window.removeEventListener(INTRO_LOGO_EVENT, onIntro);
            delete logoBridge.lay;
            delete logoBridge.gather;
            delete logoBridge.rest;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // o singură dată, la montare
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <span ref={rootRef} className={styles.logoReel} data-state={initial}>
            {/* pelicula și literele, peste logo (nu primesc click-uri) */}
            <svg className={styles.logoReelFilm} aria-hidden="true" focusable="false">
                <g ref={fillRef} className={styles.logoReelFill} style={{ opacity: 0 }} />
                <g
                    ref={stripRef}
                    fill="none"
                    stroke={FILM_COLOR}
                    strokeWidth={FILM_W}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {/* rola: butonul care pornește din nou animația */}
            <button
                type="button"
                className={styles.logoReelBtn}
                data-logo-reel-btn=""
                onClick={play}
                aria-label={label}
                title={label}
            >
                <svg viewBox="-17 -17 34 34" width="34" height="34" aria-hidden="true" focusable="false">
                    {/* pelicula înfășurată — se vede prin ferestrele flanșei */}
                    <circle ref={woundRef} r={initial === 'wait' ? WOUND_FULL : WOUND_EMPTY} fill={FILM_COLOR} />
                    <g ref={spinRef}>
                        <path d={FLANGE} fillRule="evenodd" className={styles.logoReelFlange} />
                        <circle r={2.3} fill={FILM_COLOR} />
                        <rect x={-0.9} y={-0.9} width={1.8} height={1.8} className={styles.logoReelSpindle} />
                    </g>
                </svg>
            </button>
        </span>
    );
}
