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
import HeaderClocks, { WorldClocks } from '@/containers/HeaderClocks';

import styles from './landing.module.css';



/* ============================================================
   Atemporal Film — homepage
   Port 1:1 al design-ului Claude (home.jsx + index.html + styles.css).
   Galerie centrală: derulare continuă, iar când rotița se oprește se
   așază pe un cadru (02.11.2026). Restul layout-ului e fix.
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
const LANG_NEXT:  Record<Lang, Lang>   = { en: 'ro', ro: 'fr', fr: 'en' };

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
        title:       'All That Remains',
        titleRo:     'Tot ce rămâne',
        year:        'short 2024',
        director:    'Andrei Redinciuc',
        production:  'Libra Film · Asociația Culturală „Șerban Ionescu”',
        description: 'Post-producție sunet pentru un scurtmetraj de ficțiune. Descriere temporară.',
        awards:      'Warsaw Film Festival 2024 · Best Live Action Short',
        people:      'Ionuț Alin Ionescu (sound)\nAndrei Redinciuc (regie)\ncu Coca Bloos, Cezar Antal, Alexandru Pavel, Angela Ioan',
        image:       '/assets/entities/posters/tot-ce-ramane.webp',
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
    {
        title:         'Happy Box',
        titleRo:       'Happy Box',
        year:          'short 2025 · documentary',
        director:      'Irina Malcea-Cândea',
        production:    'Luna Film',
        description:   'Scurtmetraj documentar despre HappyBox — cutiile trimise copiilor din toată țara și poveștile care au călătorit odată cu ele.',
        descriptionEn: 'A short documentary about HappyBox — the boxes sent to children across Romania and the stories that travelled with them.',
        awards:        'Premiera: Cinema City AFI Brașov, 2025 · Cinepub',
        awardsEn:      'Premiere: Cinema City AFI Brașov, 2025 · Cinepub',
        people:        'Irina Malcea-Cândea (regie, producător)\ncu Vicky & Kastelanii\nCarmen Tofeni (imagine)\nLetiția Ștefănescu (montaj)\nClaudiu Doagă (colorizare)\nFlorin Tăbăcaru, Stefan Azaharioaie, Victor Miu (sunet)',
        peopleEn:      'Irina Malcea-Cândea (director, producer)\nwith Vicky & Kastelanii\nCarmen Tofeni (cinematography)\nLetiția Ștefănescu (editing)\nClaudiu Doagă (colour grading)\nFlorin Tăbăcaru, Stefan Azaharioaie, Victor Miu (sound)',
        image:         '/assets/entities/posters/happy-box.webp',
    },
    {
        title:         'In Between',
        titleRo:       'În noapte',
        year:          'short 2020',
        director:      'Ana Pasti',
        production:    '4 Proof Film · Idea Film',
        description:   'Întâlnirea dintre o femeie de treizeci și ceva de ani, prinsă în carieră, și un băiat de doisprezece ani care vinde cărți vechi într-o parcare.',
        descriptionEn: 'An encounter between a career-driven woman in her mid-thirties and a twelve-year-old boy selling used books in a parking lot.',
        awards:        'Premiile Gopo 2021 · Cel mai bun scurtmetraj de ficțiune · SEEfest 2021 · Best Short Fiction · TIFF 2020 · Anonimul',
        awardsEn:      'Gopo Awards 2021 · Best Short Fiction Film · SEEfest 2021 · Best Short Fiction · TIFF 2020 · Anonimul',
        people:        'Ana Pasti (regie, scenariu)\ncu Gabor Bondi, Ana Pasti, Sergiu Costache, Miriam Rizea\nTudor Platon (imagine)\nAndrei Iancu (montaj)\nAndrei Petre Tatu (sunet)\nIrena Isbășescu, Ana Pasti (producători)\nAdrian Sitaru (producător executiv)',
        peopleEn:      'Ana Pasti (director, writer)\nwith Gabor Bondi, Ana Pasti, Sergiu Costache, Miriam Rizea\nTudor Platon (cinematography)\nAndrei Iancu (editing)\nAndrei Petre Tatu (sound)\nIrena Isbășescu, Ana Pasti (producers)\nAdrian Sitaru (executive producer)',
        image:         '/assets/entities/posters/in-between.webp',
    },
    {
        title:         'Mia Misses Her Revenge',
        titleRo:       'Mia își ratează răzbunarea',
        year:          'feature 2020',
        director:      'Bogdan Theodor Olteanu',
        production:    'Tangaj Production · Sub25 · Papillon Film',
        description:   'O tânără actriță, pălmuită de iubitul ei, se întoarce acasă și își plănuiește răzbunarea. O comedie neagră despre relații, violență și industria filmului.',
        descriptionEn: 'A young actress is slapped by her boyfriend, moves back home and starts planning her revenge. A dark comedy about relationships, violence and the film industry.',
        awards:        'Premiera mondială: Warsaw Film Festival 2020 · Slamdance 2021',
        awardsEn:      'World premiere: Warsaw Film Festival 2020 · Slamdance 2021',
        people:        'Bogdan Theodor Olteanu (regie, scenariu)\ncu Ioana Bugarin, Maria Popistașu, Ana Maria Guran, Carol Ionescu, Alexandru Ion\nAna Drăghici (imagine)\nTudor D. Popescu (montaj)\nDragoș Cătărău, Răzvan Ionescu (sunet)\nAlex Bălă (muzica)\nAnamaria Antoci, Anda Ionescu (producători)',
        peopleEn:      'Bogdan Theodor Olteanu (director, writer)\nwith Ioana Bugarin, Maria Popistașu, Ana Maria Guran, Carol Ionescu, Alexandru Ion\nAna Drăghici (cinematography)\nTudor D. Popescu (editing)\nDragoș Cătărău, Răzvan Ionescu (sound)\nAlex Bălă (music)\nAnamaria Antoci, Anda Ionescu (producers)',
        image:         '/assets/entities/posters/mia-misses-her-revenge.webp',
    },
    {
        title:         'Ivana the Terrible',
        titleRo:       'Ivana cea Groaznică',
        year:          'feature 2019',
        director:      'Ivana Mladenović',
        production:    'microFILM · Dunav 84',
        description:   'Ivana, actriță sârbă care trăiește în România, își petrece vara în orașul natal de pe Dunăre, alături de familie. Prieteni, rude și foști iubiți își joacă propriile roluri.',
        descriptionEn: 'Ivana, a Serbian actress living in Romania, spends the summer in her hometown on the Danube with her family. Friends, relatives and former lovers play themselves.',
        awards:        'Locarno 2019 · Premiul special al juriului, Cineasti del presente · Sarajevo FF 2019',
        awardsEn:      'Locarno 2019 · Special Jury Prize, Filmmakers of the Present · Sarajevo FF 2019',
        people:        'Ivana Mladenović (regie, scenariu, rolul principal)\nAdrian Schiop (scenariu)\ncu Luka Gramić, Gordana Mladenović, Miodrag Mladenović, Andrei Dinescu, Anca Pop\nCarmen Tofeni (imagine)\nPatricia Chelaru, Cătălin Cristuțiu (montaj)\nAlexandru Dumitru (design de sunet)\nAda Solomon, Ivana Mladenović (producători)',
        peopleEn:      'Ivana Mladenović (director, writer, lead role)\nAdrian Schiop (writer)\nwith Luka Gramić, Gordana Mladenović, Miodrag Mladenović, Andrei Dinescu, Anca Pop\nCarmen Tofeni (cinematography)\nPatricia Chelaru, Cătălin Cristuțiu (editing)\nAlexandru Dumitru (sound design)\nAda Solomon, Ivana Mladenović (producers)',
        image:         '/assets/entities/posters/ivana-the-terrible.webp',
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
   Galeria fără capăt (Modul Regie, 30.10.2026, seria a patra)
   „Să înceapă de la un film la întâmplare, să fie filme sus și jos și
   să se repete după ce se termină.” Galeria și lista conțin filmele de
   COPIES ori, una după alta. Pagina pornește în copia din mijloc, la un
   film ales la întâmplare; când derularea se oprește într-o copie de
   margine, sărim (invizibil, aceeași imagine) în copia din mijloc. Astfel
   există mereu un film deasupra și unul dedesubt.
   Un „slot” = o poziție din galerie (0 … N·COPIES − 1); filmul = slot mod N.
   ============================================================ */

