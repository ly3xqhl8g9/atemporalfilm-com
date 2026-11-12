'use client';

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Cofinance from '@/containers/Cofinance';
import FilmDetail from '@/containers/FilmDetail';
import HeaderClocks, { ClockSheetList, WorldClocks } from '@/containers/HeaderClocks';

import ContactCopy, { SocialLinks, WorkContacts } from './ContactCopy';
import GearRequest from './GearRequest';
import { HTML_LANG, LANG_STORE, isLang, type Lang } from './i18n';
import {
    BAND_TILE, MIN_SLOTS, SETTLE_MS, SPRING_W, WHEEL_GAIN, WHEEL_TAU, exposureFilter, filmK,
    type Axis, bandShift, filmAxis, offsetPos, rectMid, scrollMax, scrollPos, setScrollPos, viewSize, wheelDelta,
} from './filmStrip';
import IntroReel from './IntroReel';
import PhoneSheet, { isNarrowScreen } from './PhoneSheet';
import { decideFilmMode } from './filmMode';
import TimeCalculator from './TimeCalculator';
import LogoReel from './LogoReel';
import SetStrip, { type StripImage } from './SetStrip';
import { useBarFlow } from './barFlow';
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
    // 12.11.2026: titlul oficial în altă limbă, unde există pe IMDb (Also known as)
    titles?:     Partial<Record<Lang, string>>;
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
    // ABOUT (03.11.2026, 12:41): descrierea omului, în stânga peliculei —
    // rândul cu funcțiile (role) și paragrafele (text), în fiecare limbă
    bio?: Record<Lang, { role: string; text: string[] }>;

    image: string;   // /assets/entities/...
}


/* ── Limbi & traduceri UI ──────────────────────────────── */

// Lang, LANGS etc.: ./i18n.ts (03.11.2026, 13:49: EN, ES, FR, RO, TH, ZH, HI)

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
    es: {
        nav: {
            work:     'Trabajos',
            about:    'Nosotros',
            people:   'Equipo',
            gear:     'Material',
            services: 'Servicios',
            contact:  'Contacto',
            latest:   'Recientes',
        },
        films: 'Películas',
        by:    'by',
        rec:   'REC',
        replay: 'Volver a ver',
    },
    th: {
        nav: {
            work:     'ผลงาน',
            about:    'เกี่ยวกับเรา',
            people:   'ทีมงาน',
            gear:     'อุปกรณ์',
            services: 'บริการ',
            contact:  'ติดต่อ',
            latest:   'ล่าสุด',
        },
        films: 'ภาพยนตร์',
        by:    'by',
        rec:   'REC',
        replay: 'เล่นอีกครั้ง',
    },
    zh: {
        nav: {
            work:     '作品',
            about:    '关于',
            people:   '团队',
            gear:     '器材',
            services: '服务',
            contact:  '联系',
            latest:   '最新',
        },
        films: '电影',
        by:    'by',
        rec:   'REC',
        replay: '重新播放',
    },
    hi: {
        nav: {
            work:     'काम',
            about:    'परिचय',
            people:   'टीम',
            gear:     'उपकरण',
            services: 'सेवाएँ',
            contact:  'संपर्क',
            latest:   'नवीनतम',
        },
        films: 'फ़िल्में',
        by:    'by',
        rec:   'REC',
        replay: 'फिर से चलाएँ',
    },
};

/* CREDITELE ÎN CELELALTE LIMBI (03.11.2026, 13:49): după textul englezesc al
   creditului (workEn) sau al funcției (meta). EN, RO și FR rămân în câmpurile
   fiecărui film. Formulări scurte, ca rândul să încapă înaintea anului
   (~45 de caractere): ex. în spaniolă „diseño sonoro”, nu „diseñador de sonido”,
   în creditul cel mai lung. */
type MoreLang = 'es' | 'th' | 'zh' | 'hi';
const WORK_T: Record<string, Record<MoreLang, string>> = {
    'Sound designer':                 { es: 'Diseñador de sonido',          th: 'นักออกแบบเสียง',                 zh: '声音设计',              hi: 'साउंड डिज़ाइनर' },
    'Sound recording':                { es: 'Grabación de sonido',          th: 'บันทึกเสียง',                    zh: '录音',                  hi: 'साउंड रिकॉर्डिंग' },
    'Sound recordist':                { es: 'Sonidista',                    th: 'ผู้บันทึกเสียง',                   zh: '录音师',                hi: 'साउंड रिकॉर्डिस्ट' },
    'Editorial department':           { es: 'Departamento de montaje',      th: 'ฝ่ายตัดต่อ',                      zh: '剪辑部门',              hi: 'संपादन विभाग' },
    'Production sound mixer':         { es: 'Jefe de sonido directo',       th: 'ผู้ควบคุมเสียงในกองถ่าย',          zh: '同期录音师',            hi: 'प्रोडक्शन साउंड मिक्सर' },
    'Production sound':               { es: 'Sonido directo',               th: 'เสียงในกองถ่าย',                  zh: '同期录音',              hi: 'प्रोडक्शन साउंड' },
    'Sound mixer':                    { es: 'Ingeniero de sonido',          th: 'วิศวกรเสียง',                     zh: '声音工程师',            hi: 'साउंड इंजीनियर' },
    'Theatrical distribution':        { es: 'Distribución en salas',        th: 'จัดจำหน่ายในโรงภาพยนตร์',          zh: '院线发行',              hi: 'सिनेमाघरों में वितरण' },
    'Sound, sound designer':          { es: 'Sonido, diseñador de sonido',  th: 'เสียง, นักออกแบบเสียง',             zh: '声音、声音设计',         hi: 'साउंड, साउंड डिज़ाइनर' },
    'Film editor, sound designer':    { es: 'Montador, diseñador de sonido', th: 'ตัดต่อภาพยนตร์, นักออกแบบเสียง',    zh: '剪辑、声音设计',         hi: 'फ़िल्म एडिटर, साउंड डिज़ाइनर' },
    'Dialogue editor, foley artist, sound designer':
                                      { es: 'Editor de diálogos, foley, diseño sonoro', th: 'ตัดต่อบทพูด, ฟอลีย์, ออกแบบเสียง', zh: '对白剪辑、拟音、声音设计', hi: 'डायलॉग एडिटर, फ़ोली, साउंड डिज़ाइनर' },
    'Sound, editing':                 { es: 'Sonido, montaje',              th: 'เสียง, ตัดต่อ',                    zh: '声音、剪辑',             hi: 'साउंड, एडिटिंग' },
    // PEOPLE / ABOUT
    'Distribution, festivals, producing':      { es: 'Distribución, festivales, producción',     th: 'จัดจำหน่าย, เทศกาลภาพยนตร์, อำนวยการผลิต', zh: '发行、电影节、制片',       hi: 'वितरण, फ़ेस्टिवल, प्रोडक्शन' },
    'Production sound, sound design, editing': { es: 'Sonido directo, diseño sonoro, montaje',    th: 'เสียงในกองถ่าย, ออกแบบเสียง, ตัดต่อ',       zh: '同期录音、声音设计、剪辑',  hi: 'प्रोडक्शन साउंड, साउंड डिज़ाइन, एडिटिंग' },
    'Quiet on set':                            { es: 'Silencio en el set',                         th: 'เงียบในกองถ่าย',                         zh: '片场安静',                 hi: 'सेट पर ख़ामोशी' },
    'COO, Atemporal Film':                     { es: 'COO, Atemporal Film',                        th: 'COO, Atemporal Film',                    zh: 'COO，Atemporal Film',      hi: 'COO, Atemporal Film' },
    'Sound designer, editor':                  { es: 'Diseñador de sonido, montador',              th: 'นักออกแบบเสียง, ช่างตัดต่อ',               zh: '声音设计、剪辑师',         hi: 'साउंड डिज़ाइनर, एडिटर' },
    'Studio cat, Atemporal Film':              { es: 'Gato del estudio, Atemporal Film',           th: 'แมวประจำสตูดิโอ, Atemporal Film',          zh: '工作室的猫，Atemporal Film', hi: 'स्टूडियो की बिल्ली, Atemporal Film' },
};
const isMore = (l: Lang): l is MoreLang => l === 'es' || l === 'th' || l === 'zh' || l === 'hi';


/** Ce a făcut echipa la film, în limba selectată (fallback: RO, apoi textul temporar). */
const WORK_PLACEHOLDER = 'Sound design, mixing, distribution';   // TEMPORAR — de scris pentru fiecare film
const BY_DEFAULT       = 'Stefan Azaharioaie';

