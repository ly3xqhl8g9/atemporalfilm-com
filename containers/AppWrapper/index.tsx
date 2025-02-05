'use client';

import React, {
    useState,
} from 'react';

import {
    AppContext,
    LanguageContext,
} from '@/app/context';

import Menu from '@/containers/Menu/Menu';
import MenuText from '@/containers/Menu/MenuText';
import LanguageSwitch from '@/components/LanguageSwitch';
import MenuContact from '@/containers/Contact/MenuContact';



export default function AppWrapper({
    children,
} : {
    children: React.ReactNode;
}) {
    const [
        contactMenu,
        setContactMenu,
    ] = useState(false);

    const [
        language,
        setLanguage,
    ] = useState<'en' | 'ro'>('en');


    return (
        <AppContext.Provider
            value={{
                contactMenu,
                setContactMenu,
            }}
        >
            <LanguageContext.Provider
                value={{
                    language,
                    setLanguage,
                }}
            >
                <div
                    className="block md:hidden max-w-[1800px] relative mx-auto"
                >
                    <Menu />

                    <div
                        className="fixed z-50 top-[30px] right-[30px]"
                    >
                        <LanguageSwitch />
                    </div>
                </div>

                <div
                    className="hidden md:block max-w-[1800px] relative mx-auto"
                >
                    <MenuText />
                </div>

                {children}

                {contactMenu && (
                    <div
                        className="animate-slideinright w-40 h-full absolute top-0 right-0 z-50"
                        style={{
                            transform: 'translate3d(200%, 0, 0)',
                        }}
                    >
                        <MenuContact />
                    </div>
                )}
            </LanguageContext.Provider>
        </AppContext.Provider>
    );
}
