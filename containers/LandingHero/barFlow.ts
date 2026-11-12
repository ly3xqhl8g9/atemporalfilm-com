'use client';

import { useEffect } from 'react';

import styles from './landing.module.css';

/* ============================================================
   BARA DE JOS CU SPAȚII EGALE (09.11.2026, cererea lui Ștefan):
   „în funcție de mărimea ecranului, spațiul dintre elementele din bară
   să fie mereu la fel — pe un ecran super wide mai mult, dar egal, pe un
   ecran mic lipite unul de altul … raportate la pelicula care străbate
   ecranul”. Dacă nu e loc, renunțăm pe rând, în ordinea: Shanghai / Buenos
   Aires (CST, ART) · Bangkok / Los Angeles (ICT, PST) · New York /
   Johannesburg (EST, SAST) · Regio · Cofinanțat de UE · ADR Nord-Est ·
   TIME CALCULATOR. Madrid / Mumbai, butonul de limbă și site-urile rămân
   mereu.

   Unde: desktop (≥ 1280 px) și ecranele întoarse (telefon, tabletă —
   mai late decât înalte). Pe ecranele ținute vertical bara rămâne cum era.

   Cum: pelicula (pe ABOUT, perechea de pelicule) împarte bara în două.
   În fiecare parte elementele stau în ordinea lor, cu același spațiu între
   ele și între ultimul și pelicula; de la marginea ecranului rămân 18 px
   (ca Bangkok până acum). Spațiul de cel puțin 10 px; dacă nu ajunge, iese
   următorul element din listă care stă în partea fără loc (în stânga:
   Bangkok, New York, Regio, UE; în dreapta: Shanghai, ADR, TIME
   CALCULATOR) — partea care are loc nu pierde nimic.
   Pozițiile verticale, mărimile literelor și stările (● REC, ▶ PLAYBACK,
   ■ STOP — scrise doar de la 1600 px) rămân cele din CSS; JS-ul pune doar
   `left`, spațiul din grupurile UE + Regio și site-uri + ADR, și ascunde ce
   nu încape. Măsurat pe ecran, la fiecare schimbare de mărime / limbă.
   ============================================================ */

type Key = 'far' | 'home' | 'lang' | 'eu' | 'regio' | 'ny' | 'sites' | 'adr' | 'tc' | 'sh';

/** în stânga peliculei, de la marginea ecranului spre ea */
const LEFT: Key[]  = ['far', 'home', 'lang', 'eu', 'regio', 'ny'];
/** în dreapta peliculei, de la ea spre marginea ecranului */
const RIGHT: Key[] = ['sites', 'adr', 'tc', 'sh'];
/** ordinea în care se renunță la elemente când nu e loc (Ștefan, 09.11) */
const DROP: Key[]  = ['sh', 'far', 'ny', 'regio', 'eu', 'adr', 'tc'];

const EDGE    = 18;   // de la marginea ecranului
const GAP_MIN = 10;   // „lipite”: cel mai mic spațiu dintre două elemente

/** unde se aplică: desktop și ecranele întoarse */
export const BAR_FLOW_MEDIA = '(min-width: 1280px), (orientation: landscape)';

const CLS: Record<Key, string> = {
    far:   styles.wcBottomFar,
    home:  styles.wcBottomHome,
    lang:  styles.cofinanceLeft,
    eu:    styles.cfLogoEu,
    regio: styles.cfLogoRegio,
    ny:    styles.wcBottomLeft,
    sites: styles.cofinanceLinks,
    adr:   styles.cfLogoAdr,
    tc:    styles.cofinanceEncoder,
    sh:    styles.wcBottomRight,
};
/** perechile care stau într-un singur bloc în cod: blocul primește `left` și `gap` */
const GROUPS: [string, Key[]][] = [
    [styles.cofinanceLogos, ['eu', 'regio']],
    [styles.cofinanceRight, ['sites', 'adr']],
];

const hide = (el: HTMLElement) => el.style.setProperty('display', 'none', 'important');

