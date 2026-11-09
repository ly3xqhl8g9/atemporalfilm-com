'use client';

/* ============================================================
   /telefon — Modul Regie pe un ecran de telefon (09.11.2026)
   ------------------------------------------------------------
   Pentru așezarea site-ului pe ecranele mici, de pe Mac: site-ul
   (localhost:3000/ sau /about) e încărcat într-un iframe exact de
   mărimea ecranului ales (iPhone în Safari: 390 × 700, ca în captura
   lui Ștefan din 09.11), deci se așază ca pe telefon. Modul Regie
   pornește singur în el, iar panoul stă în coloana din dreapta (nu
   peste telefon). Click pe un element din telefon → îl muți, îl
   mărești, lași o notă; „Trimite la Claude” salvează cue-urile cu
   mărimea ecranului (ex. 390×700), ca pe desktop.
   Doar local (app/telefon/page.tsx → 404 pe site-ul public).
   ============================================================ */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import styles from './telefon.module.css';



interface Device {
    id: string;
    label: string;
    w: number;
    h: number;
    note: string;
}

/* cât se vede din pagină (fără barele browserului), în px CSS */
const DEVICES: Device[] = [
    { id: 'iphone',   label: 'iPhone',         w: 390,  h: 700,  note: 'în Safari, ca în captura ta (ecranul: 390 × 844)' },
    { id: 'promax',   label: 'iPhone Pro Max', w: 430,  h: 780,  note: 'în Safari (ecranul: 430 × 932)' },
    { id: 'se',       label: 'iPhone SE',      w: 375,  h: 553,  note: 'în Safari (ecranul: 375 × 667)' },
    { id: 'android',  label: 'Android',        w: 360,  h: 680,  note: 'în Chrome (ecranul: 360 × 780)' },
    { id: 'full',     label: 'iPhone, fără bare', w: 390, h: 844, note: 'tot ecranul, fără barele Safari' },
    { id: 'ipad',     label: 'iPad',           w: 820,  h: 1106, note: 'în Safari (ecranul: 820 × 1180)' },
    { id: 'ipad-l',   label: 'iPad întors',    w: 1180, h: 746,  note: 'în Safari (ecranul: 1180 × 820)' },
    { id: 'iphone-l', label: 'iPhone întors',  w: 844,  h: 340,  note: 'în Safari — aici pelicula rămâne verticală' },
];

const PAGES = [
    { path: '/',      label: 'WORK' },
    { path: '/about', label: 'ABOUT' },
];

const STORE = 'regie:telefon:v1';
const BEZEL = 12;   // rama neagră a telefonului, px

interface Saved { id: string; w: number; h: number; page: string }

function loadSaved(): Saved {
    const d = DEVICES[0];
    try {
        const raw = window.localStorage.getItem(STORE);
        if (raw) {
            const v = JSON.parse(raw) as Partial<Saved>;
            if (typeof v.w === 'number' && typeof v.h === 'number') {
                return { id: v.id ?? 'custom', w: v.w, h: v.h, page: v.page ?? '/' };
            }
        }
    } catch { /* fără stocare: valorile de început */ }
    return { id: d.id, w: d.w, h: d.h, page: '/' };
}

const clampSize = (n: number) => Math.max(240, Math.min(2000, Math.round(n) || 0));

/* pe telefon barele de derulare nu ocupă loc (se suprapun peste pagină); pe Mac,
   html are `scrollbar-gutter: stable` (globals.css) — în telefon locul lor ar
   îngusta pagina cu ~11–15 px. Pagina de telefon oricum nu se derulează. */
const PHONE_CSS = 'html,body{scrollbar-gutter:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}'
    + 'html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}';
function fitPhoneDoc(f: HTMLIFrameElement | null) {
    try {
        const d = f?.contentDocument;
        if (!d || d.getElementById('regie-telefon-css')) return;
        const st = d.createElement('style');
        st.id = 'regie-telefon-css';
        st.textContent = PHONE_CSS;
        d.head.appendChild(st);
    } catch { /* ignorat */ }
}


