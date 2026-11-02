'use client';

import { useEffect, useRef } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   Timecode-uri la 24 fps (ore:minute:secunde:cadre).
   Abrevierea fusului trece singură între ora de vară și cea de iarnă.

   Modul Regie, 02.11.2026:
     • <HeaderClocks /> — în antet rămâne doar București: „EET 15:54:21:11” + ● REC,
       imediat după logo.
     • <WorldClocks />  — timecode-urile lumii, în bara de jos, în două coloane:
         stânga  — Los Angeles · New York · Buenos Aires
         dreapta — Mumbai · Bangkok · Shanghai ▶ PLAYBACK
       New York și Shanghai au coborât din antet (cue-urile 01 și 02);
       Los Angeles, Buenos Aires, Mumbai și Bangkok sunt noi (cue-ul 03).
       Shanghai nu e în REC, ci în PLAYBACK (triunghi verde).
   ============================================================ */

interface Zone { city: string; tz: string; abbr: Record<string, string> }

// cheile: decalajul față de UTC, în ore (5.5 = +5:30)
const LOS_ANGELES:  Zone = { city: 'Los Angeles',  tz: 'America/Los_Angeles',            abbr: { '-8': 'PST', '-7': 'PDT' } };
const NEW_YORK:     Zone = { city: 'New York',     tz: 'America/New_York',               abbr: { '-5': 'EST', '-4': 'EDT' } };
const BUENOS_AIRES: Zone = { city: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', abbr: { '-3': 'ART' } };
const BUCHAREST:    Zone = { city: 'București',    tz: 'Europe/Bucharest',               abbr: { '2': 'EET', '3': 'EEST' } };
const MUMBAI:       Zone = { city: 'Mumbai',       tz: 'Asia/Kolkata',                   abbr: { '5.5': 'IST' } };
const BANGKOK:      Zone = { city: 'Bangkok',      tz: 'Asia/Bangkok',                   abbr: { '7': 'ICT' } };
const SHANGHAI:     Zone = { city: 'Shanghai',     tz: 'Asia/Shanghai',                  abbr: { '8': 'CST' } };

/** coloanele din bara de jos, fiecare de la vest la est */
const AMERICAS: Zone[] = [LOS_ANGELES, NEW_YORK, BUENOS_AIRES];
const ASIA:     Zone[] = [MUMBAI, BANGKOK, SHANGHAI];
const WORLD:    Zone[] = [...AMERICAS, ...ASIA];
const HOME:     Zone[] = [BUCHAREST];
/** fusul care e „în playback” */
const PLAYBACK_ZONE = SHANGHAI;

const FPS = 24;

/** decalajul față de UTC, în ore, cu jumătățile de oră (Mumbai: 5.5) */
function utcOffsetHours(tz: string, now: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find((x) => x.type === type)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    // rotunjit la sfert de oră: secundele lui `now` nu intră în asUtc
    return Math.round((asUtc - now.getTime()) / 900_000) / 4;
}

function abbrFor(z: Zone, now: Date): string {
    const off = utcOffsetHours(z.tz, now);
    if (z.abbr[String(off)]) return z.abbr[String(off)];
    const h = Math.trunc(off);
    const m = Math.round(Math.abs(off - h) * 60);
    return `UTC${off >= 0 ? '+' : '-'}${Math.abs(h)}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
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


/** Un singur rAF pentru un grup de fusuri; textul e scris direct în elemente
    la fiecare cadru nou (fără re-render React, fără nepotriviri la hidratare). */
function useTimecodes(zones: Zone[]) {
    const refs = useRef<(HTMLSpanElement | null)[]>([]);
    useEffect(() => {
        let raf = 0;
        let lastFrame = -1;
        const tick = () => {
            const d = new Date();
            const f = Math.floor(d.getTime() / (1000 / FPS));
            if (f !== lastFrame) {
                lastFrame = f;
                zones.forEach((z, i) => {
                    const el = refs.current[i];
                    if (el) el.textContent = timecode(z, d);
                });
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [zones]);

    const render = (z: Zone, extraClass = '') => {
        const i = zones.indexOf(z);
        return (
            <span
                key={z.tz}
                ref={(el) => { refs.current[i] = el; }}
                className={`${styles.hdClock} ${styles.hdTimecode} ${extraClass}`}
                title={`Timecode 24 fps · ${z.city}`}
            >
                {' '}
            </span>
        );
    };
    return render;
}


/** Antetul: București + REC, imediat după logo. */
export default function HeaderClocks({ recLabel = 'REC' }: { recLabel?: string }) {
    const tc = useTimecodes(HOME);
    return (
        <div className={styles.hdClocks}>
            <span className={styles.hdTimecodeGroup}>
                {tc(BUCHAREST)}
                <span className={styles.hdRec}>{recLabel}</span>
            </span>
        </div>
    );
}


/** Bara de jos: timecode-urile lumii, în două coloane (Americile · Asia). */
export function WorldClocks({ playbackLabel = 'PLAYBACK' }: { playbackLabel?: string }) {
    const tc = useTimecodes(WORLD);
    return (
        <>
            <div className={`${styles.worldClocks} ${styles.wcAmericas}`}>
                {AMERICAS.map((z) => tc(z))}
            </div>
            <div className={`${styles.worldClocks} ${styles.wcAsia}`}>
                {ASIA.map((z) => (z === PLAYBACK_ZONE ? (
                    <span key={z.tz} className={styles.wcRow}>
                        {tc(z)}
                        <span className={styles.hdPlay}>{playbackLabel}</span>
                    </span>
                ) : tc(z)))}
            </div>
        </>
    );
}
