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
                    ? 'atemporal film is a features and shorts production company'
                    : 'atemporal film este o companie de producție de lungmetraje și scurtmetraje'
                }
            </p>
        </PageDetail>
    );
}
