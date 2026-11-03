'use client';

import { useEffect } from 'react';

/* ============================================================
   <DevCssRefresh /> — doar în previzualizarea locală (development).

   03.11.2026, 18:40: în Safari, foile de stil ale paginilor rămâneau uneori
   vechi după o modificare (HMR-ul nu ajungea la ele): pe WORK lipsea TIME
   CALCULATOR, pe ABOUT textul stătea la x = 156 — un amestec între foaia
   veche a homepage-ului și cea nouă de pe ABOUT (amândouă conțin
   landing.module.css, iar regula veche câștiga). Aici fiecare foaie
   `/_next/static/css/…` e verificată la 2 s (cât fila e vizibilă); dacă
   s-a schimbat pe server, e reîncărcată pe loc, fără reîncărcarea paginii.
   ============================================================ */
export default function DevCssRefresh() {
    useEffect(() => {
        const seen = new Map<string, string>();      // adresa de bază → semnătura
        const base = (href: string) => href.split('?')[0];
        let busy = false;

        const sig = async (url: string) => {
            const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            if (!r.ok) return null;
            return `${r.headers.get('etag') ?? ''}|${r.headers.get('last-modified') ?? ''}|${r.headers.get('content-length') ?? ''}`;
        };

        const check = async () => {
            if (busy || document.visibilityState !== 'visible') return;
            busy = true;
            try {
                const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href*="/_next/static/css/"]')];
                for (const link of links) {
                    const b = base(link.href);
                    const s = await sig(b).catch(() => null);
                    if (!s) continue;
                    const prev = seen.get(b);
                    seen.set(b, s);
                    if (prev !== undefined && prev !== s) {
                        link.href = `${b}?v=${Date.now()}`;
                    }
                }
            } finally {
                busy = false;
            }
        };

        check();
        const id = window.setInterval(check, 2000);
        document.addEventListener('visibilitychange', check);
        return () => {
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', check);
        };
    }, []);
    return null;
}
