export * from './language';


export interface Entity {
    id: string;
    type: 'feature' | 'short' | 'commercial';
    kind?: 'documentary' | 'animation';
    year: string;
    title: string;
    titleRo: string;
    director: string;
    cinematography?: string;
    producer?: string;
    coproducer?: string;
    productionCompany?: string;
    press: string[];
    festivals: string[];
    images: string[];
    heroImage: string;
    trailer?: string;
    imdb?: string;
}


export const data: Entity[] = [
    {
        id: '2024-where-elephants-go',
        type: 'feature',
        year: '2024',
        title: 'Where Elephants Go',
        titleRo: 'Unde merg elefantii',
        director: 'Catalin Rotaru, Gabi Virginia Sarga',
        cinematography: '',
        producer: 'Gabi Suciu',
        coproducer: '',
        productionCompany: 'Atelier de Film',
        press: [
            'https://cineuropa.org/en/newsdetail/463825',
            'https://www.screendaily.com/news/smart7-title-where-elephants-go-picked-up-for-sales-exclusive/5191569.article',
        ],
        festivals: [
            'New Horizons IFF (Poland)',
            'IndieLisboa IFF (Portugal)',
            'Thessaloniki IFF (Greece)',
            'Transilvania IFF (Romania)',
            'FILMADRID IFF (Spain)',
            'Reykjavik IFF (Iceland)',
            'Vilnius IFF',
            'Kino Pavasaris (Lithuania)',
        ],
        images: [
            '2024-where-elephants-go-1',
            '2024-where-elephants-go-2',
            '2024-where-elephants-go-3',
            '2024-where-elephants-go-4',
        ],
        heroImage: '2024-where-elephants-go-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=pdoCq95Fdhg',
        imdb: 'https://www.imdb.com/title/tt25830900',
    },
    {
        id: '2025-beyond-borders',
        type: 'feature',
        year: '2025',
        title: 'Beyond Borders',
        titleRo: 'Dincolo de hotare',
        director: 'Mark Freiburger',
        cinematography: 'Rogier Stoffers',
        producer: 'Jude S. Walko, Ken Carpenter, Isaac Norris',
        coproducer: 'Ionuț Alin Ionescu',
        productionCompany: '',
        press: [
        ],
        festivals: [
        ],
        images: [
        ],
        heroImage: '2025-beyond-borders-hero.jpg',
        trailer: '',
        imdb: 'https://www.imdb.com/title/tt31123933',
    },
    {
        id: '2024-nasty',
        type: 'feature',
        kind: 'documentary',
        year: '2024',
        title: 'Nasty',
        titleRo: 'Nasty',
        director: 'Tudor Giurgiu',
        cinematography: '',
        producer: '',
        coproducer: '',
        productionCompany: 'Libra Film',
        press: [
            'https://deadline.com/2024/05/nasty-review-ilie-nastase-doc-cannes-film-festival-1235937809',
            'https://www.festival-cannes.com/2024/nasty-jeu-set-et-match-pour-ilie-nastase',
        ],
        festivals: [
            'Cannes Film Festival 2024',
        ],
        images: [
        ],
        heroImage: '2024-nasty-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=gYBwhMQ7Q_I',
        imdb: 'https://www.imdb.com/title/tt31437303',
    },
    {
        id: '2023-acolo-unde-barcile-nu-ajung',
        type: 'short',
        year: '2023',
        title: 'Where the boats don\'t go',
        titleRo: 'Acolo unde bărcile nu ajung',
        director: 'Vlad Buzăianu',
        cinematography: '',
        producer: 'Anamaria Antoci, Ana Voicu',
        coproducer: '',
        productionCompany: 'Tangaj Film',
        press: [
        ],
        festivals: [
            'Trieste Film Festival 2023',
            'Transilvania International Film Festival',
            'Festivalul Internațional de Film Independent',
            'Anonimul 2023',
            'ESTE FILM Festival 2023',
            'International Short Film Festival of Cyprus 2023',
            'GOPO selection for Best Short Film 2024',
        ],
        images: [
        ],
        heroImage: '2023-acolo-unde-barcile-nu-ajung-hero.jpg',
        trailer: '',
        imdb: 'https://www.imdb.com/title/tt28373016',
    },
    {
        id: '2022-eroii-de-la-podul-jiului',
        type: 'feature',
        year: '2022',
        title: 'The heroes from Jiului bridge',
        titleRo: 'Eroii de la podul Jiului',
        director: 'Sergiu Prodan, Barbu Silviu Tripăduș',
        cinematography: '',
        producer: 'Carmen Tripăduș',
        coproducer: '',
        productionCompany: '',
        press: [
        ],
        festivals: [
        ],
        images: [
        ],
        heroImage: '2022-eroii-de-la-podul-jiului-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=ZMEIJ4jZQ_I',
        imdb: 'https://www.imdb.com/title/tt12077022',
    },
    {
        id: '2021-a-fish-on-a-ladder',
        type: 'short',
        kind: 'animation',
        year: '2021',
        title: 'A Fish on a Ladder',
        titleRo: 'Un pește pe o scară',
        director: 'Ioana Păsărin',
        cinematography: '',
        producer: '',
        coproducer: '',
        productionCompany: '',
        press: [
        ],
        festivals: [
            'Havana Film Festival 2021',
            'Oberhausen International Short Film Festival 2021',
        ],
        images: [
        ],
        heroImage: '2021-a-fish-on-a-ladder-hero.jpg',
        trailer: '',
        imdb: 'https://www.imdb.com/title/tt21619148',
    },
    {
        id: '2021-extravaganzia-mare',
        type: 'short',
        year: '2021',
        title: 'Big extravagance, thin crust, hot sauce',
        titleRo: 'Extravaganzia mare, blat subțire, sos iute',
        director: 'Andrei Redinciuc',
        cinematography: '',
        producer: 'Carol Ionescu',
        coproducer: '',
        productionCompany: '',
        press: [
            'https://cineuropa.org/en/newsdetail/463825/',
            'https://www.screendaily.com/news/smart7-title-where-elephants-go-picked-up-for-sales-exclusive/5191569.article',
        ],
        festivals: [
            'Brno Film Festival, Cehia, 2021',
            'Goa Short Film Festival, India, 2021',
            'Short Stop International Film Festival 2021',
            'Transilvania International Film Festival, 2022',
            'Festivalul Internațional de Film Independent Anonimul, 2022',
            'Filmul de Piatra, 2022',
            'Noaptea albă a filmului românesc, București, 2022',
        ],
        images: [
        ],
        heroImage: '2021-extravaganzia-mare-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=I6ecEar_RDE',
        imdb: 'https://www.imdb.com/title/tt18629466',
    },
    {
        id: '2020-along-came-a-prince',
        type: 'short',
        year: '2020',
        title: 'Along Came a Prince',
        titleRo: 'A venit un prinț',
        director: 'Cristina Groșan',
        cinematography: '',
        producer: 'Anamaria Antoci, Anda Ionescu',
        coproducer: '',
        productionCompany: 'Tangaj Film',
        press: [
        ],
        festivals: [
            'Festival Européen du Film Court de Brest | Prix du Jury Jeune 2020 ',
            'Festival International du Film Francophone de Namur 2020',
            'Prague Shorts 2021',
            'International Short Film Week Regensburg 2021',
            'Valencia International Film Festival Cinema Jove 2021',
        ],
        images: [
        ],
        heroImage: '2020-along-came-a-prince-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=8mHmxwtcEx8',
        imdb: 'https://www.imdb.com/title/tt12743622',
    },
    {
        id: '2018-thou-shalt-not-kill',
        type: 'feature',
        year: '2018',
        title: 'Thou Shalt Not Kill',
        titleRo: 'Să nu ucizi',
        director: 'Cătălin Rotaru, Gabi Virginia Sarga',
        cinematography: '',
        producer: 'Gabi Suciu',
        coproducer: '',
        productionCompany: 'Green Cat Film',
        press: [
            'https://cineuropa.org/en/newsdetail/361555',
        ],
        festivals: [
            'IndieLisboa International Independent Film Festival 2019',
            'Göteborg Film Festival 2019',
            'Ghent Film Festival 2019',
            'Hamburg Film Festival 2019',
            'Warsaw International Film Festival 2018',
            'Calgary International Film Festival 2019',
            'Transilvania International Film Festival 2019',
        ],
        images: [
        ],
        heroImage: '2018-thou-shalt-not-kill-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=ught3_zk2sI',
        imdb: 'https://www.imdb.com/title/tt9135772',
    },
    {
        id: '2020-house-of-dolls',
        type: 'feature',
        kind: 'documentary',
        year: '2020',
        title: 'House of Dolls',
        titleRo: 'Casa cu păpuși',
        director: 'Tudor Platon',
        cinematography: '',
        producer: 'Carla Fotea',
        coproducer: '',
        productionCompany: 'Micro Film',
        press: [
            'https://cineuropa.org/en/newsdetail/390612/',
        ],
        festivals: [
            'Sarajevo Film Festival 2020',
            'Transilvania International Film Festival 2020',
        ],
        images: [
        ],
        heroImage: '2020-house-of-dolls-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=4KPQ-PiljP8',
        imdb: 'https://www.imdb.com/title/tt12765598',
    },
    {
        id: '2016-end-of-the-world',
        type: 'short',
        year: '2016',
        title: '4:15 P.M. End of the world',
        titleRo: '4:15 P.M. Sfârșitul lumii',
        director: 'Cătălin Rotaru, Gabi Virginia Sarga',
        cinematography: '',
        producer: 'Adina Sădeanu',
        coproducer: '',
        productionCompany: 'Green Cat Film',
        press: [
            'https://www.festival-cannes.com/en/f/415-p-m-sfarsitul-lumii',
        ],
        festivals: [
            'In Competition, Short Film Palme d\'Or, Cannes 2016',
            'Los Angeles Film Festival 2017',
            'Sarajevo Film Festival 2016 | Winner: Best Short Film',
        ],
        images: [
        ],
        heroImage: '2016-end-of-the-world-hero.jpg',
        trailer: 'https://www.youtube.com/watch?v=ltD5cIbhmts',
        imdb: 'https://www.imdb.com/title/tt5717670',
    },
    // {
    //     id: '',
    //     type: 'feature',
    //     kind: '',
    //     year: '',
    //     title: '',
    //     titleRo: '',
    //     director: '',
    //     cinematography: '',
    //     producer: '',
    //     coproducer: '',
    //     productionCompany: '',
    //     press: [
    //     ],
    //     festivals: [
    //     ],
    //     images: [
    //     ],
    //     heroImage: '',
    //     trailer: '',
    //     imdb: '',
    // },
];
