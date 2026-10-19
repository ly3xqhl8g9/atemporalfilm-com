'use client';

/* ============================================================
   <Regie /> — „Modul Regie” (doar în previzualizarea locală)
   ------------------------------------------------------------
   Unealtă de design: alegi un element de pe pagină, îl muți cu
   mouse-ul, îl mărești, îi schimbi culoarea sau lași o notă.
   Fiecare modificare devine un „cue”. „Trimite la Claude”
   salvează lista în .regie/ultimul.json (prin /api/regie), iar
   Claude o transformă în cod care merge pe orice ecran.

   Tot ce faci aici e DOAR vizual și temporar — nu schimbă codul.
   Componenta se încarcă numai în development (vezi
   containers/AppWrapper) și nu ajunge pe site-ul public.
   ============================================================ */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

import styles from './regie.module.css';



/* ── Tipuri ─────────────────────────────────────────────── */

interface Ident {
    tag: string;
    text: string;
    components: string[];
    selector: string;
    classes: string;
    href?: string;
    src?: string;
    alt?: string;
}

interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface ElementCue {
    id: string;
    kind: 'element';
    page: string;
    viewport: { w: number; h: number };
    scrollY: number;
    target: Ident;
    rect: Box;
    move?: { dx: number; dy: number };
    scale?: number;
    color?: string;
    background?: string;
    hidden?: boolean;
    note?: string;
}

interface PinCue {
    id: string;
    kind: 'pin';
    page: string;
    viewport: { w: number; h: number };
    at: { x: number; y: number };
    near?: Ident;
    note: string;
}

type Cue = ElementCue | PinCue;

interface Originals {
    translate: string;
    scale: string;
    color: string;
    backgroundColor: string;
    opacity: string;
}

interface Drag {
    el: HTMLElement;
    clickTarget: HTMLElement;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
    rect: Box;
    moved: boolean;
}

interface FiberLike {
    type?: unknown;
    return?: FiberLike | null;
}



/* ── Utilitare ──────────────────────────────────────────── */

const STORAGE_CUES = 'regie:cues:v1';
const STORAGE_ON = 'regie:activ';
const STORAGE_DOCK = 'regie:dock';

function load<T>(key: string, fallback: T): T {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function save(key: string, value: unknown) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* stocarea poate lipsi (fereastră privată) — nu e grav */
    }
}

const uid = () => Math.random().toString(36).slice(2, 9);

const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

const toBox = (r: DOMRect): Box => ({
    x: Math.round(r.left),
    y: Math.round(r.top),
    w: Math.round(r.width),
    h: Math.round(r.height),
});

const isRegieUI = (node: EventTarget | null): boolean =>
    node instanceof Element && !!node.closest('[data-regie-ui]');

const cleanText = (el: Element) =>
    ((el as HTMLElement).innerText || el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);

/** Componente interne Next.js / React — nu ne interesează în listă. */
const INTERNALS = /^(InnerLayoutRouter|OuterLayoutRouter|LayoutRouter|RenderFromTemplateContext|ScrollAndFocusHandler|InnerScrollAndFocusHandler|LoadingBoundary|ErrorBoundary.*|.*ErrorBoundary|HTTPAccessFallback.*|RedirectBoundary|NotFoundBoundary|DevRootHTTPAccessFallbackBoundary|AppRouter|Router|ServerRoot|Root|HotReload|ReactDevOverlay|AppDevOverlay.*|MetadataOutlet|ClientPageRoot|ClientSegmentRoot|SegmentViewNode|SegmentStateProvider|SegmentBoundaryTriggerNode|GlobalError|Suspense|Fragment)$/;

function nameOf(t: unknown): string | undefined {
    if (typeof t === 'function') {
        const f = t as { displayName?: string; name?: string };
        return f.displayName || f.name;
    }
    if (t && typeof t === 'object') {
        const o = t as {
            displayName?: string;
            render?: { displayName?: string; name?: string };
            type?: { displayName?: string; name?: string };
        };
        return o.displayName || o.render?.displayName || o.render?.name || o.type?.displayName || o.type?.name;
    }
    return undefined;
}

