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
            className="fixed top-9 right-5 z-50 w-[50px] h-[50px] flex place-content-center bg-black bg-opacity-30 p-2 rounded-[100px]"
        >
            <button
                onClick={() => {
                    setLanguage(language === 'en' ? 'ro' : 'en');
                }}
                style={{
                    userSelect: 'none',
                }}
            >
                {language === 'en' ? 'RO' : 'EN'}
            </button>
        </div>
    );
}
