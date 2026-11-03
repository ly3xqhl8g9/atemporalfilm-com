'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Cofinance from '@/containers/Cofinance';
import FilmDetail from '@/containers/FilmDetail';
import HeaderClocks, { WorldClocks } from '@/containers/HeaderClocks';

import ContactCopy, { WorkContacts } from './ContactCopy';
import GearRequest from './GearRequest';
import LogoReel from './LogoReel';
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
    // Pagina PEOPLE (02.11.2026): al doilea rând al creditului, scris întreg
    // (fără „by”) — funcția omului în echipă
    meta?:   string;
    metaRo?: string;
    metaFr?: string;

    image: string;   // /assets/entities/...
}


/* ── Limbi & traduceri UI ──────────────────────────────── */

type Lang = 'ro' | 'en' | 'fr';

const LANG_LABEL: Record<Lang, string> = { ro: 'RO', en: 'EN', fr: 'FR' };
const LANG_NEXT:  Record<Lang, Lang>   = { en: 'ro', ro: 'fr', fr: 'en' };

interface UITexts {
    nav: {
        work:     string;
        about:    string;
        people:   string;
        gear:     string;
        services: string;
        contact:  string;
        latest:   string;
    };
    films: string;   // eticheta listei de filme (doar pentru cititoarele de ecran)
    by:    string;
    rec:   string;
    replay: string;   // rola de lângă logo (03.11.2026): pornește din nou animația
}

