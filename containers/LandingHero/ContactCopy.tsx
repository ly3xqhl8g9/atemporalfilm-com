'use client';

import { useEffect, useState } from 'react';

import styles from './landing.module.css';



/* ============================================================
   CONTACT din meniu (03.11.2026): nu mai duce la o pagină. Click →
   datele de contact intră în clipboard (text simplu + HTML cu linkuri
   tel: / mailto:, ca să rămână clicabile când sunt lipite într-un mail
   sau într-un document). Sub CONTACT apare scurt confirmarea.
   ============================================================ */


type Lang = 'ro' | 'en' | 'fr';

const CONTACT_PLAIN = [
    'ȘTEFAN AZAHARIOAIE',
    'sound designer, editor',
    '+40 743 343 800',
    'stefan@atemporalfilm.com',
    '',
    'DIANA SMEU',
    'COO',
    '+40 770 789 376',
    'diana@atemporalfilm.com',
    '',
    'atemporalfilm@gmail.com',
    '',
    'Locations',
    'Piatra-Neamt, Progresului 71',
    'Piatra-Neamt, Traian 6',
    'Bucharest, Vasile Lascar 23-25',
    'Romania',
].join('\n');

const CONTACT_HTML = [
    '<div>',
    '<b>ȘTEFAN AZAHARIOAIE</b><br>',
    'sound designer, editor<br>',
    '<a href="tel:+40743343800">+40 743 343 800</a><br>',
    '<a href="mailto:stefan@atemporalfilm.com">stefan@atemporalfilm.com</a><br><br>',
    '<b>DIANA SMEU</b><br>',
    'COO<br>',
    '<a href="tel:+40770789376">+40 770 789 376</a><br>',
    '<a href="mailto:diana@atemporalfilm.com">diana@atemporalfilm.com</a><br><br>',
    '<a href="mailto:atemporalfilm@gmail.com">atemporalfilm@gmail.com</a><br><br>',
    'Locations<br>',
    'Piatra-Neamt, Progresului 71<br>',
    'Piatra-Neamt, Traian 6<br>',
    'Bucharest, Vasile Lascar 23-25<br>',
    'Romania',
    '</div>',
].join('');

const NOTE: Record<Lang, { ok: string; fail: string }> = {
    en: { ok: 'Contact details copied',  fail: 'Could not copy · atemporalfilm@gmail.com' },
    ro: { ok: 'Datele de contact au fost copiate', fail: 'Nu s-a putut copia · atemporalfilm@gmail.com' },
    fr: { ok: 'Coordonnées copiées',     fail: 'Copie impossible · atemporalfilm@gmail.com' },
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


export default function ContactCopy({ lang, label }: { lang: Lang; label: string }) {
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
            <span className={styles.copiedNote} role="status" aria-live="polite">
                {note && <span key={tick} className={styles.copiedNoteText}>{NOTE[lang][note]}</span>}
            </span>
        </span>
    );
}
