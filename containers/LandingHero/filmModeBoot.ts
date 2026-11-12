/* Prima alegere a așezării sub 1280 px, din <head> — vezi filmMode.ts.
   Fișier separat (fără CSS), ca app/layout.tsx să-l poată folosi. */

export type FilmMode = 'd' | 'v1' | 'v2' | 'h';

export const DESKTOP = 1280;
/** sub această înălțime pelicula orizontală nu mai încape (antet + peliculă + text + bară) */
export const H_MIN = 561;
/** cât loc rămâne cel puțin între ramă și meniu / ceas / text (ca pe desktop, pe ABOUT: 16 px până la WORK) */
export const GAP = 16;
/** cel mai îngust text lângă peliculă: titlul filmului (WORK), caseta cu textul (ABOUT) */
export const SIDE_MIN = 200;
export const READ_MIN = 240;

export const ATTR = 'data-film';

/* lățimile (px) de la care, pe un ecran mai lat decât înalt, meniul încape pe
   un rând lângă peliculă (sub ele: pelicula orizontală) — doar pentru prima
   alegere, din <head>, cât pagina nu e încă citită. Măsurate cu
   decideFilmMode pe 12.11.2026 (înălțimea 780 px, meniul scris cel mult
   până la 12 px). 1280 = pe ABOUT nu încape niciodată sub 1280 px (ES, FR,
   RO: cele două pelicule + meniul lung). Restul îl corectează măsurarea,
   înaintea primului cadru desenat de React. */
export const FILM_GUESS: Record<string, [number, number]> = {
    //    WORK  ABOUT
    en: [  975, 1159],
    es: [ 1167, 1280],
    fr: [ 1135, 1280],
    ro: [ 1135, 1280],
    th: [  951, 1159],
    zh: [  855, 1023],
    hi: [  863, 1071],
};

export const FILM_MODE_BOOT = `(function(){try{
var h=document.documentElement,G=${JSON.stringify(FILM_GUESS)};
function guess(){var w=innerWidth,t=innerHeight;if(w>=${DESKTOP})return'd';if(t>=w)return'h';
var l='en';try{l=sessionStorage.getItem('af-lang')||'en'}catch(e){}
var g=G[l]||G.en,lim=g[location.pathname.indexOf('/about')===0?1:0];
return w>=lim?'v1':(t>=${H_MIN}?'h':'v2')}
h.setAttribute('${ATTR}',guess());
addEventListener('resize',function(){if(window.__afFilm)window.__afFilm(false);else h.setAttribute('${ATTR}',guess())});
}catch(e){}})();`;