export default function Telefon() {
    const [ready, setReady] = useState(false);
    const [dev, setDev]     = useState<Saved>({ id: DEVICES[0].id, w: DEVICES[0].w, h: DEVICES[0].h, page: '/' });
    const [reload, setReload] = useState(0);
    const [here, setHere]   = useState('/');
    const [fit, setFit]     = useState(1);
    const stageRef = useRef<HTMLElement | null>(null);
    const phoneRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        const s = loadSaved();
        setDev(s);
        setHere(s.page);
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready) return;
        try { window.localStorage.setItem(STORE, JSON.stringify(dev)); } catch { /* ignorat */ }
    }, [dev, ready]);

    // telefonul încape în spațiul liber; dacă nu, e micșorat (Regie măsoară tot în px-ul telefonului)
    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const measure = () => {
            const r = el.getBoundingClientRect();
            const s = Math.min(1, (r.width - 48) / (dev.w + 2 * BEZEL), (r.height - 64) / (dev.h + 2 * BEZEL));
            setFit(Math.max(0.2, Math.floor(s * 100) / 100));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [dev.w, dev.h]);

    // pagina deschisă în telefon (se poate schimba și din meniul site-ului)
    useEffect(() => {
        const t = window.setInterval(() => {
            try {
                const p = phoneRef.current?.contentWindow?.location.pathname;
                if (p) setHere(p);
                fitPhoneDoc(phoneRef.current);
            } catch { /* ignorat */ }
        }, 800);
        return () => window.clearInterval(t);
    }, []);

    const pick = useCallback((d: Device) => setDev((v) => ({ ...v, id: d.id, w: d.w, h: d.h })), []);
    const rotate = () => setDev((v) => ({ ...v, id: 'custom', w: v.h, h: v.w }));
    const go = (path: string) => {
        setDev((v) => ({ ...v, page: path }));
        setHere(path);
        setReload((n) => n + 1);
    };

    const preset = DEVICES.find((d) => d.id === dev.id);
    const src = `${dev.page}?regie`;

    return (
        <div className={styles.root}>
            <header className={styles.bar}>
                <span className={styles.brand}><span className={styles.dot} aria-hidden="true" />REGIE · TELEFON</span>

                <span className={styles.group} role="group" aria-label="Ecranul">
                    {DEVICES.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            className={dev.id === d.id ? styles.on : undefined}
                            onClick={() => pick(d)}
                            title={`${d.w} × ${d.h} — ${d.note}`}
                        >
                            {d.label}
                        </button>
                    ))}
                </span>

                <span className={styles.group}>
                    <input
                        type="number"
                        aria-label="Lățimea"
                        value={dev.w}
                        onChange={(e) => setDev((v) => ({ ...v, id: 'custom', w: clampSize(Number(e.target.value)) }))}
                    />
                    <span className={styles.x}>×</span>
                    <input
                        type="number"
                        aria-label="Înălțimea"
                        value={dev.h}
                        onChange={(e) => setDev((v) => ({ ...v, id: 'custom', h: clampSize(Number(e.target.value)) }))}
                    />
                    <button type="button" onClick={rotate} title="Întoarce telefonul">⟲</button>
                </span>

                <span className={styles.group} role="group" aria-label="Pagina">
                    {PAGES.map((p) => (
                        <button
                            key={p.path}
                            type="button"
                            className={here === p.path ? styles.on : undefined}
                            onClick={() => go(p.path)}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button type="button" onClick={() => setReload((n) => n + 1)} title="Reîncarcă pagina din telefon">↻</button>
                </span>
            </header>

            <main ref={stageRef} className={styles.stage}>
                {ready && (
                    <>
                        <div
                            className={styles.phoneBox}
                            style={{ width: (dev.w + 2 * BEZEL) * fit, height: (dev.h + 2 * BEZEL) * fit }}
                        >
                            <div
                                className={styles.phone}
                                style={{ width: dev.w + 2 * BEZEL, height: dev.h + 2 * BEZEL, transform: `scale(${fit})` }}
                            >
                                <iframe
                                    key={reload}
                                    ref={phoneRef}
                                    src={src}
                                    width={dev.w}
                                    height={dev.h}
                                    title="Site-ul pe ecranul telefonului"
                                    onLoad={(e) => fitPhoneDoc(e.currentTarget)}
                                />
                            </div>
                        </div>
                        <p className={styles.caption}>
                            {dev.w} × {dev.h} px{preset ? ` · ${preset.note}` : ''}
                            {fit < 1 ? ` · micșorat la ${Math.round(fit * 100)} % ca să încapă` : ' · mărime reală'}
                        </p>
                    </>
                )}
            </main>

            {/* panoul Regie din telefon se așază aici (components/Regie › dockWindow) */}
            <aside className={styles.dock}>
                <iframe data-regie-dock="" title="Panoul Modului Regie" src="about:blank" />
                <p className={styles.hint}>
                    Dacă panoul nu apare: apasă REGIE în colțul telefonului.
                </p>
            </aside>
        </div>
    );
}