const N      = PROJECTS.length;
const COPIES = 3;
const SLOTS  = Array.from({ length: N * COPIES }, (_, i) => i);
const HOME   = N;          // primul slot din copia din mijloc

const filmOf   = (slot: number) => ((slot % N) + N) % N;
const isHome   = (slot: number) => slot >= HOME && slot < HOME + N;
const IDLE_MS  = 140;      // derularea s-a oprit dacă nu mai vine niciun eveniment
/** derularea continuă (02.11.2026, 15:34): cât timp rotița se mișcă, galeria
    curge liber; când se oprește, se așază pe cadrul următor în direcția în care
    s-a mișcat — dacă s-a mișcat mai mult de NUDGE din cadru; altfel revine. */
const NUDGE    = 0.02;     // din pasul unui cadru (351 px → ~7 px)
/** titlul din dreptul ramei, în lista din stânga (Modul Regie, 02.11, 15:34) */
const TITLE_GROW  = 0.46;  // ×1,46
const TITLE_SHIFT = 18;    // px spre dreapta

/* RAMA ÎN PARANTEZE — varianta /?rama=paranteze (02.11.2026, 15:34, după
   referința lui Ștefan): în locul ramei de geam, două paranteze negre,
   despărțite, una de fiecare parte a peliculei, mai scunde decât afișul.
   Groase în colțuri, subțiri la mijloc. Toate măsurile în px CSS. */
