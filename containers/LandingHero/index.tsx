'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import Link from 'next/link';

import Cofinance from '@/containers/Cofinance';
import FilmDetail from '@/containers/FilmDetail';
import HeaderClocks from '@/containers/HeaderClocks';

import styles from './landing.module.css';



/* ============================================================
   Atemporal Film — homepage
   Port 1:1 al design-ului Claude (home.jsx + index.html + styles.css).
   Galerie centrală cu scroll-snap. Restul layout-ului e fix.
   Textele laterale și parantezele se schimbă cu fade subtil când
   imaginea curentă se schimbă.
   ============================================================ */


interface Project {
    title:       string;   // EN (mereu obligatoriu)
    titleRo:     string;   // RO (mereu obligatoriu)
    titleFr?:    string;   // FR (opțional — fallback la EN)
    year:        string;
    director:    string;
    production:  string;

    // Câmpurile de mai jos sunt în RO ca DEFAULT.
    // Pentru a adăuga EN/FR, adaugă câmpuri cu sufix:
    //   description    (RO, default)
    //   descriptionEn  (EN)
    //   descriptionFr  (FR)
    // Dacă lipsește o variantă, se afișează RO ca fallback.
    description:    string;
    descriptionEn?: string;
    descriptionFr?: string;
    awards:    string;
    awardsEn?: string;
    awardsFr?: string;
    people:    string;
    peopleEn?: string;
    peopleFr?: string;

    // Creditul din dreapta galeriei (Modul Regie, 30.10.2026, seria a treia):
    //   work — pe scurt, ce a făcut echipa la film (ex. „Sound design, mixing, distribution”)
    //   by   — cine (ex. „Stefan Azaharioaie”)
    // Dacă lipsesc, se afișează textele temporare WORK_PLACEHOLDER / BY_DEFAULT.
    work?:   string;
    workEn?: string;
    workFr?: string;
    by?:     string;

    image: string;   // /assets/entities/...
}


/* ── Limbi & traduceri UI ──────────────────────────────── */

type Lang = 'ro' | 'en' | 'fr';

const LANG_LABEL: Record<Lang, string> = { ro: 'RO', en: 'EN', fr: 'FR' };
const LANG_NEXT:  Record<Lang, Lang>   = { ro: 'en', en: 'fr', fr: 'ro' };

interface UITexts {
    nav: {
        about:    string;
        people:   string;
        services: string;
        contact:  string;
        latest:   string;
    };
    films: string;   // eticheta listei de filme (doar pentru cititoarele de ecran)
    by:    string;
    rec:   string;
}

const UI: Record<Lang, UITexts> = {
    ro: {
        nav: {
            about:    'Despre',
            people:   'Echipa',
            services: 'Servicii',
            contact:  'Contact',
            latest:   'Recente',
        },
        films: 'Filme',
        by:    'by',
        rec:   'REC',
    },
    en: {
        nav: {
            about:    'About',
            people:   'People',
            services: 'Services',
            contact:  'Contact',
            latest:   'Latest',
        },
        films: 'Films',
        by:    'by',
        rec:   'REC',
    },
    fr: {
        nav: {
            about:    'À propos',
            people:   'Équipe',
            services: 'Services',
            contact:  'Contact',
            latest:   'Récents',
        },
        films: 'Films',
        by:    'by',
        rec:   'REC',
    },
};


/** Ce a făcut echipa la film, în limba selectată (fallback: RO, apoi textul temporar). */
const WORK_PLACEHOLDER = 'Sound design, mixing, distribution';   // TEMPORAR — de scris pentru fiecare film
const BY_DEFAULT       = 'Stefan Azaharioaie';

function pickWork(p: Project, lang: Lang): string {
    const v = lang === 'en' ? p.workEn : lang === 'fr' ? p.workFr : undefined;
    return v || p.work || WORK_PLACEHOLDER;
}

/** Titlul proiectului în limba selectată, cu fallback la EN. */
function pickTitle(p: Project, lang: Lang): string {
    if (lang === 'ro') return p.titleRo;
    if (lang === 'fr') return p.titleFr ?? p.title;
    return p.title;
}


