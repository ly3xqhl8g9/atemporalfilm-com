'use client';

import { useEffect, useRef } from 'react';

import type { Lang } from './i18n';
import styles from './landing.module.css';



/* ============================================================
   FIȘELE DE PE TELEFON (03.11.2026, 18:30 — varianta aleasă de Ștefan:
   „fișe care urcă de jos”). Pe ecranele sub 1280 px nu încap lista de
   filme, timecode-urile, contactele scrise și TIME CALCULATOR; ecranul cu
   pelicula rămâne la fel, iar fiecare dintre ele se deschide într-o fișă
   care urcă de jos, din butonul care există deja:
     • ceasul București (sub meniu)  → TIMECODE: cele 9 ceasuri + TIME CALCULATOR
     • CONTACT                        → copiază mailul și deschide contactele
     • titlul filmului (sub peliculă) → lista filmelor
   Se închide cu ×, Esc sau atingând pagina de deasupra fișei. Pe desktop
   (≥ 1280 px) fișele nu există.
   ============================================================ */

export const CLOSE_LABEL: Record<Lang, string> = {
    en: 'Close', es: 'Cerrar', fr: 'Fermer', ro: 'Închide', th: 'ปิด', zh: '关闭', hi: 'बंद करें',
};

/** true pe ecranele sub 1280 px (telefon, tabletă), unde se folosesc fișele */
export function isNarrowScreen(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
}

export default function PhoneSheet({
    open, title, lang, onClose, children,
}: {
    open: boolean;
    title: string;
    lang: Lang;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        ref.current?.focus({ preventScroll: true });
        // lista filmelor: filmul de acum la mijlocul fișei
        ref.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'center' });
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className={styles.sheetWrap}>
            <div className={styles.sheetBackdrop} onClick={onClose} aria-hidden="true" />
            <div ref={ref} className={styles.sheet} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
                <div className={styles.sheetHead}>
                    <span className={styles.sheetTitle}>{title}</span>
                    <button type="button" className={styles.sheetClose} onClick={onClose} aria-label={CLOSE_LABEL[lang]}>×</button>
                </div>
                <div className={styles.sheetBody}>{children}</div>
            </div>
        </div>
    );
}