const BRACKET = {
    h:   210,   // înălțimea: două treimi din afiș (315)
    d:   50,    // cât intră spre afiș: vârfurile ajung exact la marginea imaginii
    t:   3,     // grosimea la mijloc și pe brațe
    r:   12,    // rotunjirea colțului exterior
    ri:  34,    // rotunjirea colțului interior (mai mare → colțuri pline, ca în referință)
    gap: 24,    // de la marginea peliculei la marginea exterioară a parantezei
};
function bracketPath({ h, d, t, r, ri }: typeof BRACKET): string {
    return [
        `M ${d} 0 H ${r} A ${r} ${r} 0 0 0 0 ${r}`,
        `V ${h - r} A ${r} ${r} 0 0 0 ${r} ${h} H ${d}`,
        `V ${h - t} H ${t + ri} A ${ri} ${ri} 0 0 1 ${t} ${h - t - ri}`,
        `V ${t + ri} A ${ri} ${ri} 0 0 1 ${t + ri} ${t} H ${d} Z`,
    ].join(' ');
}
type Rama = 'groasa' | 'fina' | 'paranteze';
/** înălțimea tile-ului pistei sonore, în px CSS (public/assets/ui/soundtrack.webp,
    „TILE” afișat de scripts/pista-sonora.py) */
const BAND_TILE = 2049;   // 02.11, 15:00: 2732 × 0,75 (tot ansamblul micșorat)


/* ============================================================
   <LandingHero />
   ============================================================ */

/* EXPUNEREA AFIȘELOR (02.11.2026, 18:25): afară — subexpuse, alb-negru;
   în ramă — dense (≈ −1¾ diafragmă), pentru că lampa din spatele geamului
   (.lamp, color-dodge, ~×3,3 în medie) le aduce la expunerea corectă. */
const EXPO_OUT = 0.15;
const EXPO_IN  = 0.30;

