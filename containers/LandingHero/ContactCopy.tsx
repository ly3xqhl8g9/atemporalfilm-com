'use client';

import { useEffect, useState } from 'react';

import type { Lang } from './i18n';
import styles from './landing.module.css';



/* ============================================================
   CONTACT din meniu (03.11.2026): nu mai duce la o pagină. Click →
   adresa atemporalfilm@gmail.com intră în clipboard (text simplu + HTML
   cu link mailto:, ca să rămână clicabilă când e lipită într-un mail sau
   document). În dreapta lui CONTACT apare scurt confirmarea.
   ============================================================ */


/* 03.11.2026, 11:06 (nota Regie 01): CONTACT copiază doar adresa comună */
const CONTACT_PLAIN = 'atemporalfilm@gmail.com';
const CONTACT_HTML  = '<a href="mailto:atemporalfilm@gmail.com">atemporalfilm@gmail.com</a>';

/* dacă browserul nu lasă copierea, arătăm adresa (încape în dreapta lui CONTACT) */
const NOTE: Record<Lang, { ok: string; fail: string }> = {
    en: { ok: 'Email copied',      fail: 'atemporalfilm@gmail.com' },
    es: { ok: 'Correo copiado',    fail: 'atemporalfilm@gmail.com' },
    fr: { ok: 'E-mail copié',      fail: 'atemporalfilm@gmail.com' },
    ro: { ok: 'Mail copiat',       fail: 'atemporalfilm@gmail.com' },
    th: { ok: 'คัดลอกอีเมลแล้ว',     fail: 'atemporalfilm@gmail.com' },
    zh: { ok: '邮箱已复制',          fail: 'atemporalfilm@gmail.com' },
    hi: { ok: 'ईमेल कॉपी हो गया',    fail: 'atemporalfilm@gmail.com' },
};


async function copyContact(): Promise<boolean> {
    // 1. text + HTML (Safari 13.1+, Chrome, Firefox 127+)
    try {
        if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([CONTACT_PLAIN], { type: 'text/plain' }),
                    'text/html':  new Blob([CONTACT_HTML],  { type: 'text/html' }),
                }),
            ]);
            return true;
        }
    } catch { /* încercăm doar textul */ }
    // 2. doar text
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(CONTACT_PLAIN);
            return true;
        }
    } catch { /* încercăm metoda veche */ }
    // 3. metoda veche (fără Clipboard API)
    try {
        const ta = document.createElement('textarea');
        ta.value = CONTACT_PLAIN;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch {
        return false;
    }
}


/** `social` (03.11, 13:49): pe WORK, iconițele Instagram / LinkedIn stau pe
    rândul lui CONTACT, imediat după cuvânt (îl urmează oricât de lung e în
    altă limbă); confirmarea „Email copied” apare după ele */
export default function ContactCopy({ lang, label, social = false }: { lang: Lang; label: string; social?: boolean }) {
    const [note, setNote] = useState<null | 'ok' | 'fail'>(null);
    const [tick, setTick] = useState(0);   // repornește animația la fiecare click

    useEffect(() => {
        if (!note) return;
        const id = window.setTimeout(() => setNote(null), 2600);
        return () => window.clearTimeout(id);
    }, [note, tick]);

    const onClick = async () => {
        const ok = await copyContact();
        setNote(ok ? 'ok' : 'fail');
        setTick((n) => n + 1);
    };

    return (
        <span className={`${styles.navItemAt} ${styles.navContact}`}>
            <button
                type="button"
                className={`${styles.navItem} ${styles.navButton}`}
                onClick={onClick}
            >
                {label}
            </button>
            {social && (
                <span className={styles.navSocial}>
                    <a className={styles.socialIcon} style={{ '--icon': 'url("/assets/logos/icon-instagram-mask.png")' } as React.CSSProperties}
                       href="https://www.instagram.com/atemporalfilm" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" />
                    <a className={styles.socialIcon} style={{ '--icon': 'url("/assets/logos/icon-linkedin-mask.png")' } as React.CSSProperties}
                       href="https://www.linkedin.com/company/atemporal-film" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" />
                </span>
            )}
            <span className={styles.copiedNote} role="status" aria-live="polite">
                {note && <span key={tick} className={styles.copiedNoteText}>{NOTE[lang][note]}</span>}
            </span>
        </span>
    );
}


/* WORK — contactele scrise sub CONTACT (Modul Regie, 03.11.2026, 10:40, nota 06):
   textul exact cum l-a trimis Ștefan, mic, ca „by Stefan Azaharioaie”.
   03.11, 11:33: butoanele Instagram și LinkedIn de pe site-ul vechi
   (data/constants.ts → socialLinks), Instagram în dreptul lui „editor”,
   LinkedIn în dreptul lui „manager”. Iconițele: public/assets/logos/
   icon-*-mask.png, făcute din logo-*.png (doar desenul, ca pe site-ul vechi:
   Instagram contur, LinkedIn cerc plin cu „in” decupat).
   (Butonul CONTACT copiază doar adresa comună — din 03.11, 11:06.) */
export function WorkContacts() {
    /* 03.11.2026, 13:49: Instagram și LinkedIn au trecut pe rândul lui CONTACT
       (în ContactCopy, `social`); mailul a revenit între telefonul Dianei și
       Locations */
    return (
        <address className={styles.workContacts}>
            <p>
                ȘTEFAN AZAHARIOAIE<br />
                sound designer, editor<br />
                <a href="tel:+40743343800">+40 743 343 800</a>
            </p>
            <p>
                DIANA SMEU<br />
                distribution, manager<br />
                <a href="tel:+40770789376">+40 770 789 376</a>
            </p>
            <p>
                <a href="mailto:atemporalfilm@gmail.com">atemporalfilm@gmail.com</a>
            </p>
            <p>
                Locations<br />
                Piatra-Neamt, Progresului 71<br />
                Bucharest, Vasile Lascar 23-25<br />
                Romania
            </p>
        </address>
    );
}
