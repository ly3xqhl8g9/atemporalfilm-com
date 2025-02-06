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

import Socials from '@/containers/Socials';



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
                {menuLinks.map(menuLink => {
                    return (
                        <div
                            key={menuLink.href}
                            className="text-2xl md:text-4xl mx-10 my-6"
                        >
                            <Link
                                href={menuLink.href}
                                style={{
                                    color: window.location.pathname === menuLink.href ? '#586d70' : 'white',
                                    userSelect: 'none',
                                }}
                                draggable={false}
                                className="focus:outline-none px-2 -mx-2"
                            >
                                {menuLink.name[language]}
                            </Link>
                        </div>
                    );
                })}
            </ul>

            <Socials
                hoverable={false}
            />
        </div>
    );
}
