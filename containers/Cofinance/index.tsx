'use client';

import { WorldClocks } from '@/containers/HeaderClocks';
import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   <Cofinance />
   Bara de jos: butonul de limbă + vizibilitatea UE / Regio / ADR Nord-Est.

   30.10.2026 (Modul Regie, seria a treia): bara e fixă (mereu vizibilă,
   nu mai apare la scroll), fără linii de separare. Ceasurile au urcat în
   antet; „Aproape de tine” a fost scos. Așezare (la 2048 px):
     • butonul de limbă — textul lui aliniat cu lista de filme (seria a patra)
     • UE + Regio — la ~19,6% din lățime
     • cele patru site-uri, apoi ADR Nord-Est — în coloana din dreapta (seria a patra)
   02.11.2026: timecode-urile lumii — Los Angeles · New York · Buenos Aires după
   Regio, Mumbai · Bangkok · Shanghai (▶ PLAYBACK) după ADR Nord-Est.
   ============================================================ */

interface CofinanceProps {
    langLabel:    string;       // limba spre care comută butonul (ex. „EN”)
    onToggleLang: () => void;
}

export default function Cofinance({ langLabel, onToggleLang }: CofinanceProps) {
    return (
        <footer className={styles.cofinance}>

            <div className={styles.cofinanceLeft}>
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

            {/* timecode-urile lumii (02.11.2026) — două coloane, vezi HeaderClocks */}
            <WorldClocks />

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