function pickWork(p: Project, lang: Lang): string {
    if (isMore(lang)) {
        const en = p.workEn ?? '';
        return WORK_T[en]?.[lang] || en || p.work || WORK_PLACEHOLDER;
    }
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

/* TITLURILE FILMELOR (12.11.2026, regula lui Ștefan):
   • română (titleRo) = titlul original al filmului; dacă filmul nu are titlu
     românesc (The Nun, Beyond Borders, Nasty, Happy Box, A Fish on a Ladder),
     rămâne cel englezesc, exact cum e;
   • engleză (title) = titlul englezesc de pe IMDb / de pe afiș — nu o
     traducere făcută de noi (ex. „Where No Ships Go”, nu „Where the Boats
     Don’t Go”; „Extravaganzia Large, Thin Crust and Hot Sauce”);
   • celelalte limbi: titlul oficial din țara / limba respectivă, unde
     filmul are unul pe IMDb (câmpul `titles`: ex. The Nun — ES „La monja”,
     FR „La Nonne”, ZH „修女”, HI „द नन”); altfel titlul englezesc
     (cel internațional), netradus de noi.
   La un film nou: titlurile se iau de pe IMDb (Release info › Also known
   as) și se compară cu afișul. */
function pickTitle(p: Project, lang: Lang): string {
    if (lang === 'ro') return p.titleRo;
    return p.titles?.[lang] ?? (lang === 'fr' ? p.titleFr : undefined) ?? p.title;
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
        titles:      { es: 'La monja', fr: 'La Nonne', zh: '修女', hi: 'द नन' },   // IMDb: Spania / Mexic, Franța, China, India (hindi)
        titleRo:     'The Nun',                // 12.11: titlul original (în România a rulat ca „Călugărița: Misterul de la mănăstire”)
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
        titleRo:     'Malul Vânăt',            // 12.11: ca pe IMDb (nume de loc)
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
        titles:        { zh: '可怕的伊万娜' },   // IMDb: China
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
        // 03.11.2026: creditul cerut de Ștefan (11:18); 09.11: „theatrical distribution” (Diana a făcut distribuție în cinematografe)
        work:   'Distribuție în cinematografe',
        workEn: 'Theatrical distribution',
        workFr: 'Distribution en salles',
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
        // 03.11.2026: creditul cerut de Ștefan (11:18); 09.11: „theatrical distribution” (Diana a făcut distribuție în cinematografe)
        work:   'Distribuție în cinematografe',
        workEn: 'Theatrical distribution',
        workFr: 'Distribution en salles',
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
        // 03.11.2026: creditul cerut de Ștefan (11:18); 09.11: „theatrical distribution” (Diana a făcut distribuție în cinematografe)
        work:   'Distribuție în cinematografe',
        workEn: 'Theatrical distribution',
        workFr: 'Distribution en salles',
        by:     'Diana Smeu',
        image:         '/assets/entities/posters/something-familiar.webp',
    },


    // ──────────── FILMELE EXISTENTE (cu hero JPG-uri landscape, vor fi crop-uite) ────────────

    {
        title:       'Where Elephants Go',
        titles:      { zh: '大象去哪儿了' },   // IMDb: China
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
        titles:      { es: 'Entre fronteras' },   // IMDb: Spania
        titleRo:     'Beyond Borders',         // 12.11: filmul nu are titlu românesc (IMDb: original „Beyond Borders”; în SUA a rulat ca „Between Borders”)
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
        titles:      { zh: '医者仁心' },   // IMDb: China
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
        title:       'Where No Ships Go',      // 12.11: titlul englezesc de pe IMDb și de pe afiș
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
        titleRo:     'A Fish on a Ladder',     // 12.11: filmul nu are titlu românesc (IMDb, afiș)
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
        title:       'Extravaganzia Large, Thin Crust and Hot Sauce',   // 12.11: titlul de pe afiș (Cinepub); IMDb: „Big Extravaganzia, Thin Crust, Hot Sauce”
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
        title:       '4:15 P.M. The End of the World',   // 12.11: ca pe IMDb și pe afiș
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
        bio: {
            en: {
                role: 'Manager | Theatrical Distribution Coordinator',
                text: [
                    'Diana Smeu studied Screenwriting and Film Studies at the National University of Theatre and Film “I.L. Caragiale” (UNATC) in Bucharest. She has coordinated several film festivals and events, including Les Films de Cannes à Bucarest and the American Independent Film Festival.',
                    'Her academic background also includes studies in Philosophy, Politics and Economics in Bucharest, as well as Philosophy of Asia at the Complutense University of Madrid.',
                    'At Atemporal, Diana oversees strategic planning and organisational development. She is responsible for developing funding proposals and coordinating the theatrical distribution of Romanian films across cinemas in Romania.',
                ],
            },
            ro: {
                role: 'Manager | Coordonatoare distribuție în cinematografe',
                text: [
                    'Diana Smeu a studiat Scenaristică și Studii cinematografice la Universitatea Națională de Artă Teatrală și Cinematografică „I.L. Caragiale” (UNATC) din București. A coordonat mai multe festivaluri și evenimente de film, între care Les Films de Cannes à Bucarest și American Independent Film Festival.',
                    'A studiat, de asemenea, Filosofie, Politică și Economie la București și Filosofie asiatică la Universitatea Complutense din Madrid.',
                    'La Atemporal, Diana se ocupă de planificarea strategică și de dezvoltarea organizațională. Scrie propunerile de finanțare și coordonează distribuția filmelor românești în cinematografele din România.',
                ],
            },
            fr: {
                role: 'Manager | Coordinatrice de la distribution en salles',
                text: [
                    'Diana Smeu a étudié le scénario et les études cinématographiques à l’Université nationale d’art théâtral et cinématographique « I.L. Caragiale » (UNATC) de Bucarest. Elle a coordonné plusieurs festivals et événements de cinéma, dont Les Films de Cannes à Bucarest et l’American Independent Film Festival.',
                    'Son parcours universitaire comprend également des études de philosophie, politique et économie à Bucarest, ainsi que de philosophie de l’Asie à l’Université Complutense de Madrid.',
                    'Chez Atemporal, Diana est en charge de la planification stratégique et du développement de la structure. Elle élabore les dossiers de financement et coordonne la distribution en salles de films roumains dans les cinémas de Roumanie.',
                ],
            },
            es: {
                role: 'Manager | Coordinadora de distribución en salas',
                text: [
                    'Diana Smeu estudió Guion y Estudios Cinematográficos en la Universidad Nacional de Teatro y Cine «I.L. Caragiale» (UNATC) de Bucarest. Ha coordinado varios festivales y eventos de cine, entre ellos Les Films de Cannes à Bucarest y el American Independent Film Festival.',
                    'Su formación académica incluye también estudios de Filosofía, Política y Economía en Bucarest, así como de Filosofía de Asia en la Universidad Complutense de Madrid.',
                    'En Atemporal, Diana se encarga de la planificación estratégica y del desarrollo organizativo. Prepara las solicitudes de financiación y coordina la distribución en salas de películas rumanas en los cines de Rumanía.',
                ],
            },
            th: {
                role: 'ผู้จัดการ | ผู้ประสานงานการจัดจำหน่ายภาพยนตร์ในโรงภาพยนตร์',
                text: [
                    'Diana Smeu ศึกษาด้านการเขียนบทภาพยนตร์และภาพยนตร์ศึกษาที่มหาวิทยาลัยการละครและภาพยนตร์แห่งชาติ “I.L. Caragiale” (UNATC) ในกรุงบูคาเรสต์ เธอเคยประสานงานเทศกาลและกิจกรรมภาพยนตร์หลายงาน รวมถึง Les Films de Cannes à Bucarest และ American Independent Film Festival',
                    'นอกจากนี้ เธอยังศึกษาด้านปรัชญา การเมือง และเศรษฐศาสตร์ในกรุงบูคาเรสต์ รวมถึงปรัชญาเอเชียที่มหาวิทยาลัยคอมพลูเตนเซแห่งมาดริด',
                    'ที่ Atemporal Diana ดูแลการวางแผนเชิงกลยุทธ์และการพัฒนาองค์กร เธอรับผิดชอบการจัดทำข้อเสนอขอทุน และประสานงานการจัดจำหน่ายภาพยนตร์โรมาเนียในโรงภาพยนตร์ทั่วโรมาเนีย',
                ],
            },
            zh: {
                role: '经理 | 院线发行协调',
                text: [
                    'Diana Smeu 毕业于布加勒斯特“I.L. Caragiale”国立戏剧电影大学（UNATC），主修编剧与电影研究。她曾统筹多个电影节和电影活动，包括 Les Films de Cannes à Bucarest 和 American Independent Film Festival。',
                    '她还曾在布加勒斯特学习哲学、政治学与经济学，并在马德里康普顿斯大学学习亚洲哲学。',
                    '在 Atemporal，Diana 负责战略规划与机构发展，撰写资助申请，并统筹罗马尼亚电影在全国影院的院线发行。',
                ],
            },
            hi: {
                role: 'मैनेजर | थिएट्रिकल डिस्ट्रीब्यूशन कोऑर्डिनेटर',
                text: [
                    'Diana Smeu ने बुखारेस्ट की नेशनल यूनिवर्सिटी ऑफ़ थिएटर एंड फ़िल्म “I.L. Caragiale” (UNATC) से पटकथा लेखन और फ़िल्म अध्ययन की पढ़ाई की है। वे कई फ़िल्म फ़ेस्टिवलों और आयोजनों का समन्वय कर चुकी हैं, जिनमें Les Films de Cannes à Bucarest और American Independent Film Festival शामिल हैं।',
                    'उन्होंने बुखारेस्ट में दर्शनशास्त्र, राजनीति और अर्थशास्त्र की पढ़ाई भी की है, और मैड्रिड की कॉम्प्लुटेंस यूनिवर्सिटी में एशियाई दर्शन का अध्ययन किया है।',
                    'Atemporal में Diana रणनीतिक योजना और संगठनात्मक विकास की ज़िम्मेदारी संभालती हैं। वे फ़ंडिंग प्रस्ताव तैयार करती हैं और रोमानिया के सिनेमाघरों में रोमानियाई फ़िल्मों के थिएट्रिकल डिस्ट्रीब्यूशन का समन्वय करती हैं।',
                ],
            },
        },
        image:       '/assets/entities/people/diana-smeu.webp',
    },
    {
        title:       'Ștefan Azaharioaie',   // 03.11, 12:41: cu diacritice și în EN (cum l-a scris Ștefan)
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
        // 12.11.2026: textele noi, scrise de Ștefan (plan de lucru/bio-stefan-12-noiembrie.txt);
        // în afară de RO: „Where Elephants Go” și „4:15 P.M. The End of the World” — titlurile oficiale
        bio: {
            en: {
                role: 'Founder | Sound Designer • Production Sound Mixing • Editor • Foley Artist',
                text: [
                    "Ștefan studied music from childhood, then chose film. He did his BA and MA at UNATC in Bucharest, where he’s now working on a PhD in cinema. For over ten years he has done sound and editing on films from Romania, the UK, the UAE, Turkey, Zambia and Zimbabwe, including the features “Nasty,” “Where Elephants Go,” “A River’s Gaze” and “Thou Shalt Not Kill,” which earned nominations and awards at festivals such as Cannes, Berlin, Locarno and Warsaw. The short “4:15 P.M. The End of the World” was selected for the official competition at Cannes in 2016. Ștefan was nominated for the Young Hope award at Romania’s Gopo Awards.",
                    "He loves moving between set and studio, because knowing both worlds gives him a sharper sense of what a film really needs. The same goes for editing and sound: he’s already shaping the entire sound concept while he’s in the cut. Between projects he composes and records sounds for his personal library.",
                ],
            },
            ro: {
                role: 'Fondator | Sound designer • Sunet de platou • Montaj • Foley',
                text: [
                    "Ștefan a studiat muzica încă din copilărie, apoi a ales filmul. A urmat licența și masterul la UNATC, iar acum își face doctoratul în cinematografie la aceeași universitate. De peste zece ani face sunet și montaj pentru filme din România, Marea Britanie, Emiratele Arabe Unite, Turcia, Zambia și Zimbabwe, printre care lungmetrajele „Nasty”, „Unde merg elefanții”, „A River’s Gaze” și „Să nu ucizi”, nominalizate și premiate la festivaluri precum Cannes, Berlin, Locarno și Varșovia. Scurtmetrajul „4:15 P.M. Sfârșitul lumii” a fost selectat în competiția oficială de la Cannes în 2016. Ștefan a fost nominalizat la Premiile Gopo, la categoria Tânără Speranță.",
                    "Îi place să îmbine lucrul pe platou cu cel din studio: cunoscând ambele lumi, vede mai precis de ce are nevoie un film. La fel se întâmplă cu montajul și sunetul, pentru că gândește întregul concept sonor încă din faza de montaj. Între proiecte compune și înregistrează sunete pentru biblioteca lui personală.",
                ],
            },
            fr: {
                role: 'Fondateur | Sound designer • Ingénieur du son plateau • Monteur • Bruiteur',
                text: [
                    "Ștefan a étudié la musique dès l’enfance avant de choisir le cinéma. Il a suivi une licence et un master à l’UNATC de Bucarest, où il prépare aujourd’hui un doctorat en cinéma. Depuis plus de dix ans, il fait le son et le montage de films venus de Roumanie, du Royaume-Uni, des Émirats arabes unis, de Turquie, de Zambie et du Zimbabwe, parmi lesquels les longs métrages « Nasty », « Where Elephants Go », « A River’s Gaze » et « Thou Shalt Not Kill », nommés et primés dans des festivals comme Cannes, Berlin, Locarno ou Varsovie. Le court métrage « 4:15 P.M. The End of the World » a été sélectionné en compétition officielle à Cannes en 2016. Ștefan a été nommé aux prix Gopo, en Roumanie, dans la catégorie Jeune Espoir.",
                    "Il aime conjuguer le travail sur le plateau et en studio, car connaître les deux univers lui permet de voir plus précisément ce dont un film a besoin. Il en va de même pour le montage et le son : il pense toute la conception sonore dès l’étape du montage. Entre deux projets, il compose et enregistre des sons pour sa sonothèque personnelle.",
                ],
            },
            es: {
                role: 'Fundador | Diseñador de sonido • Sonido directo • Montador • Artista de foley',
                text: [
                    "Ștefan estudió música desde niño y después eligió el cine. Hizo el grado y el máster en la UNATC de Bucarest, donde ahora cursa el doctorado en cine. Desde hace más de diez años hace sonido y montaje para películas de Rumanía, Reino Unido, Emiratos Árabes Unidos, Turquía, Zambia y Zimbabue, entre ellas los largometrajes «Nasty», «Where Elephants Go», «A River’s Gaze» y «Thou Shalt Not Kill», nominados y premiados en festivales como Cannes, Berlín, Locarno o Varsovia. El cortometraje «4:15 P.M. The End of the World» fue seleccionado en la competición oficial de Cannes en 2016. Ștefan fue nominado a Joven Promesa en los Premios Gopo de Rumanía.",
                    "Le gusta combinar el trabajo en rodaje con el de estudio, porque conocer los dos mundos le permite ver con más precisión lo que necesita una película. Con el montaje y el sonido le pasa lo mismo: concibe todo el concepto sonoro ya desde la fase de montaje. Entre proyecto y proyecto compone y graba sonidos para su sonoteca personal.",
                ],
            },
            th: {
                role: 'ผู้ก่อตั้ง | นักออกแบบเสียง • บันทึกเสียงในกองถ่าย • ช่างตัดต่อ • ศิลปินฟอลีย์',
                text: [
                    "Ștefan เรียนดนตรีมาตั้งแต่เด็ก ก่อนจะเลือกเส้นทางภาพยนตร์ เขาจบปริญญาตรีและปริญญาโทจาก UNATC กรุงบูคาเรสต์ และตอนนี้กำลังเรียนปริญญาเอกด้านภาพยนตร์ที่มหาวิทยาลัยเดียวกัน กว่าสิบปีที่ผ่านมา เขาทำเสียงและตัดต่อให้ภาพยนตร์จากโรมาเนีย สหราชอาณาจักร สหรัฐอาหรับเอมิเรตส์ ตุรกี แซมเบีย และซิมบับเว รวมถึงหนังยาวอย่าง “Nasty” “Where Elephants Go” “A River’s Gaze” และ “Thou Shalt Not Kill” ซึ่งได้เข้าชิงและคว้ารางวัลจากเทศกาลภาพยนตร์อย่างคานส์ เบอร์ลิน โลการ์โน และวอร์ซอ หนังสั้น “4:15 P.M. The End of the World” ได้เข้าสายประกวดหลักของเทศกาลภาพยนตร์เมืองคานส์ในปี 2016 และ Ștefan เองก็เคยเข้าชิงรางวัล Gopo ของโรมาเนียในสาขาดาวรุ่ง",
                    "เขาชอบทำงานทั้งในกองถ่ายและในสตูดิโอควบคู่กัน เพราะการรู้จักทั้งสองโลกทำให้เขาเห็นชัดขึ้นว่าหนังเรื่องหนึ่งต้องการอะไร งานตัดต่อกับงานเสียงก็เช่นกัน เขาวางคอนเซ็ปต์เสียงทั้งหมดไว้ตั้งแต่ขั้นตอนตัดต่อ ระหว่างโปรเจกต์ เขาแต่งเพลงและอัดเสียงเก็บไว้ในคลังเสียงส่วนตัว",
                ],
            },
            zh: {
                role: '创始人 | 声音设计 • 同期录音 • 剪辑 • 拟音',
                text: [
                    "Ștefan 自幼学习音乐，后来选择了电影。他在布加勒斯特国立戏剧与电影艺术大学（UNATC）完成本科和硕士学业，目前在该校攻读电影博士。十多年来，他为罗马尼亚、英国、阿联酋、土耳其、赞比亚和津巴布韦的电影担任声音和剪辑，参与的长片包括《Nasty》《Where Elephants Go》《A River’s Gaze》和《Thou Shalt Not Kill》，这些影片曾在戛纳、柏林、洛迦诺、华沙等电影节获得提名和奖项。短片《4:15 P.M. The End of the World》入围了 2016 年戛纳电影节短片竞赛单元。Ștefan 曾获罗马尼亚 Gopo 奖\"新希望奖\"提名。",
                    "他喜欢把片场工作和录音棚工作结合起来：对两边都了解，让他更准确地知道一部电影真正需要什么。剪辑和声音也是如此，早在剪辑阶段，他就已经在构思整个声音概念。项目间隙，他会作曲，并为自己的私人声音库录制声音。",
                ],
            },
            hi: {
                role: 'संस्थापक | साउंड डिज़ाइनर • प्रोडक्शन साउंड मिक्सिंग • एडिटर • फ़ोली आर्टिस्ट',
                text: [
                    "Ștefan ने बचपन से संगीत सीखा और फिर फ़िल्म को चुना। उन्होंने बुखारेस्ट के UNATC से बीए और एमए किया, और अब उसी विश्वविद्यालय से सिनेमा में पीएचडी कर रहे हैं। दस साल से ज़्यादा समय से वे रोमानिया, ब्रिटेन, संयुक्त अरब अमीरात, तुर्की, ज़ाम्बिया और ज़िम्बाब्वे की फ़िल्मों में साउंड और एडिटिंग कर रहे हैं। इनमें “Nasty”, “Where Elephants Go”, “A River’s Gaze” और “Thou Shalt Not Kill” जैसी फ़ीचर फ़िल्में शामिल हैं, जिन्हें कान, बर्लिन, लोकार्नो और वारसॉ जैसे फ़िल्म फ़ेस्टिवलों में नामांकन और पुरस्कार मिले। शॉर्ट फ़िल्म “4:15 P.M. The End of the World” 2016 में कान की आधिकारिक प्रतियोगिता में चुनी गई थी। Ștefan को रोमानिया के गोपो अवॉर्ड्स में 'यंग होप' श्रेणी में नामांकन मिला।",
                    "उन्हें सेट और स्टूडियो, दोनों का काम साथ लेकर चलना पसंद है, क्योंकि दोनों दुनियाओं की समझ से उन्हें ज़्यादा साफ़ दिखता है कि किसी फ़िल्म को क्या चाहिए। एडिटिंग और साउंड के साथ भी ऐसा ही है: एडिटिंग के दौरान ही वे पूरा साउंड कॉन्सेप्ट गढ़ लेते हैं। प्रोजेक्ट्स के बीच वे संगीत रचते हैं और अपनी निजी साउंड लाइब्रेरी के लिए आवाज़ें रिकॉर्ड करते हैं।",
                ],
            },
        },
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
        bio: {
            en: { role: 'Technical Inspector, Guardian Angel, Wise Advisor', text: [] },
            ro: { role: 'Inspector tehnic, înger păzitor, sfătuitor înțelept', text: [] },
            fr: { role: 'Inspecteur technique, ange gardien, sage conseiller', text: [] },
            es: { role: 'Inspector técnico, ángel de la guarda, sabio consejero', text: [] },
            th: { role: 'ผู้ตรวจสอบด้านเทคนิค เทวดาผู้พิทักษ์ ที่ปรึกษาผู้รอบรู้', text: [] },
            zh: { role: '技术督察、守护天使、睿智顾问', text: [] },
            hi: { role: 'तकनीकी निरीक्षक, रक्षक फ़रिश्ता, समझदार सलाहकार', text: [] },
        },
        image:       '/assets/entities/people/fram.webp',
    },
];

