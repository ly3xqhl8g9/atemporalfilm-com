'use client';

import {
    useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';


const items = [
    'home',
    'features',
    'shorts',
    'commercial',
    'about',
    'contact',
    'project',
];


export default function Menu() {
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
            onClick={() => {
                setShowMenu(show => !show);
            }}
        />
    );

    if (!showMenu) {
        return (
            <div
                className="fixed top-8 left-8 cursor-pointer"
            >
                {toggleIcon}
            </div>
        );
    }

    return (
        <div
            className="fixed top-0 left-0 bottom-0 min-w-[300px] bg-black"
        >
            <button
                className="ml-8 mt-8"
            >
                {toggleIcon}
            </button>

            <ul>
                {items.map(item => {
                    return (
                        <div
                            key={item}
                            className="text-4xl m-8"
                        >
                            <Link
                                href={item === 'home' ? '/' : '/' + item}
                            >
                                {item}
                            </Link>
                        </div>
                    );
                })}
            </ul>
        </div>
    );
}