const UI: Record<Lang, UITexts> = {
    ro: {
        nav: {
            work:     'Lucrări',
            about:    'Despre',
            people:   'Echipa',
            gear:     'Echipament',
            services: 'Servicii',
            contact:  'Contact',
            latest:   'Recente',
        },
        films: 'Filme',
        by:    'by',
        rec:   'REC',
        replay: 'Derulează din nou',
    },
    en: {
        nav: {
            work:     'Work',
            about:    'About',
            people:   'People',
            gear:     'Gear',
            services: 'Services',
            contact:  'Contact',
            latest:   'Latest',
        },
        films: 'Films',
        by:    'by',
        rec:   'REC',
        replay: 'Play again',
    },
    fr: {
        nav: {
            work:     'Travaux',
            about:    'À propos',
            people:   'Équipe',
            gear:     'Matériel',
            services: 'Services',
            contact:  'Contact',
            latest:   'Récents',
        },
        films: 'Films',
        by:    'by',
        rec:   'REC',
        replay: 'Rejouer',
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
/** Anul filmului, pentru coloana din dreapta (02.11, 23:03): primul an de 4 cifre
    din câmpul `year` („feature 2018 · horror” → 2018); gol dacă lipsește. */
function pickYear(p: Project): string {
    return p.year.match(/\b(19|20)\d{2}\b/)?.[0] ?? '';
}

/** Un link din meniu, subliniat când pagina lui e cea deschisă (02.11, 23:03:
    „ca să știm pe ce pagină suntem”). WORK = homepage-ul. */
function NavLink({ href, match, children }: { href: string; match?: string; children: React.ReactNode }) {
    const path   = usePathname();
    const active = path === (match ?? href);
    return (
        <Link
            href={href}
            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
            aria-current={active ? 'page' : undefined}
        >
            {children}
        </Link>
    );
}

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
        titleRo:     'În seara de Moș Nicolae',
        year:        'short 2025 · animation',
        director:    'Emy-Mirel Ivașcă',
        production:  'UNATC București',
        description: 'Sound design pentru o animație scurtă de iarnă. Descriere temporară — de înlocuit ulterior.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nEmy-Mirel Ivașcă (regie, animație)',
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sound designer',
        workEn: 'Sound designer',
        workFr: 'Concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sound designer',
        workEn: 'Sound designer',
        workFr: 'Concepteur sonore',
        image:       '/assets/entities/posters/tot-ce-ramane.webp',
    },
    {
        title:       'Between the Edges of the Day',
        titleRo:     'Între marginile zilei',
        year:        'short 2023',
        director:    'Andreea Lăcătuș',
        production:  '—',
        description: 'Post-producție sunet pentru un scurtmetraj intim. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAndreea Lăcătuș (regie)',
        // 03.11.2026: creditul de pe IMDb (nm6847202); 11:57, Ștefan: „Sound Recording”
        work:   'Înregistrare sunet',
        workEn: 'Sound recording',
        workFr: 'Prise de son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Departamentul de montaj',
        workEn: 'Editorial department',
        workFr: 'Département montage',
        image:       '/assets/entities/posters/the-nun.webp',
    },
    {
        title:       'Cat Funeral',
        titleRo:     'Pisică moartă',
        year:        'short 2023',
        director:    'Ana-Maria Comănescu',
        production:  'Castalia Pictures',
        description: 'Sound design și post-producție audio pentru un scurtmetraj atmosferic. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAna-Maria Comănescu (regie)\ncu Dana Marineci, Robi Urs, Cristiana Luca',
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Înregistrare sunet',
        workEn: 'Sound recordist',
        workFr: 'Preneur de son',
        image:       '/assets/entities/posters/cat-funeral.webp',
    },
    {
        title:       'A River’s Gaze',
        titleRo:     'Malul vânăt',
        year:        'feature 2026',
        director:    'Andreea Cristina Borțun',
        production:  'Atelier de Film · Films de Force Majeure · Perfo',
        description: 'Sound design pentru un lungmetraj de ficțiune contemplativ. Descriere temporară.',
        awards:      '—',
        people:      'Ionuț Alin Ionescu (sound)\nAndreea Cristina Borțun (regie, scenariu)',
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sunet de platou',
        workEn: 'Production sound mixer',
        workFr: 'Chef opérateur du son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sunet de platou',
        workEn: 'Production sound',
        workFr: 'Son direct',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Înregistrare sunet',
        workEn: 'Sound recordist',
        workFr: 'Preneur de son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Inginer de sunet',
        workEn: 'Sound mixer',
        workFr: 'Ingénieur du son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Înregistrare sunet',
        workEn: 'Sound recordist',
        workFr: 'Preneur de son',
        image:         '/assets/entities/posters/ivana-the-terrible.webp',
    },
    {
        title:         'Caliu: Nothing Else, What Else Can I Do?',
        titleRo:       'Caliu: Nicidecum altceva, ce să fac altceva?',
        year:          'feature 2025 · documentary',
        director:      'Simona Constantin',
        production:    'Adenium Film · Al Jazeera Documentary Channel',
        description:   'Portretul legendarului violonist Gheorghe „Caliu” Anghel, „regele viorii”, între amintirile succesului internațional și lupta de azi pentru recunoaștere. Muzica e singurul lucru care nu se schimbă.',
        descriptionEn: 'A portrait of the legendary violinist Gheorghe ‘Caliu’ Anghel, the “king of the violin”, caught between memories of international acclaim and today’s struggle for recognition. Music is the only constant.',
        awards:        'Premiera mondială: Krakow Film Festival 2025 · DocFilmMusic · TIFF 2025 · One World Romania 2025 · Astra Film Festival 2025',
        awardsEn:      'World premiere: Krakow Film Festival 2025 · DocFilmMusic Competition · TIFF 2025 · One World Romania 2025 · Astra Film Festival 2025',
        people:        'Simona Constantin (regie, scenariu)\ncu Gheorghe „Caliu” Anghel\nAndrei Oană, Cosmin Filișan (imagine)\nLigia Popescu (montaj)\nȘtefania Grigorescu (colorizare)\nAndrei Boanță (sunet)\nCristina Badea (producător)',
        peopleEn:      'Simona Constantin (director, writer)\nwith Gheorghe ‘Caliu’ Anghel\nAndrei Oană, Cosmin Filișan (cinematography)\nLigia Popescu (editing)\nȘtefania Grigorescu (colour grading)\nAndrei Boanță (sound)\nCristina Badea (producer)',
        // 03.11.2026: creditul cerut de Ștefan (11:18)
        work:   'Distribuție',
        workEn: 'Distribution',
        workFr: 'Distribution',
        by:     'Diana Smeu',
        image:         '/assets/entities/posters/caliu.webp',
    },
    {
        title:         'A Summer of Nothing',
        titleRo:       'O vară de nimic',
        year:          'feature 2026 · documentary',
        director:      'Alina Manolache',
        production:    'Filmways · Avanpost',
        description:   'Un proiect de film care nu se mai face o duce pe Alina la un experiment: o vară în care să nu facă nimic. Întâlnirea cu Mady, o localnică cu o familie mare, transformă studiul nimicului într-o călătorie personală.',
        descriptionEn: 'When a film project falls through, Alina sets out to do the opposite of work: nothing at all. Meeting Mady, a lively local with a large family, turns the study of nothing into a personal journey.',
        awards:        'În cinematografe din 16 octombrie 2026 · distribuit de Manifest Film',
        awardsEn:      'In Romanian cinemas from 16 October 2026 · distributed by Manifest Film',
        people:        'Alina Manolache (regie, scenariu, imagine)\ncu Alina Manolache, Mady Lykeridou\nAlina Manolache, Dragoș Apetri (montaj)\nClaudiu Doagă (colorizare)\nFilip Mureșan (sunet, muzica)\nMonica Lăzurean-Gorgan, Elena Martin (producătoare)',
        peopleEn:      'Alina Manolache (director, writer, cinematography)\nwith Alina Manolache, Mady Lykeridou\nAlina Manolache, Dragoș Apetri (editing)\nClaudiu Doagă (colour grading)\nFilip Mureșan (sound, music)\nMonica Lăzurean-Gorgan, Elena Martin (producers)',
        // 03.11.2026: creditul cerut de Ștefan (11:18)
        work:   'Distribuție',
        workEn: 'Distribution',
        workFr: 'Distribution',
        by:     'Diana Smeu',
        image:         '/assets/entities/posters/a-summer-of-nothing.webp',
    },
    {
        title:         'Something Familiar',
        titleRo:       'Atât de familiar',
        year:          'feature 2026 · documentary',
        director:      'Rachel Tâpârjan',
        production:    'Manifest Film · My Accomplice',
        description:   'În timp ce ajută o femeie să își găsească mama biologică, regizoarea e atrasă spre propria istorie de familie și pornește pe urmele surorilor de care a fost despărțită.',
        descriptionEn: 'While helping a stranger find her birth mother, a filmmaker is drawn into the shadows of her own family history and sets out to find the sisters she was separated from.',
        awards:        'Premiera mondială: CPH:DOX 2026 · competiția internațională · Biografilm 2026 · Astra Film Festival 2026 · TIFF 2026',
        awardsEn:      'World premiere: CPH:DOX 2026 · International Main Competition · Biografilm 2026 · Astra Film Festival 2026 · TIFF 2026',
        people:        'Rachel Tâpârjan (regie, scenariu)\nAndrei Oană (imagine)\nAlice Powell (montaj)\nQuinta (muzica)\nNikola Medic (supervizor montaj sunet)\nMonica Lăzurean-Gorgan, Elena Martin, Aleksandra Bilić (producătoare)',
        peopleEn:      'Rachel Tâpârjan (director, writer)\nAndrei Oană (cinematography)\nAlice Powell (editing)\nQuinta (music)\nNikola Medic (supervising sound editor)\nMonica Lăzurean-Gorgan, Elena Martin, Aleksandra Bilić (producers)',
        // 03.11.2026: creditul cerut de Ștefan (11:18)
        work:   'Distribuție',
        workEn: 'Distribution',
        workFr: 'Distribution',
        by:     'Diana Smeu',
        image:         '/assets/entities/posters/something-familiar.webp',
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
        // 03.11.2026: creditul cerut de Ștefan (11:18)
        work:   'Montaj, sound designer',
        workEn: 'Film editor, sound designer',
        workFr: 'Montage, concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sunet de platou',
        workEn: 'Production sound mixer',
        workFr: 'Chef opérateur du son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Înregistrare sunet',
        workEn: 'Sound recordist',
        workFr: 'Preneur de son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sunet, sound designer',
        workEn: 'Sound, sound designer',
        workFr: 'Son, concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Montaj dialog, foley, sound designer',
        workEn: 'Dialogue editor, foley artist, sound designer',
        workFr: 'Montage dialogues, bruitage, concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sunet, sound designer',
        workEn: 'Sound, sound designer',
        workFr: 'Son, concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Înregistrare sunet',
        workEn: 'Sound recordist',
        workFr: 'Preneur de son',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sound designer',
        workEn: 'Sound designer',
        workFr: 'Concepteur sonore',
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
        // 03.11.2026: creditul de pe IMDb (nm6847202)
        work:   'Sound designer',
        workEn: 'Sound designer',
        workFr: 'Concepteur sonore',
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
        // 03.11.2026: creditul cerut de Ștefan (11:18)
        work:   'Sunet, sound designer',
        workEn: 'Sound, sound designer',
        workFr: 'Son, concepteur sonore',
        image:       '/assets/entities/2016-end-of-the-world-hero.jpg',
    },
    {
        // 02.11.2026: adăugat de Ștefan (afișul trimis în chat; IMDb tt4123466)
        title:         'False Positive',
        titleRo:       'Fals pozitiv',
        year:          'short 2014',
        director:      'Octav Chelaru',
        production:    'Doitreizeci',
        description:   'Primul scurtmetraj al lui Octav Chelaru, pornit de la o experiență personală cu un test de sarcină.',
        descriptionEn: 'Octav Chelaru’s first short film, drawn from a personal experience with a pregnancy test.',
        awards:        'Transilvania Talent Lab 2014 · Filmul de Piatră 2014 — selecția oficială · Timishort 2014 — selecția oficială',
        awardsEn:      'Transilvania Talent Lab 2014 · Filmul de Piatră 2014 — Official Selection · Timishort 2014 — Official Selection',
        people:        'Octav Chelaru (scenariu, regie, producător)\ncu Ionuț Cornilă, Ancuța Gutui, Delu Lucaci\nTudor Platon (imagine)\nȘtefan Azaharioaie (sunet, montaj)',
        peopleEn:      'Octav Chelaru (writer, director, producer)\nwith Ionuț Cornilă, Ancuța Gutui, Delu Lucaci\nTudor Platon (cinematography)\nȘtefan Azaharioaie (sound, editing)',
        work:          'Sunet, montaj',
        workEn:        'Sound, editing',
        workFr:        'Son, montage',
        image:         '/assets/entities/posters/fals-pozitiv.webp',
    },
];


