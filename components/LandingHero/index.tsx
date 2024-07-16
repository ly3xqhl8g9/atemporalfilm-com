'use client';

import Image from 'next/image';

import ProjectDisclaimer from '@/components/ProjectDisclaimer';
import IMDBLink from '@/components/IMDBLink';



export default function LandingHero() {
    return (
        <div
            className="flex flex-col justify-end items-start relative h-dvh z-0"
        >
            <div
                className="px-8 py-4 lg:p-0 lg:absolute lg:bottom-[20%] lg:left-[5%] z-50"
            >
                <h1
                    className="text-4xl md:text-6xl lg:text-8xl"
                >
                    Where Elephants Go
                </h1>

                <IMDBLink
                    href="https://www.imdb.com/title/tt25830900"
                    large={true}
                />
            </div>

            <Image
                src="/assets/entities/2024-where-elephants-go-hero-still.jpg"
                alt="Where Elephants Go"
                fill={true}
                priority={true}
                className="object-cover pointer-events-none select-none"
            />

            <div
                className="px-8 py-4 lg:p-0 lg:absolute bottom-5 right-[5%] lg:max-w-[440px] z-50"
            >
                <ProjectDisclaimer />
            </div>
        </div>
    );
}
