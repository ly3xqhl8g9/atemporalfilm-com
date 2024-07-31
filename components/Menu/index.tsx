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
    {
        nameEn: 'converter',
        nameRo: 'convertor',
        href: '/converter',
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
            alt="menu"
            height="50"
            width="50"
            priority={true}
            draggable={false}
            onClick={() => {
                setShowMenu(show => !show);
            }}
            onKeyDown={event => {
                if (event.key === 'Enter') {
                    setShowMenu(show => !show);
                }
            }}
            tabIndex={1}
            className="select-none bg-black bg-opacity-30 p-2 rounded-[100px] focus:outline-none focus:ring-2 focus:ring-white"
        />
    );

    if (!showMenu) {
        return (
            <div
                className="fixed top-4 lg:top-9 left-8 cursor-pointer z-50"
            >
                {toggleIcon}
            </div>
        );
    }

    return (
        <div
            className="fixed top-0 left-0 bottom-0 right-0 md:right-auto min-w-[400px] bg-black z-50"
        >
            <button
                className="ml-8 mt-4 lg:mt-9"
                tabIndex={-1}
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
                                style={{
                                    color: window.location.pathname === item.href ? '#586d70' : 'white',
                                    userSelect: 'none',
                                }}
                                draggable={false}
                                className="focus:outline-none focus:ring-2 focus:ring-white px-2 -mx-2"
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
