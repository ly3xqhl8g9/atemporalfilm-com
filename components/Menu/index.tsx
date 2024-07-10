'use client';

import {
    useContext,
    useState,
    useEffect,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';
import {
    usePathname,
} from 'next/navigation';

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
    const pathname = usePathname();

    const {
        language,
    } = useContext(LanguageContext);

    const [
        showMenu,
        setShowMenu,
    ] = useState(false);


    useEffect(() => {
        setShowMenu(false);
    }, [
        pathname,
    ]);


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
            className="bg-black bg-opacity-30 p-2 rounded-[100px]"
        />
    );

    if (!showMenu) {
        return (
            <div
                className="fixed top-9 left-8 cursor-pointer z-50"
            >
                {toggleIcon}
            </div>
        );
    }

    return (
        <div
            className="fixed top-0 left-0 bottom-0 right-0 md:right-auto min-w-[300px] bg-black z-50"
        >
            <button
                className="ml-8 mt-9"
            >
                {toggleIcon}
            </button>

            <ul>
                {menuLinks.map(item => {
                    return (
                        <div
                            key={item.href}
                            className="text-2xl md:text-4xl mx-10 my-6"
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
