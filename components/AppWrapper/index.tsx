'use client';

import React, {
    useState,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import Menu from '@/components/Menu';
import LanguageSwitch from '@/components/LanguageSwitch';



export default function AppWrapper({
    children,
} : {
    children: React.ReactNode;
}) {
    const [
        language,
        setLanguage,
    ] = useState<'en' | 'ro'>('ro');

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
            }}
        >
            <div
                className="max-w-[1600px] relative mx-auto"
            >
                <Menu />
                <LanguageSwitch />
            </div>

            {children}
        </LanguageContext.Provider>
    );
}
