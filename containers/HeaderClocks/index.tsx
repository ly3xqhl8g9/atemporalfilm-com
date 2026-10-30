'use client';

import { useEffect, useRef } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   <HeaderClocks />
   În antet, în dreapta logo-ului. Trei timecode-uri la 24 fps
   (Modul Regie, 30.10.2026, seria a patra — ceasurile obișnuite au devenit
   timecode, iar ceasul EET a fost scos, fiind dublat de timecode-ul EET):
     • New York  — „EDT 09:54:21:11”
     • Shanghai  — „CST 21:54:21:11”
     • București — „EET 15:54:21:11”, urmat de REC
   Abrevierea trece singură între ora de vară și cea de iarnă.
   ============================================================ */

interface Zone { city: string; tz: string; abbr: Record<string, string> }

const NEW_YORK:  Zone = { city: 'New York',  tz: 'America/New_York', abbr: { '-5': 'EST', '-4': 'EDT' } };
const BUCHAREST: Zone = { city: 'București', tz: 'Europe/Bucharest', abbr: { '2': 'EET', '3': 'EEST' } };
const SHANGHAI:  Zone = { city: 'Shanghai',  tz: 'Asia/Shanghai',    abbr: { '8': 'CST' } };

/** primul grup (fără REC) și timecode-ul de acasă (cu REC) — ordinea din cue-urile seriei a patra */
const ZONES_FIRST: Zone[] = [NEW_YORK, SHANGHAI];
const ZONE_HOME:   Zone   = BUCHAREST;
const ALL_ZONES:   Zone[] = [...ZONES_FIRST, ZONE_HOME];

const FPS = 24;

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

function abbrFor(z: Zone, now: Date): string {
    const off = utcOffsetHours(z.tz, now);
    return z.abbr[String(off)] ?? `UTC${off >= 0 ? '+' : ''}${off}`;
}

const hmsFormat: Record<string, Intl.DateTimeFormat> = {};
function hms(z: Zone, now: Date): string {
    hmsFormat[z.tz] ??= new Intl.DateTimeFormat('en-GB', {
        timeZone: z.tz, hourCycle: 'h23',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    return hmsFormat[z.tz].format(now);
}

/** „EET 15:54:21:11” — ore:minute:secunde:cadre, 24 de cadre pe secundă. */
function timecode(z: Zone, now: Date): string {
    const frame = Math.floor((now.getMilliseconds() / 1000) * FPS);
    return `${abbrFor(z, now)} ${hms(z, now)}:${String(frame).padStart(2, '0')}`;
}


export default function HeaderClocks({ recLabel = 'REC' }: { recLabel?: string }) {
    // un singur rAF pentru toate trei; textul e scris direct în elemente
    // la fiecare cadru nou (fără re-render React, fără nepotriviri la hidratare)
    const tcRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        let raf = 0;
        let lastFrame = -1;
        const tick = () => {
            const d = new Date();
            const f = Math.floor(d.getTime() / (1000 / FPS));
            if (f !== lastFrame) {
                lastFrame = f;
                ALL_ZONES.forEach((z, i) => {
                    const el = tcRefs.current[i];
                    if (el) el.textContent = timecode(z, d);
                });
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const tc = (z: Zone, i: number) => (
        <span
            key={z.tz}
            ref={(el) => { tcRefs.current[i] = el; }}
            className={`${styles.hdClock} ${styles.hdTimecode}`}
            title={`Timecode 24 fps · ${z.city}`}
        >
            {' '}
        </span>
    );

    return (
        <div className={styles.hdClocks}>
            <span className={styles.hdClockGroup}>
                {ZONES_FIRST.map((z, i) => tc(z, i))}
            </span>
            <span className={styles.hdTimecodeGroup}>
                {tc(ZONE_HOME, ZONES_FIRST.length)}
                <span className={styles.hdRec}>{recLabel}</span>
            </span>
        </div>
    );
}
