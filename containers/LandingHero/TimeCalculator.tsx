'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from './landing.module.css';



/* ============================================================
   TIME CALCULATOR (03.11.2026) — fostul buton ENCODER din bara de jos.
   Click → o căsuță, ca la GEAR, cu un calculator de time stretch audio
   între două cadențe de cadre (ex. 24 → 25 fps, 30 → 24 fps):
     • raportul (viteza nouă / viteza veche), ca fracție exactă și zecimal
     • rata de conversie (cât se schimbă viteza, în %)
     • durata nouă (% din durata veche — valoarea cerută de uneltele de time stretch)
     • tonul, dacă se face varispeed (fără corecția tonului), în semitonuri și cenți
     • la ce frecvență se citește un fișier de 48 kHz ca să iasă același varispeed
     • durata filmului: cât ține după conversie
   Cadențele NTSC sunt fracții exacte (23,976 = 24000/1001), deci
   23,976 → 24 dă exact 1001 : 1000. Click pe o valoare = o copiază.
   ============================================================ */


type Lang = 'ro' | 'en' | 'fr';

export const TIME_CALC_LABEL = 'Time Calculator';

const TEXT: Record<Lang, {
    lead: string; from: string; to: string; other: string; swap: string;
    ratio: string; rate: string; length: string; pitch: string; sr: string;
    runtime: string; note: string; copied: string; close: string;
}> = {
    en: {
        lead:    'Audio time stretch between frame rates.',
        from:    'From',
        to:      'To',
        other:   'other',
        swap:    'Swap',
        ratio:   'Ratio',
        rate:    'Conversion rate',
        length:  'New length',
        pitch:   'Varispeed pitch',
        sr:      '48 kHz read as',
        runtime: 'Runtime',
        note:    'Click a value to copy it.',
        copied:  'Copied',
        close:   'Close',
    },
    ro: {
        lead:    'Time stretch audio între două cadențe de cadre.',
        from:    'De la',
        to:      'La',
        other:   'alta',
        swap:    'Inversează',
        ratio:   'Raport',
        rate:    'Rata de conversie',
        length:  'Durata nouă',
        pitch:   'Ton la varispeed',
        sr:      '48 kHz citit ca',
        runtime: 'Durata filmului',
        note:    'Click pe o valoare ca s-o copiezi.',
        copied:  'Copiat',
        close:   'Închide',
    },
    fr: {
        lead:    'Time stretch audio entre deux cadences d’images.',
        from:    'De',
        to:      'Vers',
        other:   'autre',
        swap:    'Inverser',
        ratio:   'Rapport',
        rate:    'Taux de conversion',
        length:  'Nouvelle durée',
        pitch:   'Pitch en varispeed',
        sr:      '48 kHz lu à',
        runtime: 'Durée du film',
        note:    'Cliquez sur une valeur pour la copier.',
        copied:  'Copié',
        close:   'Fermer',
    },
};


/* ── cadențele: fracții exacte (fps = n / d) ─────────────────── */

interface Rate { n: number; d: number }

const PRESETS: { label: string; r: Rate }[] = [
    { label: '23.976', r: { n: 24000, d: 1001 } },
    { label: '24',     r: { n: 24,    d: 1 } },
    { label: '25',     r: { n: 25,    d: 1 } },
    { label: '29.97',  r: { n: 30000, d: 1001 } },
    { label: '30',     r: { n: 30,    d: 1 } },
];
const NTSC_BASES = [24, 30, 48, 60, 120];

const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const fpsOf = (r: Rate) => r.n / r.d;
const sameRate = (a: Rate, b: Rate) => a.n * b.d === b.n * a.d;

/* „23.976”, „23,98”, „29.97” → fracțiile NTSC exacte; restul, la 1/1000 */
function parseRate(s: string): Rate | null {
    const v = parseFloat(s.replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0 || v > 1000) return null;
    for (const k of NTSC_BASES) {
        const ntsc = (k * 1000) / 1001;
        if (Math.abs(v - ntsc) < 0.006 && Math.abs(v - k) > 0.006) return { n: k * 1000, d: 1001 };
    }
    const n = Math.round(v * 1000);
    const g = gcd(n, 1000);
    return { n: n / g, d: 1000 / g };
}