/* ============================================================
   PEOPLE (02.11.2026, 23:57): aceeași pagină ca WORK — pelicula, rama,
   lista, creditul — dar în locul afișelor sunt oamenii. Pozele: 2:3,
   decupate din cele trimise de Ștefan (public/assets/entities/people/).
   title = numele; work = ce face; meta = funcția (rândul al doilea).
   ============================================================ */
const PEOPLE: Project[] = [
    {
        title:       'Diana Smeu',
        titleRo:     'Diana Smeu',
        year:        '',
        director:    '',
        production:  'Atemporal Film',
        description: '',
        awards:      '',
        people:      '',
        work:        'Distribuție, festivaluri, producție',
        workEn:      'Distribution, festivals, producing',
        workFr:      'Distribution, festivals, production',
        meta:        'COO, Atemporal Film',
        image:       '/assets/entities/people/diana-smeu.webp',
    },
    {
        title:       'Stefan Azaharioaie',
        titleRo:     'Ștefan Azaharioaie',
        year:        '',
        director:    '',
        production:  'Atemporal Film',
        description: '',
        awards:      '',
        people:      '',
        work:        'Sunet de platou, sound design, montaj',
        workEn:      'Production sound, sound design, editing',
        workFr:      'Son direct, sound design, montage',
        meta:        'Sound designer, editor',
        metaRo:      'Sound designer, montaj',
        metaFr:      'Sound designer, monteur',
        image:       '/assets/entities/people/stefan-azaharioaie.webp',
    },
    {
        // 03.11.2026: Fram, pisica studioului (poza trimisă în chat, decupată la 2:3)
        title:       'Fram',
        titleRo:     'Fram',
        year:        '',
        director:    '',
        production:  'Atemporal Film',
        description: '',
        awards:      '',
        people:      '',
        work:        'Liniște pe platou',
        workEn:      'Quiet on set',
        workFr:      'Silence sur le plateau',
        meta:        'Studio cat, Atemporal Film',
        metaRo:      'Pisica studioului, Atemporal Film',
        metaFr:      'Chat du studio, Atemporal Film',
        image:       '/assets/entities/people/fram.webp',
    },
];

