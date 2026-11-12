/* ============================================================
   Fereastra filmului (close-up) — ce nu ține de lista PROJECTS:
   premiile (laurii), nota de lansare și încadrarea afișului.
   Cheia = câmpul `image` al filmului (containers/LandingHero/index.tsx).

   11.11.2026 (cererea lui Ștefan): premiile de pe afișe apar în fereastră.
   Fiecare laur = festivalul (`fest`) + distincția / secțiunea (`note`).
   „De pe afiș” = citit de pe afișul filmului; restul vin din lista de
   premii de dinainte (câmpul `awards`).

   ÎNCADRAREA (`FOCUS`): ce parte din afiș se vede în fereastră.
     x, y = punctul din afiș (în %, de la stânga / de sus) care rămâne în
            centrul ferestrei;
     zoom = mărirea (1 = afișul pe toată lățimea ferestrei).
     tall = aceeași încadrare, pentru telefonul ținut vertical (dacă lipsește,
            se folosește cea de bază).
   Se stabilesc împreună cu Ștefan, din Modul Regie: deschizi filmul, apeși
   REGIE, tragi / mărești imaginea de fundal, „Trimite la Claude”.
   ============================================================ */

export interface Laurel {
    fest:    string;
    note?:   string;   // EN (și limba de rezervă)
    noteRo?: string;
    noteFr?: string;
}

export interface Focus {
    x: number;
    y: number;
    zoom?: number;
    tall?: { x: number; y: number; zoom?: number };
}

const P = '/assets/entities/posters/';
const E = '/assets/entities/';


