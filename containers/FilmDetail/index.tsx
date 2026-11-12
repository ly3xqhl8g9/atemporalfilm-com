'use client';

import { useEffect, useMemo } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';

import { LAURELS, NOTES, FOCUS, FOCUS_DEFAULT } from './extras';
import type { Laurel } from './extras';



/* ============================================================
   <FilmDetail />
   Close-up-ul filmului: apare la click pe afișul din ramă.

   11.11.2026 (cererile lui Ștefan):
   • nimic tăiat — fereastra crește după text (titlul se micșorează după
     lungime), iar dacă tot nu încape, se derulează în interiorul ei;
   • fără buton de închidere: click sau tap oriunde închide (și Esc);
   • premiile de pe afișe, cu lauri (./extras.ts);
   • fotograma rămâne luminată din spate, cu trepidația obturatorului și
     grain la 24 de cadre pe secundă, puțin mai accentuate decât în ramă;
   • încadrarea afișului se dă pe fiecare film (./extras.ts › FOCUS) —
     pe telefonul ținut vertical imaginea stă sus, textul dedesubt.
   ============================================================ */

import type { Lang } from '@/containers/LandingHero/i18n';

interface FilmDetailData {
    title:       string;
    titleRo:     string;
    titleFr?:    string;
    titles?:     Partial<Record<Lang, string>>;   // titlul oficial în altă limbă (IMDb)
    year:        string;
    director:    string;
    production:  string;
    description: string;
    descriptionEn?: string;
    descriptionFr?: string;
    awards:    string;
    awardsEn?: string;
    awardsFr?: string;
    people:    string;
    peopleEn?: string;
    peopleFr?: string;
    image:     string;
}

interface FilmDetailProps {
    film: FilmDetailData;
    lang: Lang;
    /** ce a făcut echipa la film + cine (creditul din dreapta peliculei) */
    credit?: string;
    by?: string;
    onClose: () => void;
}

const META_LABELS: Record<Lang, { director: string; year: string; category: string; close: string; awards: string }> = {
    ro: { director: 'REGIE',    year: 'AN',     category: 'CATEGORIE', close: 'ÎNCHIDE', awards: 'Premii și festivaluri' },
    en: { director: 'DIRECTOR', year: 'YEAR',   category: 'CATEGORY',  close: 'CLOSE',   awards: 'Awards and festivals' },
    fr: { director: 'RÉALISÉ PAR', year: 'ANNÉE', category: 'CATÉGORIE', close: 'FERMER', awards: 'Prix et festivals' },
    es: { director: 'DIRECCIÓN', year: 'AÑO',   category: 'CATEGORÍA', close: 'CERRAR',  awards: 'Premios y festivales' },
    th: { director: 'ผู้กำกับ',   year: 'ปี',     category: 'ประเภท',    close: 'ปิด',      awards: 'รางวัลและเทศกาล' },
    zh: { director: '导演',       year: '年份',    category: '类别',       close: '关闭',     awards: '奖项与电影节' },
    hi: { director: 'निर्देशक',    year: 'वर्ष',    category: 'श्रेणी',     close: 'बंद करें', awards: 'पुरस्कार और समारोह' },
};

/** categoria filmului, în limba paginii (03.11.2026, 13:49) */
const CATEGORY: Record<Lang, { feature: string; short: string; film: string; anim: string; doc: string }> = {
    en: { feature: 'FEATURE FILM',  short: 'SHORT FILM',    film: 'FILM',     anim: 'ANIM',      doc: 'DOC' },
    es: { feature: 'LARGOMETRAJE',  short: 'CORTOMETRAJE',  film: 'PELÍCULA', anim: 'ANIMACIÓN', doc: 'DOCUMENTAL' },
    fr: { feature: 'LONG MÉTRAGE',  short: 'COURT MÉTRAGE', film: 'FILM',     anim: 'ANIMATION', doc: 'DOCUMENTAIRE' },
    ro: { feature: 'LUNGMETRAJ',    short: 'SCURTMETRAJ',   film: 'FILM',     anim: 'ANIMAȚIE',  doc: 'DOCUMENTAR' },
    th: { feature: 'ภาพยนตร์ขนาดยาว', short: 'ภาพยนตร์สั้น', film: 'ภาพยนตร์', anim: 'แอนิเมชัน', doc: 'สารคดี' },
    zh: { feature: '长片',           short: '短片',           film: '电影',      anim: '动画',       doc: '纪录片' },
    hi: { feature: 'फ़ीचर फ़िल्म',     short: 'शॉर्ट फ़िल्म',     film: 'फ़िल्म',     anim: 'एनिमेशन',    doc: 'डॉक्यूमेंट्री' },
};

