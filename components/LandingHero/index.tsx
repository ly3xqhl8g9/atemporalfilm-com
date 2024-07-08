'use client';

import Image from 'next/image';

import ProjectDisclaimer from '@/components/ProjectDisclaimer';
import IMDBLink from '@/components/IMDBLink';



export default function LandingHero() {
    return (
        <div
            className="relative h-screen z-0"
        >
            <div
                className="absolute bottom-[20%] left-[5%] z-50"
            >
                <h1
                    className="text-4xl md:text-6xl lg:text-8xl"
                >
                    Where Elephants Go
                </h1>

                <IMDBLink
                    href="https://www.imdb.com/title/tt25830900"
                />
            </div>

            <Image
                src="/assets/entities/2024-where-elephants-go-hero-still.jpg"
                alt="Where Elephants Go"
                fill={true}
                priority={true}
                style={{
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            />

            <div
                className="absolute bottom-5 right-[5%] max-w-[440px] z-50"
            >
                <ProjectDisclaimer />
            </div>
        </div>
    );
}
