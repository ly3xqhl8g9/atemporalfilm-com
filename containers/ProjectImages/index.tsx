'use client';

import Image from 'next/image';
import {
    usePathname,
} from 'next/navigation';



const projectImages = [
    'logo-proiect-1.png',
    'logo-proiect-2.png',
    'logo-proiect-3.png',
    'logo-proiect-4.png',
] as const;

const links = {
    'logo-proiect-1.png': 'https://european-union.europa.eu/index_ro',
    'logo-proiect-2.png': 'https://gov.ro',
    'logo-proiect-3.png': 'https://regionordest.ro',
    'logo-proiect-4.png': 'https://www.adrnordest.ro',
} as const;


export default function ProjectImages({
    width,
    withLink,
} : {
    width?: string,
    withLink?: boolean,
}) {
    const pathname = usePathname();

    if (withLink) {
        return (
            <div
                className={
                    `${width ? width : 'w-screen'} lg:w-auto lg:min-w-[610px] flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-center my-2 mb-4 p-2 lg:p-3 bg-white ${pathname === '/' ? 'bg-opacity-40 lg:bg-opacity-100' : ''} shadow-2xl lg:rounded-full`
                }
                tabIndex={-1}
            >
                {projectImages.map((projectImage, idx) => (
                    <a
                        key={projectImage}
                        tabIndex={-1}
                        href={links[projectImage]}
                        target="_blank"
                    >
                        <Image
                            src={`/assets/logos/${projectImage}`}
                            alt={projectImage}
                            width={50}
                            height={50}
                            priority={true}
                            unoptimized={true}
                            draggable={false}
                            className={
                                `${idx === 0 ? 'h-[47px]' : 'h-[67px]'} w-auto select-none pointer-events-none`
                            }
                            tabIndex={-1}
                        />
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div
            className={
                `${width ? width : 'w-screen'} md:w-auto md:min-w-[610px] flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center my-2 mb-4 p-2 md:p-3 bg-white ${pathname === '/' ? 'bg-opacity-40 md:bg-opacity-100' : ''} shadow-2xl md:rounded-full`
            }
            tabIndex={-1}
        >
            {projectImages.map((projectImage, idx) => (
                <Image
                    key={projectImage}
                    src={`/assets/logos/${projectImage}`}
                    alt={projectImage}
                    width={50}
                    height={50}
                    priority={true}
                    unoptimized={true}
                    draggable={false}
                    className={
                        `${idx === 0 ? 'h-[47px]' : 'h-[67px]'} w-auto select-none pointer-events-none`
                    }
                    tabIndex={-1}
                />
            ))}
        </div>
    );
}