export const LAURELS: Record<string, Laurel[]> = {
    // de pe afiș
    [P + 'tot-ce-ramane.webp']: [
        { fest: 'Warsaw Film Festival 2024', note: 'Best Live Action Short', noteRo: 'Cel mai bun scurtmetraj de ficțiune', noteFr: 'Meilleur court métrage de fiction' },
    ],
    // de pe afiș: Anonimul, „TIFF 2020 — Best Balkan Film” (bufnița = festivalul
    // de la Tirana, nu TIFF Cluj), SEEfest 2021; Gopo 2021 din lista de dinainte
    [P + 'in-between.webp']: [
        { fest: 'Gopo Awards 2021', note: 'Best Short Fiction Film', noteRo: 'Cel mai bun scurtmetraj de ficțiune', noteFr: 'Meilleur court métrage de fiction' },
        { fest: 'SEEfest 2021', note: 'Best Short Fiction', noteRo: 'Cel mai bun scurtmetraj de ficțiune', noteFr: 'Meilleur court métrage de fiction' },
        { fest: 'Tirana IFF 2020', note: 'Best Balkan Film', noteRo: 'Cel mai bun film din Balcani', noteFr: 'Meilleur film des Balkans' },
        { fest: 'Anonimul 2020', note: 'Audience Award · Best Romanian Short', noteRo: 'Premiul publicului · Cel mai bun scurtmetraj românesc', noteFr: 'Prix du public · Meilleur court métrage roumain' },
    ],
    [P + 'mia-misses-her-revenge.webp']: [
        { fest: 'Warsaw Film Festival 2020', note: 'World premiere', noteRo: 'Premiera mondială', noteFr: 'Première mondiale' },
        { fest: 'Slamdance 2021' },
    ],
    // de pe afiș: „72 Locarno Film Festival · Concorso Cineasti del presente · Special Jury Prize Ciné+”
    [P + 'ivana-the-terrible.webp']: [
        { fest: 'Locarno Film Festival 2019', note: 'Special Jury Prize Ciné+ · Cineasti del presente', noteRo: 'Premiul special al juriului Ciné+ · Cineasti del presente', noteFr: 'Prix spécial du jury Ciné+ · Cineasti del presente' },
        { fest: 'Sarajevo Film Festival 2019' },
    ],
    [P + 'caliu.webp']: [
        { fest: 'Krakow Film Festival 2025', note: 'World premiere · DocFilmMusic Competition', noteRo: 'Premiera mondială · competiția DocFilmMusic', noteFr: 'Première mondiale · compétition DocFilmMusic' },
        { fest: 'TIFF 2025' },
        { fest: 'One World Romania 2025' },
        { fest: 'Astra Film Festival 2025' },
    ],
    // de pe afiș: Biografilm 2026 (International Competition), Astra (Official
    // Selection 2026), CPH:DOX 2026 (In Competition, CPH:DOX Award), TIFF 2026
    [P + 'something-familiar.webp']: [
        { fest: 'CPH:DOX 2026', note: 'World premiere · In Competition, CPH:DOX Award', noteRo: 'Premiera mondială · în competiție, CPH:DOX Award', noteFr: 'Première mondiale · en compétition, CPH:DOX Award' },
        { fest: 'Biografilm 2026', note: 'International Competition', noteRo: 'Competiția internațională', noteFr: 'Compétition internationale' },
        { fest: 'Astra Film Festival 2026', note: 'Official Selection', noteRo: 'Selecția oficială', noteFr: 'Sélection officielle' },
        { fest: 'TIFF 2026' },
    ],
    [E + '2024-where-elephants-go-hero.jpg']: [
        { fest: 'New Horizons IFF' },
        { fest: 'IndieLisboa' },
        { fest: 'Thessaloniki IFF' },
        { fest: 'Transilvania IFF' },
        { fest: 'Reykjavik IFF' },
    ],
    [E + '2024-nasty-hero.jpg']: [
        { fest: 'Cannes Film Festival 2024', note: 'Official Selection', noteRo: 'Selecția oficială', noteFr: 'Sélection officielle' },
    ],
    [E + '2018-thou-shalt-not-kill-hero.jpg']: [
        { fest: 'IndieLisboa' },
        { fest: 'Göteborg' },
        { fest: 'Ghent' },
        { fest: 'Hamburg' },
        { fest: 'Warsaw IFF' },
        { fest: 'Calgary' },
        { fest: 'TIFF' },
    ],
    // de pe afiș: „26. Sarajevo Film Festival — Official Competition”, TIFF
    [E + '2020-house-of-dolls-hero.jpg']: [
        { fest: 'Sarajevo Film Festival 2020', note: 'Official Competition', noteRo: 'Competiția oficială', noteFr: 'Compétition officielle' },
        { fest: 'TIFF 2020' },
    ],
    // de pe afiș: Trieste Film Festival 2023
    [E + '2023-acolo-unde-barcile-nu-ajung-hero.jpg']: [
        { fest: 'Trieste Film Festival 2023' },
        { fest: 'TIFF' },
        { fest: 'Anonimul' },
        { fest: 'ESTE FILM' },
        { fest: 'Cyprus ISFF' },
        { fest: 'Gopo 2024' },
    ],
    [E + '2021-a-fish-on-a-ladder-hero.jpg']: [
        { fest: 'Havana FF 2021' },
        { fest: 'Oberhausen ISFF 2021' },
    ],
    [E + '2021-extravaganzia-mare-hero.jpg']: [
        { fest: 'Brno FF' },
        { fest: 'Goa SFF' },
        { fest: 'Short Stop IFF' },
        { fest: 'TIFF 2022' },
        { fest: 'Anonimul 2022' },
        { fest: 'Filmul de Piatra' },
    ],
    // de pe afiș: „Short Film Competition · Festival de Cannes”
    [E + '2016-end-of-the-world-hero.jpg']: [
        { fest: 'Festival de Cannes 2016', note: 'Short Film Competition', noteRo: 'Competiția de scurtmetraje', noteFr: 'Compétition des courts métrages' },
        { fest: 'Sarajevo Film Festival', note: 'Best Short Film', noteRo: 'Cel mai bun scurtmetraj', noteFr: 'Meilleur court métrage' },
        { fest: 'LAFF 2017' },
    ],
    // de pe afiș: Filmul de Piatră (Official Selection 2014), Transilvania
    // Talent Lab, Timishort (Official Selection 2014)
    [P + 'fals-pozitiv.webp']: [
        { fest: 'Filmul de Piatră 2014', note: 'Official Selection', noteRo: 'Selecția oficială', noteFr: 'Sélection officielle' },
        { fest: 'Timishort 2014', note: 'Official Selection', noteRo: 'Selecția oficială', noteFr: 'Sélection officielle' },
        { fest: 'Transilvania Talent Lab 2014' },
    ],
};


