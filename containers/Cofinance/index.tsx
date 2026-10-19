'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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

export default function Cofinance() {
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

                {/* logos block */}
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

                {/* converter link */}
                <div className={styles.cofinanceMid}>
                    <Link href="/converter" className={styles.cfLink}>converter</Link>
                </div>

                {/* disclaimer */}
                <div className={styles.cofinanceText}>
                    For detailed information on the other programs co-financed by the European
                    Union, please visit{' '}
                    <a href="https://mfe.gov.ro" target="_blank" rel="noreferrer">mfe.gov.ro</a>
                </div>

                {/* external links */}
                <div className={styles.cofinanceLinks}>
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
