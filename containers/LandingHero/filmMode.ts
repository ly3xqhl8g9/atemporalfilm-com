import styles from './landing.module.css';
import { ATTR, DESKTOP, GAP, H_MIN, READ_MIN, SIDE_MIN, type FilmMode } from './filmModeBoot';

export type { FilmMode };


/* ============================================================
   CUM SE AȘAZĂ PAGINA SUB 1280 PX (12.11.2026, cererea lui Ștefan)

   Starea stă pe <html>, în data-film:
     d   = desktop (≥ 1280 px) — neschimbat;
     v1  = pelicula verticală, în mijloc, iar meniul pe UN SINGUR RÂND în
           dreapta-sus („WORK, ABOUT   GEAR, CONTACT”), cu ceasul dedesubt;
     v2  = pelicula verticală, meniul pe două rânduri — doar unde nu e loc
           de un rând și nici de pelicula orizontală (telefonul întors);
     h   = pelicula orizontală, sub meniu (telefonul / tableta ținute
           vertical — ca până acum).

   Ștefan: „lasă scrisul în dreapta până când se face ecranul și mai mic …
   până când nu mai au spațiu; când nu mai au spațiu treci direct cu
   pelicula orizontală, ca să eviți suprapunerea — verifică și în funcție
   de limbă”. Deci pe un ecran mai lat decât înalt nu se ghicește după
   lățime: se încearcă v1 și se MĂSOARĂ (în limba aleasă, pe pagina
   deschisă — WORK are o peliculă, ABOUT două) dacă meniul, ceasul și
   textul încap lângă peliculă, la cel puțin GAP px de ramă. Dacă nu
   încap, se trece la pelicula orizontală (h); doar dacă ecranul e prea
   scund și pentru ea (sub H_MIN px), rămâne pelicula verticală cu meniul
   pe două rânduri (v2).

   Măsurarea și schimbarea se fac în același pas, înaintea desenării:
   – în <head> (FILM_MODE_BOOT): o primă alegere după orientare și un tabel
     cu lățimile de trecere (pagina nu e încă citită, deci nu se poate
     măsura) — ca telefonul ținut vertical să nu vadă nicio clipă altceva;
   – la încărcarea paginii, la redimensionare, la schimbarea limbii și la
     trecerea WORK ↔ ABOUT: măsurarea adevărată (decideFilmMode).
   Ascultătorul de redimensionare din <head> e primul înregistrat, deci
   peliculele, bara de jos etc. citesc deja noua așezare.
   ============================================================ */

const rect = (el: Element | null) => (el ? el.getBoundingClientRect() : null);

/** cel mai mic scris al meniului pe un rând (px) — cât e pe telefon */
const NAV_FS_MIN = 12;
const FS_ATTR = 'data-nav-fs';

/** în așezarea v1 (deja pusă pe <html>): încap meniul, ceasul și textul lângă peliculă?
    Dacă meniul nu încape, întâi se scrie mai mic (ca pe desktop, în ES / FR / RO),
    cel mult până la NAV_FS_MIN; abia apoi se renunță la v1. */
function fitsV1(): boolean {
    const page = document.querySelector<HTMLElement>(`.${styles.page}`);
    if (!page) return true;
    const frames = [...page.querySelectorAll(`.${styles.viewfinder}, .${styles.gallery}`)]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0);
    if (!frames.length) return true;
    const stripL = Math.min(...frames.map((r) => r.left));
    const stripR = Math.max(...frames.map((r) => r.right));

    const navEl = page.querySelector<HTMLElement>(`.${styles.navRow}`);
    let nav     = rect(navEl);
    const clock = rect(page.querySelector(`.${styles.hdClocks}`));
    if (navEl && nav && nav.left < stripR + GAP) {
        // doar cuvintele se micșorează (spațiile și iconițele rămân), deci
        // căutăm mărimea prin încercări: cea mai mare la care încape
        const word = navEl.querySelector<HTMLElement>(`.${styles.navItem}`);
        const fs0  = word ? parseFloat(getComputedStyle(word).fontSize) : 14;
        const h    = document.documentElement;
        const fitsAt = (fs: number) => {
            h.style.setProperty('--nav-fs-v1', `${fs}px`);
            h.setAttribute(FS_ATTR, '');
            nav = rect(navEl);
            return !!nav && nav.left >= stripR + GAP;
        };
        if (!fitsAt(NAV_FS_MIN)) return false;
        let lo = NAV_FS_MIN * 10, hi = Math.floor(fs0 * 10);   // în zecimi de px
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (fitsAt(mid / 10)) lo = mid; else hi = mid;
        }
        fitsAt(lo / 10);
    }
    if (clock && clock.width > 0 && clock.left < stripR + GAP) return false;
    // meniul nu are voie să treacă pe două rânduri
    const items = [...page.querySelectorAll(`.${styles.navRow} .${styles.navItemAt}`)].map((el) => el.getBoundingClientRect());
    if (items.length && Math.max(...items.map((r) => r.top)) - Math.min(...items.map((r) => r.top)) > 4) return false;

    if (page.classList.contains(styles.pageAbout)) {
        const read = rect(page.querySelector(`.${styles.aboutRead}`));
        if (read && read.width > 0 && read.width < READ_MIN) return false;
    } else {
        // titlul filmului stă în stânga peliculei
        const logoL = rect(page.querySelector(`.${styles.logo}`))?.left ?? 28;
        if (stripL - logoL - 28 < SIDE_MIN) return false;
    }
    return true;
}

