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
    width: string,
}) {
    return (
        <div
            className={
                `${width ? width : 'w-screen'} lg:w-auto lg:min-w-[600px] flex gap-2 lg:gap-4 items-center justify-center my-4 p-2 lg:p-4 bg-white shadow-2xl`
            }
        >
            {projectImages.map(projectImage => (
                <Image
                    key={projectImage}
                    src={`/assets/logos/${projectImage}`}
                    alt={projectImage}
                    className="h-[20px] lg:h-[50px]"
                    style={{
                        width: 'auto',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                    width={50}
                    height={50}
                    priority={true}
                    unoptimized={true}
                />
            ))}
        </div>
    );
}