/** nota de lansare (nu e premiu): un rând simplu, sub tabel */
export const NOTES: Record<string, { en: string; ro: string; fr?: string }> = {
    [P + 'the-nun.webp']: {
        en: 'International release',
        ro: 'Distribuție internațională',
        fr: 'Sortie internationale',
    },
    [P + 'happy-box.webp']: {
        en: 'Premiere: Cinema City AFI Brașov, 2025 · Cinepub',
        ro: 'Premiera: Cinema City AFI Brașov, 2025 · Cinepub',
        fr: 'Première : Cinema City AFI Brașov, 2025 · Cinepub',
    },
    [P + 'a-summer-of-nothing.webp']: {
        en: 'In Romanian cinemas from 16 October 2026 · distributed by Manifest Film',
        ro: 'În cinematografe din 16 octombrie 2026 · distribuit de Manifest Film',
        fr: 'Dans les salles roumaines à partir du 16 octobre 2026 · distribué par Manifest Film',
    },
    [E + '2025-beyond-borders-hero.jpg']: {
        en: 'In production — premiere 2025',
        ro: 'În lucru — premiera 2025',
        fr: 'En production — première 2025',
    },
    [E + '2022-eroii-de-la-podul-jiului-hero.jpg']: {
        en: 'National release · international festival selections',
        ro: 'Distribuție națională · selecții la festivaluri internaționale',
        fr: 'Sortie nationale · sélections en festivals internationaux',
    },
};


/** încadrarea afișului în fereastră — prima variantă, de corectat din Regie */
export const FOCUS: Record<string, Focus> = {
    [P + 'on-saint-nicholas-eve.webp']:        { x: 50, y: 63 },
    [P + 'tot-ce-ramane.webp']:                { x: 55, y: 25 },
    [P + 'between-the-edges-of-the-day.webp']: { x: 50, y: 69 },
    [P + 'the-nun.webp']:                      { x: 50, y: 31 },
    [P + 'cat-funeral.webp']:                  { x: 50, y: 29 },
    [P + 'a-rivers-gaze.webp']:                { x: 50, y: 41 },
    [P + 'happy-box.webp']:                    { x: 50, y: 62 },
    [P + 'in-between.webp']:                   { x: 30, y: 60, zoom: 1.45 },
    [P + 'mia-misses-her-revenge.webp']:       { x: 50, y: 41 },
    [P + 'ivana-the-terrible.webp']:           { x: 50, y: 27, zoom: 1.12 },
    [P + 'caliu.webp']:                        { x: 50, y: 45, tall: { x: 50, y: 54 } },
    [P + 'a-summer-of-nothing.webp']:          { x: 50, y: 56 },
    [P + 'something-familiar.webp']:           { x: 50, y: 34 },
    [E + '2024-where-elephants-go-hero.jpg']:  { x: 50, y: 24 },
    [E + '2025-beyond-borders-hero.jpg']:      { x: 50, y: 56 },
    [E + '2024-nasty-hero.jpg']:               { x: 50, y: 38 },
    [E + '2022-eroii-de-la-podul-jiului-hero.jpg']:   { x: 50, y: 33 },
    [E + '2018-thou-shalt-not-kill-hero.jpg']:        { x: 40, y: 24 },
    [E + '2020-house-of-dolls-hero.jpg']:             { x: 50, y: 47 },
    [E + '2023-acolo-unde-barcile-nu-ajung-hero.jpg']: { x: 50, y: 84 },
    [E + '2021-a-fish-on-a-ladder-hero.jpg']:         { x: 50, y: 52 },
    [E + '2021-extravaganzia-mare-hero.jpg']:         { x: 50, y: 22 },
    [E + '2016-end-of-the-world-hero.jpg']:           { x: 50, y: 43 },
    [P + 'fals-pozitiv.webp']:                        { x: 50, y: 12 },
};

export const FOCUS_DEFAULT: Focus = { x: 50, y: 40 };