/** Numele componentelor React care conțin elementul (cel mai apropiat întâi). */
function componentNames(el: Element): string[] {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    if (!key) return [];
    let fiber = (el as unknown as Record<string, FiberLike | undefined>)[key];
    const names: string[] = [];
    let guard = 0;
    while (fiber && names.length < 4 && guard < 300) {
        guard += 1;
        const name = nameOf(fiber.type);
        if (name && /^[A-Z]/.test(name) && !INTERNALS.test(name) && !names.includes(name)) {
            names.push(name);
            if (name === 'AppWrapper') break;
        }
        fiber = fiber.return ?? undefined;
    }
    return names;
}

/** Un selector CSS scurt, suficient ca să regăsim elementul. */
function cssPath(el: Element): string {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node !== document.body && node !== document.documentElement && parts.length < 6) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
            parts.unshift(`${part}#${CSS.escape(node.id)}`);
            break;
        }
        const classes = Array.from(node.classList).slice(0, 2);
        if (classes.length) part += classes.map((c) => `.${CSS.escape(c)}`).join('');
        const parent: Element | null = node.parentElement;
        if (parent) {
            const tag = node.tagName;
            const same = Array.from(parent.children).filter((c) => c.tagName === tag);
            if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = parent;
    }
    return parts.join(' > ');
}

function identify(el: Element): Ident {
    const ident: Ident = {
        tag: el.tagName.toLowerCase(),
        text: cleanText(el),
        components: componentNames(el),
        selector: cssPath(el),
        classes: (el.getAttribute('class') || '').slice(0, 200),
    };
    const href = el.closest('a')?.getAttribute('href');
    if (href) ident.href = href;
    if (el instanceof HTMLImageElement) {
        ident.src = el.getAttribute('src') || undefined;
        ident.alt = el.alt || undefined;
    }
    return ident;
}

function labelOf(id: Ident): string {
    const what = id.text
        ? `„${id.text.length > 34 ? `${id.text.slice(0, 34)}…` : id.text}”`
        : id.alt
            ? `„${id.alt}”`
            : id.src
                ? id.src.split('/').pop() || ''
                : '(fără text)';
    return `<${id.tag}> ${what}`;
}

function changesOf(c: ElementCue): string[] {
    const out: string[] = [];
    if (c.move && (c.move.dx || c.move.dy)) {
        const parts: string[] = [];
        if (c.move.dx) parts.push(`${Math.abs(c.move.dx)} px ${c.move.dx > 0 ? '→' : '←'}`);
        if (c.move.dy) parts.push(`${Math.abs(c.move.dy)} px ${c.move.dy > 0 ? '↓' : '↑'}`);
        out.push(`mutat ${parts.join(', ')}`);
    }
    if (c.scale && Math.abs(c.scale - 1) > 0.001) {
        out.push(`${c.scale > 1 ? 'mărit' : 'micșorat'} ×${c.scale.toFixed(2).replace('.', ',')}`);
    }
    if (c.color) out.push(`text ${c.color}`);
    if (c.background) out.push(`fundal ${c.background}`);
    if (c.hidden) out.push('de scos');
    return out;
}

function buildText(cues: Cue[]): string {
    const lines: string[] = [
        `REGIE — ${cues.length} cue-uri — ecran ${window.innerWidth}×${window.innerHeight} — ${new Date().toLocaleString('ro-RO')}`,
        '',
    ];
    cues.forEach((c, i) => {
        const n = String(i + 1).padStart(2, '0');
        if (c.kind === 'element') {
            const comps = c.target.components.length ? ` [${c.target.components.join(' › ')}]` : '';
            lines.push(`${n}  pagina ${c.page} · ${labelOf(c.target)}${comps}`);
            const changes = changesOf(c);
            if (changes.length) lines.push(`    ${changes.join(' · ')}`);
            if (c.note) lines.push(`    notă: „${c.note}”`);
        } else {
            const near = c.near ? ` lângă ${labelOf(c.near)}` : '';
            lines.push(`${n}  pagina ${c.page} · NOTĂ la (${c.at.x}, ${c.at.y})${near}`);
            lines.push(`    „${c.note || '(fără text)'}”`);
        }
    });
    return lines.join('\n');
}

