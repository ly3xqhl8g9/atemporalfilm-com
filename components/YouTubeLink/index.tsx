'use client';

import Image from 'next/image';



export default function YouTubeLink({
    href,
} : {
    href: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            draggable={false}
            className="inline-block focus:outline-none focus:ring-2 focus:ring-white"
            style={{
                marginTop: '14px',
            }}
        >
            <Image
                src="/assets/logos/logo-youtube.png"
                height="35"
                width="35"
                alt="imdb"
                priority={true}
                draggable={false}
                className="p-1"
                style={{
                    userSelect: 'none',
                    width: 'auto',
                    height: 'auto',
                }}
            />
        </a>
    );
}
