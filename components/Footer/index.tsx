'use client';

import Link from 'next/link';
import Image from 'next/image';

import ProjectDisclaimer from '@/components/ProjectDisclaimer';

import {
    socialLinks,
} from '@/data/constants';



export default function Footer() {
    return (
        <div
            className="flex flex-row items-center justify-between bg-black z-50 p-4 px-8 max-w-[1800px] mx-auto"
        >
            <ul
                className="flex justify-center items-center gap-12 select-none"
            >
                {socialLinks.map((social) => (
                    <li
                        key={social.alt}
                        className="focus:outline-none"
                    >
                        <a
                            href={social.href}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3 focus:outline-none"
                        >
                            <Image
                                src={social.icon}
                                alt={social.alt}
                                width={25}
                                height={25}
                            />
                        </a>
                    </li>
                ))}

                <li>
                    <Link
                        href="/chat"
                    >
                        chat
                    </Link>
                </li>

                <li>
                    <Link
                        href="/converter"
                    >
                        converter
                    </Link>
                </li>
            </ul>

            <div
                className="text-sm text-right lg:max-w-[800px] z-50 flex flex-row items-center gap-4"
            >
                <ProjectDisclaimer />
            </div>
        </div>
    );
}