/** cel mai mic scris al meniului pe telefon, ca să nu intre peste logo */
const NAV_FS_MIN_PHONE = 10.5;

/* PELICULA ORIZONTALĂ (12.11.2026, seara — pe 375 px, în română, meniul
   „LUCRĂRI, DESPRE   ECHIPAMENT, CONTACT” intra peste „Film” din logo):
   meniul se scrie puțin mai mic, exact cât să rămână la 10 px de logo;
   unde încape, nu se schimbă nimic. */
function fitNavBesideLogo(): void {
    const page  = document.querySelector<HTMLElement>(`.${styles.page}`);
    const navEl = page?.querySelector<HTMLElement>(`.${styles.navRow}`);
    const logo  = page?.querySelector<HTMLElement>(`.${styles.logoWord2}`)
               ?? page?.querySelector<HTMLElement>(`.${styles.logo}`);
    if (!navEl || !logo) return;
    const h = document.documentElement;
    const clear = () => {
        const n = navEl.getBoundingClientRect(), l = logo.getBoundingClientRect();
        return n.top >= l.bottom || n.bottom <= l.top || n.left >= l.right + 10;
    };
    if (clear()) return;
    // întâi golul dintre perechi (36 → cel puțin 20 px), apoi scrisul
    h.style.setProperty('--nav-pair-gap', '20px');
    if (clear()) {
        let g = 20;
        while (g < 36) { h.style.setProperty('--nav-pair-gap', `${g + 2}px`); if (!clear()) break; g += 2; }
        h.style.setProperty('--nav-pair-gap', `${g}px`);
        return;
    }
    const word = navEl.querySelector<HTMLElement>(`.${styles.navItem}`);
    const fs0  = word ? parseFloat(getComputedStyle(word).fontSize) : 12.5;
    const at = (fs: number) => {
        h.style.setProperty('--nav-fs-v1', `${fs}px`);
        h.setAttribute(FS_ATTR, '');
        return clear();
    };
    if (!at(NAV_FS_MIN_PHONE)) return;   // nici așa: rămâne cel mai mic
    let lo = NAV_FS_MIN_PHONE * 10, hi = Math.floor(fs0 * 10);
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (at(mid / 10)) lo = mid; else hi = mid;
    }
    at(lo / 10);
}

/**
 * Alege așezarea și o pune pe <html>. `announce` = trimite un „resize”, ca
 * peliculele și bara de jos să se așeze din nou — nu e nevoie când suntem
 * chiar în ascultătorul de redimensionare (urmează oricum ceilalți).
 */
export function decideFilmMode(announce = true): FilmMode {
    const h    = document.documentElement;
    const prev = h.getAttribute(ATTR);
    const w = window.innerWidth, t = window.innerHeight;
    let m: FilmMode;
    const fsPrev = h.style.getPropertyValue('--nav-fs-v1') + h.style.getPropertyValue('--nav-pair-gap');
    h.style.removeProperty('--nav-pair-gap');
    h.style.removeProperty('--nav-fs-v1');
    h.removeAttribute(FS_ATTR);
    if (w >= DESKTOP) m = 'd';
    else if (t >= w) m = 'h';
    else {
        h.setAttribute(ATTR, 'v1');
        m = fitsV1() ? 'v1' : t >= H_MIN ? 'h' : 'v2';
    }
    if (m !== 'v1') {
        h.style.removeProperty('--nav-fs-v1');
        h.removeAttribute(FS_ATTR);
    }
    h.setAttribute(ATTR, m);
    if (m === 'h') fitNavBesideLogo();
    if (announce && (m !== prev || h.style.getPropertyValue('--nav-fs-v1') + h.style.getPropertyValue('--nav-pair-gap') !== fsPrev)) window.dispatchEvent(new Event('resize'));
    return m;
}

declare global {
    interface Window { __afFilm?: (announce?: boolean) => FilmMode }
}
if (typeof window !== 'undefined') window.__afFilm = decideFilmMode;
