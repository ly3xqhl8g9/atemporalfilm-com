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
            className="select-none inline-block focus:outline-none focus:ring-2 focus:ring-white"
            style={{
                marginTop: '14px',
            }}
        >
            <Image
                src="/assets/logos/logo-imdb.png"
                height={large ? "30" : "20"}
                width={large ? "30" : "20"}
                alt="imdb"
                priority={true}
                draggable={false}
                className="select-none p-1"
                style={{
                    width: 'auto',
                    height: 'auto',
                }}
            />
        </a>
    );
}
