'use client';

import {
    useState,
} from 'react';



export default function LanguageSwitch() {
    const [
        language,
        setLanguage,
    ] = useState<'en' | 'ro'>('en');

    return (
        <div
            className="absolute top-9 right-5 z-50"
        >
            {language === 'en' ? (
                <button
                    onClick={() => setLanguage('ro')}
                >
                    romanian
                </button>
            ) : (
                <button
                    onClick={() => setLanguage('en')}
                >
                    english
                </button>
            )}
        </div>
    );
}