/** Orice culoare CSS (inclusiv oklch) → #rrggbb, pentru selectorul de culoare. */
let probe: CanvasRenderingContext2D | null = null;
function toHex(css: string, fallback: string): string {
    try {
        if (!probe) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            probe = canvas.getContext('2d', { willReadFrequently: true });
        }
        if (!probe) return fallback;
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = css;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = Array.from(probe.getImageData(0, 0, 1, 1).data);
        if (a === 0) return fallback;
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    } catch {
        return fallback;
    }
}

const GLOBAL_CSS = `
html.regie-on, html.regie-on *:not([data-regie-ui]):not([data-regie-ui] *) {
    cursor: crosshair !important;
    user-select: none !important;
    -webkit-user-select: none !important;
}
html.regie-on.regie-drag, html.regie-on.regie-drag * { cursor: grabbing !important; }
`;



/* ── Componenta ─────────────────────────────────────────── */

export default function Regie() {
    const pathname = usePathname() || '/';

    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const [dock, setDock] = useState<'right' | 'left'>('right');
    const [collapsed, setCollapsed] = useState(false);
    const [pinMode, setPinMode] = useState(false);
    const [status, setStatus] = useState('');
    const [confirmReset, setConfirmReset] = useState(false);
    const [sending, setSending] = useState(false);
    const [, setVersion] = useState(0);

    const cuesRef = useRef<Cue[]>([]);
    const selectedRef = useRef<HTMLElement | null>(null);
    const selectedPinRef = useRef<string | null>(null);
    const hoverRef = useRef<HTMLElement | null>(null);
    const dragRef = useRef<Drag | null>(null);
    const pinModeRef = useRef(false);
    const pathRef = useRef(pathname);
    const elByCue = useRef(new Map<string, HTMLElement>());
    const cueByEl = useRef(new WeakMap<HTMLElement, string>());
    const originals = useRef(new Map<HTMLElement, Originals>());
    const hoverBoxRef = useRef<HTMLDivElement | null>(null);
    const selBoxRef = useRef<HTMLDivElement | null>(null);

    const bump = useCallback(() => setVersion((v) => v + 1), []);

    const commit = useCallback((next: Cue[]) => {
        cuesRef.current = next;
        save(STORAGE_CUES, next);
        bump();
    }, [bump]);


    /* ── stiluri temporare pe elemente ── */

    const remember = (el: HTMLElement) => {
        if (originals.current.has(el)) return;
        originals.current.set(el, {
            translate: el.style.getPropertyValue('translate'),
            scale: el.style.getPropertyValue('scale'),
            color: el.style.getPropertyValue('color'),
            backgroundColor: el.style.getPropertyValue('background-color'),
            opacity: el.style.getPropertyValue('opacity'),
        });
    };

    const restore = (el: HTMLElement) => {
        const o = originals.current.get(el);
        if (!o) return;
        el.style.setProperty('translate', o.translate);
        el.style.setProperty('scale', o.scale);
        el.style.setProperty('color', o.color);
        el.style.setProperty('background-color', o.backgroundColor);
        el.style.setProperty('opacity', o.opacity);
        originals.current.delete(el);
    };

    const paint = (el: HTMLElement, c: ElementCue) => {
        remember(el);
        const o = originals.current.get(el) as Originals;
        el.style.setProperty('translate', c.move ? `${c.move.dx}px ${c.move.dy}px` : o.translate);
        el.style.setProperty('scale', c.scale && c.scale !== 1 ? String(c.scale) : o.scale);
        el.style.setProperty('color', c.color || o.color);
        el.style.setProperty('background-color', c.background || o.backgroundColor);
        el.style.setProperty('opacity', c.hidden ? '0.15' : o.opacity);
    };


    /* ── cues ── */

    const cueFor = (el: HTMLElement): ElementCue | undefined => {
        const id = cueByEl.current.get(el);
        if (!id) return undefined;
        const c = cuesRef.current.find((x) => x.id === id);
        return c && c.kind === 'element' ? c : undefined;
    };

    const update = (el: HTMLElement, patch: Partial<ElementCue>, rectBefore?: Box) => {
        const existing = cueFor(el);
        let cue: ElementCue;
        let next: Cue[];
        if (!existing) {
            cue = {
                id: uid(),
                kind: 'element',
                page: pathRef.current,
                viewport: viewport(),
                scrollY: Math.round(window.scrollY),
                target: identify(el),
                rect: rectBefore || toBox(el.getBoundingClientRect()),
                ...patch,
            };
            cueByEl.current.set(el, cue.id);
            elByCue.current.set(cue.id, el);
            next = [...cuesRef.current, cue];
        } else {
            cue = { ...existing, ...patch, viewport: viewport() };
            next = cuesRef.current.map((x) => (x.id === cue.id ? cue : x));
        }
        paint(el, cue);
        commit(next);
    };

    const removeCue = (id: string) => {
        const el = elByCue.current.get(id);
        if (el) {
            restore(el);
            cueByEl.current.delete(el);
            elByCue.current.delete(id);
        }
        if (selectedPinRef.current === id) selectedPinRef.current = null;
        commit(cuesRef.current.filter((c) => c.id !== id));
    };

    const clearAll = () => {
        Array.from(originals.current.keys()).forEach(restore);
        cueByEl.current = new WeakMap();
        elByCue.current.clear();
        selectedRef.current = null;
        selectedPinRef.current = null;
        commit([]);
    };

    const select = (el: HTMLElement | null) => {
        selectedRef.current = el;
        selectedPinRef.current = null;
        bump();
    };

    const addPin = (x: number, y: number, under: HTMLElement | null) => {
        const pin: PinCue = {
            id: uid(),
            kind: 'pin',
            page: pathRef.current,
            viewport: viewport(),
            at: { x: Math.round(x + window.scrollX), y: Math.round(y + window.scrollY) },
            near: under ? identify(under) : undefined,
            note: '',
        };
        pinModeRef.current = false;
        setPinMode(false);
        selectedRef.current = null;
        selectedPinRef.current = pin.id;
        commit([...cuesRef.current, pin]);
    };


    /* ── pornire: starea salvată ── */

    useEffect(() => {
        cuesRef.current = load<Cue[]>(STORAGE_CUES, []);
        setActive(load<boolean>(STORAGE_ON, false));
        setDock(load<'right' | 'left'>(STORAGE_DOCK, 'right'));
        setMounted(true);

        const style = document.createElement('style');
        style.setAttribute('data-regie-ui', '');
        style.textContent = GLOBAL_CSS;
        document.head.appendChild(style);
        return () => {
            style.remove();
        };
    }, []);

    useEffect(() => {
        if (mounted) save(STORAGE_ON, active);
    }, [active, mounted]);

    useEffect(() => {
        if (mounted) save(STORAGE_DOCK, dock);
    }, [dock, mounted]);


    /* ── la schimbarea paginii: regăsim elementele cu cue-uri ── */

    useEffect(() => {
        if (!mounted) return;
        pathRef.current = pathname;
        selectedRef.current = null;
        selectedPinRef.current = null;
        hoverRef.current = null;
        const timer = window.setTimeout(() => {
            cuesRef.current.forEach((c) => {
                if (c.kind !== 'element' || c.page !== pathname) return;
                const known = elByCue.current.get(c.id);
                if (known && known.isConnected) return;
                let el: HTMLElement | null = null;
                try {
                    el = document.querySelector(c.target.selector);
                } catch {
                    el = null;
                }
                if (!el || cleanText(el) !== c.target.text) return;
                elByCue.current.set(c.id, el);
                cueByEl.current.set(el, c.id);
                paint(el, c);
            });
            bump();
        }, 400);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, mounted]);


    /* ── modul activ: mouse, tastatură, contururi ── */

    useEffect(() => {
        if (!active) return;
        const root = document.documentElement;
        root.classList.add('regie-on');

        const pick = (x: number, y: number): HTMLElement | null => {
            const el = document.elementFromPoint(x, y);
            if (!el || el === root || el === document.body) return null;
            if (isRegieUI(el) || el.closest('nextjs-portal')) return null;
            return el as HTMLElement;
        };

        const onMove = (e: PointerEvent) => {
            const d = dragRef.current;
            if (d) {
                const dx = e.clientX - d.startX;
                const dy = e.clientY - d.startY;
                if (!d.moved && Math.hypot(dx, dy) < 3) return;
                if (!d.moved) {
                    d.moved = true;
                    root.classList.add('regie-drag');
                    remember(d.el);
                }
                d.el.style.setProperty('translate', `${d.baseDx + dx}px ${d.baseDy + dy}px`);
                return;
            }
            hoverRef.current = isRegieUI(e.target) ? null : pick(e.clientX, e.clientY);
        };

        const onDown = (e: PointerEvent) => {
            if (e.button !== 0 || isRegieUI(e.target)) return;
            e.preventDefault();
            e.stopPropagation();
            const target = pick(e.clientX, e.clientY);
            if (pinModeRef.current) {
                addPin(e.clientX, e.clientY, target);
                return;
            }
            if (!target) {
                select(null);
                return;
            }
            const current = selectedRef.current;
            const el = current && current.contains(target) ? current : target;
            if (el !== current) select(el);
            const existing = cueFor(el);
            dragRef.current = {
                el,
                clickTarget: target,
                startX: e.clientX,
                startY: e.clientY,
                baseDx: existing?.move?.dx ?? 0,
                baseDy: existing?.move?.dy ?? 0,
                rect: existing ? existing.rect : toBox(el.getBoundingClientRect()),
                moved: false,
            };
        };

        const onUp = (e: PointerEvent) => {
            const d = dragRef.current;
            if (!d) {
                if (!isRegieUI(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return;
            }
            dragRef.current = null;
            root.classList.remove('regie-drag');
            e.preventDefault();
            e.stopPropagation();
            if (d.moved) {
                const dx = Math.round(d.baseDx + e.clientX - d.startX);
                const dy = Math.round(d.baseDy + e.clientY - d.startY);
                update(d.el, { move: { dx, dy } }, d.rect);
            } else if (d.clickTarget !== d.el) {
                // click simplu în interiorul selecției → coborâm la elementul apăsat
                select(d.clickTarget);
            }
        };

        const block = (e: Event) => {
            if (isRegieUI(e.target)) return;
            e.preventDefault();
            e.stopPropagation();
        };

        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key === 'Escape') {
                pinModeRef.current = false;
                setPinMode(false);
                select(null);
                return;
            }
            const el = selectedRef.current;
            if (!el) return;
            const step = e.shiftKey ? 10 : 1;
            const deltas: Record<string, [number, number]> = {
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
                ArrowUp: [0, -step],
                ArrowDown: [0, step],
            };
            const delta = deltas[e.key];
            if (!delta) return;
            e.preventDefault();
            e.stopPropagation();
            const c = cueFor(el);
            update(el, {
                move: {
                    dx: (c?.move?.dx ?? 0) + delta[0],
                    dy: (c?.move?.dy ?? 0) + delta[1],
                },
            });
        };

        const blocked = ['click', 'dblclick', 'auxclick', 'dragstart', 'submit'];
        window.addEventListener('pointermove', onMove, true);
        window.addEventListener('pointerdown', onDown, true);
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('keydown', onKey, true);
        blocked.forEach((type) => window.addEventListener(type, block, true));

        let raf = 0;
        const place = (box: HTMLDivElement | null, el: HTMLElement | null) => {
            if (!box) return;
            if (!el || !el.isConnected) {
                box.style.display = 'none';
                return;
            }
            const r = el.getBoundingClientRect();
            box.style.display = 'block';
            box.style.transform = `translate(${r.left}px, ${r.top}px)`;
            box.style.width = `${r.width}px`;
            box.style.height = `${r.height}px`;
        };
        const loop = () => {
            const sel = selectedRef.current;
            if (sel && !sel.isConnected) {
                selectedRef.current = null;
                bump();
            }
            place(selBoxRef.current, selectedRef.current);
            const hov = hoverRef.current;
            place(hoverBoxRef.current, hov && hov !== selectedRef.current && !dragRef.current ? hov : null);
            raf = window.requestAnimationFrame(loop);
        };
        raf = window.requestAnimationFrame(loop);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerdown', onDown, true);
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('keydown', onKey, true);
            blocked.forEach((type) => window.removeEventListener(type, block, true));
            root.classList.remove('regie-on', 'regie-drag');
            hoverRef.current = null;
            dragRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);


    /* ── acțiuni din panou ── */

    const exit = () => {
        pinModeRef.current = false;
        setPinMode(false);
        selectedRef.current = null;
        selectedPinRef.current = null;
        setActive(false);
    };

    const togglePin = () => {
        const next = !pinModeRef.current;
        pinModeRef.current = next;
        setPinMode(next);
    };

    const selectParent = () => {
        const p = selectedRef.current?.parentElement;
        if (p && p !== document.body && p !== document.documentElement && !isRegieUI(p)) select(p);
    };

    const scaleBy = (factor: number) => {
        const el = selectedRef.current;
        if (!el) return;
        const c = cueFor(el);
        update(el, { scale: Math.round((c?.scale ?? 1) * factor * 100) / 100 });
    };

    const setPinNote = (id: string, note: string) => {
        commit(cuesRef.current.map((c) => (c.id === id && c.kind === 'pin' ? { ...c, note } : c)));
    };

    const focusCue = (c: Cue) => {
        if (c.page !== pathRef.current) {
            setStatus(`Cue-ul e pe pagina ${c.page}.`);
            return;
        }
        if (c.kind === 'pin') {
            selectedRef.current = null;
            selectedPinRef.current = c.id;
            bump();
            window.scrollTo({ top: Math.max(0, c.at.y - window.innerHeight / 2), behavior: 'smooth' });
            return;
        }
        const el = elByCue.current.get(c.id);
        if (el && el.isConnected) {
            select(el);
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    };

    const onReset = () => {
        if (!confirmReset) {
            setConfirmReset(true);
            window.setTimeout(() => setConfirmReset(false), 3000);
            return;
        }
        setConfirmReset(false);
        clearAll();
        setStatus('Totul a revenit la normal.');
    };

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(buildText(cuesRef.current));
            setStatus('Copiat ✓ — lipește textul în chat.');
        } catch {
            setStatus('Nu am putut copia automat.');
        }
    };

    const send = async () => {
        const cues = cuesRef.current;
        if (!cues.length || sending) return;
        setSending(true);
        const payload = {
            v: 1,
            sentAt: new Date().toISOString(),
            page: pathRef.current,
            viewport: viewport(),
            text: buildText(cues),
            cues,
        };
        (window as unknown as { __regie?: unknown }).__regie = payload;
        try {
            const res = await fetch('/api/regie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(String(res.status));
            clearAll();
            setStatus(`Trimis ✓ ${cues.length} cue-uri. Scrie-i lui Claude „am trimis”.`);
        } catch {
            setStatus('Nu am putut trimite. Apasă „Copiază” și lipește textul în chat.');
        } finally {
            setSending(false);
        }
    };


    /* ── randare ── */

    if (!mounted) return null;

    const cues = cuesRef.current;
    const sel = selectedRef.current && selectedRef.current.isConnected ? selectedRef.current : null;
    const selIdent = sel ? identify(sel) : null;
    const selCue = sel ? cueFor(sel) : undefined;
    const pinIndex = selectedPinRef.current ? cues.findIndex((c) => c.id === selectedPinRef.current) : -1;
    const pin = pinIndex >= 0 && cues[pinIndex].kind === 'pin' ? (cues[pinIndex] as PinCue) : null;
    const computed = sel ? window.getComputedStyle(sel) : null;

    return createPortal(
        <>
            {!active && (
                <button
                    type="button"
                    data-regie-ui=""
                    className={styles.launch}
                    onClick={() => setActive(true)}
                    title="Modul Regie — doar în previzualizarea locală"
                >
                    <span className={styles.dot} aria-hidden="true" />
                    REGIE{cues.length ? ` · ${cues.length}` : ''}
                </button>
            )}

            {active && (
                <>
                    <div ref={hoverBoxRef} className={styles.hoverBox} aria-hidden="true" />
                    <div ref={selBoxRef} className={styles.selBox} aria-hidden="true">
                        {selIdent && <div className={styles.selTag}>{labelOf(selIdent)}</div>}
                    </div>

                    <div className={styles.pinLayer}>
                        {cues.map((c, i) => (c.kind === 'pin' && c.page === pathname ? (
                            <button
                                key={c.id}
                                type="button"
                                data-regie-ui=""
                                className={`${styles.pin} ${c.id === selectedPinRef.current ? styles.pinActive : ''}`}
                                style={{ left: c.at.x, top: c.at.y }}
                                aria-label={`Notă ${i + 1}`}
                                onClick={() => {
                                    selectedRef.current = null;
                                    selectedPinRef.current = c.id;
                                    bump();
                                }}
                            >
                                {i + 1}
                            </button>
                        ) : null))}
                    </div>

                    <aside
                        data-regie-ui=""
                        aria-label="Modul Regie"
                        className={[
                            styles.panel,
                            dock === 'left' ? styles.left : '',
                            collapsed ? styles.collapsed : '',
                        ].filter(Boolean).join(' ')}
                    >
                        <header className={styles.head}>
                            <span className={styles.rec}>
                                <span className={styles.dot} aria-hidden="true" />
                                REGIE
                            </span>
                            <span className={styles.page}>{pathname}</span>
                            <span className={styles.headBtns}>
                                <button
                                    type="button"
                                    onClick={() => setDock((d) => (d === 'right' ? 'left' : 'right'))}
                                    aria-label="Mută panoul în partea cealaltă"
                                    title="Mută panoul în partea cealaltă"
                                >
                                    ⇆
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCollapsed((v) => !v)}
                                    aria-label={collapsed ? 'Deschide panoul' : 'Strânge panoul'}
                                    title={collapsed ? 'Deschide panoul' : 'Strânge panoul'}
                                >
                                    {collapsed ? '▢' : '–'}
                                </button>
                                <button
                                    type="button"
                                    onClick={exit}
                                    aria-label="Ieși din Modul Regie"
                                    title="Ieși din Modul Regie (cue-urile rămân)"
                                >
                                    ×
                                </button>
                            </span>
                        </header>

                        {!collapsed && (
                            <div className={styles.body}>
                                {!sel && !pin && (
                                    <p className={styles.help}>
                                        Click pe un element ca să-l alegi, apoi trage-l unde vrei.
                                        Săgețile îl mută fin (Shift = 10 px). Esc renunță.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className={`${styles.wide} ${pinMode ? styles.on : ''}`}
                                    onClick={togglePin}
                                >
                                    {pinMode ? 'Click oriunde pe pagină…' : '+ Notă nouă pe pagină'}
                                </button>

                                {sel && selIdent && (
                                    <section className={styles.card}>
                                        <div className={styles.cardTitle}>{labelOf(selIdent)}</div>
                                        {selIdent.components.length > 0 && (
                                            <div className={styles.meta}>{selIdent.components.join(' › ')}</div>
                                        )}

                                        <div className={styles.row}>
                                            <button type="button" onClick={selectParent}>↑ Părinte</button>
                                            <button type="button" onClick={() => scaleBy(1 / 1.1)}>− Mai mic</button>
                                            <button type="button" onClick={() => scaleBy(1.1)}>+ Mai mare</button>
                                        </div>

                                        <div className={styles.row}>
                                            <label className={styles.swatch}>
                                                Text
                                                <input
                                                    type="color"
                                                    value={selCue?.color || toHex(computed?.color || '', '#000000')}
                                                    onChange={(e) => update(sel, { color: e.target.value })}
                                                />
                                            </label>
                                            <label className={styles.swatch}>
                                                Fundal
                                                <input
                                                    type="color"
                                                    value={selCue?.background || toHex(computed?.backgroundColor || '', '#ffffff')}
                                                    onChange={(e) => update(sel, { background: e.target.value })}
                                                />
                                            </label>
                                            <button type="button" onClick={() => update(sel, { hidden: !selCue?.hidden })}>
                                                {selCue?.hidden ? 'Arată' : 'Ascunde'}
                                            </button>
                                        </div>

                                        <label className={styles.noteLabel}>
                                            Notă pentru Claude
                                            <textarea
                                                rows={2}
                                                value={selCue?.note || ''}
                                                placeholder="ex.: mai discret, aliniat cu titlul"
                                                onChange={(e) => update(sel, { note: e.target.value })}
                                            />
                                        </label>

                                        {selCue && (
                                            <button type="button" className={styles.linkBtn} onClick={() => removeCue(selCue.id)}>
                                                Anulează modificările acestui element
                                            </button>
                                        )}
                                    </section>
                                )}

                                {pin && (
                                    <section className={styles.card}>
                                        <div className={styles.cardTitle}>Notă pe pagină · {String(pinIndex + 1).padStart(2, '0')}</div>
                                        <label className={styles.noteLabel}>
                                            Ce vrei aici?
                                            <textarea
                                                rows={3}
                                                autoFocus
                                                value={pin.note}
                                                placeholder="ex.: aici vreau o poză cu echipa"
                                                onChange={(e) => setPinNote(pin.id, e.target.value)}
                                            />
                                        </label>
                                        <button type="button" className={styles.linkBtn} onClick={() => removeCue(pin.id)}>
                                            Șterge nota
                                        </button>
                                    </section>
                                )}

                                <section className={styles.list} aria-label="Lista de cue-uri">
                                    <div className={styles.listHead}>Cue-uri ({cues.length})</div>
                                    {cues.length === 0 && <p className={styles.empty}>Nimic încă.</p>}
                                    <ol>
                                        {cues.map((c, i) => {
                                            const isSel = (c.kind === 'pin' && c.id === selectedPinRef.current)
                                                || (c.kind === 'element' && !!sel && elByCue.current.get(c.id) === sel);
                                            const detail = c.kind === 'element'
                                                ? [...changesOf(c), c.note ? `„${c.note}”` : ''].filter(Boolean).join(' · ') || 'fără modificări încă'
                                                : (c.note ? `„${c.note}”` : 'fără text încă');
                                            return (
                                                <li key={c.id} className={isSel ? styles.cueSel : undefined}>
                                                    <button type="button" className={styles.cueBtn} onClick={() => focusCue(c)}>
                                                        <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                                                        <span className={styles.cueText}>
                                                            {c.kind === 'element' ? labelOf(c.target) : 'Notă pe pagină'}
                                                            {c.page !== pathname && <em> · {c.page}</em>}
                                                            <small>{detail}</small>
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.x}
                                                        aria-label={`Șterge cue-ul ${i + 1}`}
                                                        onClick={() => removeCue(c.id)}
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </section>
                            </div>
                        )}

                        <footer className={styles.foot}>
                            <div className={styles.footBtns}>
                                <button type="button" className={styles.ghost} onClick={onReset}>
                                    {confirmReset ? 'Sigur? Încă o dată' : 'Resetează'}
                                </button>
                                <button type="button" className={styles.ghost} onClick={copyText} disabled={!cues.length}>
                                    Copiază
                                </button>
                                <button
                                    type="button"
                                    className={styles.primary}
                                    onClick={send}
                                    disabled={!cues.length || sending}
                                >
                                    {sending ? 'Trimit…' : 'Trimite la Claude →'}
                                </button>
                            </div>
                            {status && <p className={styles.status} role="status">{status}</p>}
                        </footer>
                    </aside>
                </>
            )}
        </>,
        document.body,
    );
}
