'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './landing.module.css';



/* ============================================================
   GEAR din meniu (03.11.2026): nu mai e o pagină. Click → o căsuță
   sub meniu, în coloana din dreapta: „Adaugă-ți mailul aici ca să
   primești lista de echipament.” După trimitere, /api/gear păstrează
   adresa și răspunde cu PDF-ul cu echipamentul, care se descarcă imediat.
   ============================================================ */


import type { Lang } from './i18n';

const TEXT: Record<Lang, {
    prompt: string; placeholder: string; send: string; sending: string;
    done: string; invalid: string; error: string; note: string; quote: string; close: string;
}> = {
    en: {
        prompt:      'Add your email here to receive the gear list.',
        placeholder: 'name@email.com',
        send:        'Send',
        sending:     'Sending…',
        done:        'Thank you. The list is downloading.',
        invalid:     'Please check the address.',
        error:       'Something went wrong. Write to us at atemporalfilm@gmail.com.',
        note:        'We keep your address only for gear inquiries.',
        quote:       'For price quotes, write to us at',
        close:       'Close',
    },
    ro: {
        prompt:      'Adaugă-ți mailul aici ca să primești lista de echipament.',
        placeholder: 'nume@email.ro',
        send:        'Trimite',
        sending:     'Se trimite…',
        done:        'Mulțumim. Lista se descarcă.',
        invalid:     'Verifică adresa, te rog.',
        error:       'Ceva n-a mers. Scrie-ne la atemporalfilm@gmail.com.',
        note:        'Păstrăm adresa doar pentru cererile de echipament.',
        quote:       'Pentru oferte de preț, scrie-ne la',
        close:       'Închide',
    },
    fr: {
        prompt:      'Ajoutez votre e-mail ici pour recevoir la liste du matériel.',
        placeholder: 'nom@email.fr',
        send:        'Envoyer',
        sending:     'Envoi…',
        done:        'Merci. La liste se télécharge.',
        invalid:     'Vérifiez l’adresse, s’il vous plaît.',
        error:       'Une erreur est survenue. Écrivez-nous à atemporalfilm@gmail.com.',
        note:        'Nous gardons votre adresse uniquement pour les demandes de matériel.',
        quote:       'Pour un devis, écrivez-nous à',
        close:       'Fermer',
    },
    es: {
        prompt:      'Deja aquí tu correo para recibir la lista de material.',
        placeholder: 'nombre@correo.es',
        send:        'Enviar',
        sending:     'Enviando…',
        done:        'Gracias. La lista se está descargando.',
        invalid:     'Revisa la dirección, por favor.',
        error:       'Algo ha fallado. Escríbenos a atemporalfilm@gmail.com.',
        note:        'Solo guardamos tu dirección para las consultas de material.',
        quote:       'Para presupuestos, escríbenos a',
        close:       'Cerrar',
    },
    th: {
        prompt:      'กรอกอีเมลของคุณที่นี่เพื่อรับรายการอุปกรณ์',
        placeholder: 'name@email.com',
        send:        'ส่ง',
        sending:     'กำลังส่ง…',
        done:        'ขอบคุณ กำลังดาวน์โหลดรายการ',
        invalid:     'โปรดตรวจสอบที่อยู่อีเมล',
        error:       'เกิดข้อผิดพลาด เขียนถึงเราได้ที่ atemporalfilm@gmail.com',
        note:        'เราเก็บอีเมลของคุณไว้สำหรับการสอบถามเรื่องอุปกรณ์เท่านั้น',
        quote:       'ขอใบเสนอราคา เขียนถึงเราได้ที่',
        close:       'ปิด',
    },
    zh: {
        prompt:      '在此留下您的邮箱，即可收到器材清单。',
        placeholder: 'name@email.com',
        send:        '发送',
        sending:     '发送中…',
        done:        '谢谢。清单正在下载。',
        invalid:     '请检查邮箱地址。',
        error:       '出了点问题。请写信至 atemporalfilm@gmail.com',
        note:        '您的邮箱仅用于器材咨询。',
        quote:       '如需报价，请写信至',
        close:       '关闭',
    },
    hi: {
        prompt:      'उपकरणों की सूची पाने के लिए अपना ईमेल यहाँ लिखें।',
        placeholder: 'name@email.com',
        send:        'भेजें',
        sending:     'भेजा जा रहा है…',
        done:        'धन्यवाद। सूची डाउनलोड हो रही है।',
        invalid:     'कृपया पता जाँच लें।',
        error:       'कुछ गड़बड़ हो गई। हमें atemporalfilm@gmail.com पर लिखें।',
        note:        'हम आपका पता केवल उपकरण संबंधी पूछताछ के लिए रखते हैं।',
        quote:       'कीमत के कोटेशन के लिए हमें लिखें:',
        close:       'बंद करें',
    },
};
/* punctul de după adresa din rândul pentru oferte (în thai și chineză nu se pune) */
const QUOTE_END: Record<Lang, string> = { en: '.', es: '.', fr: '.', ro: '.', th: '', zh: '。', hi: '।' };

