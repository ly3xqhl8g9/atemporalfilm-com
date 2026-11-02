'use client';

import React, {
    useState,
} from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import {
    AppContext,
    LanguageContext,
} from '@/app/context';

import Menu from '@/containers/Menu/Menu';
import MenuText from '@/containers/Menu/MenuText';
import LanguageSwitch from '@/components/LanguageSwitch';
import MenuContact from '@/containers/Contact/MenuContact';


// Modul Regie — unealta de design din previzualizarea locală.
// Se încarcă DOAR în development; nu ajunge pe site-ul public.
const Regie = process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/Regie'), { ssr: false })
    : null;



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

    // Pe homepage (`/`) ascundem meniul/limba din AppWrapper —
    // homepage-ul are propriul header (în <LandingHero />).
    const pathname = usePathname();
    const isHome = pathname === '/' || pathname === '/people';   // /people folosește același layout (02.11)


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
                {!isHome && (
                    <>
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
                    </>
                )}

                {children}

                {contactMenu && (
                    <div
                        className="animate-slideinright w-40 h-full fixed top-0 right-0 bottom-o z-50"
                        style={{
                            transform: 'translate3d(200%, 0, 0)',
                        }}
                    >
                        <MenuContact />
                    </div>
                )}

                {Regie && <Regie />}
            </LanguageContext.Provider>
        </AppContext.Provider>
    );
}