function rateText(r: Rate): string {
    const p = PRESETS.find((x) => sameRate(x.r, r));
    if (p) return p.label;
    return String(Number(fpsOf(r).toFixed(3)));
}


/* ── formatare ─────────────────────────────────────────────── */

const MINUS = '−';   // pe ecran; la copiere, „-” simplu
const signed = (v: number, dp: number) => {
    const s = Math.abs(v).toFixed(dp);
    if (Number(s) === 0) return `±${s}`;
    return `${v > 0 ? '+' : MINUS}${s}`;
};
const plain = (v: number, dp: number) => (Number(v.toFixed(dp)) === 0 ? 0 : v).toFixed(dp);
const thousands = (s: string) => {
    const [i, f] = s.split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (f ? `.${f}` : '');
};

/* durata: H:MM:SS:FF, H:MM:SS, MM:SS sau minute */
function parseRuntime(s: string, nominal: number): number | null {
    const parts = s.trim().split(/[:;.]/).filter((p) => p !== '');
    if (!parts.length || parts.length > 4) return null;
    const v = parts.map(Number);
    if (v.some((x) => !Number.isFinite(x) || x < 0)) return null;
    let h = 0, m = 0, sec = 0, ff = 0;
    if (v.length === 4) [h, m, sec, ff] = v;
    else if (v.length === 3) [h, m, sec] = v;
    else if (v.length === 2) [m, sec] = v;
    else [m] = v;
    if (ff >= nominal) return null;
    return h * 3600 + m * 60 + sec + ff / nominal;
}
function formatRuntime(sec: number, nominal: number): string {
    const total = Math.round(sec * nominal);
    const ff = total % nominal;
    const s  = Math.floor(total / nominal);
    const p  = (x: number) => String(x).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
}


/* ── forma de undă pentru desenul întinderii (aceeași de fiecare dată) ── */

const BARS = 84;
const WAVE = Array.from({ length: BARS }, (_, i) => {
    const a = Math.abs(Math.sin(i * 0.61) * 0.55 + Math.sin(i * 0.173 + 1.3) * 0.45);
    const b = Math.abs(Math.sin(i * 2.71 + 0.4));
    return 0.14 + 0.86 * Math.min(1, a * (0.55 + 0.45 * b));
});

function Wave() {
    return (
        <svg className={styles.tcWaveSvg} viewBox={`0 0 ${BARS * 3} 20`} preserveAspectRatio="none" aria-hidden="true">
            {WAVE.map((h, i) => (
                <rect key={i} x={i * 3} y={10 - h * 10} width={1.5} height={h * 20} />
            ))}
        </svg>
    );
}


/* ── numărul mare se derulează de la valoarea veche la cea nouă ── */

function useRolling(target: number): number {
    const [shown, setShown] = useState(target);
    const shownRef = useRef(target);
    useEffect(() => {
        if (!Number.isFinite(target)) { shownRef.current = target; setShown(target); return; }
        const from = shownRef.current;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!Number.isFinite(from) || reduce || from === target) { shownRef.current = target; setShown(target); return; }
        const t0 = performance.now();
        const dur = 560;
        let raf = 0;
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - k, 3);
            const v = from + (target - from) * e;
            shownRef.current = v;
            setShown(v);
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target]);
    return shown;
}


/* ── rândul cu cadențe: butoanele obișnuite + o valoare oarecare ── */

