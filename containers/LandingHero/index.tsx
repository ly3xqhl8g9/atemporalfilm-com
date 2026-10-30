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
    eyebrowDesc:    string;
    eyebrowPeople:  string;
    sideMetaUnde:   string;
    sideMetaPeople: string;
    endCue:         string;
    rec:            string;
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
        eyebrowDesc:    'descrierea proiectului',
        eyebrowPeople:  'cine a lucrat la el',
        sideMetaUnde:   'unde am fost · ce am făcut',
        sideMetaPeople: 'oameni',
        endCue:         'scroll mai jos pentru info cofinanțare',
        rec:            'REC',
    },
    en: {
        nav: {
            about:    'About',
            people:   'People',
            services: 'Services',
            contact:  'Contact',
            latest:   'Latest',
        },
        eyebrowDesc:    'project description',
        eyebrowPeople:  'who worked on it',
        sideMetaUnde:   'where we shot · what we did',
        sideMetaPeople: 'people',
        endCue:         'scroll down for co-financing info',
        rec:            'REC',
    },
    fr: {
        nav: {
            about:    'À propos',
            people:   'Équipe',
            services: 'Services',
            contact:  'Contact',
            latest:   'Récents',
        },
        eyebrowDesc:    'description du projet',
        eyebrowPeople:  'qui a travaillé dessus',
        sideMetaUnde:   'où on a tourné · ce qu’on a fait',
        sideMetaPeople: 'équipe',
        endCue:         'défilez pour les infos de cofinancement',
        rec:            'REC',
    },
};


/** Selector cu fallback la RO pentru câmpurile multilingve ale unui Project. */
function pickLang(p: Project, lang: Lang, base: 'description' | 'awards' | 'people'): string {
    if (lang === 'ro') return p[base];
    const suffix = lang === 'en' ? 'En' : 'Fr';
    const key = (base + suffix) as keyof Project;
    const value = p[key];
    return (typeof value === 'string' && value.length > 0) ? value : p[base];
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


    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActive();
                    ticking = false;
                });
                ticking = true;
            }
        };
        gallery.addEventListener('scroll', onScroll, { passive: true });
        updateActive();
        return () => gallery.removeEventListener('scroll', onScroll);
    }, [updateActive]);


    const proj            = PROJECTS[active];
    const projTitle       = pickTitle(proj, lang);
    const projDescription = pickLang(proj, lang, 'description');
    const projAwards      = pickLang(proj, lang, 'awards');
    const projPeople      = pickLang(proj, lang, 'people');

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


            {/* TEXTE LATERALE — fixe ca poziție, conținutul se schimbă cu fade.
                Stânga: descrierea (mare) + anul/premiile alături, ca un singur grup
                (pe ecrane mai înguste de 1600 px, anul/premiile coboară sub descriere). */}
            <div className={styles.sideLeftGroup} style={fadeStyle}>
                <aside className={`${styles.side} ${styles.sideLeft1}`}>
                    <div className={styles.sideEyebrow}>{t.eyebrowDesc}</div>
                    <p className={styles.sideText}>{projDescription}</p>
                    <div className={styles.sideMeta}>{t.sideMetaUnde}</div>
                </aside>

                <aside className={`${styles.side} ${styles.sideLeft2}`}>
                    <div className={styles.sideEyebrow}>{proj.year}</div>
                    <p className={styles.sideTextSm}>{projAwards}</p>
                </aside>
            </div>

            <aside className={`${styles.side} ${styles.sideRight}`} style={fadeStyle}>
                <div className={styles.sideEyebrow}>{t.eyebrowPeople}</div>
                <p
                    className={styles.sideTextSm}
                    style={{ whiteSpace: 'pre-line' }}
                >
                    {projPeople}
                </p>
                <div className={styles.sideMeta}>{t.sideMetaPeople}</div>
            </aside>


            {/* VIZOR — rama de geam mat (din poza lui Ștefan, 30.10.2026), fixă peste
                galerie; afișul activ stă în interiorul ei, la fel REC și contorul. */}
            <div className={styles.viewfinder} aria-hidden="true">
                <div className={styles.vfGlass} />
                <div className={`${styles.vfTick} ${styles.vfRec}`}>{t.rec}</div>
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
                <div className={styles.galleryPad} />

                {/* Indicator scroll — apare după ce galeria s-a derulat până jos */}
                <div className={styles.endCue}>
                    <div className={styles.endCueLine} />
                    <div className={styles.endCueText}>{t.endCue}</div>
                </div>
            </div>


            {/* FOOTER de cofinanțare — dezvăluit când scrolezi pagina */}
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
