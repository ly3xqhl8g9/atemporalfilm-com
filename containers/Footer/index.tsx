'use client';

import Link from 'next/link';
import Image from 'next/image';

import ProjectDisclaimer from '@/containers/ProjectDisclaimer';

import {
    socialLinks,
} from '@/data/constants';



export default function Footer() {
    return (
        <div
            className="md:flex flex-row items-center justify-between bg-black z-50 p-4 px-8 max-w-[1800px] mx-auto"
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
                                style={{
                                    width: '25px',
                                    height: '25px',
                                    minWidth: '25px',
                                    minHeight: '25px',
                                }}
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
                className="lg:flex lg:max-w-[800px] gap-4 items-center z-50 text-sm text-center md:text-right md:ml-4"
            >
                <ProjectDisclaimer />
            </div>
        </div>
    );
}
