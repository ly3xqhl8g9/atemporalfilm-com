'use client';

import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

import Image from 'next/image';

import {
    galleryImages,
} from '@/data/constants';



export default function GalleryPage() {
    return (
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
                    className="h-dvh"
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
    );
}
