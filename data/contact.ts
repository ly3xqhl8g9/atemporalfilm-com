import {
    Language,
} from './language';



export type LocalizedContent<T> = {
    [K in Language]: T;
};

export type ContactItem = {
    type: 'tel' | 'email';
    value: string;
    href: string;
};

export type PersonContent = {
    name: string;
    title: string | LocalizedContent<string>;
    contact: ContactItem[];
};

export type EmailContent = {
    contact: ContactItem[];
};

export type LocationsContent = {
    en: string[];
    ro: string[];
};

export type BaseSection<T extends string, C> = {
    type: T;
    content: C;
};

export type PersonSection = BaseSection<'person', PersonContent>;

export type EmailSection = BaseSection<'email', EmailContent>;

export type LocationsSection = BaseSection<'locations', LocationsContent> & {
    title: LocalizedContent<string>;
};

export type Section = PersonSection | EmailSection | LocationsSection;

export const sections: Section[] = [
    {
        type: 'person',
        content: {
            name: 'ȘTEFAN AZAHARIOAIE',
            title: {
                en: 'sound designer, editor',
                ro: 'design sunet, monteur'
            },
            contact: [
                { type: 'tel', value: '+40 743 343 800', href: 'tel:+40743343800' },
                { type: 'email', value: 'stefan@atemporalfilm.com', href: 'mailto:stefan@atemporalfilm.com' }
            ]
        }
    },
    {
        type: 'person',
        content: {
            name: 'DIANA SMEU',
            title: 'COO',
            contact: [
                { type: 'tel', value: '+40 770 789 376', href: 'tel:+40770789376' },
                { type: 'email', value: 'diana@atemporalfilm.com', href: 'mailto:diana@atemporalfilm.com' }
            ]
        }
    },
    {
        type: 'email',
        content: {
            contact: [
                { type: 'email', value: 'atemporalfilm@gmail.com', href: 'mailto:atemporalfilm@gmail.com' }
            ]
        }
    },
    {
        type: 'locations',
        title: {
            en: 'Locations',
            ro: 'Locații'
        },
        content: {
            en: [
                'Piatra-Neamt, Progresului 71',
                'Piatra-Neamt, Traian 6',
                'Bucharest, Vasile Lascar 23-25',
                'Romania'
            ],
            ro: [
                'Piatra-Neamț, Progresului 71',
                'Piatra-Neamț, Traian 6',
                'București, Vasile Lascăr 23-25',
                'România'
            ]
        }
    }
];
