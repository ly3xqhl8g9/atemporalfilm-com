'use client';

import Image from 'next/image';



const socialLinks = [
    {
        href: "https://www.instagram.com/atemporalfilm",
        icon: "/assets/logos/logo-instagram.png",
        alt: "Instagram"
    },
    {
        href: "https://www.facebook.com/AtemporalFilms",
        icon: "/assets/logos/logo-facebook.png",
        alt: "Facebook"
    },
    {
        href: "https://www.linkedin.com/company/atemporal-film",
        icon: "/assets/logos/logo-linkedin.png",
        alt: "Linkedin"
    }
];

const INDEX_OFFSET = 100;


export default function Socials({
    hoveredIndex,
    setHoveredIndex,
} : {
    hoveredIndex?: number | null;
    setHoveredIndex?: (index: number | null) => void;
}) {
    return (
        <ul className="flex justify-center gap-12 focus:outline-none select-none">
            {socialLinks.map((social, index) => (
                <li
                    key={social.alt}
                    className="focus:outline-none select-none"
                >
                    <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 focus:outline-none block select-none"
                        onMouseEnter={() => setHoveredIndex?.(index - INDEX_OFFSET)}
                        onMouseLeave={() => setHoveredIndex?.(null)}
                    >
                        <Image
                            src={social.icon}
                            alt={social.alt}
                            width={25}
                            height={25}
                            className={`transition-opacity duration-300 focus:outline-none select-none ${
                                hoveredIndex !== null && hoveredIndex !== index - INDEX_OFFSET
                                    ? 'opacity-10'
                                    : 'opacity-100'
                            }`}
                            draggable={false}
                            unselectable="on"
                            tabIndex={-1}
                        />
                    </a>
                </li>
            ))}
        </ul>
    );
}
