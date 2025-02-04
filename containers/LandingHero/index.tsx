'use client';

import Image from 'next/image';

import Footer from '@/containers/Footer';



export default function LandingHero() {
    return (
        <>
            <div
                className="flex flex-col justify-end items-start relative h-dvh z-0"
            >
                <Image
                    src="/landing.webp"
                    alt="Landing"
                    fill={true}
                    priority={true}
                    className="object-cover pointer-events-none select-none"
                />
            </div>

            <Footer />
        </>
    );
}
