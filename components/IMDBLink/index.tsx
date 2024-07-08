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
            className="ml-4"
        >
            <Image
                src="/assets/logos/logo-imdb.png"
                height="50"
                width="50"
                alt="imdb"
                priority={true}
                style={{
                    userSelect: 'none',
                    display: 'inline-block',
                    width: 'auto',
                    height: 'auto',
                }}
            />
        </a>
    );
}
