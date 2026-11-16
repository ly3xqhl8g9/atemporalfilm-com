/* ============================================================
   INTRO „MASA LUMINATĂ” — varianta /?intro (03.11.2026)

   Starea animației stă pe <html>, ca s-o vadă și CSS-ul înainte de
   primul cadru desenat de React (o pune scriptul din app/layout.tsx):
     data-intro       = pending → spin → launch → lay → rest → retract → logo
     data-intro-ui    = „off” cât timp pagina e goală (doar masa și rola)
     data-intro-js    = IntroReel a preluat animația (altfel scriptul o
                        anulează singur după 12 s, ca pagina să nu rămână goală)
     data-intro-light = rama și lampa s-au aprins
     --intro-y        = până unde s-a așezat pelicula pe masă (px)
   ============================================================ */

/** IntroReel → LogoReel: rola a ajuns lângă logo, pornește încâlceala */
export const INTRO_LOGO_EVENT = 'atemporal:intro-logo';

/** intro-ul rulează (sau așteaptă să pornească) → LogoReel nu pornește singur */
export const introPending = (): boolean =>
    typeof document !== 'undefined' && document.documentElement.hasAttribute('data-intro');

export function clearIntro(): void {
    const h = document.documentElement;
    for (const a of ['data-intro', 'data-intro-ui', 'data-intro-js', 'data-intro-light']) h.removeAttribute(a);
    h.style.removeProperty('--intro-y');
}

/* ============================================================
   INTRO „VIZOR” — variantele /?intro=vizor … /?intro=vizor5 (16.11.2026) — IntroVizor.tsx

   Starea stă tot pe <html>, cu alte nume (ca regulile intro-ului „masa
   luminată” să nu se amestece):
     data-vz       = pending → run → film → out
     data-vz-ui    = „off” cât pagina e goală (totul în afară de fundal și grain)
     data-vz-js    = IntroVizor a preluat animația (altfel scriptul o
                     anulează singur după 8 s)
     data-vz-strip = peliculele intră în pagină
     data-vz-logo  = logo-ul apare
     data-vz-reel  = rola desenată a ajuns peste rola de lângă logo
     data-vz-lamp  = rama și lampa se aprind
   ============================================================ */
export const VZ = {
    state: 'data-vz',
    ui:    'data-vz-ui',
    js:    'data-vz-js',
    strip: 'data-vz-strip',
    logo:  'data-vz-logo',
    reel:  'data-vz-reel',
    lamp:  'data-vz-lamp',
    pull:  'data-vz-pull',     // versiunea 5: benzile paginii le mută JS-ul (rola le trage), nu CSS-ul
} as const;

/** IntroVizor (versiunea 4) → LogoReel, pe ceasul intro-ului: „lay” = pelicula încâlcită stă
    peste logo; „gather(p, unghi)” = rola o strânge (p de la 0 la 1; unghi = cum stă rola,
    în grade); „rest” = logo-ul scris, rola plină */
export const logoBridge: { lay?: () => void; gather?: (p: number, ang: number) => void; rest?: () => void } = {};

/** intro-ul „vizor” rulează (sau așteaptă) → LogoReel nu pornește încâlceala */
export const vizorPending = (): boolean =>
    typeof document !== 'undefined' && document.documentElement.hasAttribute(VZ.state);

export function clearVizor(): void {
    const h = document.documentElement;
    for (const a of Object.values(VZ)) h.removeAttribute(a);
}

/** scriptul din <head>: rulează înaintea primului cadru.
    /?intro=vizor … /?intro=vizor5 (16.11.2026): pe / și pe /about, pe orice ecran
    (versiunea o alege IntroVizor.tsx, după adresă).
    /?intro (03.11.2026, „masa luminată”): doar pe / cu ?intro,
    doar pe desktop (≥ 1280 px — pe telefon și tabletă pagina are alt layout;
    intro-ul pentru ele se face când refacem animația). Varianta e blocată:
    eticheta git `intro-masa-v1` (03.11.2026). */
export const INTRO_BOOT = `(function(){try{
var h=document.documentElement,p=location.pathname;
if(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);
if(/[?&]intro=vizor[2345]?(?:&|$)/.test(location.search)){
if((p==='/'||p==='/about')&&window.matchMedia&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
h.setAttribute('data-vz','pending');h.setAttribute('data-vz-ui','off');
setTimeout(function(){if(!h.hasAttribute('data-vz-js')){['data-vz','data-vz-ui'].forEach(function(a){h.removeAttribute(a)})}},8000);}
return;}
if(location.pathname!=='/'||!/[?&]intro(?:[=&]|$)/.test(location.search))return;
if(!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(min-width: 1280px)').matches)return;
h.setAttribute('data-intro','pending');h.setAttribute('data-intro-ui','off');
setTimeout(function(){if(!h.hasAttribute('data-intro-js')){['data-intro','data-intro-ui','data-intro-light'].forEach(function(a){h.removeAttribute(a)})}},12000);
}catch(e){}})();`;
