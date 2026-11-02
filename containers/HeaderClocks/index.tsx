'use client';

import { useEffect, useRef } from 'react';

import styles from '@/containers/LandingHero/landing.module.css';



/* ============================================================
   Timecode-uri la 24 fps (ore:minute:secunde:cadre).
   Abrevierea fusului trece singură între ora de vară și cea de iarnă.

   Modul Regie, 02.11.2026 (a doua serie, 14:20):
     • <HeaderClocks /> — în antet, imediat după logo: București și Madrid,
       fiecare cu ● REC (Madrid e nou, cue-ul 09).
     • <WorldClocks />  — timecode-urile lumii au urcat din bara de jos în
       coloana din dreapta, fiecare cu starea lui de „magnetofon”:
         sub meniu   — Los Angeles ▶ PLAYBACK · Mumbai ■ STOP ·
                       Shanghai ▶ PLAYBACK · Bangkok ▶ PLAYBACK
         sub credit  — New York ▶ PLAYBACK · Buenos Aires ■ STOP
       (cue-urile 02–08; ordinea rândurilor e cea din cue-uri).

   Modul Regie, 02.11.2026, 15:00:
     • Bangkok urcă în antet, după Madrid, doar cu triunghiul ▶ (fără scris).
     • Restul, sus în dreapta: un rând — Los Angeles ▶ PLAYBACK · Mumbai ■ STOP ·
       Shanghai —, iar sub Shanghai o coloană, fiecare stare sub timecode-ul ei:
       ▶ PLAYBACK · New York · ▶ PLAYBACK · Buenos Aires · ■ STOP.
   ============================================================ */

interface Zone { city: string; tz: string; abbr: Record<string, string> }

// cheile: decalajul față de UTC, în ore (5.5 = +5:30)
const LOS_ANGELES:  Zone = { city: 'Los Angeles',  tz: 'America/Los_Angeles',            abbr: { '-8': 'PST', '-7': 'PDT' } };
const NEW_YORK:     Zone = { city: 'New York',     tz: 'America/New_York',               abbr: { '-5': 'EST', '-4': 'EDT' } };
const BUENOS_AIRES: Zone = { city: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', abbr: { '-3': 'ART' } };
const MADRID:       Zone = { city: 'Madrid',       tz: 'Europe/Madrid',                  abbr: { '1': 'CET', '2': 'CEST' } };
const BUCHAREST:    Zone = { city: 'Bucharest',    tz: 'Europe/Bucharest',               abbr: { '2': 'EET', '3': 'EEST' } };
const MUMBAI:       Zone = { city: 'Mumbai',       tz: 'Asia/Kolkata',                   abbr: { '5.5': 'IST' } };
const BANGKOK:      Zone = { city: 'Bangkok',      tz: 'Asia/Bangkok',                   abbr: { '7': 'ICT' } };
const SHANGHAI:     Zone = { city: 'Shanghai',     tz: 'Asia/Shanghai',                  abbr: { '8': 'CST' } };

type Transport = 'play' | 'stop';

/** Timecode-urile lumii (Modul Regie, 02.11.2026, 16:25), în trei locuri:
    sus în dreapta, pe un rând — Los Angeles ▶ PLAYBACK · Bangkok ▶ PLAYBACK;
    jos în stânga, după UE + Regio, două rânduri — Mumbai ■ STOP / New York ▶ PLAYBACK;
    jos în dreapta, după site-uri, două rânduri — Shanghai ▶ PLAYBACK / Buenos Aires ■ STOP.
    Starea stă mereu alături de timecode, pe același rând. */
/* 02.11, 23:03 (Modul Regie): Bangkok și Los Angeles coboară din dreapta-sus
   în colțul din stânga-jos, unul sub altul, înaintea butonului de limbă */
const BOTTOM_FAR: [Zone, Transport][] = [
    [BANGKOK,      'play'],
    [LOS_ANGELES,  'play'],
];
const BOTTOM_LEFT: [Zone, Transport][] = [
    [MUMBAI,   'stop'],
    [NEW_YORK, 'play'],
];
const BOTTOM_RIGHT: [Zone, Transport][] = [
    [SHANGHAI,     'play'],
    [BUENOS_AIRES, 'stop'],     // 02.11, 16:25: sub Shanghai
];
const WORLD: Zone[] = [...BOTTOM_FAR, ...BOTTOM_LEFT, ...BOTTOM_RIGHT].map(([z]) => z);
/** antetul: București și Madrid cu ● REC (Bangkok a trecut sus în dreapta, 02.11, 16:25) */
const HOME:  Zone[] = [BUCHAREST, MADRID];

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


/** Antetul: București și Madrid, fiecare cu ● REC, imediat după logo. */
export default function HeaderClocks({ recLabel = 'REC' }: { recLabel?: string }) {
    const tc = useTimecodes(HOME);
    return (
        <div className={styles.hdClocks}>
            {HOME.map((z) => (
                <span key={z.tz} className={styles.hdTimecodeGroup}>
                    {tc(z)}
                    <span className={styles.hdRec}>{recLabel}</span>
                </span>
            ))}
        </div>
    );
}


/** Timecode-urile lumii, fiecare cu ▶ PLAYBACK sau ■ STOP, toate în bara de jos:
    în colțul din stânga, după UE + Regio și după site-uri
    (vezi BOTTOM_FAR, BOTTOM_LEFT, BOTTOM_RIGHT). */
export function WorldClocks({
    playbackLabel = 'PLAYBACK',
    stopLabel = 'STOP',
}: { playbackLabel?: string; stopLabel?: string }) {
    const tc = useTimecodes(WORLD);
    const status = (state: Transport) => state === 'play'
        ? <span className={styles.hdPlay}><span className={styles.wcLabel}>{playbackLabel}</span></span>
        : <span className={styles.hdStop}><span className={styles.wcLabel}>{stopLabel}</span></span>;
    const rows = (list: [Zone, Transport][]) => list.map(([z, state]) => (
        <span key={z.tz} className={styles.wcRow}>
            {tc(z)}
            {status(state)}
        </span>
    ));
    return (
        <>
            <div className={`${styles.worldClocks} ${styles.wcBottomFar}`}>{rows(BOTTOM_FAR)}</div>
            <div className={`${styles.worldClocks} ${styles.wcBottomLeft}`}>{rows(BOTTOM_LEFT)}</div>
            <div className={`${styles.worldClocks} ${styles.wcBottomRight}`}>{rows(BOTTOM_RIGHT)}</div>
        </>
    );
}
