/* ============================================================
   PELICULA — constantele comune ale benzilor de film (03.11.2026)
   Folosite de banda principală (index.tsx: WORK, ABOUT) și de a doua
   bandă de pe ABOUT (SetStrip.tsx), ca amândouă să se miște la fel.
   ============================================================ */

/* DERULAREA ANALOGICĂ (03.11.2026, 13:32): pelicula urmează rotița cu
   inerție și se oprește oriunde; după SETTLE_MS de liniște alege cadrul
   cel mai încadrat și e trasă încet în ramă de un arc amortizat critic. */
export const SETTLE_MS  = 360;    // liniștea după care pelicula alege cadrul
export const WHEEL_TAU  = 0.24;   // s — cât de „grea” e pelicula (cât întârzie după rotiță)
export const WHEEL_GAIN = 1;      // distanța pe o mișcare de rotiță (1 = cât derularea normală)
export const SPRING_W   = 3.6;    // rad/s — arcul care o așază (~1,3 s până aproape de cadru)

/* EXPUNEREA AFIȘELOR (02.11.2026, 18:25): afară — subexpuse, alb-negru;
   în ramă — dense, pentru că lampa din spatele geamului le aduce la
   expunerea corectă. */
export const EXPO_OUT = 0.15;
export const EXPO_IN  = 0.30;

/** înălțimea tile-ului pistei sonore la mărimea de bază a peliculei (px CSS);
    pe ecranele mici se înmulțește cu --film-k */
export const BAND_TILE = 2049;

/** câte cadre are cel puțin o peliculă fără capăt (lista e pusă de mai multe ori).
    16.11.2026: 30 → 96 (WORK: 5 copii în loc de 3). Pe telefon pelicula sare
    în copia din mijloc doar după ce se oprește (o săritură în timpul inerției
    o oprea brusc — vezi touchSnap); o aruncare puternică cu degetul (inerția
    iOS: 4–8 mii de px) nu mai ajunge la capăt. */
export const MIN_SLOTS = 96;

/** mărimea peliculei (--film-k din CSS): 1 pe desktop, mai mică pe telefon */
export function filmK(el: Element | null): number {
    if (!el) return 1;
    const v = parseFloat(getComputedStyle(el).getPropertyValue('--film-k'));
    return Number.isFinite(v) && v > 0 ? v : 1;
}

/** filtrul unui afiș după cât de mult e în ramă (e: 0 = afară, 1 = în ramă);
    `gain` = cât de mult e ridicată expunerea în ramă față de afișe (1 = la fel) */
export function exposureFilter(e: number, gain = 1): string {
    return `grayscale(${(1 - e).toFixed(3)}) ` +
           `contrast(${(1.15 - 0.15 * e).toFixed(3)}) ` +
           `brightness(${(EXPO_OUT + (EXPO_IN * gain - EXPO_OUT) * e).toFixed(3)})`;
}

/* POZELE DE PE PLATOU (ABOUT, a doua peliculă — 12.11.2026, Ștefan: „e
   subexpusă, o poți ridica puțin să se vadă mai bine?”): în ramă, puțin
   mai luminoase decât afișele. Lampa (color-dodge) amplifică, deci un pas
   mic aici se vede mult. */
export const SET_GAIN = 1.3;

/* ============================================================
   PELICULA ORIZONTALĂ (09.11.2026, cererea lui Ștefan): pe telefon și
   tabletă pelicula curge stânga ↔ dreapta, imediat sub meniu, ca sub ea să
   rămână loc pentru text și butoane. Axa o dă CSS-ul (--film-axis: x, vezi
   „PELICULA ORIZONTALĂ” la sfârșitul landing.module.css); calculele sunt
   aceleași ca pe verticală — funcțiile de mai jos aleg doar axa.
   ============================================================ */
export type Axis = 'x' | 'y';

/** 'x' când pelicula curge stânga ↔ dreapta (telefon, tabletă), altfel 'y' */
export function filmAxis(el: Element | null): Axis {
    if (!el) return 'y';
    return getComputedStyle(el).getPropertyValue('--film-axis').trim() === 'x' ? 'x' : 'y';
}

/** poziția derulării de-a lungul peliculei */
export const scrollPos = (g: HTMLElement, a: Axis): number => (a === 'x' ? g.scrollLeft : g.scrollTop);

export function setScrollPos(g: HTMLElement, a: Axis, v: number): void {
    if (a === 'x') g.scrollLeft = v;
    else g.scrollTop = v;
}

/** cât se poate derula, de la un capăt la altul */
export const scrollMax = (g: HTMLElement, a: Axis): number =>
    (a === 'x' ? g.scrollWidth - g.clientWidth : g.scrollHeight - g.clientHeight);

/** cât din peliculă se vede, de-a lungul ei */
export const viewSize = (g: HTMLElement, a: Axis): number => (a === 'x' ? g.clientWidth : g.clientHeight);

/** mijlocul unui dreptunghi de pe ecran, pe axa peliculei */
export const rectMid = (r: DOMRect, a: Axis): number =>
    (a === 'x' ? r.left + r.width / 2 : r.top + r.height / 2);

/** începutul unui cadru în galerie, pe axa peliculei */
export const offsetPos = (el: HTMLElement, a: Axis): number => (a === 'x' ? el.offsetLeft : el.offsetTop);

