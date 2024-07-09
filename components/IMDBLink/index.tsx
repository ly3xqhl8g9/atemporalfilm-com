'use client';

import Image from 'next/image';



export default function IMDBLink({
    href,
} : {
    href: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            draggable={false}
        >
            <Image
                src="/assets/logos/logo-imdb.png"
                height="50"
                width="50"
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
