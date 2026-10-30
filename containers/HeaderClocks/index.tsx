'use client';

import { useEffect, useRef, useState } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   <HeaderClocks />
   În antet, în dreapta logo-ului (Modul Regie, 30.10.2026, seria a treia):
     • ceasurile New York · București · Shanghai — „EET 3:31 PM”
       (abrevierea trece singură între ora de vară și cea de iarnă)
     • timecode la 24 fps pe ora României — „EET 15:54:21:11”
     • REC cu bulina roșie, cât înălțimea literelor
   ============================================================ */

const CLOCKS: { city: string; tz: string; abbr: Record<string, string> }[] = [
    { city: 'New York',  tz: 'America/New_York', abbr: { '-5': 'EST', '-4': 'EDT' } },
    { city: 'București', tz: 'Europe/Bucharest', abbr: { '2': 'EET', '3': 'EEST' } },
    { city: 'Shanghai',  tz: 'Asia/Shanghai',    abbr: { '8': 'CST' } },
];

const TC_TZ   = 'Europe/Bucharest';
const TC_ABBR = CLOCKS[1].abbr;
const FPS     = 24;

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

function abbrFor(tz: string, map: Record<string, string>, now: Date): string {
    const off = utcOffsetHours(tz, now);
    return map[String(off)] ?? `UTC${off >= 0 ? '+' : ''}${off}`;
}

const tcFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: TC_TZ, hourCycle: 'h23',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
});

/** „EET 15:54:21:11” — ore:minute:secunde:cadre, 24 de cadre pe secundă. */
function timecode(now: Date): string {
    const hms   = tcFormat.format(now);                        // 15:54:21
    const frame = Math.floor((now.getMilliseconds() / 1000) * FPS);
    return `${abbrFor(TC_TZ, TC_ABBR, now)} ${hms}:${String(frame).padStart(2, '0')}`;
}


export default function HeaderClocks({ recLabel = 'REC' }: { recLabel?: string }) {
    // pornește gol (server) și se completează în browser → fără nepotriviri la hidratare
    const [now, setNow] = useState<Date | null>(null);
    const tcRef = useRef<HTMLSpanElement | null>(null);

    // ceasurile obișnuite: o dată la 10 s ajunge
    useEffect(() => {
        setNow(new Date());
        const id = window.setInterval(() => setNow(new Date()), 10_000);
        return () => window.clearInterval(id);
    }, []);

    // timecode-ul: scris direct în element la fiecare cadru nou (fără re-render React)
    useEffect(() => {
        let raf = 0;
        let lastFrame = -1;
        const tick = () => {
            const d = new Date();
            const f = Math.floor(d.getTime() / (1000 / FPS));
            if (f !== lastFrame && tcRef.current) {
                lastFrame = f;
                tcRef.current.textContent = timecode(d);
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className={styles.hdClocks}>
            <span className={styles.hdClockGroup}>
            {CLOCKS.map((c) => {
                let label = ' ';
                if (now) {
                    const time = new Intl.DateTimeFormat('en-US', {
                        timeZone: c.tz, hour: 'numeric', minute: '2-digit', hour12: true,
                    }).format(now);
                    label = `${abbrFor(c.tz, c.abbr, now)} ${time}`;
                }
                return (
                    <span key={c.tz} className={styles.hdClock} title={c.city}>
                        {label}
                    </span>
                );
            })}
            </span>
            <span className={styles.hdTimecodeGroup}>
                <span
                    ref={tcRef}
                    className={`${styles.hdClock} ${styles.hdTimecode}`}
                    title="Timecode 24 fps · București"
                >
                    {' '}
                </span>
                <span className={styles.hdRec}>{recLabel}</span>
            </span>
        </div>
    );
}