/* ============================================================
   ABOUT (03.11.2026, 12:41): PEOPLE și ABOUT sunt o singură pagină (/about).
   Pe peliculă: fețele celor trei din PEOPLE (pozele de pe platou nu mai
   apar; fișierele rămân în public/assets/entities/about/). În stânga
   peliculei: descrierea omului din ramă (PEOPLE → bio). În dreapta, mereu
   aceeași: descrierea Atemporal Film (trimisă de Ștefan în chat; RO și FR
   traduse de Claude).
   ============================================================ */
const ABOUT_TEXT: Record<Lang, string[]> = {
    en: [
        'Atemporal is a film production and post-production company based in Bucharest, Romania, with an active presence in Piatra Neamț and Madrid, Spain.',
        'Founded in 2018, the company has provided post-production and location sound recording services for feature films, short films, documentaries and TV series, collaborating on productions from around the world.',
        'Led by Diana Smeu and Ștefan Azaharioaie, Atemporal is drawn to unconventional, bold and audacious projects.',
        'Our team is fluent in English and has extensive experience working across diverse international settings, including Romania, the United Kingdom, Spain, the United Arab Emirates, Saudi Arabia, Turkey, Zambia and Zimbabwe.',
    ],
    ro: [
        'Atemporal este o companie de producție și postproducție de film cu sediul în București, prezentă activ și la Piatra Neamț și la Madrid, în Spania.',
        'Fondată în 2018, compania a oferit servicii de postproducție și de înregistrare a sunetului pe platou pentru lungmetraje, scurtmetraje, documentare și seriale TV, colaborând cu producții din întreaga lume.',
        'Condusă de Diana Smeu și Ștefan Azaharioaie, Atemporal caută proiectele neconvenționale, curajoase și îndrăznețe.',
        'Echipa noastră vorbește fluent engleza și are o experiență bogată de lucru în contexte internaționale diverse, între care România, Regatul Unit, Spania, Emiratele Arabe Unite, Arabia Saudită, Turcia, Zambia și Zimbabwe.',
    ],
    fr: [
        'Atemporal est une société de production et de postproduction cinématographique basée à Bucarest, en Roumanie, également active à Piatra Neamț et à Madrid, en Espagne.',
        'Fondée en 2018, elle assure des services de postproduction et de prise de son sur le tournage pour des longs métrages, des courts métrages, des documentaires et des séries télévisées, en collaboration avec des productions du monde entier.',
        'Dirigée par Diana Smeu et Ștefan Azaharioaie, Atemporal est attirée par les projets non conventionnels, audacieux et osés.',
        'Notre équipe parle couramment l’anglais et possède une solide expérience dans des contextes internationaux variés, notamment en Roumanie, au Royaume-Uni, en Espagne, aux Émirats arabes unis, en Arabie saoudite, en Turquie, en Zambie et au Zimbabwe.',
    ],
    es: [
        'Atemporal es una empresa de producción y posproducción cinematográfica con sede en Bucarest, Rumanía, y presencia activa en Piatra Neamț y en Madrid, España.',
        'Fundada en 2018, la empresa ha prestado servicios de posproducción y de sonido directo para largometrajes, cortometrajes, documentales y series de televisión, colaborando con producciones de todo el mundo.',
        'Dirigida por Diana Smeu y Ștefan Azaharioaie, Atemporal se siente atraída por los proyectos poco convencionales, valientes y audaces.',
        'Nuestro equipo habla inglés con fluidez y tiene una amplia experiencia de trabajo en contextos internacionales muy diversos, como Rumanía, el Reino Unido, España, los Emiratos Árabes Unidos, Arabia Saudí, Turquía, Zambia y Zimbabue.',
    ],
    th: [
        'Atemporal เป็นบริษัทผลิตและโพสต์โปรดักชันภาพยนตร์ ตั้งอยู่ที่กรุงบูคาเรสต์ ประเทศโรมาเนีย และดำเนินงานอยู่ที่เมืองเปียตรา เนียมตส์ และกรุงมาดริด ประเทศสเปน',
        'ก่อตั้งขึ้นในปี 2018 บริษัทให้บริการงานโพสต์โปรดักชันและบันทึกเสียงในกองถ่ายสำหรับภาพยนตร์ขนาดยาว ภาพยนตร์สั้น สารคดี และซีรีส์โทรทัศน์ โดยร่วมงานกับโปรดักชันจากทั่วโลก',
        'ภายใต้การนำของ Diana Smeu และ Ștefan Azaharioaie บริษัท Atemporal สนใจโปรเจกต์ที่แหวกขนบ กล้าหาญ และท้าทาย',
        'ทีมงานของเราสื่อสารภาษาอังกฤษได้อย่างคล่องแคล่ว และมีประสบการณ์มากมายในการทำงานในบริบทนานาชาติที่หลากหลาย ทั้งโรมาเนีย สหราชอาณาจักร สเปน สหรัฐอาหรับเอมิเรตส์ ซาอุดีอาระเบีย ตุรกี แซมเบีย และซิมบับเว',
    ],
    zh: [
        'Atemporal 是一家总部位于罗马尼亚布加勒斯特的电影制作与后期制作公司，在皮亚特拉尼亚姆茨以及西班牙马德里亦有活跃业务。',
        '公司成立于 2018 年，为剧情长片、短片、纪录片和电视剧提供后期制作及现场录音服务，合作的作品来自世界各地。',
        'Atemporal 由 Diana Smeu 与 Ștefan Azaharioaie 共同领导，钟情于不落俗套、大胆而无畏的项目。',
        '我们的团队英语流利，在多元的国际环境中拥有丰富的工作经验，足迹遍及罗马尼亚、英国、西班牙、阿联酋、沙特阿拉伯、土耳其、赞比亚和津巴布韦。',
    ],
    hi: [
        'Atemporal एक फ़िल्म प्रोडक्शन और पोस्ट-प्रोडक्शन कंपनी है, जिसका मुख्यालय बुखारेस्ट, रोमानिया में है और जो पियात्रा नेअम्त्स तथा मैड्रिड, स्पेन में भी सक्रिय है।',
        '2018 में स्थापित यह कंपनी फ़ीचर फ़िल्मों, शॉर्ट फ़िल्मों, डॉक्यूमेंट्री और टीवी सीरीज़ के लिए पोस्ट-प्रोडक्शन और लोकेशन साउंड रिकॉर्डिंग सेवाएँ देती है, और दुनिया भर की प्रोडक्शनों के साथ काम कर चुकी है।',
        'Diana Smeu और Ștefan Azaharioaie के नेतृत्व में, Atemporal लीक से हटकर चलने वाले, साहसी और बेबाक प्रोजेक्ट्स की ओर आकर्षित होती है।',
        'हमारी टीम धाराप्रवाह अंग्रेज़ी बोलती है और उसे रोमानिया, यूनाइटेड किंगडम, स्पेन, संयुक्त अरब अमीरात, सऊदी अरब, तुर्की, ज़ाम्बिया और ज़िम्बाब्वे सहित विविध अंतरराष्ट्रीय परिवेशों में काम करने का व्यापक अनुभव है।',
    ],
};