export default function LandingHero() {
    const [active, setActive]               = useState(HOME);   // slotul din ramă
    const [ready, setReady]                 = useState(false);  // așezat pe filmul de start
    const [textVisible, setTextVisible]     = useState(true);
    const [expandedIdx, setExpandedIdx]     = useState<number | null>(null);
    const [lang, setLang]                   = useState<Lang>('en');
    // variantele de comparație ale ramei:
    //   /                — rama de metal vopsit: laterale 30 px, sus/jos 8 px (02.11, 18:15)
    //   /?rama=fina      — rama de 12 px, în interiorul peliculei
    //   /?rama=paranteze — două paranteze despărțite (02.11, 15:34)
    const [rama, setRama]                   = useState<Rama>('groasa');
    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get('rama');
        setRama(q === 'fina' || q === 'paranteze' ? q : 'groasa');
        setLuminaNeutra(new URLSearchParams(window.location.search).get('lumina') === 'neutra');
    }, []);
    // lumina din spatele fotogramei (02.11, 17:40): caldă, ca în referință;
    // /?lumina=neutra — aceeași cădere, fără căldura becului
    const [luminaNeutra, setLuminaNeutra]   = useState(false);
    const galleryRef    = useRef<HTMLDivElement | null>(null);
    const slotRefs      = useRef<(HTMLDivElement | null)[]>([]);
    const lastActiveRef = useRef(HOME);
    const listTrackRef  = useRef<HTMLOListElement | null>(null);
    const listItemRefs  = useRef<(HTMLLIElement | null)[]>([]);
    // pista sonoră: urmează derularea galeriei, dar nu și săriturile dintre copii
    const bandRef       = useRef<HTMLDivElement | null>(null);
    const bandYRef      = useRef(0);
    const lastTopRef    = useRef(0);
    const exposureRef   = useRef<number[]>([]);
    const titleGrowRef  = useRef<number[]>([]);
    // derularea continuă: animația de așezare, cadrul pe care s-a oprit ultima
    // dată, direcția ultimei mișcări și poziția de la evenimentul precedent
    const animRef       = useRef<number | null>(null);
    const restRef       = useRef(HOME);
    const dirRef        = useRef(0);
    const prevTopRef    = useRef(0);
    // rama (vizorul) și poziția măsurată a cadrului 0 față de ea (02.11, 18:35):
    // ținta derulării se măsoară pe ecran — centrul cadrului pe centrul ramei —
    // nu se mai calculează din 50vh, care în Safari poate diferi de centrul ramei
    const vfRef         = useRef<HTMLDivElement | null>(null);
    const originRef     = useRef(0);

    const t = UI[lang];


    // detectează ce slot e cel mai aproape de centru
    const updateActive = useCallback(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        // centrul ramei (nu al galeriei): acolo trebuie să stea afișul
        const vfRect     = (vfRef.current ?? gallery).getBoundingClientRect();
        const galleryMid = vfRect.top + vfRect.height / 2;
        let bestIdx  = lastActiveRef.current;
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
            const sameFilm = filmOf(bestIdx) === filmOf(lastActiveRef.current);
            lastActiveRef.current = bestIdx;
            if (sameFilm) {
                setActive(bestIdx);
                return;
            }
            // fade text out → schimbă index → fade in
            setTextVisible(false);
            window.setTimeout(() => {
                setActive(lastActiveRef.current);
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
        const last = SLOTS.length - 1;
        const f    = Math.min(last, Math.max(0, (gallery.scrollTop - originRef.current) / slotPitch()));
        const i0   = Math.floor(f);
        const i1   = Math.min(last, i0 + 1);
        const y0   = items[i0]?.offsetTop ?? 0;
        const y1   = items[i1]?.offsetTop ?? y0;
        const y    = y0 + (y1 - y0) * (f - i0);
        track.style.transform = `translate3d(0, ${-y}px, 0)`;
        const grow = titleGrowRef.current;
        items.forEach((el, i) => {
            if (!el) return;
            const d = Math.abs(i - f);
            el.style.opacity = String(Math.max(0.16, 1 - 0.6 * d));
            // titlul din dreptul ramei crește treptat (×1,46, 18 px spre dreapta)
            const x = Math.max(0, 1 - d);
            const g = Math.round(x * x * (3 - 2 * x) * 1000) / 1000;
            if (grow[i] === g) return;
            grow[i] = g;
            const btn = el.firstElementChild as HTMLElement | null;
            if (btn) btn.style.transform = g === 0 ? '' :
                `translateX(${(TITLE_SHIFT * g).toFixed(2)}px) scale(${(1 + TITLE_GROW * g).toFixed(4)})`;
        });

        /* LUMINA DIN LASĂ (30.10, seria a cincea): în spatele ramei e lumină.
           Afișul se aprinde treptat cât intră în ramă — culoare, expunere,
           claritate — și se stinge la fel când iese. --e: 0 = afară, 1 = în ramă. */
        const exp = exposureRef.current;
        slotRefs.current.forEach((el, i) => {
            const img  = el?.children[0] as HTMLElement | undefined;
            const halo = el?.children[1] as HTMLElement | undefined;
            if (!img) return;
            const x = Math.max(0, 1 - Math.abs(i - f));
            const e = Math.round(x * x * (3 - 2 * x) * 1000) / 1000;   // smoothstep
            if (exp[i] === e) return;
            exp[i] = e;
            // e = 0: alb-negru, subexpus (ca vecinii de până acum)
            // e = 1: culoare plină, expus (ca afișul din ramă)
            // 02.11: afișele nu se mai micșorează afară — stau lipite de pista sonoră,
            // pe peliculă; transparența din afara ramei o dă masca galeriei
            // 02.11, 18:25: pelicula e densă — afișul e ținut întunecat (×0,15 afară,
            // ×0,30 în ramă), iar lampa din spate (~×3,3) îl aduce în geam la expunerea
            // corectă, cu culorile lui; în centrul geamului puțin peste, la margini puțin sub
            img.style.filter =
                `grayscale(${(1 - e).toFixed(3)}) ` +
                `contrast(${(1.15 - 0.15 * e).toFixed(3)}) ` +
                `brightness(${(EXPO_OUT + (EXPO_IN - EXPO_OUT) * e).toFixed(3)})`;
            // halația: lumina lămpii trece prin afiș și „curge” din zonele luminoase
            // (02.11, 17:40: mai puternică și caldă, după referință)
            if (halo) halo.style.opacity = (0.32 * e).toFixed(3);
        });

        /* PISTA SONORĂ — banda din stânga afișului curge odată cu pelicula.
           Mișcarea vine din derulare; săriturile invizibile dintre copiile galeriei
           (jumpTo) nu o mișcă, deci banda nu sare niciodată. */
        const top = gallery.scrollTop;
        bandYRef.current += top - lastTopRef.current;
        lastTopRef.current = top;
        const band = bandRef.current;
        if (band) {
            const y = ((bandYRef.current % BAND_TILE) + BAND_TILE) % BAND_TILE;
            band.style.transform = `translate3d(0, ${-y}px, 0)`;
        }
    }, [slotPitch]);

    /** poziția de derulare la care cadrul `slot` stă exact în centrul ramei —
        măsurată pe ecran, deci aceeași în Safari și în Chrome */
    const scrollFor = useCallback((slot: number): number => {
        const gallery = galleryRef.current;
        const el      = slotRefs.current[slot];
        const vf      = vfRef.current;
        if (!gallery || !el || !vf) return originRef.current + slot * slotPitch();
        const r  = el.getBoundingClientRect();
        const v  = vf.getBoundingClientRect();
        const to = gallery.scrollTop + (r.top + r.height / 2) - (v.top + v.height / 2);
        originRef.current = to - slot * slotPitch();
        return to;
    }, [slotPitch]);

    /** mută galeria fără animație */
    const jumpTo = useCallback((slot: number) => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        gallery.scrollTop = scrollFor(slot);
        lastTopRef.current = gallery.scrollTop;   // săritura nu mișcă pista sonoră
        prevTopRef.current = gallery.scrollTop;   // și nu contează ca mișcare
        lastActiveRef.current = slot;
        restRef.current = slot;
        setActive(slot);
        syncList();
    }, [scrollFor, syncList]);

    const stopGlide = useCallback(() => {
        if (animRef.current !== null) cancelAnimationFrame(animRef.current);
        animRef.current = null;
    }, []);

    /** dusă lin până la un cadru: încetinește spre final, ca o peliculă care
        se oprește în fereastra proiectorului; durata crește cu distanța */
    const glideTo = useCallback((slot: number, onDone?: () => void) => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        stopGlide();
        const pitch = slotPitch();
        const from  = gallery.scrollTop;
        const to    = scrollFor(slot);
        const dist  = to - from;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (Math.abs(dist) < 0.5 || still) {
            gallery.scrollTop = to;
            onDone?.();
            return;
        }
        const dur = Math.min(900, 240 + 260 * Math.sqrt(Math.abs(dist) / pitch));
        const t0  = performance.now();
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / dur);
            gallery.scrollTop = from + dist * (1 - Math.pow(1 - k, 3));   // ease-out
            if (k < 1) {
                animRef.current = requestAnimationFrame(step);
            } else {
                animRef.current = null;
                onDone?.();
            }
        };
        animRef.current = requestAnimationFrame(step);
    }, [slotPitch, scrollFor, stopGlide]);

    /** derularea s-a oprit într-o copie de margine → aceeași poziție în copia din mijloc */
    const recenter = useCallback(() => {
        if (isHome(lastActiveRef.current)) restRef.current = lastActiveRef.current;
        const gallery = galleryRef.current;
        const slot    = lastActiveRef.current;
        if (!gallery || isHome(slot)) return;
        const target = HOME + filmOf(slot);
        // fără tranziții cât timp afișul activ trece pe alt element
        gallery.classList.add(styles.jumping);
        jumpTo(target);
        window.setTimeout(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                gallery.classList.remove(styles.jumping);
            }));
        }, 60);
    }, [jumpTo]);

    /** galeria e pe cadrul `slot`: actualizăm totul, apoi revenim în copia din mijloc */
    const arrive = useCallback((slot: number) => {
        // verificare finală, pe ecran: dacă a rămas vreo diferență (ex. o așezare
        // întreruptă), cadrul e pus exact în ramă
        const gallery = galleryRef.current;
        if (gallery) {
            const to = scrollFor(slot);
            if (Math.abs(gallery.scrollTop - to) > 0.75) gallery.scrollTop = to;
        }
        updateActive();
        syncList();
        restRef.current = slot;
        recenter();
    }, [scrollFor, updateActive, syncList, recenter]);

    /** rotița s-a oprit → galeria se așază pe un cadru: pe următorul în direcția
        mișcării, dacă s-a mișcat mai mult de NUDGE din cadrul de plecare */
    const settle = useCallback(() => {
        const gallery = galleryRef.current;
        if (!gallery || animRef.current !== null) return;
        const f    = (gallery.scrollTop - originRef.current) / slotPitch();
        const last = SLOTS.length - 1;
        let target = Math.round(f);
        if (Math.abs(f - target) > 0.001 && Math.abs(f - restRef.current) > NUDGE && dirRef.current !== 0) {
            target = dirRef.current > 0 ? Math.ceil(f - NUDGE) : Math.floor(f + NUDGE);
        }
        target = Math.min(last, Math.max(0, target));
        glideTo(target, () => arrive(target));
    }, [slotPitch, glideTo, arrive]);

    /** click pe un titlu din listă → galeria curge până la filmul respectiv */
    const goTo = useCallback((slot: number) => {
        glideTo(slot, () => arrive(slot));
    }, [glideTo, arrive]);


    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        // pornim de la un film ales la întâmplare, în copia din mijloc
        jumpTo(HOME + Math.floor(Math.random() * N));
        const readyId = requestAnimationFrame(() => setReady(true));

        let ticking = false;
        let idle    = 0;
        const onScroll = () => {
            // direcția mișcării făcute de om (nu de animația de așezare)
            const top = gallery.scrollTop;
            const dy  = top - prevTopRef.current;
            prevTopRef.current = top;
            if (animRef.current === null && Math.abs(dy) > 0.5) dirRef.current = Math.sign(dy);
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActive();
                    syncList();
                    ticking = false;
                });
                ticking = true;
            }
            window.clearTimeout(idle);
            if (animRef.current === null) idle = window.setTimeout(settle, IDLE_MS);
        };
        // omul pune mâna pe rotiță / pe ecran → animația de așezare se oprește.
        // 02.11, 18:35: în Safari, inerția rotiței trimite la final evenimente
        // „wheel” fără mișcare; ele opreau așezarea la jumătatea drumului și
        // nimic n-o mai relua (afișul rămânea sub geam, decalat). Acum orice
        // atingere a rotiței repornește și cronometrul de așezare, iar după
        // degetul ridicat (touchend / pointerup) galeria se așază din nou.
        const scheduleSettle = () => {
            window.clearTimeout(idle);
            idle = window.setTimeout(settle, IDLE_MS);
        };
        const onWheel = () => { stopGlide(); scheduleSettle(); };
        const onGrab  = () => { stopGlide(); window.clearTimeout(idle); };
        const onLift  = () => { if (animRef.current === null) scheduleSettle(); };
        gallery.addEventListener('scroll', onScroll, { passive: true });
        gallery.addEventListener('wheel', onWheel, { passive: true });
        gallery.addEventListener('touchstart', onGrab, { passive: true });
        gallery.addEventListener('pointerdown', onGrab, { passive: true });
        gallery.addEventListener('touchend', onLift, { passive: true });
        window.addEventListener('pointerup', onLift, { passive: true });
        window.addEventListener('resize', onScroll);
        // fonturile schimbă înălțimea rândurilor → recalculăm după ce se încarcă
        document.fonts?.ready.then(syncList).catch(() => {});
        return () => {
            cancelAnimationFrame(readyId);
            window.clearTimeout(idle);
            stopGlide();
            gallery.removeEventListener('scroll', onScroll);
            gallery.removeEventListener('wheel', onWheel);
            gallery.removeEventListener('touchstart', onGrab);
            gallery.removeEventListener('pointerdown', onGrab);
            gallery.removeEventListener('touchend', onLift);
            window.removeEventListener('pointerup', onLift);
            window.removeEventListener('resize', onScroll);
        };
    }, [updateActive, syncList, jumpTo, settle, stopGlide]);

    // la schimbarea limbii titlurile își schimbă lungimea → recalculăm
    useEffect(() => { syncList(); }, [lang, syncList]);


    const film            = filmOf(active);
    const proj            = PROJECTS[film];
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
        <div className={[
            styles.page,
            ready ? '' : styles.notReady,
            rama === 'fina' ? styles.ramaFina : '',
            rama === 'paranteze' ? styles.ramaParanteze : '',
            luminaNeutra ? styles.luminaNeutra : '',
        ].join(' ')}>

            {/* GRAIN overlay — peste tot */}
            <div className={styles.grain} aria-hidden="true" />

            {/* LASA: lumina albă din geam (30.10) a fost scoasă pe 02.11 — geamul e acum
                acoperit de peliculă (fundal negru), deci lumina nu se mai vedea */}


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
                    {SLOTS.map((i) => {
                        const p = PROJECTS[filmOf(i)];
                        // copiile de margine există doar pentru ochi — cititoarele de ecran
                        // și tastatura văd lista o singură dată
                        const home = isHome(i);
                        return (
                            <li
                                key={i}
                                ref={(el) => { listItemRefs.current[i] = el; }}
                                className={styles.filmListItem}
                                style={{ opacity: Math.max(0.16, 1 - 0.6 * Math.abs(i - HOME)) }}
                                aria-hidden={home ? undefined : true}
                            >
                                <button
                                    type="button"
                                    className={styles.filmListBtn}
                                    onClick={() => goTo(i)}
                                    tabIndex={home ? undefined : -1}
                                    aria-current={filmOf(i) === film && home ? 'true' : undefined}
                                >
                                    {pickTitle(p, lang)}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {/* DREAPTA — creditul: ce a făcut echipa la film + cine.
                Mutat mai aproape de ramă; lista de oameni scoasă (30.10, seria a treia). */}
            <aside className={`${styles.side} ${styles.sideRight}`} style={fadeStyle}>
                <div className={styles.sideEyebrow}>{projWork}</div>
                <div className={styles.sideMeta}>{t.by} {projBy}</div>
            </aside>

            {/* timecode-urile lumii, în coloana din dreapta: sub meniu și sub credit,
                fiecare cu ▶ PLAYBACK sau ■ STOP (Modul Regie, 02.11.2026, a doua serie) */}
            <WorldClocks />


            {/* VIZOR — rama de geam mat (din poza lui Ștefan, 30.10.2026), fixă peste
                galerie. Din 02.11 geamul cuprinde afișul și pista sonoră întregi, cu
                peliculă neagră împrejur; perforația rămâne în afara ramei. */}
            <div ref={vfRef} className={styles.viewfinder} aria-hidden="true">
                <div className={styles.vfGlass} />
                {/* contorul „15 / 19” scos — filmele nu se numerotează (30.10, seria a cincea) */}
            </div>

            {/* RAMA ÎN PARANTEZE — doar în varianta /?rama=paranteze (02.11, 15:34) */}
            {rama === 'paranteze' && (
                <div
                    className={styles.brackets}
                    aria-hidden="true"
                    style={{
                        '--br-h':   `${BRACKET.h}px`,
                        '--br-d':   `${BRACKET.d}px`,
                        '--br-gap': `${BRACKET.gap}px`,
                    } as React.CSSProperties}
                >
                    {[0, 1].map((k) => (
                        <svg
                            key={k}
                            className={styles.bracket}
                            width={BRACKET.d}
                            height={BRACKET.h}
                            viewBox={`0 0 ${BRACKET.d} ${BRACKET.h}`}
                        >
                            <path d={bracketPath(BRACKET)} />
                        </svg>
                    ))}
                </div>
            )}


            {/* LAMPA — lumina proiectorului, fixă în spatele ramei: afișul trece prin
                fața ei și se luminează prin transparență, ca pelicula în lasă;
                pâlpâie la 24 fps, ca lumina tăiată de obturator (30.10, seria a cincea) */}
            <div className={styles.backlight} aria-hidden="true" />
            <div className={styles.lamp} aria-hidden="true" />


            {/* PISTA SONORĂ — bandă neagră lipită de marginea stângă a afișelor, ca pista
                optică de lângă fotogramă pe pelicula de 35 mm. Din 02.11.2026 desenul e forma
                de undă trimisă de Ștefan, alb pe negru (scripts/pista-sonora.py).
                Curge odată cu galeria; în dreptul ramei e luminată, în rest subexpusă. */}
            <div className={styles.soundtrack} aria-hidden="true">
                <div
                    ref={bandRef}
                    className={styles.soundtrackStrip}
                    style={{
                        height:         `calc(100% + ${BAND_TILE}px)`,
                        backgroundSize: `100% ${BAND_TILE}px`,
                    }}
                />
            </div>


            {/* Titlul proiectului nu mai apare sus (cerut în Modul Regie, 30.10);
                rămâne doar pentru cititoarele de ecran. */}
            <h1 className={styles.srOnly} aria-live="polite">{projTitle}</h1>


            {/* GALERIE CENTRALĂ — singura zonă scrolabilă. Din 02.11.2026 e o peliculă:
                fiecare slot = un cadru pe fundal negru, cu perforația de o parte și de
                alta (::before / ::after în CSS), iar afișul lipit de pista sonoră. */}
            <div className={styles.gallery} ref={galleryRef}>
                <div className={styles.galleryPad} />
                {SLOTS.map((i) => {
                    const p        = PROJECTS[filmOf(i)];
                    const isActive = i === active;
                    // expunerea (culoare, lumină, mărime) o dă syncList, după distanța față de ramă
                    return (
                        <div
                            key={i}
                            className={styles.slot}
                            ref={(el) => { slotRefs.current[i] = el; }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={p.image}
                                alt={isHome(i) ? p.title : ''}
                                loading="lazy"
                                draggable={false}
                                className={styles.slotImg}
                                style={{ cursor: isActive ? 'zoom-in' : 'default' }}
                                onClick={() => {
                                    if (isActive) setExpandedIdx(filmOf(i));
                                }}
                            />
                            {/* halația — copie estompată a afișului, aprinsă doar în ramă */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={p.image}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                draggable={false}
                                className={styles.slotHalo}
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