function RateRow({ label, value, onChange, other }: {
    label: string; value: Rate; onChange: (r: Rate) => void; other: string;
}) {
    const isPreset = PRESETS.some((p) => sameRate(p.r, value));
    const [draft, setDraft] = useState(isPreset ? '' : rateText(value));
    useEffect(() => { if (isPreset) setDraft(''); else setDraft((d) => d || rateText(value)); }, [isPreset, value]);

    return (
        <div className={styles.tcRateRow}>
            <span className={styles.tcLabel}>{label}</span>
            <div className={styles.tcChips} role="group" aria-label={label}>
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        className={`${styles.tcChip} ${sameRate(p.r, value) ? styles.tcChipOn : ''}`}
                        aria-pressed={sameRate(p.r, value)}
                        onClick={() => onChange(p.r)}
                    >
                        {p.label}
                    </button>
                ))}
                <input
                    className={`${styles.tcOther} ${!isPreset ? styles.tcChipOn : ''}`}
                    type="text"
                    inputMode="decimal"
                    spellCheck={false}
                    placeholder={other}
                    aria-label={`${label} (fps)`}
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const r = parseRate(e.target.value);
                        if (r) onChange(r);
                    }}
                />
            </div>
        </div>
    );
}


export default function TimeCalculator({ lang }: { lang: Lang }) {
    const tx = TEXT[lang];
    const [open, setOpen]       = useState(false);
    const [src, setSrc]         = useState<Rate>(PRESETS[1].r);   // 24
    const [dst, setDst]         = useState<Rate>(PRESETS[2].r);   // 25
    const [runtime, setRuntime] = useState('01:30:00:00');
    const [copied, setCopied]   = useState<string | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    const close = useCallback(() => setOpen(false), []);

    // Esc sau click în afara căsuței → se închide (ca la GEAR)
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

    useEffect(() => {
        if (!copied) return;
        const id = window.setTimeout(() => setCopied(null), 1600);
        return () => window.clearTimeout(id);
    }, [copied]);

    /* calculul — totul din fracțiile exacte */
    const r = useMemo(() => {
        const num = dst.n * src.d;          // viteza nouă / viteza veche
        const den = dst.d * src.n;
        const g   = gcd(num, den);
        const speed  = num / den;
        const length = den / num;
        const cents  = 1200 * Math.log2(speed);
        const hz     = 48000 * speed;
        return { fracN: num / g, fracD: den / g, speed, length, cents, hz };
    }, [src, dst]);

    const srcNominal = Math.max(1, Math.round(fpsOf(src)));
    const dstNominal = Math.max(1, Math.round(fpsOf(dst)));
    const runSec     = parseRuntime(runtime, srcNominal);
    const runOut     = runSec === null ? '—' : formatRuntime(runSec * r.length, dstNominal);

    const rolling = useRolling(r.speed);

    // desenul: cea mai lungă dintre cele două durate ocupă toată lățimea
    const longest = Math.max(1, r.length);
    const scaleSrc = 1 / longest;
    const scaleDst = r.length / longest;

    const copy = (key: string, text: string) => {
        const done = () => setCopied(key);
        try {
            if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text).then(done, () => {}); return; }
        } catch { /* nimic */ }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { if (document.execCommand('copy')) done(); } catch { /* nimic */ }
        ta.remove();
    };

    const hzText = Number.isInteger(Math.round(r.hz * 100) / 100) ? Math.round(r.hz).toString() : r.hz.toFixed(2);

    const rows: { key: string; label: string; shown: React.ReactNode; copyText: string }[] = [
        { key: 'rate',   label: tx.rate,   shown: `${signed((r.speed - 1) * 100, 4)} %`, copyText: plain((r.speed - 1) * 100, 4) },
        { key: 'length', label: tx.length, shown: `${(r.length * 100).toFixed(4)} %`,    copyText: (r.length * 100).toFixed(4) },
        { key: 'pitch',  label: tx.pitch,
          shown: <>{signed(r.cents / 100, 4)} st <span className={styles.tcSep}>·</span> {signed(r.cents, 2)} ct</>,
          copyText: plain(r.cents / 100, 4) },
        { key: 'sr',     label: tx.sr,     shown: `${thousands(hzText)} Hz`,               copyText: hzText },
    ];

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                className={`${styles.langBtn} ${styles.tcBtn} ${open ? styles.tcBtnOn : ''}`}
                aria-expanded={open}
                aria-controls="time-calculator"
                onClick={() => setOpen((o) => !o)}
            >
                <span>Time</span><span>Calculator</span>
            </button>

            {open && (
                <div
                    id="time-calculator"
                    ref={boxRef}
                    className={`${styles.gearBox} ${styles.tcBox}`}
                    role="dialog"
                    aria-label={TIME_CALC_LABEL}
                >
                    <button type="button" className={styles.gearClose} onClick={close} aria-label={tx.close}>×</button>
                    <p className={styles.tcTitle}>{TIME_CALC_LABEL}</p>
                    <p className={styles.tcLead}>{tx.lead}</p>

                    <RateRow label={tx.from} value={src} onChange={setSrc} other={tx.other} />
                    <button
                        type="button"
                        className={styles.tcSwap}
                        onClick={() => { setSrc(dst); setDst(src); }}
                        aria-label={tx.swap}
                        title={tx.swap}
                    >⇅</button>
                    <RateRow label={tx.to} value={dst} onChange={setDst} other={tx.other} />

                    {/* întinderea, desenată: aceeași undă, la durata veche și la cea nouă */}
                    <div className={styles.tcWaves} aria-hidden="true">
                        <div className={styles.tcWaveRow}>
                            <span className={styles.tcWaveFps}>{rateText(src)}</span>
                            <div className={styles.tcTrack}>
                                <div className={`${styles.tcWave} ${styles.tcWaveSrc}`} style={{ transform: `scaleX(${scaleSrc})` }}><Wave /></div>
                            </div>
                        </div>
                        <div className={styles.tcWaveRow}>
                            <span className={styles.tcWaveFps}>{rateText(dst)}</span>
                            <div className={styles.tcTrack}>
                                <div className={styles.tcWave} style={{ transform: `scaleX(${scaleDst})` }}><Wave /></div>
                            </div>
                        </div>
                    </div>

                    {/* raportul, mare */}
                    <button
                        type="button"
                        className={styles.tcRatio}
                        onClick={() => copy('ratio', r.speed.toFixed(6))}
                        aria-label={`${tx.ratio} ${r.speed.toFixed(6)}`}
                    >
                        <span className={styles.tcLabel}>{tx.ratio}</span>
                        <span className={styles.tcRatioNum}>{rolling.toFixed(6)}</span>
                        <span className={styles.tcRatioFrac}>{r.fracN} : {r.fracD}</span>
                        {copied === 'ratio' && <span className={styles.tcCopied}>{tx.copied}</span>}
                    </button>

                    <dl className={styles.tcRows}>
                        {rows.map((row) => (
                            <div key={row.key} className={styles.tcRow}>
                                <dt className={styles.tcLabel}>
                                    {/* „kHz” rămâne scris corect, nu „KHZ” */}
                                    {row.label.split('kHz').map((part, i) => (
                                        <span key={i}>{i > 0 && <span className={styles.tcUnit}>kHz</span>}{part}</span>
                                    ))}
                                </dt>
                                <dd>
                                    <button type="button" className={styles.tcValue} onClick={() => copy(row.key, row.copyText)}>
                                        {row.shown}
                                    </button>
                                    {copied === row.key && <span className={styles.tcCopied}>{tx.copied}</span>}
                                </dd>
                            </div>
                        ))}
                        <div className={`${styles.tcRow} ${styles.tcRowRuntime}`}>
                            <dt className={styles.tcLabel}>{tx.runtime}</dt>
                            <dd>
                                <input
                                    className={styles.tcRuntimeIn}
                                    type="text"
                                    inputMode="numeric"
                                    spellCheck={false}
                                    value={runtime}
                                    onChange={(e) => setRuntime(e.target.value)}
                                    aria-label={`${tx.runtime}, ${rateText(src)} fps`}
                                    aria-invalid={runSec === null || undefined}
                                />
                                <span className={styles.tcArrow}>→</span>
                                <button type="button" className={styles.tcValue} onClick={() => runOut !== '—' && copy('runtime', runOut)}>
                                    {runOut}
                                </button>
                                {copied === 'runtime' && <span className={styles.tcCopied}>{tx.copied}</span>}
                            </dd>
                        </div>
                    </dl>

                    <p className={styles.gearNote}>{tx.note}</p>
                </div>
            )}
        </>
    );
}