type Kind = 'work' | 'about';
const ITEMS: Record<Kind, Project[]> = { work: PROJECTS, about: PEOPLE };

function pickMeta(p: Project, lang: Lang): string | undefined {
    if (isMore(lang)) return (p.meta && WORK_T[p.meta]?.[lang]) || p.meta;
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
    about:  makeReel(ITEMS.about, true),   // 3 oameni → 11 copii (33 de cadre)
};
/* DERULAREA ANALOGICĂ (03.11.2026, 13:32, cererea lui Ștefan): fără salt pe
   cadru cât se mișcă rotița. Pelicula are „masă”: urmează rotița cu inerție
   (WHEEL_TAU) și se oprește oriunde, și între două cadre. Abia după ce rotița
   e lăsată în pace SETTLE_MS, pelicula alege cadrul cel mai încadrat (cel mai
   aproape de centrul ramei, acolo unde ar ajunge) și e trasă încet în ramă de
   un arc amortizat critic (SPRING_W): pornește cu viteza pe care o avea, fără
   smucitură, și încetinește spre final, ca o peliculă trasă cu mâna pe masa de
   montaj. Același arc pentru săgețile ↑ ↓ și pentru click pe un titlu. */
/* SETTLE_MS, WHEEL_TAU, WHEEL_GAIN, SPRING_W: în filmStrip.ts (comune cu a doua bandă de pe ABOUT) */

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
/* BAND_TILE (2049 = 2732 × 0,75): în filmStrip.ts; pe ecranele mici × --film-k */