function pickDescription(p: FilmDetailData, lang: Lang): string {
    // RO e textul de bază; FR are câmp propriu; celelalte limbi iau varianta EN
    const v = lang === 'ro'
        ? p.description
        : (lang === 'fr' && p.descriptionFr) || p.descriptionEn || p.description;
    // textele-machetă („Descriere temporară — de înlocuit ulterior”) nu se arată
    return /temporar/i.test(v) ? '' : v;
}

function pickTitle(p: FilmDetailData, lang: Lang): string {
    if (lang === 'ro') return p.titleRo;
    return p.titles?.[lang] ?? (lang === 'fr' ? p.titleFr : undefined) ?? p.title;
}

function pickNote(l: Laurel, lang: Lang): string | undefined {
    if (lang === 'ro') return l.noteRo ?? l.note;
    if (lang === 'fr') return l.noteFr ?? l.note;
    return l.note;
}

/** mărimea titlului după lungime: titlurile lungi se scriu mai mic, ca să încapă */
function titleScale(n: number): number {
    if (n <= 12) return 1;
    if (n <= 20) return 0.84;
    if (n <= 30) return 0.7;
    if (n <= 42) return 0.6;
    return 0.52;
}


/* ── LAURUL ─────────────────────────────────────────────────
   O ramură desenată o dată (frunze de-a lungul unei curbe), folosită în
   stânga și, oglindită, în dreapta fiecărui premiu. */