/* ============================================================
   ABOUT (03.11.2026): aceeași pagină ca WORK și PEOPLE — pelicula, rama,
   lampa — cu pozele de pe platou trimise de Ștefan (13, decupate la 2:3,
   public/assets/entities/about/set-NN.webp). Lista din stânga și creditul
   din dreapta nu apar; în locul lor, textul paginii, sub meniu, unde l-a
   cerut nota Regie 11 din 02.11, 22:52 (x = col-r − 119, y = 179).
   ============================================================ */
const ABOUT_SET: Project[] = Array.from({ length: 13 }, (_, k) => ({
    title:       'On set',
    titleRo:     'Pe platou',
    titleFr:     'Sur le plateau',
    year:        '',
    director:    '',
    production:  'Atemporal Film',
    description: '',
    awards:      '',
    people:      '',
    image:       `/assets/entities/about/set-${String(k + 1).padStart(2, '0')}.webp`,
}));

/** textul paginii ABOUT (03.11.2026, trimis de Ștefan în chat; RO și FR traduse de Claude) */
const ABOUT_TEXT: Record<Lang, string[]> = {
    en: [
        'Atemporal Film is a concept-driven design studio founded by Stefan Azaharioaie in 2018 and based in Bucharest, Piatra Neamț and Madrid.',
        'Rooted in modernist design principles and graphic design tradition, our work combines typography, grid systems and motion to create digital experiences that balance clarity, usability and bold visual expression.',
        'Our team remains intentionally small, under 10 people, which allows creative direction to stay personal and decisions to stay sharp. Every project is led closely by the founders. No layers. No dilution.',
    ],
    ro: [
        'Atemporal Film este un studio de design construit în jurul conceptului, fondat de Ștefan Azaharioaie în 2018, cu sediul în București, Piatra Neamț și Madrid.',
        'Pornind de la principiile designului modernist și de la tradiția designului grafic, lucrările noastre îmbină tipografia, sistemele de grilă și mișcarea, pentru a crea experiențe digitale care echilibrează claritatea, ușurința în folosire și expresia vizuală îndrăzneață.',
        'Echipa noastră rămâne în mod intenționat mică, sub 10 oameni, ca direcția creativă să rămână personală și deciziile limpezi. Fiecare proiect e condus îndeaproape de fondatori. Fără straturi. Fără diluare.',
    ],
    fr: [
        'Atemporal Film est un studio de design guidé par le concept, fondé par Stefan Azaharioaie en 2018 et basé à Bucarest, Piatra Neamț et Madrid.',
        'Ancré dans les principes du design moderniste et la tradition du graphisme, notre travail associe typographie, systèmes de grille et mouvement pour créer des expériences numériques qui équilibrent clarté, facilité d’usage et expression visuelle affirmée.',
        'Notre équipe reste volontairement petite, moins de 10 personnes, ce qui permet à la direction créative de rester personnelle et aux décisions de rester nettes. Chaque projet est mené de près par les fondateurs. Pas d’intermédiaires. Pas de dilution.',
    ],
};

