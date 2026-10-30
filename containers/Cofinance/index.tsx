'use client';

import { useEffect, useRef, useState } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   <Cofinance />
   Footer de cofinanțare UE / Regio / ADR Nord-Est.

   Comportament: pinned la bottom: 0 cu position: fixed.
     • la scroll = 0  →  ascuns sub viewport (translateY 100%)
     • pe măsură ce scrolezi pagina, alunecă în sus din afara cadrului
     • când e complet vizibil, rămâne ca "temelie" (translateY 0)
     • dacă scrolezi mai departe, rămâne pe loc
     • dacă scrolezi înapoi sus, alunecă înapoi jos până dispare
   ============================================================ */

/* ── Ceasuri: New York · București · Shanghai ─────────────
   Format cerut: „EET 3:31 PM”. Abrevierea se calculează din decalajul
   orar curent, deci trece singură între ora de vară și cea de iarnă. */

const CLOCKS: { city: string; tz: string; abbr: Record<string, string> }[] = [
    { city: 'New York',  tz: 'America/New_York', abbr: { '-5': 'EST', '-4': 'EDT' } },
    { city: 'București', tz: 'Europe/Bucharest', abbr: { '2': 'EET', '3': 'EEST' } },
    { city: 'Shanghai',  tz: 'Asia/Shanghai',    abbr: { '8': 'CST' } },
];

function utcOffsetHours(tz: string, now: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find((x) => x.type === type)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    return Math.round((asUtc - now.getTime()) / 3_600_000);
}

function WorldClocks() {
    // pornește gol (server) și se completează în browser → fără nepotriviri la hidratare
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = window.setInterval(() => setNow(new Date()), 10_000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className={styles.cfClocks}>
            {CLOCKS.map((c) => {
                let label = '\u00a0';
                if (now) {
                    const off  = utcOffsetHours(c.tz, now);
                    const abbr = c.abbr[String(off)] ?? `UTC${off >= 0 ? '+' : ''}${off}`;
                    const time = new Intl.DateTimeFormat('en-US', {
                        timeZone: c.tz, hour: 'numeric', minute: '2-digit', hour12: true,
                    }).format(now);
                    label = `${abbr} ${time}`;
                }
                return (
                    <span key={c.tz} className={styles.cfClock} title={c.city}>
                        {label}
                    </span>
                );
            })}
        </div>
    );
}


interface CofinanceProps {
    langLabel:    string;       // limba spre care comută butonul (ex. „EN”)
    onToggleLang: () => void;
}

export default function Cofinance({ langLabel, onToggleLang }: CofinanceProps) {
    const [progress, setProgress] = useState(0);
    const tickingRef = useRef(false);


    useEffect(() => {
        const compute = () => {
            // 60% dintr-un viewport de scroll = revelare completă;
            // după aceea rămâne pinned la bottom: 0.
            const trigger = window.innerHeight * 0.6;
            const p = Math.min(1, Math.max(0, window.scrollY / trigger));
            setProgress(p);
            tickingRef.current = false;
        };

        const onScroll = () => {
            if (!tickingRef.current) {
                requestAnimationFrame(compute);
                tickingRef.current = true;
            }
        };

        compute(); // valoare inițială (în caz că pagina e deja scrolată)
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);


    return (
        <footer
            className={styles.cofinance}
            style={{
                transform: `translateY(${(1 - progress) * 100}%)`,
                transition: 'transform 0.05s linear',
            }}
        >
            <div className={styles.cofinanceInner}>

                {/* stânga: ceasurile (în locul converterului) + butonul de limbă */}
                <div className={styles.cofinanceLeft}>
                    <WorldClocks />
                    <button
                        type="button"
                        className={styles.langBtn}
                        onClick={onToggleLang}
                        aria-label={`Switch to ${langLabel}`}
                        title={`Switch to ${langLabel}`}
                    >
                        {langLabel}
                        <span className={styles.langBtnArrow} aria-hidden="true">⇆</span>
                    </button>
                </div>

                {/* dreapta: logo-urile, apoi cele patru site-uri, unul sub altul */}
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
                    <div className={`${styles.cfLogo} ${styles.cfLogoAdr}`}>
                        ADR<br /><span>NORD-EST</span>
                    </div>
                </div>

                <div className={styles.cofinanceLinks}>
                    <a href="https://mfe.gov.ro" target="_blank" rel="noreferrer">www.mfe.gov.ro</a>
                    <a href="https://regionordest.ro" target="_blank" rel="noreferrer">www.regionordest.ro</a>
                    <a href="https://www.facebook.com/RegioNordEst.ro" target="_blank" rel="noreferrer">www.facebook.com/RegioNordEst.ro</a>
                    <a href="https://regionordest.ro" target="_blank" rel="noreferrer">RegioNordEst.ro</a>
                </div>

                {/* warm yellow tag */}
                <div className={styles.cofinanceTag}>Aproape de tine</div>
            </div>
        </footer>
    );
}
