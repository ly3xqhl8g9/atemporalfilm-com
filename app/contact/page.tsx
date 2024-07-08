'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import PageDetail from '@/components/PageDetail';



export default function Contact() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <PageDetail
            name="contact"
        >
            <div
                className="text-center mb-8"
            >
                <p>
                    ȘTEFAN AZAHARIOAIE
                </p>

                <p>
                    {language === 'en' ? 'sound designer, editor' : 'design sunet, monteur'}
                </p>

                <p>
                    <a href="tel:+40743343800">+40 743 343 800</a>
                </p>

                <p>
                    <a href="mailto:stefan@atemporalfilm.com">stefan@atemporalfilm.com</a>
                </p>
            </div>

            <div
                className="text-center mb-8"
            >
                <p>
                    DIANA SMEU
                </p>

                <p>
                    COO
                </p>

                <p>
                    <a href="tel:++40770789376">+40 770 789 376</a>
                </p>

                <p>
                    <a href="mailto:stefan@atemporalfilm.com">diana@atemporalfilm.com</a>
                </p>
            </div>

            <div
                className="text-center mb-2"
            >
                Piatra-Neamț, Traian 6
            </div>

            <div
                className="text-center mb-8"
            >
                București, Vasile Lascăr 23-25
            </div>
        </PageDetail>
    );
}