/** rotița / trackpadul: pe pelicula orizontală contează și mișcarea stânga ↔ dreapta */
export function wheelDelta(e: WheelEvent, a: Axis): number {
    return a === 'x' && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
}

/** pista sonoră mutată cu `off` px de-a lungul peliculei */
export const bandShift = (off: number, a: Axis): string =>
    (a === 'x' ? `translate3d(${(-off).toFixed(2)}px, 0, 0)` : `translate3d(0, ${-off}px, 0)`);


/* ============================================================
   ECRANELE TACTILE (16.11.2026, Ștefan: „pe telefon, când trag pelicula cu
   degetul și îi dau drumul, rămâne o secundă fixă, apoi sare pe una din
   fotograme; credeam că, dacă ridic degetul, merge lent spre cea mai
   apropiată”). Pe telefon / tabletă fără mouse, așezarea pe cadru o face
   browserul (scroll-snap, vezi „PELICULA PE ECRANELE TACTILE” la sfârșitul
   landing.module.css): inerția degetului încetinește și se oprește lin pe
   cadrul cel mai apropiat de centrul ramei, pe firul de derulare al
   sistemului — fluid, fără așteptare. Arcul din JS rămâne pentru click pe
   titlu, săgeți și rotiță; cât lucrează el, .jsDrive oprește așezarea
   browserului. Desktopul (mouse, trackpad): neschimbat.
   ============================================================ */
const TOUCH_Q = '(hover: none) and (pointer: coarse)';

/** true pe telefon / tabletă: degetul e singurul „mouse” */
export function touchSnap(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        && window.matchMedia(TOUCH_Q).matches;
}

/** zona în care browserul așază cadrele (scroll-padding) are centrul exact pe
    centrul ramei, oriunde ar sta rama față de galerie */
export function alignSnap(g: HTMLElement, vf: Element | null, a: Axis): void {
    const s = g.style;
    s.scrollPaddingTop = s.scrollPaddingBottom = s.scrollPaddingLeft = s.scrollPaddingRight = '';
    if (!vf) return;
    const d = rectMid(vf.getBoundingClientRect(), a) - rectMid(g.getBoundingClientRect(), a);
    if (Math.abs(d) < 0.5) return;
    const lead = d > 0 ? `${(2 * d).toFixed(1)}px` : '';
    const tail = d < 0 ? `${(-2 * d).toFixed(1)}px` : '';
    if (a === 'x') { s.scrollPaddingLeft = lead; s.scrollPaddingRight = tail; }
    else { s.scrollPaddingTop = lead; s.scrollPaddingBottom = tail; }
}

/* ============================================================
   PREÎNCĂRCAREA (16.11.2026, Ștefan: „dacă dau scroll foarte repede pe
   peliculă nu reușește să se încarce rapid și rămâne blocată până se
   încarcă”). După ce pagina e afișată, în timpul liber al browserului,
   imaginile peliculei (variantele mici, stripThumbs.ts) se descarcă și se
   decodează dinainte, în ordinea apropierii de cadrul din ramă. Toate
   copiile peliculei folosesc aceeași imagine, deci o decodare ajunge pentru
   toate. La final imaginile „leneșe” (loading=lazy) trec pe „eager”: vin din
   memorie, fără să mai aștepte să se apropie de ecran.
   ============================================================ */
const kept = new Map<string, HTMLImageElement>();   // ținute cât e deschisă pagina

/** descarcă (și decodează primele `decode`) imaginile `urls`, câte trei odată */
export function warmStrip(urls: string[], opts: { decode?: number; done?: () => void } = {}): () => void {
    if (typeof window === 'undefined') return () => {};
    const decodeN = opts.decode ?? Infinity;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const later = (cb: () => void) => {
        if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 600 });
        else window.setTimeout(cb, 60);
    };
    let stop = false, next = 0, running = 0, finished = false;
    const pump = () => {
        if (stop) return;
        if (next >= urls.length) {
            if (running === 0 && !finished) { finished = true; opts.done?.(); }
            return;
        }
        const i = next++;
        let img = kept.get(urls[i]);
        if (!img) {
            img = new Image();
            img.decoding = 'async';
            img.src = urls[i];
            kept.set(urls[i], img);
        }
        const im = img;
        running++;
        const ready: Promise<unknown> = i < decodeN && typeof im.decode === 'function'
            ? im.decode()
            : new Promise<void>((res) => {
                if (im.complete) { res(); return; }
                im.addEventListener('load', () => res(), { once: true });
                im.addEventListener('error', () => res(), { once: true });
            });
        ready.catch(() => {}).then(() => { running--; later(pump); });
    };
    later(() => { pump(); pump(); pump(); });
    return () => { stop = true; };
}

/** imaginile din `root` încă „leneșe” se încarcă acum (din memorie, după warmStrip) */
export function eagerImages(root: Element | null): void {
    root?.querySelectorAll('img[loading="lazy"]').forEach((el) => {
        (el as HTMLImageElement).loading = 'eager';
    });
}

/** ordinea preîncărcării: filmul `start`, apoi vecinii lui, alternativ înainte și înapoi */
export function nearFirst(n: number, start: number): number[] {
    const out: number[] = [];
    for (let d = 0; out.length < n; d++) {
        const a = (((start + d) % n) + n) % n;
        if (!out.includes(a)) out.push(a);
        const b = (((start - d) % n) + n) % n;
        if (out.length < n && !out.includes(b)) out.push(b);
    }
    return out;
}
