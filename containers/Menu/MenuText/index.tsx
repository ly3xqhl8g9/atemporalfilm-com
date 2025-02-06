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
    useRouter,
} from 'next/navigation';

import {
    AppContext,
    LanguageContext,
} from '@/app/context';

import {
    menuLinks,
} from '@/data/constants';

import LanguageSwitch from '@/components/LanguageSwitch';
import ProjectImages from '@/containers/ProjectImages';



export default function Menu() {
    const pathname = usePathname();
    const router = useRouter();

    const {
        language,
    } = useContext(LanguageContext);

    const {
        contactMenu,
        setContactMenu,
    } = useContext(AppContext);

    const [
        clicked,
        setClicked,
    ] = useState(false);


    useEffect(() => {
        if (clicked) {
            setTimeout(() => {
                setClicked(false);
            }, 700);
        }
    }, [
        clicked,
    ]);


    return (
        <>
            <div
                className="flex flex-row justify-between items-center select-none absolute top-0 left-0 right-0 z-50 px-8 mt-6"
            >
                <button
                    className={`${clicked ? 'animate-fade-in-out' : ''}`}
                    onClick={() => {
                        setClicked(true);

                        if (pathname === '/') {
                            setTimeout(() => {
                                location.reload();
                            }, 700);
                        } else {
                            router.push('/');
                        }
                    }}
                >
                    <Image
                        src="/assets/logos/logo-atemporal.png"
                        alt="menu"
                        height="60"
                        width="200"
                        priority={true}
                        draggable={false}
                        onClick={() => {
                        }}
                        tabIndex={-1}
                        className="select-none p-2 focus:outline-none select-none pointer-events-none"
                    />
                </button>

                <div
                    className="flex flex-row gap-14 items-center"
                >
                    <ul
                        className="flex flex-row gap-8"
                    >
                        {menuLinks.map(menuLink => {
                            if (menuLink.href === '/') {
                                return;
                            }

                            return (
                                <div
                                    key={menuLink.href}
                                    className="text-xl"
                                >
                                    <Link
                                        href={menuLink.href === '/contact' ? '#' : menuLink.href}
                                        style={{
                                            color: pathname === menuLink.href ? '#ffffff' : '#f0f0f0',
                                            textShadow: '0px 1px 1px #292929',
                                        }}
                                        onClick={(event) => {
                                            if (menuLink.href === '/contact') {
                                                event.preventDefault();
                                                setContactMenu(!contactMenu);
                                            }
                                        }}
                                        draggable={false}
                                        className="select-none focus:outline-none px-2 -mx-2 font-light"
                                    >
                                        {menuLink.name[language]}
                                    </Link>
                                </div>
                            );
                        })}
                    </ul>

                    <div
                        className="text-lg"
                    >
                        <LanguageSwitch
                            absolute={false}
                        />
                    </div>
                </div>
            </div>

            {pathname !== '/news' && (
                <div
                    className="absolute top-[70px] w-[550px] right-0 z-50"
                    style={{
                        transform: 'scale(0.7)',
                    }}
                >
                    <ProjectImages
                        width="300px"
                    />
                </div>
            )}
        </>
    );
}
