'use client';

import Image from 'next/image';



export default function IMDBLink({
    href,
    large,
} : {
    href: string;
    large?: boolean;
}) {
    return (
        <a
            href={href}
            target="_blank"
            draggable={false}
            className="inline-block focus:outline-none focus:ring-2 focus:ring-white"
        >
            <Image
                src="/assets/logos/logo-imdb.png"
                height={large ? "50" : "40"}
                width={large ? "50" : "40"}
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
