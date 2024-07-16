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
            className="inline-block"
        >
            <Image
                src="/assets/logos/logo-youtube.png"
                height="35"
                width="35"
                alt="imdb"
                priority={true}
                draggable={false}
                style={{
                    userSelect: 'none',
                    width: 'auto',
                    height: 'auto',
                    marginTop: '14px',
                }}
            />
        </a>
    );
}