const BRANCH_D = (() => {
    const P0 = [15.5, 43], P1 = [-3, 24], P2 = [12.5, 2.5];
    const at = (t: number) => [
        (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
        (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
    ];
    const tan = (t: number) => {
        const x = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
        const y = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
        const l = Math.hypot(x, y) || 1;
        return [x / l, y / l];
    };
    const f = (v: number) => v.toFixed(2);
    const leaf = (bx: number, by: number, dx: number, dy: number, len: number, wid: number) => {
        const tx = bx + dx * len, ty = by + dy * len;
        const mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
        const nx = -dy * wid, ny = dx * wid;
        return `M${f(bx)} ${f(by)}Q${f(mx + nx)} ${f(my + ny)} ${f(tx)} ${f(ty)}Q${f(mx - nx)} ${f(my - ny)} ${f(bx)} ${f(by)}Z`;
    };
    const rot = (x: number, y: number, deg: number) => {
        const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        return [x * c - y * s, x * s + y * c];
    };
    let d = '';
    const N = 7;
    for (let i = 0; i < N; i++) {
        const t = 0.1 + (i / (N - 1)) * 0.8;
        const [bx, by] = at(t);
        const [tx, ty] = tan(t);
        const len = 6.6 - i * 0.28;
        const [ox, oy] = rot(tx, ty, -42);   // spre exterior
        const [ix, iy] = rot(tx, ty, 38);    // spre interior
        d += leaf(bx, by, ox, oy, len, 1.75) + leaf(bx, by, ix, iy, len * 0.86, 1.55);
    }
    const [ex, ey] = at(1);
    const [etx, ety] = tan(1);
    d += leaf(ex, ey, etx, ety, 5.4, 1.5);
    return d;
})();

function Branch({ flip }: { flip?: boolean }) {
    return (
        <svg
            className={styles.detailBranch}
            width="18" height="45" viewBox="0 0 18 45"
            aria-hidden="true"
            style={flip ? { transform: 'scaleX(-1)' } : undefined}
        >
            <path d={BRANCH_D} fill="currentColor" />
            <path d="M15.5 43Q-3 24 12.5 2.5" fill="none" stroke="currentColor" strokeWidth="0.7" />
        </svg>
    );
}


export default function FilmDetail({ film, lang, credit, by, onClose }: FilmDetailProps) {

    const labels      = META_LABELS[lang];
    const description = pickDescription(film, lang);
    const titleMain   = pickTitle(film, lang);
    const titleSub    = lang === 'ro' ? film.title : film.titleRo;

    const laurels = LAURELS[film.image] ?? [];
    const noteT   = NOTES[film.image];
    const note    = noteT ? (lang === 'ro' ? noteT.ro : (lang === 'fr' && noteT.fr) || noteT.en) : '';
    const focus   = FOCUS[film.image] ?? FOCUS_DEFAULT;
    const tall    = focus.tall ?? focus;

    // Esc închide
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // blocăm scroll-ul paginii cât timp e fereastra deschisă
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);


    const { yearNumber, category, eyebrow } = useMemo(() => {
        const m = film.year.match(/\d{4}/);
        const isFeature = /feature/i.test(film.year);
        const isShort   = /short/i.test(film.year);
        const isAnim    = /animation|animație/i.test(film.year);
        const isDoc     = /documentary|documentar/i.test(film.year);

        const C = CATEGORY[lang];
        const base = isFeature ? C.feature : isShort ? C.short : C.film;
        let cat = base;
        if (isAnim) cat += ' · ' + C.anim;
        if (isDoc)  cat += ' · ' + C.doc;

        return { yearNumber: m ? m[0] : '', category: cat, eyebrow: base };
    }, [film.year, lang]);

    const vars = {
        '--fx': `${focus.x}%`, '--fy': `${focus.y}%`, '--fz': String(focus.zoom ?? 1),
        '--px': `${tall.x}%`,  '--py': `${tall.y}%`,  '--pz': String(tall.zoom ?? 1),
        '--tk': String(titleScale(titleMain.length)),
    } as React.CSSProperties;


    return (
        <div
            className={styles.detailBackdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={film.title}
        >
            <div
                className={`${styles.detailBanner} ${laurels.length > 4 ? styles.detailManyLaurels : ''}`}
                style={vars}
                data-regie="close-up"
            >
                {/* FOTOGRAMA — afișul, luminat din spate: imaginea e „densă” (ca pe
                    peliculă), lampa o aduce la expunerea corectă și trepidează la
                    24 de cadre pe secundă; deasupra, grain la 24 fps */}
                <div className={styles.detailStage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={film.image}
                        alt=""
                        className={styles.detailBg}
                        data-regie="incadrare"
                    />
                    <div className={styles.detailLamp} aria-hidden="true" />
                    <div className={styles.detailVignette} aria-hidden="true" />
                    <div className={styles.detailGrain} aria-hidden="true" />
                </div>


                <div className={styles.detailContent}>

                    {/* SUS-STÂNGA — ce a făcut Atemporal la film */}
                    <div className={styles.detailTopLeft}>
                        {credit && <div className={styles.detailCredit}>{credit}</div>}
                        {by && <div className={styles.detailBy}>{by}</div>}
                    </div>


                    {/* SUS-DREAPTA — categoria · anul */}
                    <div className={styles.detailTopRight}>
                        <span className={styles.detailTag}>{category}</span>
                        {yearNumber && (
                            <>
                                <span className={styles.detailTagSep}>·</span>
                                <span className={styles.detailTag}>{yearNumber}</span>
                            </>
                        )}
                    </div>


                    {/* MIJLOC-STÂNGA — titlul */}
                    <div className={styles.detailTitleBlock}>
                        <div className={styles.detailEyebrow}>{eyebrow}</div>
                        <h1 className={styles.detailTitleMain}>{titleMain}</h1>
                        {titleSub && titleSub !== titleMain && (
                            <div className={styles.detailTitleRo}>{titleSub}</div>
                        )}
                        {description && (
                            <p className={styles.detailDescription}>{description}</p>
                        )}
                    </div>


                    {/* MIJLOC-DREAPTA — premiile și festivalurile, cu lauri */}
                    {laurels.length > 0 && (
                        <ul className={styles.detailLaurels} aria-label={labels.awards}>
                            {laurels.map((l, i) => {
                                const n = pickNote(l, lang);
                                return (
                                    <li key={i} className={styles.detailLaurel}>
                                        <Branch />
                                        <span className={styles.detailLaurelText}>
                                            <span className={styles.detailLaurelFest}>{l.fest}</span>
                                            {n && <span className={styles.detailLaurelNote}>{n}</span>}
                                        </span>
                                        <Branch flip />
                                    </li>
                                );
                            })}
                        </ul>
                    )}


                    {/* JOS-STÂNGA — tabelul */}
                    <div className={styles.detailMeta}>
                        <div className={styles.detailMetaRow}>
                            <span className={styles.detailMetaLabel}>{labels.director}</span>
                            <span className={styles.detailMetaValue}>{film.director.toUpperCase()}</span>
                        </div>
                        {yearNumber && (
                            <div className={styles.detailMetaRow}>
                                <span className={styles.detailMetaLabel}>{labels.year}</span>
                                <span className={styles.detailMetaValue}>{yearNumber}</span>
                            </div>
                        )}
                        <div className={styles.detailMetaRow}>
                            <span className={styles.detailMetaLabel}>{labels.category}</span>
                            <span className={styles.detailMetaValue}>{category}</span>
                        </div>
                        {note && <div className={styles.detailNote}>{note}</div>}
                    </div>
                </div>

                {/* fără buton vizibil: click / tap oriunde închide. Butonul rămâne
                    doar pentru cititoarele de ecran și pentru tastatură. */}
                <button type="button" className={styles.srOnly} onClick={onClose}>
                    {labels.close}
                </button>
            </div>
        </div>
    );
}
