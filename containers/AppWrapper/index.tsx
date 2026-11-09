'use client';

import React, {
    useEffect,
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

// Foile de stil ținute la zi și în Safari (03.11.2026) — tot doar local.
const DevCssRefresh = process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/DevCssRefresh'), { ssr: false })
    : null;

// Modul vizitator (03.11): `/?vizitator` ascunde butonul REGIE pentru tot
// restul sesiunii din tab (sessionStorage), ca site-ul să se vadă exact ca
// online. `/?regie` îl aduce înapoi. Doar în previzualizarea locală.
const VIZITATOR_KEY = 'atemporal-vizitator';



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
    const isHome = pathname === '/' || pathname === '/people' || pathname === '/about';   // /people (02.11) și /about (03.11) folosesc același layout
    // /telefon (09.11.2026, doar local): Modul Regie pe un ecran de telefon — site-ul
    // e într-un iframe, cu propriul Regie; pagina-mamă nu are meniu și nici Regie
    const isTelefon = pathname === '/telefon';

    const [vizitator, setVizitator] = useState(false);
    useEffect(() => {
        if (!Regie) return;
        try {
            const q = new URLSearchParams(window.location.search);
            if (q.has('vizitator')) window.sessionStorage.setItem(VIZITATOR_KEY, '1');
            if (q.has('regie')) window.sessionStorage.removeItem(VIZITATOR_KEY);
            setVizitator(window.sessionStorage.getItem(VIZITATOR_KEY) === '1');
        } catch {
            // sessionStorage indisponibil — rămâne modul obișnuit
        }
    }, [pathname]);


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
                {!isHome && !isTelefon && (
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

                {Regie && !vizitator && !isTelefon && <Regie />}
                {DevCssRefresh && <DevCssRefresh />}
            </LanguageContext.Provider>
        </AppContext.Provider>
    );
}
