'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';



export default function LanguageSwitch({
    absolute,
}: {
    absolute?: boolean;
}) {
    const {
        language,
        setLanguage,
    } = useContext(LanguageContext);

    return (
        <div
            className={`select-none flex items-center top-4 lg:top-9 right-8 z-50 ${absolute ? 'absolute' : ''}`}
        >
            <button
                onClick={() => {
                    setLanguage(language === 'en' ? 'ro' : 'en');
                }}
                className="select-none w-[50px] h-[50px] flex items-center justify-center p-2 rounded-full"
            >
                {language === 'en' ? 'RO' : 'EN'}
            </button>
        </div>
    );
}