export function useBarFlow(deps: unknown[]) {
    useEffect(() => {
        const mq = window.matchMedia(BAR_FLOW_MEDIA);
        let raf = 0;

        const find = (page: HTMLElement) => {
            const els = {} as Record<Key, HTMLElement | null>;
            (Object.keys(CLS) as Key[]).forEach((k) => {
                els[k] = page.querySelector<HTMLElement>(`.${CLS[k]}`);
            });
            const groups = GROUPS.map(([cls, keys]) => [page.querySelector<HTMLElement>(`.${cls}`), keys] as const);
            return { els, groups };
        };

        const place = () => {
            raf = 0;
            const page = document.querySelector<HTMLElement>(`.${styles.page}`);
            if (!page) return;
            const { els, groups } = find(page);

            // de la zero: tot vizibil, pozițiile din CSS
            (Object.values(els) as (HTMLElement | null)[]).forEach((el) => {
                el?.style.removeProperty('display');
                el?.style.removeProperty('left');
            });
            groups.forEach(([g]) => {
                g?.style.removeProperty('display');
                g?.style.removeProperty('left');
                g?.style.removeProperty('gap');
            });
            page.style.removeProperty('--tc-l');
            page.style.removeProperty('--tc-r');

            // 12.11.2026: nu mai după orientare, ci după așezarea aleasă în
            // filmMode.ts — pelicula orizontală (data-film="h") are bara ei
            const on = mq.matches && (window.innerWidth >= 1280
                || document.documentElement.getAttribute('data-film') !== 'h');
            page.classList.toggle(styles.barFlow, on);
            if (!on) { placePortrait(els); return; }

            // măsurăm totul lipit de marginea din stânga, ca nimic să nu fie
            // strâns (rupt pe două rânduri) de marginea din dreapta a ecranului
            const grouped0 = new Set(GROUPS.flatMap(([, keys]) => keys));
            (Object.keys(els) as Key[]).forEach((k) => {
                if (!grouped0.has(k)) els[k]?.style.setProperty('left', '0px', 'important');
            });
            groups.forEach(([g]) => g?.style.setProperty('left', '0px', 'important'));

            // marginile peliculei (pe ABOUT: ale perechii)
            const strips = [...page.querySelectorAll<HTMLElement>(`.${styles.gallery}`)]
                .map((el) => el.getBoundingClientRect())
                .filter((r) => r.width > 0);
            const W  = document.documentElement.clientWidth;
            const fL = strips.length ? Math.min(...strips.map((r) => r.left))  : W / 2;
            const fR = strips.length ? Math.max(...strips.map((r) => r.right)) : W / 2;

            const w = {} as Record<Key, number>;
            (Object.keys(els) as Key[]).forEach((k) => {
                w[k] = els[k] ? els[k]!.getBoundingClientRect().width : 0;
            });
            const present = (k: Key) => !!els[k] && w[k] > 0;

            const fit = (keys: Key[], room: number) => {
                const sum = keys.reduce((a, k) => a + w[k], 0);
                return keys.length ? (room - sum) / keys.length : Infinity;
            };

            // de fiecare parte a peliculei: scoatem elementele ei, în ordinea
            // lui Ștefan, până încape ce rămâne
            const settle = (side: Key[], room: number): [Key[], number] => {
                const order = DROP.filter((k) => side.includes(k));
                let keys: Key[] = [];
                let g = 0;
                for (let n = 0; n <= order.length; n++) {
                    const off = new Set(order.slice(0, n));
                    keys = side.filter((k) => present(k) && !off.has(k));
                    g = fit(keys, room);
                    if (g >= GAP_MIN) break;
                }
                // ce rămâne trebuie să stea pe ecran, chiar și foarte strâns
                return [keys, Math.max(4, g)];
            };
            const [L, gL] = settle(LEFT,  fL - EDGE);
            const [R, gR] = settle(RIGHT, W - EDGE - fR);

            const x = {} as Record<Key, number>;
            let at = EDGE;
            L.forEach((k) => { x[k] = at; at += w[k] + gL; });
            at = fR + gR;
            R.forEach((k) => { x[k] = at; at += w[k] + gR; });

            const grouped = new Set(GROUPS.flatMap(([, keys]) => keys));
            (Object.keys(els) as Key[]).forEach((k) => {
                const el = els[k];
                if (!el) return;
                if (!(k in x)) { hide(el); return; }
                if (!grouped.has(k)) el.style.setProperty('left', `${Math.round(x[k])}px`, 'important');
            });
            groups.forEach(([g, keys]) => {
                if (!g) return;
                const shown = keys.filter((k) => k in x);
                if (!shown.length) { hide(g); return; }
                g.style.setProperty('left', `${Math.round(x[shown[0]])}px`, 'important');
                // al doilea element ajunge exact unde l-ar pune bara (aceeași rotunjire)
                if (shown.length > 1) {
                    const gap = Math.round(x[shown[1]]) - Math.round(x[shown[0]]) - w[shown[0]];
                    g.style.setProperty('gap', `${gap.toFixed(2)}px`, 'important');
                }
            });

            // căsuța TIME CALCULATOR se așază după buton (vezi .tcBox în CSS)
            if ('tc' in x) {
                page.style.setProperty('--tc-l', `${Math.round(x.tc)}px`);
                page.style.setProperty('--tc-r', `${Math.round(x.tc + w.tc)}px`);
            }
        };

        /* ECRANELE ȚINUTE VERTICAL (09.11.2026, 16:23 — Ștefan: „pe telefon și
           tabletă e destul loc în bara de jos între Regio și ADR Nord-Est să pui
           butonul de TIME CALCULATOR; fă-l mai mic, să nu fie mai mare decât ADR”).
           Butonul (mic, vezi CSS) stă după Regio, înaintea primului element din
           dreapta de pe rândul logo-urilor (pe telefon ADR, pe tabletă site-urile):
           – telefon: limba, UE, Regio, TIME CALCULATOR și ADR cu spații egale
             (limba și ADR rămân la marginile lor; UE și Regio se mută puțin);
           – tabletă: centrat în golul dintre Regio și site-uri (restul pe loc).
           Dacă nu încape nici așa (sub ~6 px între elemente), lipsește din bară —
           rămâne în fișa TIMECODE (ceasul din antet). */
        const placePortrait = (els: Record<Key, HTMLElement | null>) => {
            const { tc, regio, eu, lang, sites, adr } = els;
            if (!tc || !regio || !eu || !lang) return;
            const W   = document.documentElement.clientWidth;
            const r   = (el: HTMLElement) => el.getBoundingClientRect();
            const wT  = r(tc).width;
            const reg = r(regio);
            if (!wT || !reg.width) { hide(tc); return; }
            const cy    = (reg.top + reg.bottom) / 2;
            const right = [sites, adr]
                .filter((el): el is HTMLElement => !!el)
                .map(r)
                .filter((q) => q.width > 0 && q.top <= cy && q.bottom >= cy && q.left > reg.right);
            const nextL = right.length ? Math.min(...right.map((q) => q.left)) : W - EDGE;

            if (W < 768) {
                const logos = page0()?.querySelector<HTMLElement>(`.${styles.cofinanceLogos}`);
                const wE = r(eu).width;
                const wR = reg.width;
                const l  = r(lang).right;
                const g  = (nextL - l - wE - wR - wT) / 4;
                if (g < 6 || !logos) { hide(tc); return; }
                const xE = Math.round(l + g);
                const xR = Math.round(l + g + wE + g);
                const xT = Math.round(l + g + wE + g + wR + g);
                logos.style.setProperty('left', `${xE}px`, 'important');
                logos.style.setProperty('gap', `${(xR - xE - wE).toFixed(2)}px`, 'important');
                tc.style.setProperty('left', `${xT}px`, 'important');
            } else {
                const room = nextL - reg.right;
                if (room < wT + 2 * GAP_MIN) { hide(tc); return; }
                tc.style.setProperty('left', `${Math.round(reg.right + (room - wT) / 2)}px`, 'important');
            }
        };
        const page0 = () => document.querySelector<HTMLElement>(`.${styles.page}`);

        const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

        place();
        // lățimile se schimbă cu fontul, cu limba, cu mărimea ecranului
        // browserele vechi (Safari sub 13.1) nu au ResizeObserver: rămân resize + cronometrele
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
        const page = document.querySelector<HTMLElement>(`.${styles.page}`);
        if (page) {
            const { els } = find(page);
            (Object.values(els) as (HTMLElement | null)[]).forEach((el) => {
                // blocul TIME CALCULATOR are lățimea butonului; restul, a lor
                const target = el?.classList.contains(styles.cofinanceEncoder)
                    ? el.firstElementChild as HTMLElement | null
                    : el;
                if (target) ro?.observe(target);
            });
            page.querySelectorAll<HTMLElement>(`.${styles.gallery}`).forEach((g) => ro?.observe(g));
        }
        const t1 = window.setTimeout(schedule, 300);
        const t2 = window.setTimeout(schedule, 1500);
        document.fonts?.ready.then(schedule).catch(() => {});
        window.addEventListener('resize', schedule);
        // Safari mai vechi de 14 are doar addListener
        if (mq.addEventListener) mq.addEventListener('change', schedule); else mq.addListener(schedule);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            ro?.disconnect();
            window.removeEventListener('resize', schedule);
            if (mq.removeEventListener) mq.removeEventListener('change', schedule); else mq.removeListener(schedule);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
