'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';



export default function LanguageSwitch() {
    const {
        language,
        setLanguage,
    } = useContext(LanguageContext);

    return (
        <div
            className="absolute top-9 right-5 z-50"
        >
            <button
                onClick={() => {
                    setLanguage(language === 'en' ? 'ro' : 'en');
                }}
                style={{
                    userSelect: 'none',
                }}
            >
                {language === 'en' ? 'romanian' : 'english'}
            </button>
        </div>
    );
}
