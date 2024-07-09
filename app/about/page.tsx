'use client';

import {
    useContext,
} from 'react';

import Link from 'next/link';

import {
    LanguageContext,
} from '@/app/context';

import PageDetail from '@/components/PageDetail';



export default function About() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <PageDetail
            name={language === 'en' ? 'about' : 'despre'}
        >
            <p
                className="text-center mb-8"
            >
                {language === 'en'
                    ? 'ATEMPORAL FILM is a post-production and production company in Romania.'
                    : 'ATEMPORAL FILM este o companie de post-producție și producție din România.'
                }
            </p>

            <p
                className="text-center mb-8"
            >
                {language === 'en'
                    ? 'We provide post-production sound and editing services and field recording services.'
                    : 'Oferim servicii de post-producție sunet și montaj și servicii de priză directă.'
                }
            </p>

            <Link
                href="/contact"
            >
                <button
                    className="block mx-auto mt-14 bg-white text-black py-2 px-4 rounded-full select-none"
                >
                    contact
                </button>
            </Link>
        </PageDetail>
    );
}
