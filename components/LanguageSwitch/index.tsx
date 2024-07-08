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
