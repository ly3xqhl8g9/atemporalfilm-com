'use client';

import {
    useContext,
} from 'react';

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
                    ? 'ATEMPORAL FILM is a post-production and production company in Romania. We provide post-production sound and editing services and field recording services.'
                    : 'ATEMPORAL FILM este o companie de post-producție și producție din România. Oferim servicii de post-producție sunet și montaj și servicii de priză directă.'
                }
            </p>
        </PageDetail>
    );
}