type Kind = 'work' | 'people' | 'about';
const ITEMS: Record<Kind, Project[]> = { work: PROJECTS, people: PEOPLE, about: ABOUT_SET };

function pickMeta(p: Project, lang: Lang): string | undefined {
    const v = lang === 'ro' ? p.metaRo : lang === 'fr' ? p.metaFr : undefined;
    return v || p.meta;
}



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

/* Câte copii: cel puțin 3 și cel puțin ~30 de cadre în total, ca pelicula să
   nu se termine nici când lista e scurtă (PEOPLE are 3 → 11 copii).
   Numărul de copii e impar, deci există mereu o copie „din mijloc”.
   once (PEOPLE, 03.11.2026, nota Regie de la 00:11): „dacă sunt mai puțini,
   nu mai repeta numele” — pelicula tot nu are capăt, dar lista din stânga
   arată fiecare nume o singură dată, nemișcată, centrată pe ramă; numele din
   ramă crește (ca titlul filmului), iar trecerea de la ultimul la primul
   urmează roata (Fram → Diana e un pas, nu doi). */
const MIN_SLOTS = 30;
function makeReel(items: Project[], once = false) {
    const N      = items.length;
    const half   = Math.max(1, Math.ceil((MIN_SLOTS / N - 1) / 2));
    const COPIES = 2 * half + 1;
    const SLOTS  = Array.from({ length: N * COPIES }, (_, i) => i);
    const HOME   = N * half;   // primul slot din copia din mijloc
    const filmOf = (slot: number) => ((slot % N) + N) % N;
    const isHome = (slot: number) => slot >= HOME && slot < HOME + N;
    return { items, N, SLOTS, HOME, filmOf, isHome, once };
}
const REELS: Record<Kind, ReturnType<typeof makeReel>> = {
    work:   makeReel(ITEMS.work),
    people: makeReel(ITEMS.people, true),
    about:  makeReel(ITEMS.about),   // 13 poze → 3 copii (39 de cadre)
};
const IDLE_MS  = 140;      // derularea s-a oprit dacă nu mai vine niciun eveniment
/** derularea continuă (02.11.2026, 15:34): cât timp rotița se mișcă, galeria
    curge liber; când se oprește, se așază pe cadrul următor în direcția în care
    s-a mișcat — dacă s-a mișcat mai mult de NUDGE din cadru; altfel revine. */
const NUDGE    = 0.02;     // din pasul unui cadru (351 px → ~7 px)
/** titlul din dreptul ramei, în lista din stânga (Modul Regie, 02.11, 15:34) */
const TITLE_GROW  = 0.46;  // ×1,46
const TITLE_SHIFT = 18;    // px spre dreapta
/** perspectiva listei (02.11.2026, 23:05): după vecinii imediați (×1), fiecare
    titlu e cu 8% mai mic decât cel dinaintea lui, până la jumătate; lumina scade
    de la 0,45 (vecinii) la zero, pe douăsprezece titluri */
const LIST_SHRINK = 0.92;
const LIST_MIN    = 0.5;
const LIST_O1     = 0.45;
const LIST_FADE   = 12;
const LIST_GAP    = 9;     // spațiul dintre titluri la mărimea normală (px)

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