const DOWNLOAD_NAME = 'Atemporal-Film-Equipment.pdf';
const STORE_KEY     = 'af-gear-email';     // adresa rămâne completată la a doua cerere
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type State = 'idle' | 'sending' | 'done' | 'invalid' | 'error';


export default function GearRequest({ lang, label }: { lang: Lang; label: string }) {
    const tx = TEXT[lang];
    const [open, setOpen]   = useState(false);
    const [email, setEmail] = useState('');
    const [state, setState] = useState<State>('idle');
    const boxRef   = useRef<HTMLDivElement>(null);
    const btnRef   = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const honeyRef = useRef<HTMLInputElement>(null);

    const close = useCallback(() => { setOpen(false); setState('idle'); }, []);

    // la deschidere: adresa folosită data trecută + cursorul în câmp
    useEffect(() => {
        if (!open) return;
        try {
            const saved = window.localStorage.getItem(STORE_KEY);
            if (saved) setEmail((v) => v || saved);
        } catch { /* fără localStorage: câmpul rămâne gol */ }
        inputRef.current?.focus({ preventScroll: true });
    }, [open]);

    // Esc sau click în afara căsuței → se închide
    useEffect(() => {
        if (!open) return;
        const onKey  = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
        const onDown = (e: PointerEvent) => {
            const n = e.target as Node;
            if (boxRef.current?.contains(n) || btnRef.current?.contains(n)) return;
            close();
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointerdown', onDown);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pointerdown', onDown);
        };
    }, [open, close]);

    // după descărcare, căsuța se închide singură
    useEffect(() => {
        if (state !== 'done') return;
        const id = window.setTimeout(close, 2800);
        return () => window.clearTimeout(id);
    }, [state, close]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!EMAIL_RE.test(value)) { setState('invalid'); return; }
        setState('sending');
        try {
            const res = await fetch('/api/gear', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: value, lang, website: honeyRef.current?.value ?? '' }),
            });
            if (!res.ok) { setState(res.status === 400 ? 'invalid' : 'error'); return; }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = DOWNLOAD_NAME;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 10000);
            try { window.localStorage.setItem(STORE_KEY, value); } catch { /* nimic */ }
            setState('done');
        } catch {
            setState('error');
        }
    };

    const status =
        state === 'done'    ? tx.done    :
        state === 'invalid' ? tx.invalid :
        state === 'error'   ? tx.error   : '';

    return (
        <>
            <span className={`${styles.navItemAt} ${styles.navGear}`}>
                <button
                    ref={btnRef}
                    type="button"
                    className={`${styles.navItem} ${styles.navButton} ${open ? styles.navItemActive : ''}`}
                    aria-expanded={open}
                    aria-controls="gear-request"
                    onClick={() => (open ? close() : setOpen(true))}
                >
                    {label}
                </button>
                {/* 03.11, 12:41 (nota Regie): virgula după GEAR — „GEAR, CONTACT” */}
                <span className={`${styles.navItem} ${styles.navComma}`} aria-hidden="true">,</span>

            {/* 03.11, 12:41: căsuța stă sub „GEAR, CONTACT”, cu marginea dreaptă la --nav-r */}
            {open && (
                <div
                    id="gear-request"
                    ref={boxRef}
                    className={styles.gearBox}
                    role="dialog"
                    aria-label={label}
                >
                    <button type="button" className={styles.gearClose} onClick={close} aria-label={tx.close}>×</button>
                    <p className={styles.gearPrompt}>{tx.prompt}</p>

                    <form className={styles.gearForm} onSubmit={submit} noValidate>
                        <input
                            ref={inputRef}
                            className={styles.gearInput}
                            type="email"
                            name="email"
                            autoComplete="email"
                            inputMode="email"
                            spellCheck={false}
                            placeholder={tx.placeholder}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (state === 'invalid' || state === 'error') setState('idle'); }}
                            aria-label="Email"
                            aria-invalid={state === 'invalid' || undefined}
                            disabled={state === 'sending' || state === 'done'}
                        />
                        {/* capcană pentru roboți: oamenii nu văd câmpul */}
                        <input ref={honeyRef} className={styles.gearHoney} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                        <button
                            type="submit"
                            className={styles.gearSend}
                            disabled={state === 'sending' || state === 'done' || !email.trim()}
                        >
                            {state === 'sending' ? tx.sending : `${tx.send} →`}
                        </button>
                    </form>

                    <p className={styles.gearStatus} role="status" aria-live="polite">{status}</p>
                    <p className={styles.gearNote}>
                        {tx.note}<br />
                        {tx.quote} <a href="mailto:atemporalfilm@gmail.com">atemporalfilm@gmail.com</a>{QUOTE_END[lang]}
                    </p>
                </div>
            )}
            </span>
        </>
    );
}
