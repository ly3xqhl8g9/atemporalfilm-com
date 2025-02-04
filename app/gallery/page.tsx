'use client';

import {
    useContext,
} from 'react';

import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

import Image from 'next/image';

import {
    LanguageContext,
} from '@/app/context';

import {
    galleryImages,
} from '@/data/constants';



export default function GalleryPage() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <div>
            <Carousel
                dynamicHeight={true}
                emulateTouch={true}
                useKeyboardArrows={true}
                infiniteLoop={true}
                showStatus={false}
                showThumbs={false}
            >
                {galleryImages.map((image, index) => (
                    <div
                        key={index}
                        className="h-screen"
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill={true}
                            priority={true}
                            className="object-contain pointer-events-none select-none"
                            draggable={false}
                        />
                    </div>
                )) as any}
            </Carousel>
        </div>
    );
}