export default function LandingHero({ kind = 'work' }: { kind?: Kind }) {
    const reel = REELS[kind];
    const { HOME } = reel;
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
    const keyTargetRef  = useRef<number | null>(null);   // cadrul spre care merge galeria după săgeți

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
            const sameFilm = reel.filmOf(bestIdx) === reel.filmOf(lastActiveRef.current);
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
    }, [reel]);


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
        if (!gallery) return;
        const last = reel.SLOTS.length - 1;
        const f    = Math.min(last, Math.max(0, (gallery.scrollTop - originRef.current) / slotPitch()));
        /* PERSPECTIVA LISTEI (02.11.2026, 23:05, cerut de Ștefan): titlul din
           ramă e cel mai mare; cu cât un titlu e mai departe de el, cu atât e mai
           mic și mai stins — ca rândurile unei role care se depărtează. Distanța
           dintre titluri scade odată cu mărimea lor, deci lista se strânge spre
           capete. Fiecare titlu e așezat din JS (transform), după poziția
           continuă a derulării (f): mărimea și lumina curg odată cu pelicula. */
        // ABOUT (03.11.2026) nu are listă — doar expunerea de mai jos
        if (track && items.length > 0) {
            const n   = items.length;
            const h   = Array.from(items, (el) => el?.offsetHeight ?? 0);
            const sc  = new Array<number>(n);
            const g   = new Array<number>(n);
            // distanța (cu semn) dintre titlul i și poziția derulării; în lista
            // „o singură dată” (PEOPLE), pe drumul cel mai scurt al roții
            const N   = reel.N;
            const fm  = ((f % N) + N) % N;
            const dOf = (i: number) => {
                if (!reel.once) return i - f;
                const d = i - fm;
                return d - N * Math.round(d / N);
            };
            for (let i = 0; i < n; i++) {
                const ad = Math.abs(dOf(i));
                if (ad < 1) {
                    const x = 1 - ad;
                    g[i]  = Math.round(x * x * (3 - 2 * x) * 1000) / 1000;   // smoothstep
                    sc[i] = 1 + TITLE_GROW * g[i];
                } else {
                    g[i]  = 0;
                    sc[i] = Math.max(LIST_MIN, Math.pow(LIST_SHRINK, ad - 1));
                }
            }
            // centrele titlurilor, de la i0 în ambele sensuri; pasul = media
            // înălțimilor (cu tot cu spațiul dintre ele) celor doi vecini, micșorate
            const c  = new Array<number>(n);
            const pitch = (i: number) => ((h[i] + LIST_GAP) * sc[i] + (h[i + 1] + LIST_GAP) * sc[i + 1]) / 2;
            let off: number;
            if (reel.once) {
                // lista nu curge: numele stau în ordine, iar mijlocul lor e pe centrul ramei
                c[0] = 0;
                for (let i = 1; i < n; i++) c[i] = c[i - 1] + pitch(i - 1);
                off = (c[0] - h[0] * sc[0] / 2 + c[n - 1] + h[n - 1] * sc[n - 1] / 2) / 2;
            } else {
                const i0 = Math.min(n - 1, Math.floor(f));
                c[i0] = 0;
                for (let i = i0 + 1; i < n; i++) c[i] = c[i - 1] + pitch(i - 1);
                for (let i = i0 - 1; i >= 0; i--) c[i] = c[i + 1] - pitch(i);
                off = i0 + 1 < n ? c[i0] + (c[i0 + 1] - c[i0]) * (f - i0) : c[i0];
            }
            // centrul titlului din ramă = centrul unui titlu pe un rând (ca înainte)
            const cy = (h.find((v) => v > 0) ?? 17) / 2;
            track.style.transform = '';
            for (let i = 0; i < n; i++) {
                const el = items[i];
                if (!el) continue;
                const ad = Math.abs(dOf(i));
                const o  = ad < 1
                    ? LIST_O1 + (1 - LIST_O1) * g[i]
                    : LIST_O1 * Math.pow(Math.max(0, 1 - (ad - 1) / LIST_FADE), 1.4);
                const y  = cy + c[i] - off - h[i] / 2;
                el.style.opacity    = o < 0.005 ? '0' : o.toFixed(3);
                el.style.visibility = o < 0.005 ? 'hidden' : '';
                el.style.transform  =
                    `translate3d(${(TITLE_SHIFT * g[i]).toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sc[i].toFixed(4)})`;
            }
        }

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
    }, [slotPitch, reel]);

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
        if (reel.isHome(lastActiveRef.current)) restRef.current = lastActiveRef.current;
        const gallery = galleryRef.current;
        const slot    = lastActiveRef.current;
        if (!gallery || reel.isHome(slot)) return;
        const target = reel.HOME + reel.filmOf(slot);
        // fără tranziții cât timp afișul activ trece pe alt element
        gallery.classList.add(styles.jumping);
        jumpTo(target);
        window.setTimeout(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                gallery.classList.remove(styles.jumping);
            }));
        }, 60);
    }, [jumpTo, reel]);

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
        const last = reel.SLOTS.length - 1;
        let target = Math.round(f);
        if (Math.abs(f - target) > 0.001 && Math.abs(f - restRef.current) > NUDGE && dirRef.current !== 0) {
            target = dirRef.current > 0 ? Math.ceil(f - NUDGE) : Math.floor(f + NUDGE);
        }
        target = Math.min(last, Math.max(0, target));
        glideTo(target, () => arrive(target));
    }, [slotPitch, glideTo, arrive, reel]);

    /** click pe un titlu din listă → galeria curge până la filmul respectiv */
    const goTo = useCallback((slot: number) => {
        glideTo(slot, () => arrive(slot));
    }, [glideTo, arrive]);


    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        // pornim de la un film ales la întâmplare, în copia din mijloc
        jumpTo(reel.HOME + Math.floor(Math.random() * reel.N));
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
    }, [updateActive, syncList, jumpTo, settle, stopGlide, reel]);

    // la schimbarea limbii titlurile își schimbă lungimea → recalculăm
    useEffect(() => { syncList(); }, [lang, syncList]);

    /* SĂGEȚILE ↑ ↓ (02.11.2026, 19:21): o apăsare = afișul anterior / următor,
       cu aceeași mișcare lină ca la rotiță. Apăsările repetate (sau ținute)
       se adună: fiecare pornește de la cadrul spre care merge deja galeria.
       Nu fac nimic cât timp e deschisă fereastra filmului sau când se scrie
       într-un câmp de text (ex. o notă în Modul Regie). */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
            if (expandedIdx !== null) return;
            const el = e.target as HTMLElement | null;
            if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
            e.preventDefault();   // fără derularea proprie a browserului
            const from = animRef.current !== null && keyTargetRef.current !== null
                ? keyTargetRef.current
                : lastActiveRef.current;
            const last   = reel.SLOTS.length - 1;
            const target = Math.min(last, Math.max(0, from + (e.key === 'ArrowDown' ? 1 : -1)));
            keyTargetRef.current = target;
            glideTo(target, () => {
                keyTargetRef.current = null;
                arrive(target);
            });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expandedIdx, glideTo, arrive, reel]);


    const { SLOTS, filmOf, isHome, items } = reel;
    /** lista „o singură dată”: click pe un nume → cel mai apropiat cadru cu omul respectiv */
    const slotForItem = (i: number) => {
        const a    = lastActiveRef.current;
        const base = a - filmOf(a);
        let best   = base + i;
        for (const s of [base + i - reel.N, base + i + reel.N]) {
            if (Math.abs(s - a) < Math.abs(best - a)) best = s;
        }
        return Math.min(SLOTS.length - 1, Math.max(0, best));
    };
    const isPeople        = kind === 'people';
    const isAbout         = kind === 'about';
    const film            = filmOf(active);
    const proj            = items[film];
    const projTitle       = pickTitle(proj, lang);
    const projWork        = pickWork(proj, lang);
    const projBy          = proj.by || BY_DEFAULT;
    const projMeta        = pickMeta(proj, lang);

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
                {/* 03.11.2026: rola de lângă logo — pelicula iese din ea, se încâlcește
                    și din încâlceală rămâne scris logo-ul; click pe rolă = din nou.
                    Stă înaintea logo-ului în cod (îl ascunde cât se desenează: ~ .logo) */}
                <LogoReel label={t.replay} />
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
            {/* 02.11, 23:03 (Modul Regie): meniul urcă la y = 85; WORK (= homepage-ul)
                apare înaintea lui ABOUT, CONTACT stă mai departe; PEOPLE și GEAR
                au trecut în stânga, pe același rând, după timecode-urile din antet. Pagina deschisă e subliniată. */}
            <nav className={styles.navRow} aria-label="Main navigation">
                {/* 02.11, 23:37 (Modul Regie): PEOPLE rămâne singur în stânga, 53 px
                    mai la dreapta; GEAR trece în dreapta, înaintea lui CONTACT;
                    CONTACT 114 px mai la dreapta. PEOPLE duce la /people. */}
                <span className={`${styles.navItemAt} ${styles.navPeople}`}>
                    <NavLink href="/people">{t.nav.people}</NavLink>
                    <span className={`${styles.navItem} ${styles.navComma}`} aria-hidden="true">,</span>
                </span>
                {/* 03.11: GEAR deschide căsuța pentru mail → descarcă lista de echipament */}
                <GearRequest lang={lang} label={t.nav.gear} />
                <span className={`${styles.navItemAt} ${styles.navWork}`}>
                    <NavLink href="/">{t.nav.work}</NavLink>
                    <span className={`${styles.navItem} ${styles.navComma}`} aria-hidden="true">,</span>
                </span>
                <span className={`${styles.navItemAt} ${styles.navAbout}`}><NavLink href="/about">{t.nav.about}</NavLink></span>
                {/* 03.11: CONTACT copiază datele de contact în clipboard */}
                <ContactCopy lang={lang} label={t.nav.contact} />
            </nav>


            {/* STÂNGA — lista filmelor, în ordinea din galerie, sincronizată cu ea.
                Titlul din dreptul ramei stă unde era „descrierea proiectului”;
                cele de dinainte deasupra, cele următoare dedesubt. Click → galeria
                merge la filmul respectiv. (Modul Regie, 30.10.2026, seria a treia:
                descrierea, anul, premiile și „unde am fost” scoase de pe homepage.) */}
            {!isAbout && (
            <nav className={styles.filmList} aria-label={isPeople ? t.nav.people : t.films}>
                <ol className={styles.filmListTrack} ref={listTrackRef}>
                    {(reel.once ? items.map((_, k) => k) : SLOTS).map((i) => {
                        const p = items[filmOf(i)];
                        // copiile de margine există doar pentru ochi — cititoarele de ecran
                        // și tastatura văd lista o singură dată
                        const home = reel.once || isHome(i);
                        return (
                            <li
                                key={i}
                                ref={(el) => { listItemRefs.current[i] = el; }}
                                className={styles.filmListItem}
                                style={{ opacity: i === (reel.once ? 0 : HOME) ? 1 : 0 }}   // până la prima așezare (syncList)
                                aria-hidden={home ? undefined : true}
                            >
                                <button
                                    type="button"
                                    className={styles.filmListBtn}
                                    onClick={() => goTo(reel.once ? slotForItem(i) : i)}
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
            )}

            {/* DREAPTA — creditul: ce a făcut echipa la film + cine.
                Mutat mai aproape de ramă; lista de oameni scoasă (30.10, seria a treia). */}
            {/* ABOUT (03.11.2026): în locul creditului, textul paginii, sub meniu
                (nota Regie 11 din 02.11, 22:52: „aici vreau să intre textul”) */}
            {isAbout ? (
                <section className={styles.aboutText} aria-label={t.nav.about}>
                    {ABOUT_TEXT[lang].map((para, k) => <p key={k}>{para}</p>)}
                </section>
            ) : (
            <aside className={`${styles.side} ${styles.sideRight}`} style={fadeStyle}>
                <div className={styles.sideEyebrow}>{projWork}</div>
                {/* anul filmului, pe rândul creditului, în dreapta (02.11, 23:03) */}
                {pickYear(proj) && <div className={styles.sideYear}>{pickYear(proj)}</div>}
                <div className={styles.sideMeta}>{projMeta ?? projBy}</div>
            </aside>
            )}

            {/* timecode-urile lumii, în coloana din dreapta: sub meniu și sub credit,
                fiecare cu ▶ PLAYBACK sau ■ STOP (Modul Regie, 02.11.2026, a doua serie) */}
            <WorldClocks recLabel={t.rec} />

            {/* WORK: contactele sub CONTACT (03.11.2026, nota Regie 06) */}
            {kind === 'work' && <WorkContacts />}


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
            <h1 className={styles.srOnly} aria-live={isAbout ? undefined : 'polite'}>{isAbout ? 'Atemporal Film — ' + t.nav.about : projTitle}</h1>


            {/* GALERIE CENTRALĂ — singura zonă scrolabilă. Din 02.11.2026 e o peliculă:
                fiecare slot = un cadru pe fundal negru, cu perforația de o parte și de
                alta (::before / ::after în CSS), iar afișul lipit de pista sonoră. */}
            <div className={styles.gallery} ref={galleryRef}>
                <div className={styles.galleryPad} />
                {SLOTS.map((i) => {
                    const p        = items[filmOf(i)];
                    // PEOPLE, ABOUT: click pe poză nu deschide nimic (deocamdată nu există fișa omului)
                    const isActive = i === active && kind === 'work';
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
                    film={items[expandedIdx]}
                    lang={lang}
                    onClose={() => setExpandedIdx(null)}
                />
            )}
        </div>
    );
}