// Date proiecte. AFIȘELE NOI (8 — în partea de sus, format 2:3 nativ).
// Apoi cele 11 filme cu hero JPG din /public/assets/entities/ (landscape, vor fi crop-uite).
// Toate textele temporare — de înlocuit ulterior.
const PROJECTS: Project[] = [

    // ──────────── AFIȘE NOI (din folderul "Afise filme") ────────────

    {
        title:       'Auntie Lica The Hunchback',
        titleRo:     'Mătușa Lica Cocoșata',
        year:        'short',
        director:    'Paul-Răzvan Macovei',
        production:  '—',
        description: 'Sound design și post-producție audio. Descriere temporară — de înlocuit cu textul real al proiectului.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nPaul-Răzvan Macovei (regie)\ncu Oana Rusu, Diana Cavallioti, Vișarion Udatu, Bogdan Farcaș, Șerban Pavlu',
        image:       '/assets/entities/posters/auntie-lica-the-hunchback.webp',
    },
    {
        title:       'On Saint Nicholas’ Eve',
        titleRo:     'În ajunul Sfântului Nicolae',
        year:        'short · animation',
        director:    'Emy Mirel Ivașcu',
        production:  '—',
        description: 'Sound design pentru o animație scurtă de iarnă. Descriere temporară — de înlocuit ulterior.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nEmy Mirel Ivașcu (regie, animație)',
        image:       '/assets/entities/posters/on-saint-nicholas-eve.webp',
    },
    {
        title:       'Tot Ce Rămâne',
        titleRo:     'Tot ce rămâne',
        year:        'short 2024',
        director:    'Andrei Redinciuc',
        production:  'Libra Film · Asociația Culturală „Șerban Ionescu”',
        description: 'Post-producție sunet pentru un scurtmetraj de ficțiune. Descriere temporară.',
        awards:      'Warsaw Film Festival 2024 · Tot Live Action Short',
        people:      'Ionuț Alin Ionescu (sound)\nAndrei Redinciuc (regie)\ncu Coca Bloos, Cezar Antal, Alexandru Pavel, Angela Ioan',
        image:       '/assets/entities/posters/tot-ce-ramane.webp',
    },
    {
        title:       'Everything Is Great And Nobody’s Happy',
        titleRo:     'Totul e bine și nimeni nu e fericit',
        year:        'short',
        director:    'Ioana Pâșărin',
        production:  'Dog Bites Back · Western Transylvania Studios',
        description: 'Sound design pentru o comedie de epocă cu tonalitate jucăușă. Descriere temporară — de înlocuit.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nIoana Pâșărin (regie)\ncu Cosmina Olariu, Alina Chivulescu, Letiția Vlădescu',
        image:       '/assets/entities/posters/everything-is-great-and-nobodys-happy.webp',
    },
    {
        title:       'Between the Edges of the Day',
        titleRo:     'Între marginile zilei',
        year:        'short',
        director:    'Andreea Lăcătuș',
        production:  '—',
        description: 'Post-producție sunet pentru un scurtmetraj intim. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAndreea Lăcătuș (regie)',
        image:       '/assets/entities/posters/between-the-edges-of-the-day.webp',
    },
    {
        title:       'The Nun',
        titleRo:     'Călugărița',
        year:        'feature 2018 · horror',
        director:    'Corin Hardy',
        production:  'New Line Cinema · The Conjuring Universe',
        description: 'Contribuție la post-producția sunet pentru distribuția locală. Descriere temporară — de detaliat ulterior.',
        awards:      'distribuție internațională',
        people:      'Ionuț Alin Ionescu (sound)\nCorin Hardy (regie)',
        image:       '/assets/entities/posters/the-nun.webp',
    },
    {
        title:       'Cat Funeral',
        titleRo:     'Cat Funeral',
        year:        'short',
        director:    'Ana-Maria Comănescu',
        production:  'Castalia Pictures',
        description: 'Sound design și post-producție audio pentru un scurtmetraj atmosferic. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAna-Maria Comănescu (regie)\ncu Dana Marineci, Robi Urs, Cristiana Luca',
        image:       '/assets/entities/posters/cat-funeral.webp',
    },
    {
        title:       'A River’s Gaze',
        titleRo:     'Privirea râului',
        year:        'short',
        director:    'Andreea Cristina Borțun',
        production:  '—',
        description: 'Sound design pentru un scurtmetraj de ficțiune contemplativ. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAndreea Cristina Borțun (regie, scenariu)',
        image:       '/assets/entities/posters/a-rivers-gaze.webp',
    },


    // ──────────── FILMELE EXISTENTE (cu hero JPG-uri landscape, vor fi crop-uite) ────────────

    {
        title:       'Where Elephants Go',
        titleRo:     'Unde merg elefanții',
        year:        'feature 2024',
        director:    'Cătălin Rotaru, Gabi Virginia Sarga',
        production:  'Atelier de Film',
        description: 'Post-production sound. Filmat în Delta Dunării. Travelling între lumi paralele și o căutare interioară prelungită.',
        awards:      'New Horizons IFF · IndieLisboa · Thessaloniki IFF · Transilvania IFF · Reykjavik IFF',
        people:      'Ionuț Alin Ionescu (sound design)\nCătălin Rotaru (regie)\nGabi Suciu (producător)',
        image:       '/assets/entities/2024-where-elephants-go-hero.jpg',
    },
    {
        title:       'Beyond Borders',
        titleRo:     'Dincolo de hotare',
        year:        'feature 2025',
        director:    'Mark Freiburger',
        production:  'co-produced by Ionuț Alin Ionescu',
        description: 'Field recording și post-production sound pentru un lung-metraj internațional. Imagine de Rogier Stoffers.',
        awards:      'în lucru — premiere 2025',
        people:      'Ionuț Alin Ionescu (co-producător, sound)\nMark Freiburger (regie)\nRogier Stoffers (imagine)',
        image:       '/assets/entities/2025-beyond-borders-hero.jpg',
    },
    {
        title:       'Nasty',
        titleRo:     'Nasty',
        year:        'feature 2024 · documentary',
        director:    'Tudor Giurgiu',
        production:  'Libra Film',
        description: 'Documentar despre Ilie Năstase. Sound design cinematografic care țese împreună arhive de epocă cu materialul nou.',
        awards:      'Cannes Film Festival 2024 · selecție oficială',
        people:      'Ionuț Alin Ionescu (sound design)\nTudor Giurgiu (regie)\nLibra Film (producție)',
        image:       '/assets/entities/2024-nasty-hero.jpg',
    },
    {
        title:       'The Heroes from Jiului Bridge',
        titleRo:     'Eroii de la podul Jiului',
        year:        'feature 2022',
        director:    'Sergiu Prodan, Barbu Silviu Tripăduș',
        production:  'produced by Carmen Tripăduș',
        description: 'Reconstituirea evenimentelor din decembrie ’89. Sound design construit pe straturi de arhivă și recreări de teren.',
        awards:      'distribuție națională · selecții festivaluri internaționale',
        people:      'Ionuț Alin Ionescu (sound)\nSergiu Prodan (regie)\nCarmen Tripăduș (producător)',
        image:       '/assets/entities/2022-eroii-de-la-podul-jiului-hero.jpg',
    },
    {
        title:       'Thou Shalt Not Kill',
        titleRo:     'Să nu ucizi',
        year:        'feature 2018',
        director:    'Cătălin Rotaru, Gabi Virginia Sarga',
        production:  'Green Cat Film',
        description: 'Dramă morală cu o construcție sonoră austeră. Tăceri lungi, voci joase, spațiu acustic disecat cu precizie.',
        awards:      'IndieLisboa · Göteborg · Ghent · Hamburg · Warsaw IFF · Calgary · TIFF',
        people:      'Ionuț Alin Ionescu (sound design)\nCătălin Rotaru (regie)\nGabi Suciu (producător)',
        image:       '/assets/entities/2018-thou-shalt-not-kill-hero.jpg',
    },
    {
        title:       'House of Dolls',
        titleRo:     'Casa cu păpuși',
        year:        'feature 2020 · documentary',
        director:    'Tudor Platon',
        production:  'Micro Film',
        description: 'Documentar de observație. Sunet capturat în timp real, fără procesare excesivă — un microfon discret în mijlocul familiei.',
        awards:      'Sarajevo Film Festival 2020 · TIFF 2020',
        people:      'Ionuț Alin Ionescu (sound)\nTudor Platon (regie)\nCarla Fotea (producător)',
        image:       '/assets/entities/2020-house-of-dolls-hero.jpg',
    },
    {
        title:       'Where the Boats Don’t Go',
        titleRo:     'Acolo unde bărcile nu ajung',
        year:        'short 2023',
        director:    'Vlad Buzăianu',
        production:  'Tangaj Film',
        description: 'Scurtmetraj filmat în Delta Dunării. Field recording extensiv — păsări, apă, vânt construite în peisaje sonore.',
        awards:      'Trieste FF · TIFF · Anonimul · ESTE FILM · Cyprus ISFF · GOPO 2024',
        people:      'Ionuț Alin Ionescu (sound design)\nVlad Buzăianu (regie)\nAnamaria Antoci, Ana Voicu (producători)',
        image:       '/assets/entities/2023-acolo-unde-barcile-nu-ajung-hero.jpg',
    },
    {
        title:       'A Fish on a Ladder',
        titleRo:     'Un pește pe o scară',
        year:        'short 2021 · animation',
        director:    'Ioana Păsărin',
        production:  '—',
        description: 'Animație scurtă. Sound design construit de la zero — fiecare zgomot e fabricat în studio și pus în corespondență cu imaginea.',
        awards:      'Havana FF 2021 · Oberhausen ISFF 2021',
        people:      'Ionuț Alin Ionescu (sound design)\nIoana Păsărin (regie, animație)',
        image:       '/assets/entities/2021-a-fish-on-a-ladder-hero.jpg',
    },
    {
        title:       'Big Extravagance, Thin Crust, Hot Sauce',
        titleRo:     'Extravaganzia mare, blat subțire, sos iute',
        year:        'short 2021',
        director:    'Andrei Redinciuc',
        production:  'produced by Carol Ionescu',
        description: 'Comedie absurdă cu un strat sonor jucăuș. Foley artizanal și o coloană sonoră aproape muzicală a obiectelor de bucătărie.',
        awards:      'Brno FF · Goa SFF · Short Stop IFF · TIFF 2022 · Anonimul 2022 · Filmul de Piatra',
        people:      'Ionuț Alin Ionescu (sound)\nAndrei Redinciuc (regie)\nCarol Ionescu (producător)',
        image:       '/assets/entities/2021-extravaganzia-mare-hero.jpg',
    },
    {
        title:       'Along Came a Prince',
        titleRo:     'A venit un prinț',
        year:        'short 2020',
        director:    'Cristina Groșan',
        production:  'Tangaj Film',
        description: 'Scurtmetraj de ficțiune. Sound design intim — focalizare pe respirație, micro-detalii ale spațiului domestic.',
        awards:      'Brest EFCF | Prix du Jury Jeune 2020 · Namur FIFF · Prague Shorts · Regensburg ISFW · Cinema Jove',
        people:      'Ionuț Alin Ionescu (sound)\nCristina Groșan (regie)\nAnamaria Antoci, Anda Ionescu (producători)',
        image:       '/assets/entities/2020-along-came-a-prince-hero.jpg',
    },
    {
        title:       '4:15 P.M. End of the World',
        titleRo:     '4:15 P.M. Sfârșitul lumii',
        year:        'short 2016',
        director:    'Cătălin Rotaru, Gabi Virginia Sarga',
        production:  'Green Cat Film',
        description: 'Scurtmetraj filmat într-un singur cadru. Sound design al unei după-amieze obișnuite care alunecă spre catastrofă.',
        awards:      'Cannes 2016 · Short Film Palme d’Or — In Competition · LAFF 2017 · Sarajevo FF — Best Short Film',
        people:      'Ionuț Alin Ionescu (sound design)\nCătălin Rotaru (regie)\nAdina Sădeanu (producător)',
        image:       '/assets/entities/2016-end-of-the-world-hero.jpg',
    },
];



