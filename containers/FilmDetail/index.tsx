'use client';

import { useEffect, useMemo } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   <FilmDetail />
   Overlay banner cinematic care apare când dai click pe afișul
   activ. Layout inspirat din referința atașată: backdrop blur,
   imagine fundal vignette, titlu mare stânga, premii cu stele
   pe dreapta, meta jos.
   ============================================================ */

type Lang = 'ro' | 'en' | 'fr';

interface FilmDetailData {
    title:       string;
    titleRo:     string;
    titleFr?:    string;
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
    onClose: () => void;
}

const META_LABELS: Record<Lang, { director: string; year: string; category: string; close: string }> = {
    ro: { director: 'REGIE',    year: 'AN',     category: 'CATEGORIE', close: 'ÎNCHIDE' },
    en: { director: 'DIRECTOR', year: 'YEAR',   category: 'CATEGORY',  close: 'CLOSE'   },
    fr: { director: 'RÉALISÉ PAR', year: 'ANNÉE', category: 'CATÉGORIE', close: 'FERMER' },
};

function pickField(p: FilmDetailData, lang: Lang, base: 'description' | 'awards' | 'people'): string {
    if (lang === 'ro') return p[base];
    const suffix = lang === 'en' ? 'En' : 'Fr';
    const key = (base + suffix) as keyof FilmDetailData;
    const v = p[key];
    return (typeof v === 'string' && v.length > 0) ? v : p[base];
}

function pickTitle(p: FilmDetailData, lang: Lang): string {
    if (lang === 'ro') return p.titleRo;
    if (lang === 'fr') return p.titleFr ?? p.title;
    return p.title;
}


export default function FilmDetail({ film, lang, onClose }: FilmDetailProps) {

    const labels      = META_LABELS[lang];
    const description = pickField(film, lang, 'description');
    const awards      = pickField(film, lang, 'awards');
    const titleMain   = pickTitle(film, lang);
    const titleSub    = lang === 'ro' ? film.title : film.titleRo;

    // close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // blocăm scroll-ul paginii cât timp e overlay-ul deschis
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);


    // extragem informația structurată din câmpurile existente
    const { yearNumber, category, awardsList } = useMemo(() => {
        const m = film.year.match(/\d{4}/);
        const isFeature = /feature/i.test(film.year);
        const isShort   = /short/i.test(film.year);
        const isAnim    = /animation|animație/i.test(film.year);
        const isDoc     = /documentary|documentar/i.test(film.year);

        let cat = isFeature ? 'FEATURE FILM' : isShort ? 'SHORT FILM' : 'FILM';
        if (isAnim) cat += ' · ANIM';
        if (isDoc)  cat += ' · DOC';

        const list = awards
            .split(/\s*[·•]\s*/)
            .map(s => s.trim())
            .filter(s => s && s !== '—');

        return {
            yearNumber: m ? m[0] : '',
            category:   cat,
            awardsList: list,
        };
    }, [film.year, awards]);


    return (
        <div
            className={styles.detailBackdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={film.title}
        >
            <div
                className={styles.detailBanner}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background image (zoomed-in poster) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={film.image}
                    alt={film.title}
                    className={styles.detailBg}
                />
                <div className={styles.detailVignette} aria-hidden="true" />


                {/* CONTENT GRID */}
                <div className={styles.detailContent}>

                    {/* TOP-LEFT — festival badge */}
                    <div className={styles.detailTopLeft}>
                        {awardsList[0] && (
                            <>
                                {yearNumber && (
                                    <div className={styles.detailFestYear}>{yearNumber}</div>
                                )}
                                <div className={styles.detailFestName}>
                                    {awardsList[0].toUpperCase()}
                                </div>
                                <div className={styles.detailLaurel}>
                                    <svg width="44" height="50" viewBox="0 0 44 50" fill="none" aria-hidden="true">
                                        <path d="M8 25 Q 4 12, 12 4" stroke="currentColor" strokeWidth="1" fill="none" />
                                        <path d="M8 25 Q 4 38, 12 46" stroke="currentColor" strokeWidth="1" fill="none" />
                                        <path d="M36 25 Q 40 12, 32 4" stroke="currentColor" strokeWidth="1" fill="none" />
                                        <path d="M36 25 Q 40 38, 32 46" stroke="currentColor" strokeWidth="1" fill="none" />
                                        <text x="22" y="29" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="serif" fontStyle="italic">laurel</text>
                                    </svg>
                                </div>
                            </>
                        )}
                    </div>


                    {/* TOP-RIGHT — category / year tags */}
                    <div className={styles.detailTopRight}>
                        <span className={styles.detailTag}>{category}</span>
                        {yearNumber && (
                            <>
                                <span className={styles.detailTagSep}>·</span>
                                <span className={styles.detailTag}>{yearNumber}</span>
                            </>
                        )}
                    </div>


                    {/* CENTER-LEFT — eyebrow + big title */}
                    <div className={styles.detailTitleBlock}>
                        <div className={styles.detailEyebrow}>{category.split('·')[0].trim()}</div>
                        <h1 className={styles.detailTitleMain}>{titleMain}</h1>
                        {titleSub && titleSub !== titleMain && (
                            <div className={styles.detailTitleRo}>{titleSub}</div>
                        )}
                        {description && (
                            <p className={styles.detailDescription}>{description}</p>
                        )}
                    </div>


                    {/* CENTER-RIGHT — awards / festival quotes */}
                    <div className={styles.detailQuotes}>
                        {awardsList.slice(0, 3).map((award, i) => (
                            <div key={i} className={styles.detailQuote}>
                                <div className={styles.detailQuoteStars}>★ ★ ★ ★ ★</div>
                                <div className={styles.detailQuoteSource}>
                                    {award.toUpperCase()}
                                </div>
                            </div>
                        ))}
                        {awardsList.length === 0 && (
                            <div className={styles.detailQuote}>
                                <div className={styles.detailQuoteStars}>★ ★ ★ ★ ★</div>
                                <div className={styles.detailQuoteSource}>
                                    SOUND DESIGN BY<br />ATEMPORAL FILM
                                </div>
                            </div>
                        )}
                    </div>


                    {/* BOTTOM-LEFT — meta table */}
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
                    </div>


                    {/* BOTTOM-RIGHT — close action */}
                    <button
                        className={styles.detailCloseBtn}
                        onClick={onClose}
                        aria-label={labels.close}
                    >
                        {labels.close}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M3 3 L 11 11 M 11 3 L 3 11" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
