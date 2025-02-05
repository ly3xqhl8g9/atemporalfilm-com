export const menuLinks = [
    {
        nameEn: 'Home',
        nameRo: 'Acasă',
        href: '/',
    },
    {
        nameEn: 'Work',
        nameRo: 'Proiecte',
        href: '/work',
    },
    {
        nameEn: 'About',
        nameRo: 'Despre',
        href: '/about',
    },
    // {
    //     nameEn: 'Careers',
    //     nameRo: 'Jobs',
    //     href: '/careers',
    // },
    {
        nameEn: 'News',
        nameRo: 'Noutăți',
        href: '/news',
    },
    {
        nameEn: 'Gallery',
        nameRo: 'Galerie',
        href: '/gallery',
    },
    {
        nameEn: 'Contact',
        nameRo: 'Contact',
        href: '/contact',
    },
];


export const socialLinks = [
    {
        href: "https://www.instagram.com/atemporalfilm",
        icon: "/assets/logos/logo-instagram.png",
        alt: "Instagram",
    },
    // {
    //     href: "https://www.facebook.com/AtemporalFilms",
    //     icon: "/assets/logos/logo-facebook.png",
    //     alt: "Facebook",
    // },
    {
        href: "https://www.linkedin.com/company/atemporal-film",
        icon: "/assets/logos/logo-linkedin.png",
        alt: "Linkedin",
    },
];


export interface Person {
    name: string;
    role: {
        en: string;
        ro: string;
    };
}

export const persons: Person[] = [
    {
        name: 'ȘTEFAN AZAHARIOAIE',
        role: {
            en: 'sound designer, editor',
            ro: 'design sunet, monteur',
        },
    },
    {
        name: 'DIANA SMEU',
        role: {
            en: 'COO',
            ro: 'COO',
        },
    },
    {
        name: 'ANDREI SIBIȘAN',
        role: {
            en: 'sound',
            ro: 'sunet',
        },
    },
    {
        name: 'RĂZVAN ILINCA',
        role: {
            en: 'editor, sound',
            ro: 'editor, sunet',
        },
    },
    {
        name: 'MIHAI NANU',
        role: {
            en: 'sound engineer',
            ro: 'inginer sunet',
        },
    },
];


export const galleryImages = [
    {
        src: '/assets/gallery/gallery-1.webp',
        alt: 'Gallery 1',
    },
    {
        src: '/assets/gallery/gallery-2.webp',
        alt: 'Gallery 2',
    },
    {
        src: '/assets/gallery/gallery-3.webp',
        alt: 'Gallery 3',
    },
    {
        src: '/assets/gallery/gallery-4.webp',
        alt: 'Gallery 4',
    },
    {
        src: '/assets/gallery/gallery-5.webp',
        alt: 'Gallery 5',
    },
    {
        src: '/assets/gallery/gallery-6.webp',
        alt: 'Gallery 6',
    },
    {
        src: '/assets/gallery/gallery-7.webp',
        alt: 'Gallery 7',
    },
    {
        src: '/assets/gallery/gallery-8.webp',
        alt: 'Gallery 8',
    },
    {
        src: '/assets/gallery/gallery-9.webp',
        alt: 'Gallery 9',
    },
];