/* ============================================================
   <LandingHero />
   ============================================================ */

export default function LandingHero() {
    const [active, setActive]               = useState(0);
    const [textVisible, setTextVisible]     = useState(true);
    const [expandedIdx, setExpandedIdx]     = useState<number | null>(null);
    const [lang, setLang]                   = useState<Lang>('ro');
    const galleryRef    = useRef<HTMLDivElement | null>(null);
    const slotRefs      = useRef<(HTMLDivElement | null)[]>([]);
    const lastActiveRef = useRef(0);
    const listTrackRef  = useRef<HTMLOListElement | null>(null);
    const listItemRefs  = useRef<(HTMLLIElement | null)[]>([]);

    const t = UI[lang];


    // detectează ce slot e cel mai aproape de centru
    const updateActive = useCallback(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        const galleryRect = gallery.getBoundingClientRect();
        const galleryMid  = galleryRect.top + galleryRect.height / 2;
        let bestIdx  = 0;
        let bestDist = Infinity;
        slotRefs.current.forEach((el, i) => {
            if (!el) return;
            const r   = el.getBoundingClientRect();
            const mid = r.top + r.height / 2;
            const d   = Math.abs(mid - galleryMid);
            if (d < bestDist) {
                bestDist = d;
                bestIdx  = i;
            }
        });
        if (bestIdx !== lastActiveRef.current) {
            lastActiveRef.current = bestIdx;
            // fade text out → schimbă index → fade in
            setTextVisible(false);
            window.setTimeout(() => {
                setActive(bestIdx);
                setTextVisible(true);
            }, 220);
        }
    }, []);


    /* Lista de filme din stânga urmează galeria continuu: poziția în galerie
       (ex. 3,4 = între al 4-lea și al 5-lea afiș) mută lista cu exact atât,
       iar titlul aflat în dreptul ramei e plin, celelalte se sting cu distanța
       — ca afișele vecine. Scris direct în stil (fără re-render React). */
    const slotPitch = useCallback((): number => {
        const a = slotRefs.current[0];
        const b = slotRefs.current[1];
        return a && b ? b.offsetTop - a.offsetTop : 1;
    }, []);

    const syncList = useCallback(() => {
        const gallery = galleryRef.current;
        const track   = listTrackRef.current;
        const items   = listItemRefs.current;
        if (!gallery || !track || items.length === 0) return;
        const last = PROJECTS.length - 1;
        const f    = Math.min(last, Math.max(0, gallery.scrollTop / slotPitch()));
        const i0   = Math.floor(f);
        const i1   = Math.min(last, i0 + 1);
        const y0   = items[i0]?.offsetTop ?? 0;
        const y1   = items[i1]?.offsetTop ?? y0;
        const y    = y0 + (y1 - y0) * (f - i0);
        track.style.transform = `translate3d(0, ${-y}px, 0)`;
        items.forEach((el, i) => {
            if (!el) return;
            const d = Math.abs(i - f);
            el.style.opacity = String(Math.max(0.16, 1 - 0.6 * d));
        });
    }, [slotPitch]);

    const goTo = useCallback((i: number) => {
        galleryRef.current?.scrollTo({ top: i * slotPitch(), behavior: 'smooth' });
    }, [slotPitch]);


    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActive();
                    syncList();
                    ticking = false;
                });
                ticking = true;
            }
        };
        gallery.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        updateActive();
        syncList();
        // fonturile schimbă înălțimea rândurilor → recalculăm după ce se încarcă
        document.fonts?.ready.then(syncList).catch(() => {});
        return () => {
            gallery.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [updateActive, syncList]);

    // la schimbarea limbii titlurile își schimbă lungimea → recalculăm
    useEffect(() => { syncList(); }, [lang, syncList]);


    const proj            = PROJECTS[active];
    const projTitle       = pickTitle(proj, lang);
    const projWork        = pickWork(proj, lang);
    const projBy          = proj.by || BY_DEFAULT;

    const fadeStyle: React.CSSProperties = {
        opacity: textVisible ? 1 : 0,
        transition: 'opacity 0.35s ease',
    };


    /* -------------------------------------------------- *
     *                      RENDER
     * -------------------------------------------------- */
    return (
        <div className={styles.page}>

            {/* GRAIN overlay — peste tot */}
            <div className={styles.grain} aria-hidden="true" />


            {/* HEADER fix */}
            <header className={styles.siteHeader}>
                <Link href="/" className={styles.logo} aria-label="Atemporal Film">
                    <span className={`${styles.logoWord} ${styles.logoWord1}`}>Atemporal</span>
                    <span className={`${styles.logoWord} ${styles.logoWord2}`}>Film</span>
                </Link>

                {/* ceasurile + timecode 24 fps + REC — urcate din bara de jos (30.10, seria a treia) */}
                <HeaderClocks recLabel={t.rec} />
            </header>


            {/* NAV — în rândul antetului, în dreapta galeriei: Despre · Echipa · Contact,
                fără cifre și fără punctuație. Servicii și Recente scoase de pe homepage;
                butonul de limbă e în bara de jos. Modul Regie, 30.10.2026 (seria a doua). */}
            <nav className={styles.navRow} aria-label="Main navigation">
                <div className={`${styles.navGroup} ${styles.navGroupRight}`}>
                    <Link href="/about" className={styles.navItem}>{t.nav.about}</Link>
                    <Link href="/about" className={styles.navItem}>{t.nav.people}</Link>
                    <Link href="/contact" className={styles.navItem}>{t.nav.contact}</Link>
                </div>
            </nav>


            {/* STÂNGA — lista filmelor, în ordinea din galerie, sincronizată cu ea.
                Titlul din dreptul ramei stă unde era „descrierea proiectului”;
                cele de dinainte deasupra, cele următoare dedesubt. Click → galeria
                merge la filmul respectiv. (Modul Regie, 30.10.2026, seria a treia:
                descrierea, anul, premiile și „unde am fost” scoase de pe homepage.) */}
            <nav className={styles.filmList} aria-label={t.films}>
                <ol className={styles.filmListTrack} ref={listTrackRef}>
                    {PROJECTS.map((p, i) => (
                        <li
                            key={p.image}
                            ref={(el) => { listItemRefs.current[i] = el; }}
                            className={styles.filmListItem}
                            style={{ opacity: i === 0 ? 1 : Math.max(0.16, 1 - 0.6 * i) }}
                        >
                            <button
                                type="button"
                                className={styles.filmListBtn}
                                onClick={() => goTo(i)}
                                aria-current={i === active ? 'true' : undefined}
                            >
                                {pickTitle(p, lang)}
                            </button>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* DREAPTA — creditul: ce a făcut echipa la film + cine.
                Mutat mai aproape de ramă; lista de oameni scoasă (30.10, seria a treia). */}
            <aside className={`${styles.side} ${styles.sideRight}`} style={fadeStyle}>
                <div className={styles.sideEyebrow}>{projWork}</div>
                <div className={styles.sideMeta}>{t.by} {projBy}</div>
            </aside>


            {/* VIZOR — rama de geam mat (din poza lui Ștefan, 30.10.2026), fixă peste
                galerie; afișul activ stă în interiorul ei, la fel contorul. */}
            <div className={styles.viewfinder} aria-hidden="true">
                <div className={styles.vfGlass} />
                {/* REC a urcat în antet, lângă timecode (30.10, seria a treia) */}
                <div className={`${styles.vfTick} ${styles.vfFrame}`}>
                    {String(active + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
                </div>
            </div>


            {/* Titlul proiectului nu mai apare sus (cerut în Modul Regie, 30.10);
                rămâne doar pentru cititoarele de ecran. */}
            <h1 className={styles.srOnly} aria-live="polite">{projTitle}</h1>


            {/* GALERIE CENTRALĂ — singura zonă scrolabilă */}
            <div className={styles.gallery} ref={galleryRef}>
                <div className={styles.galleryPad} />
                {PROJECTS.map((p, i) => {
                    const isActive = i === active;
                    const slotClass = [
                        styles.slot,
                        isActive                           ? styles.slotActive   : '',
                        Math.abs(i - active) === 1         ? styles.slotNeighbor : '',
                    ].filter(Boolean).join(' ');
                    return (
                        <div
                            key={p.image}
                            className={slotClass}
                            ref={(el) => { slotRefs.current[i] = el; }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={p.image}
                                alt={p.title}
                                loading={i < 3 ? 'eager' : 'lazy'}
                                draggable={false}
                                className={styles.slotImg}
                                style={{ cursor: isActive ? 'zoom-in' : 'default' }}
                                onClick={() => {
                                    if (isActive) setExpandedIdx(i);
                                }}
                            />
                        </div>
                    );
                })}
                <div className={styles.galleryPad} />
                {/* indicatorul „scroll mai jos pentru info cofinanțare” scos:
                    bara de jos e acum mereu vizibilă (30.10, seria a treia) */}
            </div>


            {/* BARA DE JOS — fixă, mereu vizibilă: limba + cofinanțarea */}
            <Cofinance
                langLabel={LANG_LABEL[LANG_NEXT[lang]]}
                onToggleLang={() => setLang(LANG_NEXT[lang])}
            />


            {/* DETAIL OVERLAY — apare când dai click pe afișul activ */}
            {expandedIdx !== null && (
                <FilmDetail
                    film={PROJECTS[expandedIdx]}
                    lang={lang}
                    onClose={() => setExpandedIdx(null)}
                />
            )}
        </div>
    );
}
