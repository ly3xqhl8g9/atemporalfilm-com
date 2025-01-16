'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import Person from './Person';



const persons = [
    {
        name: 'ȘTEFAN AZAHARIOAIE',
        role: {
            en: 'sound designer, editor',
            ro: 'design sunet, monteur',
        },
        image: '/placeholder.png',
    },
    {
        name: 'DIANA SMEU',
        role: {
            en: 'COO',
            ro: 'COO',
        },
        image: '/placeholder.png',
    },
    {
        name: 'ANDREI SIBIȘAN',
        role: {
            en: 'sound',
            ro: 'sunet',
        },
        image: '/placeholder.png',
    },
    {
        name: 'RĂZVAN ILINCA',
        role: {
            en: 'editor, sound',
            ro: 'editor, sunet',
        },
        image: '/placeholder.png',
    },
];


export default function About() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <div
            className="max-w-[1800px] mx-auto"
        >
            <div
                className="w-full h-[600px] flex flex-row gap-8 justify-between place-items-center"
            >
                <div
                    className="w-1/2 grid place-content-center uppercase text-4xl"
                >
                    {language === 'en' ? 'Piatra Neamt' : 'Piatra Neamț'}
                </div>

                <div
                    className="w-1/2 grid place-content-center uppercase text-4xl"
                >
                    {language === 'en' ? 'Bucuresti' : 'București'}
                </div>
            </div>

            <div
                className="w-full h-[300px] flex flex-col gap-8 justify-center place-items-center"
            >
                <div>
                    {language === 'en' ? 'Our Team' : 'Noi'}
                </div>

                <div>
                    <p
                        className="max-w-[300px] md:max-w-none mx-auto mb-8 text-center"
                    >
                        {language === 'en'
                            ? 'ATEMPORAL FILM is a post-production and production company in Romania.'
                            : 'ATEMPORAL FILM este o companie de post-producție și producție din România.'
                        }
                    </p>

                    <p
                        className="max-w-[300px] md:max-w-none mx-auto mb-8 text-center"
                    >
                        {language === 'en'
                            ? 'We provide post-production sound and editing services and field recording services.'
                            : 'Oferim servicii de post-producție sunet și montaj și servicii de priză directă.'
                        }
                    </p>
                </div>
            </div>

            <div
                className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
            >
                {persons.map((person, index) => (
                    <Person
                        key={index}
                        data={person}
                        language={language}
                    />
                ))}
            </div>
        </div>
    );
}
