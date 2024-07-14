'use client';

import Image from 'next/image';



const projectImages = [
    'logo-proiect-1.png',
    'logo-proiect-2.png',
    'logo-proiect-3.png',
    'logo-proiect-4.png',
];


export default function ProjectImages({
    width,
} : {
    width?: string,
}) {
    return (
        <div
            className={
                `${width ? width : 'w-screen'} lg:w-auto lg:min-w-[700px] flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-center my-2 mb-4 p-2 lg:p-3 bg-white bg-opacity-40 lg:bg-opacity-100 shadow-2xl lg:rounded-full`
            }
        >
            {projectImages.map((projectImage, idx) => (
                <Image
                    key={projectImage}
                    src={`/assets/logos/${projectImage}`}
                    alt={projectImage}
                    width={50}
                    height={50}
                    priority={true}
                    unoptimized={true}
                    draggable={false}
                    className={
                        `${idx === 0 ? 'h-[47px]' : 'h-[67px]'} w-auto select-none pointer-events-none`
                    }
                />
            ))}
        </div>
    );
}
