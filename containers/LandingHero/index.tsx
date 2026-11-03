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
import { HTML_LANG, LANG_STORE, isLang, type Lang } from './i18n';
import IntroReel from './IntroReel';
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
    'Distribution':                   { es: 'Distribución',                 th: 'จัดจำหน่าย',                      zh: '发行',                  hi: 'वितरण' },
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
        bio: {
            en: {
                role: 'Founder | Sound Designer • Production Sound Mixing • Editor • Foley Artist',
                text: [
                    'With over a decade of experience, Ștefan has shaped audio for productions in Romania, the UK, UAE, Saudi Arabia, Turkey, Zambia and Zimbabwe. He holds both a BA and an MA in Editing & Sound Design and is currently pursuing a PhD. When he’s not capturing sound on set, you’ll find him in the studio fine-tuning every detail.',
                ],
            },
            ro: {
                role: 'Fondator | Sound designer • Sunet de platou • Montaj • Foley',
                text: [
                    'Cu peste zece ani de experiență, Ștefan a lucrat sunetul unor producții din România, Marea Britanie, Emiratele Arabe Unite, Arabia Saudită, Turcia, Zambia și Zimbabwe. Are licența și masteratul în Montaj și Sound Design și face acum doctoratul. Când nu înregistrează sunet pe platou, e în studio, unde lucrează fiecare detaliu.',
                ],
            },
            fr: {
                role: 'Fondateur | Sound designer • Ingénieur du son plateau • Monteur • Bruiteur',
                text: [
                    'Fort de plus de dix ans d’expérience, Ștefan a façonné le son de productions en Roumanie, au Royaume-Uni, aux Émirats arabes unis, en Arabie saoudite, en Turquie, en Zambie et au Zimbabwe. Titulaire d’une licence et d’un master en montage et sound design, il prépare actuellement un doctorat. Quand il n’enregistre pas le son sur un plateau, il est en studio, à peaufiner chaque détail.',
                ],
            },
            es: {
                role: 'Fundador | Diseñador de sonido • Sonido directo • Montador • Artista de foley',
                text: [
                    'Con más de una década de experiencia, Ștefan ha dado forma al sonido de producciones en Rumanía, el Reino Unido, los Emiratos Árabes Unidos, Arabia Saudí, Turquía, Zambia y Zimbabue. Es graduado y máster en Montaje y Diseño de Sonido, y actualmente cursa un doctorado. Cuando no está grabando sonido en un rodaje, está en el estudio, puliendo cada detalle.',
                ],
            },
            th: {
                role: 'ผู้ก่อตั้ง | นักออกแบบเสียง • บันทึกเสียงในกองถ่าย • ช่างตัดต่อ • ศิลปินฟอลีย์',
                text: [
                    'ด้วยประสบการณ์กว่าสิบปี Ștefan สร้างสรรค์งานเสียงให้กับโปรดักชันในโรมาเนีย สหราชอาณาจักร สหรัฐอาหรับเอมิเรตส์ ซาอุดีอาระเบีย ตุรกี แซมเบีย และซิมบับเว เขาจบปริญญาตรีและปริญญาโทด้านการตัดต่อและการออกแบบเสียง และกำลังศึกษาระดับปริญญาเอก เมื่อไม่ได้บันทึกเสียงอยู่ในกองถ่าย เขาจะอยู่ในสตูดิโอ ขัดเกลาทุกรายละเอียด',
                ],
            },
            zh: {
                role: '创始人 | 声音设计 • 同期录音 • 剪辑 • 拟音',
                text: [
                    'Ștefan 拥有十余年从业经验，曾为罗马尼亚、英国、阿联酋、沙特阿拉伯、土耳其、赞比亚和津巴布韦的作品打造声音。他拥有剪辑与声音设计学士和硕士学位，目前正在攻读博士学位。不在片场录音的时候，他就在录音棚里打磨每一个细节。',
                ],
            },
            hi: {
                role: 'संस्थापक | साउंड डिज़ाइनर • प्रोडक्शन साउंड मिक्सिंग • एडिटर • फ़ोली आर्टिस्ट',
                text: [
                    'एक दशक से अधिक के अनुभव के साथ, Ștefan ने रोमानिया, ब्रिटेन, संयुक्त अरब अमीरात, सऊदी अरब, तुर्की, ज़ाम्बिया और ज़िम्बाब्वे की प्रोडक्शनों के लिए साउंड गढ़ा है। उनके पास एडिटिंग और साउंड डिज़ाइन में BA और MA की डिग्रियाँ हैं और वे इस समय PhD कर रहे हैं। जब वे सेट पर साउंड रिकॉर्ड नहीं कर रहे होते, तो स्टूडियो में हर बारीकी को निखारते मिलते हैं।',
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
const SETTLE_MS  = 360;    // liniștea după care pelicula alege cadrul
const WHEEL_TAU  = 0.24;   // s — cât de „grea” e pelicula (cât întârzie după rotiță)
const WHEEL_GAIN = 1;      // distanța pe o mișcare de rotiță (1 = cât derularea normală)
const SPRING_W   = 3.6;    // rad/s — arcul care o așază (~1,3 s până aproape de cadru)

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
        const m = motionRef.current;
        m.pos = m.target = gallery.scrollTop;
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
        if (gallery) m.pos = m.target = gallery.scrollTop;
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
            gallery.scrollTop = m.pos;
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
            m.pos = gallery.scrollTop;
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
            gallery.scrollTop = to;
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
            if (Math.abs(gallery.scrollTop - to) > 0.75) gallery.scrollTop = to;
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
        const rest = m.mode === 'free' ? m.target : gallery.scrollTop;
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

        // pornim de la un film ales la întâmplare, în copia din mijloc
        jumpTo(reel.HOME + Math.floor(Math.random() * reel.N));
        const readyId = requestAnimationFrame(() => setReady(true));

        let ticking = false;
        let idle    = 0;
        const scheduleSettle = () => {
            window.clearTimeout(idle);
            idle = window.setTimeout(settle, SETTLE_MS);
        };
        const onScroll = () => {
            const top = gallery.scrollTop;
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
                m.pos    = animRef.current !== null ? m.pos : gallery.scrollTop;
                m.target = m.pos + m.vel * WHEEL_TAU;
                m.mode   = 'free';
                m.onDone = null;
            }
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? gallery.clientHeight : 1;
            const max  = gallery.scrollHeight - gallery.clientHeight;
            m.target = Math.min(max, Math.max(0, m.target + e.deltaY * unit * WHEEL_GAIN));
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                m.pos = m.target;
                gallery.scrollTop = m.pos;
            } else {
                runMotion();
            }
            scheduleSettle();
        };
        const onGrab  = () => { stopGlide(); window.clearTimeout(idle); };
        const onLift  = () => { if (motionRef.current.mode !== 'spring') scheduleSettle(); };
        gallery.addEventListener('scroll', onScroll, { passive: true });
        gallery.addEventListener('wheel', onWheel, { passive: false });
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
    }, [updateActive, syncList, jumpTo, settle, stopGlide, runMotion, reel]);

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
            // apăsările repetate se adună: pornesc de la cadrul spre care merge deja pelicula
            const m    = motionRef.current;
            const from = m.mode === 'spring' ? m.goal : lastActiveRef.current;
            const last   = reel.SLOTS.length - 1;
            const target = Math.min(last, Math.max(0, from + (e.key === 'ArrowDown' ? 1 : -1)));
            glideTo(target, () => arrive(target));
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
                {/* 03.11, 12:41: PEOPLE s-a unit cu ABOUT (o singură pagină, /about);
                    GEAR a trecut în dreapta, înaintea lui CONTACT: „GEAR, CONTACT” */}
                {/* 03.11: GEAR deschide căsuța pentru mail → descarcă lista de echipament */}
                <GearRequest lang={lang} label={t.nav.gear} />
                <span className={`${styles.navItemAt} ${styles.navWork}`}>
                    <NavLink href="/">{t.nav.work}</NavLink>
                    <span className={`${styles.navItem} ${styles.navComma}`} aria-hidden="true">,</span>
                </span>
                <span className={`${styles.navItemAt} ${styles.navAbout}`}><NavLink href="/about">{t.nav.about}</NavLink></span>
                {/* 03.11: CONTACT copiază datele de contact în clipboard */}
                <ContactCopy lang={lang} label={t.nav.contact} social={kind === 'work'} />
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
            <Cofinance lang={lang} onLang={setLang} />


            {/* INTRO „masa luminată” — doar pe homepage, cu /?intro (03.11.2026) */}
            {kind === 'work' && <IntroReel galleryRef={galleryRef} ready={ready} />}


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
