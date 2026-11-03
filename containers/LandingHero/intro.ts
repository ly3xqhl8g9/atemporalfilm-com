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

/** scriptul din <head>: rulează înaintea primului cadru, doar pe / cu ?intro */
export const INTRO_BOOT = `(function(){try{
if(location.pathname!=='/'||!/[?&]intro(?:[=&]|$)/.test(location.search))return;
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var h=document.documentElement;h.setAttribute('data-intro','pending');h.setAttribute('data-intro-ui','off');
setTimeout(function(){if(!h.hasAttribute('data-intro-js')){['data-intro','data-intro-ui','data-intro-light'].forEach(function(a){h.removeAttribute(a)})}},12000);
}catch(e){}})();`;
