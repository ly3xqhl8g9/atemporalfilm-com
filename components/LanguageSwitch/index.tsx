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
            className="fixed top-9 right-8 z-50"
        >
            <button
                onClick={() => {
                    setLanguage(language === 'en' ? 'ro' : 'en');
                }}
                className="select-none w-[50px] h-[50px] flex items-center justify-center bg-black bg-opacity-30 p-2 rounded-full"
            >
                {language === 'en' ? 'RO' : 'EN'}
            </button>
        </div>
    );
}
