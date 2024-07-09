'use client';

import {
    useState,
    useContext,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
    LanguageContext,
} from '@/app/context';



const menuLinks = [
    {
        nameEn: 'home',
        nameRo: 'acasă',
        href: '/',
    },
    {
        nameEn: 'features',
        nameRo: 'lungmetraje',
        href: '/features',
    },
    {
        nameEn: 'shorts',
        nameRo: 'scurtmetraje',
        href: '/shorts',
    },
    {
        nameEn: 'commercial',
        nameRo: 'reclame',
        href: '/commercial',
    },
    {
        nameEn: 'about',
        nameRo: 'despre',
        href: '/about',
    },
    {
        nameEn: 'contact',
        nameRo: 'contact',
        href: '/contact',
    },
    {
        nameEn: 'project',
        nameRo: 'proiect',
        href: '/project',
    },
];


export default function Menu() {
    const {
        language,
    } = useContext(LanguageContext);

    const [
        showMenu,
        setShowMenu,
    ] = useState(false);

    const toggleIcon = (
        <Image
            src="/assets/logos/logo-wb.png"
            height="50"
            width="50"
            alt="menu"
            priority={true}
            draggable={false}
            onClick={() => {
                setShowMenu(show => !show);
            }}
            style={{
                userSelect: 'none',
            }}
        />
    );

    if (!showMenu) {
        return (
            <div
                className="fixed top-8 left-8 cursor-pointer z-50"
            >
                {toggleIcon}
            </div>
        );
    }

    return (
        <div
            className="fixed top-0 left-0 bottom-0 min-w-[300px] bg-black z-50"
        >
            <button
                className="ml-8 mt-8"
            >
                {toggleIcon}
            </button>

            <ul>
                {menuLinks.map(item => {
                    return (
                        <div
                            key={item.href}
                            className="text-4xl m-8"
                        >
                            <Link
                                href={item.href}
                                onClick={() => {
                                    setShowMenu(false);
                                }}
                                style={{
                                    color: window.location.pathname === item.href ? '#586d70' : 'white',
                                }}
                            >
                                {language === 'en' ? item.nameEn : item.nameRo}
                            </Link>
                        </div>
                    );
                })}
            </ul>
        </div>
    );
}
