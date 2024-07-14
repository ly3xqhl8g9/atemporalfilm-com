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
                `${width ? width : 'w-screen'} lg:w-auto lg:min-w-[810px] flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-center my-4 p-4 lg:p-4 bg-white bg-opacity-40 lg:bg-opacity-100 shadow-2xl lg:rounded-full`
            }
        >
            {projectImages.map(projectImage => (
                <Image
                    key={projectImage}
                    src={`/assets/logos/${projectImage}`}
                    alt={projectImage}
                    width={50}
                    height={50}
                    priority={true}
                    unoptimized={true}
                    draggable={false}
                    className="h-[67px] w-auto select-none pointer-events-none"
                />
            ))}
        </div>
    );
}
