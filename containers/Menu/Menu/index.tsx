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

import {
    menuLinks,
} from '@/data/constants';



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
            src="/assets/logos/logo-atemporal.png"
            alt="menu"
            height="60"
            width="200"
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
            className="select-none p-2 focus:outline-none"
        />
    );

    if (!showMenu) {
        return (
            <div
                className="select-none fixed top-4 lg:top-9 left-8 cursor-pointer z-50"
            >
                {toggleIcon}
            </div>
        );
    }

    return (
        <div
            className="select-none fixed top-0 left-0 bottom-0 right-0 md:right-auto min-w-[400px] bg-black z-50"
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


            <ul
                className="flex justify-center gap-12 mt-12"
            >
                <li>
                    <a
                        href="https://www.instagram.com/atemporalfilm"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        ig
                    </a>
                </li>

                <li>
                    <a
                        href="https://www.linkedin.com/company/atemporal-film"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        in
                    </a>
                </li>
            </ul>
        </div>
    );
}
