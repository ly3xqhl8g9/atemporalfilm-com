'use client';

import { useEffect, useRef, useState } from 'react';

import {
    HTML_LANG, LANG_CODE, LANG_MENU_LABEL, LANG_NAME, LANGS, type Lang,
} from '@/containers/LandingHero/i18n';
import styles from '@/containers/LandingHero/landing.module.css';
import TimeCalculator from '@/containers/LandingHero/TimeCalculator';



/* ============================================================
   <Cofinance />
   Bara de jos: butonul de limbă + vizibilitatea UE / Regio / ADR Nord-Est.

   30.10.2026 (Modul Regie, seria a treia): bara e fixă (mereu vizibilă,
   nu mai apare la scroll), fără linii de separare. Ceasurile au urcat în
   antet; „Aproape de tine” a fost scos. Așezare (la 2048 px):
     • butonul de limbă — textul lui aliniat cu lista de filme (seria a patra)
     • UE + Regio — la ~19,6% din lățime
     • cele patru site-uri, apoi ADR Nord-Est — în coloana din dreapta (seria a patra)
   02.11.2026: timecode-urile lumii au stat aici câteva ore; din a doua serie
   sunt în coloana din dreapta (vezi HeaderClocks › WorldClocks).
   ============================================================ */

interface CofinanceProps {
    lang:   Lang;                    // limba paginii
    onLang: (lang: Lang) => void;    // alegerea din lista de limbi
}

/* BUTONUL DE LIMBĂ (03.11.2026, 13:49): arată limba de acum; click → lista
   limbilor, deschisă în sus (EN, ES, FR, RO, TH, ZH, HI), fiecare scrisă în
   limba ei. Se închide la alegere, cu Esc sau cu click în afară. */
function LangMenu({ lang, onLang }: CofinanceProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <span className={styles.langWrap} ref={wrapRef}>
            <button
                type="button"
                className={`${styles.langBtn} ${open ? styles.langBtnOn : ''}`}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={`${LANG_MENU_LABEL[lang]}: ${LANG_NAME[lang]}`}
                title={LANG_MENU_LABEL[lang]}
            >
                {LANG_CODE[lang]}
                <span className={styles.langBtnArrow} aria-hidden="true">▴</span>
            </button>
            {open && (
                <span className={styles.langMenu} role="menu" aria-label={LANG_MENU_LABEL[lang]}>
                    {LANGS.map((l) => (
                        <button
                            key={l}
                            type="button"
                            role="menuitemradio"
                            aria-checked={l === lang}
                            lang={HTML_LANG[l]}
                            className={`${styles.langItem} ${l === lang ? styles.langItemOn : ''}`}
                            onClick={() => { onLang(l); setOpen(false); }}
                        >
                            <span className={styles.langItemCode}>{LANG_CODE[l]}</span>
                            <span className={styles.langItemName}>{LANG_NAME[l]}</span>
                        </button>
                    ))}
                </span>
            )}
        </span>
    );
}

export default function Cofinance({ lang, onLang }: CofinanceProps) {
    return (
        <footer className={styles.cofinance}>

            <div className={styles.cofinanceLeft}>
                <LangMenu lang={lang} onLang={onLang} />
            </div>

            <div className={styles.cofinanceLogos}>
                <div className={`${styles.cfLogo} ${styles.cfLogoEu}`}>
                    <div className={styles.cfStars}>
                        ★ ★ ★<br />★ ★ ★<br />★ ★ ★
                    </div>
                    <div className={styles.cfCap}>
                        Cofinanțat de<br />Uniunea Europeană
                    </div>
                </div>
                <div className={`${styles.cfLogo} ${styles.cfLogoRegio}`}>Regio</div>
            </div>

            {/* TIME CALCULATOR (03.11.2026; până atunci ENCODER, nota Regie 11):
                între ADR Nord-Est și Shanghai / Buenos Aires. Click → căsuța cu
                calculatorul de time stretch (TimeCalculator.tsx) */}
            <div className={styles.cofinanceEncoder}>
                <TimeCalculator lang={lang} />
            </div>

            {/* dreapta: site-urile aliniate cu creditul și meniul (--col-r),
                ADR Nord-Est după ele (Modul Regie, seria a patra) */}
            <div className={styles.cofinanceRight}>
                <div className={styles.cofinanceLinks}>
                    <a href="https://mfe.gov.ro" target="_blank" rel="noreferrer">www.mfe.gov.ro</a>
                    <a href="https://regionordest.ro" target="_blank" rel="noreferrer">www.regionordest.ro</a>
                    <a href="https://www.facebook.com/RegioNordEst.ro" target="_blank" rel="noreferrer">www.facebook.com/RegioNordEst.ro</a>
                    <a href="https://regionordest.ro" target="_blank" rel="noreferrer">RegioNordEst.ro</a>
                </div>
                <div className={`${styles.cfLogo} ${styles.cfLogoAdr}`}>
                    ADR<br /><span>NORD-EST</span>
                </div>
            </div>
        </footer>
    );
}
