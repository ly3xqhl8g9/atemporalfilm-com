'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
    BAND_TILE, MIN_SLOTS, SETTLE_MS, SPRING_W, WHEEL_GAIN, WHEEL_TAU, exposureFilter, filmK,
} from './filmStrip';
import styles from './landing.module.css';



/* ============================================================
   A DOUA PELICULĂ DE PE ABOUT (03.11.2026, cererea lui Ștefan):
   lângă banda cu oamenii, o bandă cu pozele de la filmare (cele 13 de pe
   pagina ABOUT veche, public/assets/entities/about/set-NN.webp).
   E aceeași peliculă ca banda principală — rama de metal, lampa, lumina
   din spate, pista sonoră, perforația, expunerea — și se derulează la fel
   (rotița cu inerție, așezarea lentă pe cadru, degetul pe telefon), dar
   independent: rotița deasupra ei o mișcă doar pe ea. Fără capăt; pornește
   la o poză aleasă la întâmplare.

   Poziția: toate elementele stau la `50% + --reel-x`; învelișul .strip2
   (display: contents) pune --reel-x = --reel-x2 (în stânga benzii
   principale, la --strip-gap de ea — vezi landing.module.css).
   ============================================================ */

export type StripImage = { src: string; alt: string };

export default function SetStrip({ images, label }: { images: StripImage[]; label: string }) {
    const reel = useMemo(() => {
        const N      = images.length;
        const half   = Math.max(1, Math.ceil((MIN_SLOTS / N - 1) / 2));
        const COPIES = 2 * half + 1;
        return {
            N,
            HOME:  N * half,
            SLOTS: Array.from({ length: N * COPIES }, (_, i) => i),
            of:    (slot: number) => ((slot % N) + N) % N,
            isHome: (slot: number) => slot >= N * half && slot < N * (half + 1),
        };
    }, [images.length]);

    const galleryRef = useRef<HTMLDivElement | null>(null);
    const vfRef      = useRef<HTMLDivElement | null>(null);
    const bandRef    = useRef<HTMLDivElement | null>(null);
    const slotRefs   = useRef<(HTMLDivElement | null)[]>([]);
    const expoRef    = useRef<number[]>([]);
    const originRef  = useRef(0);
    const bandYRef   = useRef(0);
    const lastTopRef = useRef(0);
    const kRef       = useRef(1);
    const animRef    = useRef<number | null>(null);
    const motionRef  = useRef({
        mode: 'idle' as 'idle' | 'free' | 'spring',
        pos: 0, target: 0, vel: 0, goalTop: 0, last: 0,
        onDone: null as null | (() => void),
    });

    const pitch = useCallback(() => {
        const a = slotRefs.current[0], b = slotRefs.current[1];
        return a && b ? b.offsetTop - a.offsetTop : 1;
    }, []);

    /** expunerea fiecărei poze și pista sonoră, după poziția derulării */
    const sync = useCallback(() => {
        const g = galleryRef.current;
        if (!g) return;
        const f = (g.scrollTop - originRef.current) / pitch();
        const exp = expoRef.current;
        slotRefs.current.forEach((el, i) => {
            const img  = el?.children[0] as HTMLElement | undefined;
            const halo = el?.children[1] as HTMLElement | undefined;
            if (!img) return;
            const x = Math.max(0, 1 - Math.abs(i - f));
            const e = Math.round(x * x * (3 - 2 * x) * 1000) / 1000;
            if (exp[i] === e) return;
            exp[i] = e;
            img.style.filter = exposureFilter(e);
            if (halo) halo.style.opacity = (0.32 * e).toFixed(3);
        });
        const top = g.scrollTop;
        bandYRef.current += top - lastTopRef.current;
        lastTopRef.current = top;
        const tile = BAND_TILE * kRef.current;
        if (bandRef.current) {
            const y = ((bandYRef.current % tile) + tile) % tile;
            bandRef.current.style.transform = `translate3d(0, ${-y}px, 0)`;
        }
    }, [pitch]);

    /** poziția la care cadrul `slot` stă în centrul ramei — măsurată pe ecran */
    const scrollFor = useCallback((slot: number) => {
        const g = galleryRef.current, el = slotRefs.current[slot], vf = vfRef.current;
        if (!g || !el || !vf) return originRef.current + slot * pitch();
        const r = el.getBoundingClientRect(), v = vf.getBoundingClientRect();
        const to = g.scrollTop + (r.top + r.height / 2) - (v.top + v.height / 2);
        originRef.current = to - slot * pitch();
        return to;
    }, [pitch]);

    const jumpTo = useCallback((slot: number) => {
        const g = galleryRef.current;
        if (!g) return;
        g.scrollTop = scrollFor(slot);
        lastTopRef.current = g.scrollTop;          // săritura nu mișcă pista
        const m = motionRef.current;
        m.pos = m.target = g.scrollTop;
        m.vel = 0;
        sync();
    }, [scrollFor, sync]);

    const stop = useCallback(() => {
        if (animRef.current !== null) cancelAnimationFrame(animRef.current);
        animRef.current = null;
        const m = motionRef.current, g = galleryRef.current;
        m.mode = 'idle'; m.vel = 0; m.onDone = null;
        if (g) m.pos = m.target = g.scrollTop;
    }, []);

    const run = useCallback(() => {
        if (animRef.current !== null) return;
        const m = motionRef.current;
        m.last = performance.now();
        const step = (now: number) => {
            const g = galleryRef.current;
            if (!g) { animRef.current = null; return; }
            const dt = Math.min(0.05, Math.max(0.001, (now - m.last) / 1000));
            m.last = now;
            let done = false;
            if (m.mode === 'free') {
                const np = m.pos + (m.target - m.pos) * (1 - Math.exp(-dt / WHEEL_TAU));
                m.vel = (np - m.pos) / dt;
                m.pos = np;
                if (Math.abs(m.target - m.pos) < 0.25) { m.pos = m.target; m.vel = 0; done = true; }
            } else if (m.mode === 'spring') {
                const x = m.pos - m.goalTop;
                m.vel += (-SPRING_W * SPRING_W * x - 2 * SPRING_W * m.vel) * dt;
                m.pos += m.vel * dt;
                if (Math.abs(x) < 0.4 && Math.abs(m.vel) < 8) { m.pos = m.target = m.goalTop; m.vel = 0; done = true; }
            } else {
                done = true;
            }
            g.scrollTop = m.pos;
            if (!done) { animRef.current = requestAnimationFrame(step); return; }
            animRef.current = null;
            if (m.mode === 'spring') {
                m.mode = 'idle';
                const cb = m.onDone;
                m.onDone = null;
                cb?.();
            }
        };
        animRef.current = requestAnimationFrame(step);
    }, []);

    /** pelicula a ajuns pe un cadru: dacă e într-o copie de margine, sare invizibil în mijloc */
    const arrive = useCallback((slot: number) => {
        const g = galleryRef.current;
        if (!g) return;
        const to = scrollFor(slot);
        if (Math.abs(g.scrollTop - to) > 0.75) g.scrollTop = to;
        if (!reel.isHome(slot)) {
            g.classList.add(styles.jumping);
            jumpTo(reel.HOME + reel.of(slot));
            window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
                g.classList.remove(styles.jumping);
            })), 60);
        }
    }, [scrollFor, jumpTo, reel]);

    const glideTo = useCallback((slot: number) => {
        const g = galleryRef.current;
        if (!g) return;
        const m = motionRef.current;
        if (animRef.current === null) { m.pos = g.scrollTop; if (m.mode === 'idle') m.vel = 0; }
        const to = scrollFor(slot);
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (still || (Math.abs(to - m.pos) < 0.5 && Math.abs(m.vel) < 8)) {
            stop();
            g.scrollTop = to;
            arrive(slot);
            return;
        }
        m.goalTop = to;
        m.onDone  = () => arrive(slot);
        m.mode    = 'spring';
        run();
    }, [scrollFor, stop, arrive, run]);

    const settle = useCallback(() => {
        const g = galleryRef.current, m = motionRef.current;
        if (!g || m.mode === 'spring') return;
        const rest = m.mode === 'free' ? m.target : g.scrollTop;
        const last = reel.SLOTS.length - 1;
        glideTo(Math.min(last, Math.max(0, Math.round((rest - originRef.current) / pitch()))));
    }, [glideTo, pitch, reel]);

    useEffect(() => {
        const g = galleryRef.current;
        if (!g) return;
        kRef.current = filmK(g);
        jumpTo(reel.HOME + Math.floor(Math.random() * reel.N));

        let idle = 0, ticking = false;
        const later = () => { window.clearTimeout(idle); idle = window.setTimeout(settle, SETTLE_MS); };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => { sync(); ticking = false; });
            }
            const m = motionRef.current;
            if (animRef.current === null && Math.abs(g.scrollTop - m.pos) > 1.5) {
                m.mode = 'idle'; m.pos = m.target = g.scrollTop; m.vel = 0;
                later();
            }
        };
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey) return;
            e.preventDefault();
            const m = motionRef.current;
            if (m.mode !== 'free') {
                m.pos    = animRef.current !== null ? m.pos : g.scrollTop;
                m.target = m.pos + m.vel * WHEEL_TAU;
                m.mode   = 'free';
                m.onDone = null;
            }
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? g.clientHeight : 1;
            const max  = g.scrollHeight - g.clientHeight;
            m.target = Math.min(max, Math.max(0, m.target + e.deltaY * unit * WHEEL_GAIN));
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                m.pos = m.target;
                g.scrollTop = m.pos;
            } else {
                run();
            }
            later();
        };
        const onGrab   = () => { stop(); window.clearTimeout(idle); };
        const onLift   = () => { if (motionRef.current.mode !== 'spring') later(); };
        const onResize = () => {
            kRef.current = filmK(g);
            expoRef.current = [];
            // după o schimbare de mărime (ex. telefonul întors), cadrul rămâne în ramă
            const f = Math.round((g.scrollTop - originRef.current) / pitch());
            jumpTo(Math.min(reel.SLOTS.length - 1, Math.max(0, f)));
        };
        g.addEventListener('scroll', onScroll, { passive: true });
        g.addEventListener('wheel', onWheel, { passive: false });
        g.addEventListener('touchstart', onGrab, { passive: true });
        g.addEventListener('pointerdown', onGrab, { passive: true });
        g.addEventListener('touchend', onLift, { passive: true });
        window.addEventListener('pointerup', onLift, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.clearTimeout(idle);
            stop();
            g.removeEventListener('scroll', onScroll);
            g.removeEventListener('wheel', onWheel);
            g.removeEventListener('touchstart', onGrab);
            g.removeEventListener('pointerdown', onGrab);
            g.removeEventListener('touchend', onLift);
            window.removeEventListener('pointerup', onLift);
            window.removeEventListener('resize', onResize);
        };
    }, [jumpTo, sync, settle, stop, run, pitch, reel]);

    return (
        <div className={styles.strip2} role="group" aria-label={label}>
            <div ref={vfRef} className={styles.viewfinder} aria-hidden="true">
                <div className={styles.vfGlass} />
            </div>
            <div className={styles.backlight} aria-hidden="true" />
            <div className={styles.lamp} aria-hidden="true" />
            <div className={styles.soundtrack} aria-hidden="true">
                <div
                    ref={bandRef}
                    className={styles.soundtrackStrip}
                    style={{
                        height:         `calc(100% + ${BAND_TILE}px * var(--film-k))`,
                        backgroundSize: `100% calc(${BAND_TILE}px * var(--film-k))`,
                    }}
                />
            </div>
            <div ref={galleryRef} className={styles.gallery}>
                <div className={styles.galleryPad} />
                {reel.SLOTS.map((i) => {
                    const im = images[reel.of(i)];
                    return (
                        <div key={i} className={styles.slot} ref={(el) => { slotRefs.current[i] = el; }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={im.src}
                                alt={reel.isHome(i) ? im.alt : ''}
                                loading="lazy"
                                draggable={false}
                                className={styles.slotImg}
                            />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={im.src} alt="" aria-hidden="true" loading="lazy" draggable={false} className={styles.slotHalo} />
                        </div>
                    );
                })}
                <div className={styles.galleryPad} />
            </div>
        </div>
    );
}