/* ============================================================
   <LandingHero />
   ============================================================ */

/* EXPUNEREA AFIȘELOR (02.11.2026, 18:25): afară — subexpuse, alb-negru;
   în ramă — dense (≈ −1¾ diafragmă), pentru că lampa din spatele geamului
   (.lamp, color-dodge, ~×3,3 în medie) le aduce la expunerea corectă. */
/* EXPO_OUT = 0,15, EXPO_IN = 0,30: în filmStrip.ts (exposureFilter) */

/* A DOUA PELICULĂ DE PE ABOUT (03.11.2026): pozele de la filmare, lângă banda
   cu oamenii — SetStrip.tsx. Din 03.11, 19:30: selecția lui Ștefan („selectie
   website poze pentru pagina about”, 54 de poze, decupate la 2:3 de
   scripts/about-set.py — numărul de mai jos = câte fișiere set-NN.webp sunt) */
const SET_COUNT = 54;
const SET_PHOTOS: StripImage[] = Array.from({ length: SET_COUNT }, (_, k) => ({
    src: `/assets/entities/about/set-${String(k + 1).padStart(2, '0')}.webp`,
    alt: `Atemporal Film on set — ${k + 1}`,
}));

export default function LandingHero({ kind = 'work' }: { kind?: Kind }) {
    const reel = REELS[kind];
    const { HOME } = reel;
    const [active, setActive]               = useState(HOME);   // slotul din ramă
    const [ready, setReady]                 = useState(false);  // așezat pe filmul de start
    const [textVisible, setTextVisible]     = useState(true);
    const [expandedIdx, setExpandedIdx]     = useState<number | null>(null);
    const [lang, setLangState]              = useState<Lang>('en');
    // limba aleasă rămâne cât ține vizita (WORK ↔ ABOUT); o vizită nouă pornește în engleză
    useEffect(() => {
        try {
            const saved = window.sessionStorage.getItem(LANG_STORE);
            if (isLang(saved)) setLangState(saved);
        } catch { /* fără sessionStorage: rămâne engleza */ }
    }, []);
    useEffect(() => { document.documentElement.lang = HTML_LANG[lang]; }, [lang]);
    const setLang = useCallback((l: Lang) => {
        setLangState(l);
        try { window.sessionStorage.setItem(LANG_STORE, l); } catch { /* ignorat */ }
    }, []);
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
    const kRef          = useRef(1);   // --film-k: mărimea peliculei (1 pe desktop)
    // axa peliculei (09.11.2026): 'y' pe desktop, 'x' pe telefon / tabletă (curge stânga ↔ dreapta)
    const axisRef       = useRef<Axis>('y');
    // derularea continuă: animația de așezare, cadrul pe care s-a oprit ultima
    // dată, direcția ultimei mișcări și poziția de la evenimentul precedent
    const animRef       = useRef<number | null>(null);
    const restRef       = useRef(HOME);
    const prevTopRef    = useRef(0);
    /** starea peliculei: liberă (urmează rotița), pe arc (se așază pe `goal`) sau oprită */
    const motionRef     = useRef({
        mode: 'idle' as 'idle' | 'free' | 'spring',
        pos: 0, target: 0, vel: 0, goal: 0, goalTop: 0, last: 0,
        onDone: null as null | (() => void),
    });
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
        const galleryMid = rectMid(vfRect, axisRef.current);
        let bestIdx  = lastActiveRef.current;
        let bestDist = Infinity;
        slotRefs.current.forEach((el, i) => {
            if (!el) return;
            const mid = rectMid(el.getBoundingClientRect(), axisRef.current);
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
        return a && b ? offsetPos(b, axisRef.current) - offsetPos(a, axisRef.current) : 1;
    }, []);

    const syncList = useCallback(() => {
        const gallery = galleryRef.current;
        const track   = listTrackRef.current;
        const items   = listItemRefs.current;
        if (!gallery) return;
        const last = reel.SLOTS.length - 1;
        const f    = Math.min(last, Math.max(0, (scrollPos(gallery, axisRef.current) - originRef.current) / slotPitch()));
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
            img.style.filter = exposureFilter(e);
            // halația: lumina lămpii trece prin afiș și „curge” din zonele luminoase
            // (02.11, 17:40: mai puternică și caldă, după referință)
            if (halo) halo.style.opacity = (0.32 * e).toFixed(3);
        });

        /* PISTA SONORĂ — banda din stânga afișului curge odată cu pelicula.
           Mișcarea vine din derulare; săriturile invizibile dintre copiile galeriei
           (jumpTo) nu o mișcă, deci banda nu sare niciodată. */
        const top = scrollPos(gallery, axisRef.current);
        bandYRef.current += top - lastTopRef.current;
        lastTopRef.current = top;
        const band = bandRef.current;
        if (band) {
            const tile = BAND_TILE * kRef.current;   // pe ecranele mici pelicula e mai mică (--film-k)
            const y = ((bandYRef.current % tile) + tile) % tile;
            band.style.transform = bandShift(y, axisRef.current);
        }
    }, [slotPitch, reel]);

    /** poziția de derulare la care cadrul `slot` stă exact în centrul ramei —
        măsurată pe ecran, deci aceeași în Safari și în Chrome */
    const scrollFor = useCallback((slot: number): number => {
        const gallery = galleryRef.current;
        const el      = slotRefs.current[slot];
        const vf      = vfRef.current;
        if (!gallery || !el || !vf) return originRef.current + slot * slotPitch();
        const a  = axisRef.current;
        const to = scrollPos(gallery, a) + rectMid(el.getBoundingClientRect(), a) - rectMid(vf.getBoundingClientRect(), a);
        originRef.current = to - slot * slotPitch();
        return to;
    }, [slotPitch]);

    /** mută galeria fără animație */
    const jumpTo = useCallback((slot: number) => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        setScrollPos(gallery, axisRef.current, scrollFor(slot));
        lastTopRef.current = scrollPos(gallery, axisRef.current);   // săritura nu mișcă pista sonoră
        prevTopRef.current = scrollPos(gallery, axisRef.current);   // și nu contează ca mișcare
        lastActiveRef.current = slot;
        restRef.current = slot;
        const m = motionRef.current;
        m.pos = m.target = scrollPos(gallery, axisRef.current);
        m.vel = 0;
        setActive(slot);
        syncList();
    }, [scrollFor, syncList]);

    /** oprește pelicula pe loc (mâna pe ecran / pe galerie) */
    const stopGlide = useCallback(() => {
        if (animRef.current !== null) cancelAnimationFrame(animRef.current);
        animRef.current = null;
        const m = motionRef.current;
        const gallery = galleryRef.current;
        m.mode = 'idle';
        m.vel = 0;
        m.onDone = null;
        if (gallery) m.pos = m.target = scrollPos(gallery, axisRef.current);
    }, []);

    /** un pas al peliculei (rAF): liberă → se apropie de țintă cu inerție;
        pe arc → arc amortizat critic spre cadrul ales */
    const runMotion = useCallback(() => {
        if (animRef.current !== null) return;
        const m = motionRef.current;
        m.last = performance.now();
        const step = (now: number) => {
            const gallery = galleryRef.current;
            if (!gallery) { animRef.current = null; return; }
            const dt = Math.min(0.05, Math.max(0.001, (now - m.last) / 1000));
            m.last = now;
            let done = false;
            if (m.mode === 'free') {
                const np = m.pos + (m.target - m.pos) * (1 - Math.exp(-dt / WHEEL_TAU));
                m.vel = (np - m.pos) / dt;
                m.pos = np;
                if (Math.abs(m.target - m.pos) < 0.25) { m.pos = m.target; m.vel = 0; done = true; }
            } else if (m.mode === 'spring') {
                const x = m.pos - m.goalTop;
                m.vel += (-SPRING_W * SPRING_W * x - 2 * SPRING_W * m.vel) * dt;
                m.pos += m.vel * dt;
                if (Math.abs(m.pos - m.goalTop) < 0.4 && Math.abs(m.vel) < 8) {
                    m.pos = m.target = m.goalTop;
                    m.vel = 0;
                    done = true;
                }
            } else {
                done = true;
            }
            setScrollPos(gallery, axisRef.current, m.pos);
            if (!done) {
                animRef.current = requestAnimationFrame(step);
                return;
            }
            animRef.current = null;
            if (m.mode === 'spring') {
                m.mode = 'idle';
                const cb = m.onDone;
                m.onDone = null;
                cb?.();
            }
        };
        animRef.current = requestAnimationFrame(step);
    }, []);

    /** dusă lin până la un cadru, pe arc: pornește cu viteza pe care o are
        pelicula și încetinește spre final */
    const glideTo = useCallback((slot: number, onDone?: () => void) => {
        const gallery = galleryRef.current;
        if (!gallery) return;
        const m = motionRef.current;
        if (m.mode === 'idle' || animRef.current === null) {
            m.pos = scrollPos(gallery, axisRef.current);
            if (m.mode === 'idle') m.vel = 0;
        }
        const to    = scrollFor(slot);
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        m.goal    = slot;
        m.goalTop = to;
        m.onDone  = onDone ?? null;
        if (still || (Math.abs(to - m.pos) < 0.5 && Math.abs(m.vel) < 8)) {
            if (animRef.current !== null) cancelAnimationFrame(animRef.current);
            animRef.current = null;
            m.mode = 'idle';
            m.pos = m.target = to;
            m.vel = 0;
            m.onDone = null;
            setScrollPos(gallery, axisRef.current, to);
            onDone?.();
            return;
        }
        m.mode = 'spring';
        runMotion();
    }, [scrollFor, runMotion]);

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
            if (Math.abs(scrollPos(gallery, axisRef.current) - to) > 0.75) setScrollPos(gallery, axisRef.current, to);
        }
        updateActive();
        syncList();
        restRef.current = slot;
        recenter();
    }, [scrollFor, updateActive, syncList, recenter]);

    /** rotița a fost lăsată → pelicula alege cadrul cel mai încadrat: cel mai
        aproape de centrul ramei, în locul unde ar ajunge (ținta mișcării) */
    const settle = useCallback(() => {
        const gallery = galleryRef.current;
        const m = motionRef.current;
        if (!gallery || m.mode === 'spring') return;
        const rest = m.mode === 'free' ? m.target : scrollPos(gallery, axisRef.current);
        const last = reel.SLOTS.length - 1;
        const f    = (rest - originRef.current) / slotPitch();
        const target = Math.min(last, Math.max(0, Math.round(f)));
        glideTo(target, () => arrive(target));
    }, [slotPitch, glideTo, arrive, reel]);

    /** click pe un titlu din listă → galeria curge până la filmul respectiv */
    const goTo = useCallback((slot: number) => {
        glideTo(slot, () => arrive(slot));
    }, [glideTo, arrive]);


    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        kRef.current = filmK(gallery);
        axisRef.current = filmAxis(gallery);
        // pornim de la un film ales la întâmplare, în copia din mijloc
        jumpTo(reel.HOME + Math.floor(Math.random() * reel.N));
        const readyId = requestAnimationFrame(() => setReady(true));

        let ticking = false;
        let idle    = 0;
        let finger  = false;   // degetul e pe peliculă
        const scheduleSettle = () => {
            window.clearTimeout(idle);
            idle = window.setTimeout(settle, SETTLE_MS);
        };
        /* PELICULA FĂRĂ CAPĂT ȘI ÎN TIMPUL DERULĂRII (12.11.2026, Ștefan: pe
           telefon, derulând mult, pelicula ajungea la capăt): până acum
           pelicula sărea în copia din mijloc doar după ce se oprea. Acum, cât
           derulează (inerția degetului, rotița), când capătul ajunge la mai
           puțin de un ecran, sare cu un număr întreg de liste spre mijloc —
           aceeași imagine, deci nu se vede. Nu cât timp degetul e pe
           ecran (ar sări sub deget) și nu pe arcul care o așază. */
        const wrap = (top: number): number => {
            const m = motionRef.current;
            if (finger || m.mode === 'spring') return top;
            // capătul ar ajunge la mai puțin de un ecran (sau o jumătate de listă)
            // → mutăm pelicula cu un număr întreg de liste, cât mai aproape de mijloc
            const N = reel.N, p = slotPitch(), ax = axisRef.current;
            const max  = scrollMax(gallery, ax);
            const edge = Math.max((N / 2) * p, viewSize(gallery, ax));
            if (top > edge && top < max - edge) return top;
            const f = (top - originRef.current) / p;
            const d = Math.round(((reel.SLOTS.length - 1) / 2 - f) / N) * N;
            if (!d) return top;
            const delta = d * p;
            gallery.classList.add(styles.jumping);
            setScrollPos(gallery, axisRef.current, top + delta);
            const now = scrollPos(gallery, axisRef.current);
            const moved = now - top;
            lastTopRef.current += moved;          // pista sonoră nu sare
            m.pos += moved;
            m.target += moved;
            lastActiveRef.current += d;
            restRef.current += d;
            window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
                gallery.classList.remove(styles.jumping);
            })), 60);
            return now;
        };
        const onScroll = () => {
            const top = wrap(scrollPos(gallery, axisRef.current));
            prevTopRef.current = top;
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActive();
                    syncList();
                    ticking = false;
                });
                ticking = true;
            }
            // derulare care nu vine de la noi (deget pe ecran, bara de scroll):
            // pelicula o urmează și se așază după ce se oprește
            const m = motionRef.current;
            if (animRef.current === null && Math.abs(top - m.pos) > 1.5) {
                m.mode = 'idle';
                m.pos = m.target = top;
                m.vel = 0;
                scheduleSettle();
            }
        };
        // rotița / trackpadul: derularea o face pelicula (cu inerție), nu browserul
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey) return;                       // zoom cu două degete
            e.preventDefault();
            const m = motionRef.current;
            if (m.mode !== 'free') {
                // preia mișcarea de unde e, cu viteza pe care o avea (fără smucitură)
                m.pos    = animRef.current !== null ? m.pos : scrollPos(gallery, axisRef.current);
                m.target = m.pos + m.vel * WHEEL_TAU;
                m.mode   = 'free';
                m.onDone = null;
            }
            const ax   = axisRef.current;
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewSize(gallery, ax) : 1;
            const max  = scrollMax(gallery, ax);
            m.target = Math.min(max, Math.max(0, m.target + wheelDelta(e, ax) * unit * WHEEL_GAIN));
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                m.pos = m.target;
                setScrollPos(gallery, axisRef.current, m.pos);
            } else {
                runMotion();
            }
            scheduleSettle();
        };
        const onGrab  = (e: Event) => { if (e.type === 'touchstart') finger = true; stopGlide(); window.clearTimeout(idle); };
        const onLift  = (e: Event) => {
            if (e.type === 'touchend' || e.type === 'touchcancel') finger = false;
            if (motionRef.current.mode !== 'spring') scheduleSettle();
        };
        gallery.addEventListener('scroll', onScroll, { passive: true });
        gallery.addEventListener('wheel', onWheel, { passive: false });
        gallery.addEventListener('touchstart', onGrab, { passive: true });
        gallery.addEventListener('pointerdown', onGrab, { passive: true });
        gallery.addEventListener('touchend', onLift, { passive: true });
        gallery.addEventListener('touchcancel', onLift, { passive: true });
        window.addEventListener('pointerup', onLift, { passive: true });
        // telefonul întors / fereastra redimensionată: altă mărime a peliculei,
        // alt loc al ramei → cadrul din ramă e pus din nou exact în ea
        const onResize = () => {
            kRef.current = filmK(gallery);
            exposureRef.current = [];
            // telefonul / tableta întoarsă: pelicula poate trece de pe orizontală
            // pe verticală (sau invers) — același cadru rămâne în ramă
            const ax = filmAxis(gallery);
            if (ax !== axisRef.current) {
                stopGlide();
                window.clearTimeout(idle);
                axisRef.current = ax;
                jumpTo(lastActiveRef.current);
                return;
            }
            if (motionRef.current.mode === 'idle') jumpTo(lastActiveRef.current);
            else onScroll();
        };
        window.addEventListener('resize', onResize);
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
            gallery.removeEventListener('touchcancel', onLift);
            window.removeEventListener('pointerup', onLift);
            window.removeEventListener('resize', onResize);
        };
    }, [updateActive, syncList, jumpTo, settle, stopGlide, runMotion, reel, slotPitch]);

    // la schimbarea limbii titlurile își schimbă lungimea → recalculăm
    useEffect(() => { syncList(); }, [lang, syncList]);

    /* SĂGEȚILE ↑ ↓ (02.11.2026, 19:21): o apăsare = afișul anterior / următor,
       cu aceeași mișcare lină ca la rotiță. Apăsările repetate (sau ținute)
       se adună: fiecare pornește de la cadrul spre care merge deja galeria.
       Nu fac nimic cât timp e deschisă fereastra filmului sau când se scrie
       într-un câmp de text (ex. o notă în Modul Regie). */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // ↑ ↓ și, doar pentru pelicula orizontală de pe ecranele mici, ← → (09.11.2026);
            // pe desktop (pelicula verticală) săgețile ← → nu fac nimic, ca până acum
            const horiz = axisRef.current === 'x';
            const fwd  = e.key === 'ArrowDown' || (horiz && e.key === 'ArrowRight');
            const back = e.key === 'ArrowUp' || (horiz && e.key === 'ArrowLeft');
            if (!fwd && !back) return;
            if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
            if (expandedIdx !== null) return;
            const el = e.target as HTMLElement | null;
            if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
            e.preventDefault();   // fără derularea proprie a browserului
            // apăsările repetate se adună: pornesc de la cadrul spre care merge deja pelicula
            const m    = motionRef.current;
            const from = m.mode === 'spring' ? m.goal : lastActiveRef.current;
            const last   = reel.SLOTS.length - 1;
            const target = Math.min(last, Math.max(0, from + (fwd ? 1 : -1)));
            glideTo(target, () => arrive(target));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expandedIdx, glideTo, arrive, reel]);


    /* FIȘELE DE PE TELEFON (03.11.2026, 18:30; vezi PhoneSheet.tsx): sub
       1280 px ceasul din antet, CONTACT și titlul filmului deschid fișe */
    const [sheet, setSheet]   = useState<null | 'time' | 'contact' | 'films'>(null);
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1279px)');
        const on = () => { setNarrow(mq.matches); if (!mq.matches) setSheet(null); };
        on();
        // Safari mai vechi de 14 are doar addListener (11.11.2026: pagina dădea
        // „Application error” pe Mac-urile vechi)
        if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
        return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
    }, []);
    const closeSheet = useCallback(() => setSheet(null), []);

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

    /* BARA DE JOS (09.11.2026): spații egale între elemente, de o parte și
       de alta a peliculei; ce nu încape iese în ordinea lui Ștefan — vezi
       barFlow.ts. Înlocuiește regula de pe ABOUT din 03.11, 18:40
       (timecode-urile „doar dacă intră între Regio și peliculă”, întâi
       scurtate) și timecode-urile scurte de pe WORK la 1280–1369 px. */
    useBarFlow([isAbout, lang]);

    /* SUB 1280 PX (12.11.2026): pelicula verticală cu meniul pe un rând cât
       încape lângă ea, altfel pelicula orizontală — se măsoară în limba
       aleasă și pe pagina deschisă (vezi filmMode.ts). Aici: la încărcare,
       la schimbarea limbii, la WORK ↔ ABOUT și după încărcarea fonturilor;
       redimensionarea o prinde scriptul din <head>. */
    useLayoutEffect(() => {
        decideFilmMode();
        let alive = true;
        document.fonts?.ready.then(() => { if (alive) decideFilmMode(); }).catch(() => {});
        return () => { alive = false; };
    }, [isAbout, lang]);

    /* MENIUL, pe desktop (11.11.2026): în limbile cu cuvinte lungi (ES, FR, RO)
       „WORK, ABOUT” se mută spre stânga ca să nu intre peste „GEAR” (o face
       CSS-ul, singur). Aici doar măsurăm: dacă așa ar ajunge peste peliculă,
       întâi se strânge golul ABOUT → GEAR (36 → cel puțin 24 px), apoi tot
       meniul se scrie mai mic, exact cât să încapă (cel mult până la ×0,7).
       Limita e aceeași pe WORK și pe ABOUT (10 px după rama peliculei de pe
       WORK), ca meniul să arate la fel pe amândouă. Pe ABOUT, peliculele se
       opresc la 16 px înainte de WORK: îi spunem CSS-ului unde a ajuns
       (--work-w = cât de departe e marginea lui stângă de locul lui ABOUT). */
    const navRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const page = nav.parentElement;
        const BASE = 15.4, GAP = 36, GAP_MIN = 24, K_MIN = 0.7;
        const fit = () => {
            nav.style.removeProperty('--nav-fs');
            nav.style.removeProperty('--nav-gap');
            page?.style.removeProperty('--work-w');
            if (window.innerWidth < 1280) return;
            const duo  = nav.querySelector<HTMLElement>(`.${styles.navDuo}`);
            const word = (c: string) => nav.querySelector<HTMLElement>(`.${c} > .${styles.navItem}`);
            const work = word(styles.navWork), about = word(styles.navAbout), gear = word(styles.navGear);
            if (!duo || !work || !about || !gear) return;
            const tight = window.innerWidth <= 1534;                 // meniul pe un singur rând strâns
            const d     = duo.getBoundingClientRect();
            const colR  = d.left + (tight ? 35 : 37);                // --col-r
            const join  = tight ? 23 : 21;                           // WORK → ABOUT
            const avail = d.right - (colR - 169);                    // până la 10 px după rama peliculei
            const sum   = work.offsetWidth + about.offsetWidth + gear.offsetWidth;
            let k = 1, gap = GAP;
            if (sum + join + GAP > avail) {
                gap = Math.max(GAP_MIN, Math.min(GAP, Math.floor(avail - sum - join)));
                if (sum + join + gap > avail) k = Math.max(K_MIN, (avail - join - gap) / sum);
            }
            if (gap !== GAP) nav.style.setProperty('--nav-gap', `${gap}px`);
            if (k < 1) nav.style.setProperty('--nav-fs', `${(Math.floor(BASE * k * 10) / 10).toFixed(1)}px`);
            page?.style.setProperty('--work-w', `${Math.ceil(colR - 58 - work.getBoundingClientRect().left)}px`);
        };
        fit();
        const t1 = window.setTimeout(fit, 300);
        const t2 = window.setTimeout(fit, 1500);
        document.fonts?.ready.then(fit).catch(() => {});
        window.addEventListener('resize', fit);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.removeEventListener('resize', fit);
        };
    }, [lang]);

    /* ABOUT, desktop (03.11.2026): lățimea textului Atemporal, din poziția
       reală a peliculei. */
    useEffect(() => {
        if (!isAbout) return;
        const place = () => {
            const text = document.querySelector<HTMLElement>(`.${styles.page} .${styles.aboutText}`);
            text?.style.removeProperty('width');
            text?.style.removeProperty('left');
            if (window.innerWidth < 1280) return;

            const stripEls = [...document.querySelectorAll<HTMLElement>(`.${styles.page} .${styles.viewfinder}, .${styles.page} .${styles.gallery}`)];
            if (!stripEls.length) return;
            const stripL = Math.min(...stripEls.map((el) => el.getBoundingClientRect().left));

            // textul Atemporal: de la verticala listei de filme până la 32 px de
            // peliculă, cel mult 384 px. Unde lista e prea aproape de peliculă
            // (ecranele foarte late, pelicula ×1,3), textul pornește mai la
            // stânga, dar nu înaintea logo-ului
            if (text) {
                const listX = text.getBoundingClientRect().left;
                const probe = document.createElement('div');
                probe.style.cssText = 'position:fixed;top:0;width:0;height:0;left:var(--logo-x)';
                text.parentElement?.appendChild(probe);
                const logoX = probe.getBoundingClientRect().left;
                probe.remove();
                const x = Math.max(logoX, Math.min(listX, stripL - 32 - 384));
                if (x !== listX) text.style.left = `${Math.round(x)}px`;
                text.style.width = `${Math.round(Math.max(200, Math.min(384, stripL - x - 32)))}px`;
            }
        };
        place();
        const t1 = window.setTimeout(place, 300);
        const t2 = window.setTimeout(place, 1500);
        document.fonts?.ready.then(place).catch(() => {});
        window.addEventListener('resize', place);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.removeEventListener('resize', place);
        };
    }, [isAbout, lang]);


    /* -------------------------------------------------- *
     *                      RENDER
     * -------------------------------------------------- */
    return (
        <div className={[
            styles.page,
            isAbout ? styles.pageAbout : styles.pageWork,
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
                <HeaderClocks recLabel={t.rec} onOpen={narrow ? () => setSheet('time') : undefined} />
            </header>


            {/* NAV — în rândul antetului, în dreapta galeriei: Despre · Echipa · Contact,
                fără cifre și fără punctuație. Servicii și Recente scoase de pe homepage;
                butonul de limbă e în bara de jos. Modul Regie, 30.10.2026 (seria a doua). */}
            {/* 02.11, 23:03 (Modul Regie): meniul urcă la y = 85; WORK (= homepage-ul)
                apare înaintea lui ABOUT, CONTACT stă mai departe; PEOPLE și GEAR
                au trecut în stânga, pe același rând, după timecode-urile din antet. Pagina deschisă e subliniată. */}
            <nav className={styles.navRow} aria-label="Main navigation" ref={navRef}>
                {/* 03.11, 12:41: PEOPLE s-a unit cu ABOUT (o singură pagină, /about);
                    GEAR a trecut în dreapta, înaintea lui CONTACT: „GEAR, CONTACT” */}
                {/* 11.11.2026 (Ștefan: în ES, RO, FR, TH „ABOUT” intra peste „GEAR”):
                    fără virgulă după ABOUT, în nicio limbă; „WORK, ABOUT” stau
                    împreună (navPair) și se mută spre stânga cât e nevoie ca între
                    ABOUT și GEAR să rămână mereu loc (navDuo — vezi CSS, „MENIUL,
                    11.11.2026”); dacă ar ajunge peste peliculă, meniul se scrie
                    puțin mai mic (efectul de mai sus). Sub 1280 px cele două
                    învelișuri nu există (display: contents). */}
                <span className={styles.navDuo}>
                    {/* 03.11: GEAR deschide căsuța pentru mail → descarcă lista de echipament */}
                    <GearRequest lang={lang} label={t.nav.gear} />
                    <span className={styles.navPair}>
                        <span className={`${styles.navItemAt} ${styles.navWork}`}>
                            <NavLink href="/">{t.nav.work}</NavLink>
                            <span className={`${styles.navItem} ${styles.navComma}`} aria-hidden="true">,</span>
                        </span>
                        <span className={`${styles.navItemAt} ${styles.navAbout}`}>
                            <NavLink href="/about">{t.nav.about}</NavLink>
                        </span>
                    </span>
                </span>
                {/* 03.11: CONTACT copiază datele de contact în clipboard */}
                <ContactCopy lang={lang} label={t.nav.contact} social={kind === 'work' || kind === 'about'}
                             onOpenSheet={() => { if (isNarrowScreen()) setSheet('contact'); }} />
            </nav>


            {/* STÂNGA — lista filmelor, în ordinea din galerie, sincronizată cu ea.
                Titlul din dreptul ramei stă unde era „descrierea proiectului”;
                cele de dinainte deasupra, cele următoare dedesubt. Click → galeria
                merge la filmul respectiv. (Modul Regie, 30.10.2026, seria a treia:
                descrierea, anul, premiile și „unde am fost” scoase de pe homepage.) */}
            {!isAbout && (
            <nav className={styles.filmList} aria-label={t.films}>
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

            {/* ABOUT (03.11.2026, 12:41): în stânga peliculei, descrierea omului din ramă */}
            {/* ABOUT, ecranele înguste (03.11.2026): descrierea omului și cea a firmei
                stau împreună, sub pelicule, într-o casetă care se derulează;
                pe desktop învelișul nu există (display: contents) */}
            <div className={styles.aboutRead}>
            {isAbout && proj.bio && (
                <section className={styles.personText} style={fadeStyle} aria-live="polite">
                    <h2 className={styles.personName}>{pickTitle(proj, lang)}</h2>
                    <p className={styles.personRole}>{proj.bio[lang].role}</p>
                    {proj.bio[lang].text.map((para, k) => <p key={k}>{para}</p>)}
                </section>
            )}

            {/* DREAPTA — creditul: ce a făcut echipa la film + cine.
                Mutat mai aproape de ramă; lista de oameni scoasă (30.10, seria a treia). */}
            {/* ABOUT (03.11.2026): în locul creditului, descrierea Atemporal Film, mereu aceeași */}
            {isAbout ? (
                <section className={styles.aboutText} aria-label={t.nav.about}>
                    {ABOUT_TEXT[lang].map((para, k) => <p key={k}>{para}</p>)}
                </section>
            ) : null}
            </div>
            {!isAbout && (
            <aside className={`${styles.side} ${styles.sideRight}`} style={fadeStyle}>
                {/* titlul filmului: doar pe ecranele înguste, unde lista din stânga nu încape */}
                {/* 03.11, 18:30: pe telefon titlul e un buton — deschide lista filmelor (≡) */}
                <button type="button" className={styles.capTitle} onClick={() => setSheet('films')}
                        aria-haspopup="dialog" tabIndex={narrow ? 0 : -1} aria-hidden={narrow ? undefined : true}>
                    {projTitle}<span className={styles.capListIcon} aria-hidden="true">≡</span>
                </button>
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
                    style={{ '--band-tile': `${BAND_TILE}px` } as React.CSSProperties}
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


            {/* ABOUT: a doua peliculă, cu pozele de la filmare, lângă cea cu oamenii (03.11.2026) */}
            {isAbout && <SetStrip images={SET_PHOTOS} label={t.nav.about + ' — on set'} />}


            {/* BARA DE JOS — fixă, mereu vizibilă: limba + cofinanțarea */}
            <Cofinance lang={lang} onLang={setLang} />

            {/* FIȘELE DE PE TELEFON (doar sub 1280 px) */}
            <PhoneSheet open={sheet === 'time'} title="Timecode" lang={lang} onClose={closeSheet}>
                <ClockSheetList recLabel={t.rec} />
                <div className={styles.sheetTc}><TimeCalculator lang={lang} /></div>
            </PhoneSheet>
            <PhoneSheet open={sheet === 'contact'} title={t.nav.contact} lang={lang} onClose={closeSheet}>
                <WorkContacts className={styles.sheetContacts} />
                <SocialLinks className={styles.sheetSocial} />
            </PhoneSheet>
            {!isAbout && (
                <PhoneSheet open={sheet === 'films'} title={t.films} lang={lang} onClose={closeSheet}>
                    <ol className={styles.sheetFilms}>
                        {items.map((p, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    className={styles.sheetFilmBtn}
                                    aria-current={i === film ? 'true' : undefined}
                                    onClick={() => { setSheet(null); goTo(slotForItem(i)); }}
                                >
                                    <span>{pickTitle(p, lang)}</span>
                                    <span className={styles.sheetFilmYear}>{pickYear(p)}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </PhoneSheet>
            )}


            {/* INTRO „masa luminată” — doar pe homepage, cu /?intro (03.11.2026) */}
            {kind === 'work' && <IntroReel galleryRef={galleryRef} ready={ready} />}


            {/* DETAIL OVERLAY — apare când dai click pe afișul activ */}
            {expandedIdx !== null && (
                <FilmDetail
                    film={items[expandedIdx]}
                    lang={lang}
                    credit={pickWork(items[expandedIdx], lang)}
                    by={items[expandedIdx].by || BY_DEFAULT}
                    onClose={() => setExpandedIdx(null)}
                />
            )}
        </div>
    );
}
