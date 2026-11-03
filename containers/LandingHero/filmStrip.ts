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

/** câte cadre are cel puțin o peliculă fără capăt (lista e pusă de mai multe ori) */
export const MIN_SLOTS = 30;

/** mărimea peliculei (--film-k din CSS): 1 pe desktop, mai mică pe telefon */
export function filmK(el: Element | null): number {
    if (!el) return 1;
    const v = parseFloat(getComputedStyle(el).getPropertyValue('--film-k'));
    return Number.isFinite(v) && v > 0 ? v : 1;
}

/** filtrul unui afiș după cât de mult e în ramă (e: 0 = afară, 1 = în ramă) */
export function exposureFilter(e: number): string {
    return `grayscale(${(1 - e).toFixed(3)}) ` +
           `contrast(${(1.15 - 0.15 * e).toFixed(3)}) ` +
           `brightness(${(EXPO_OUT + (EXPO_IN - EXPO_OUT) * e).toFixed(3)})`;
}
