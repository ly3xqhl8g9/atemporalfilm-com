'use client';

import Link from 'next/link';
import Image from 'next/image';

import ProjectDisclaimer from '@/components/ProjectDisclaimer';



export default function Footer() {
    return (
        <div
            className="flex flex-row items-center justify-between bg-black z-50 p-4 px-8 max-w-[1800px] mx-auto"
        >
            <ul
                className="flex justify-center items-center gap-12 select-none"
            >
                <li>
                    <a
                        href="https://www.instagram.com/atemporalfilm"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <Image
                            src="/assets/logos/logo-instagram.png"
                            alt="Instagram"
                            width={25}
                            height={25}
                        />
                    </a>
                </li>

                <li>
                    <a
                        href="https://www.facebook.com/AtemporalFilms"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <Image
                            src="/assets/logos/logo-facebook.png"
                            alt="Facebook"
                            width={25}
                            height={25}
                        />
                    </a>
                </li>

                <li>
                    <a
                        href="https://www.linkedin.com/company/atemporal-film"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <Image
                            src="/assets/logos/logo-linkedin.png"
                            alt="Linkedin"
                            width={25}
                            height={25}
                        />
                    </a>
                </li>

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
