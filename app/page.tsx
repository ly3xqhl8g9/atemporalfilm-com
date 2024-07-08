import Link from 'next/link';
import Image from 'next/image';

// import {
//     data,
// } from '@/data/index';

import ProjectImages from '@/components/ProjectImages';
import ProjectDisclaimer from '@/components/ProjectDisclaimer';
// import EntityDetail from '@/components/EntityDetail';



export default function Home() {
    return (
        <div>
            <div
                className="absolute top-4 left-[50%] text-center z-50"
                style={{
                    transform: "translateX(-50%)"
                }}
            >
                <Link
                    href="/project"
                >
                    <ProjectImages />
                </Link>
            </div>

            {/* <h1
                className="text-8xl grid place-content-center h-screen"
            >
                atemporal film
            </h1> */}

            <div
                className="relative h-screen z-0"
            >
                <h1
                    className="text-8xl absolute bottom-[20%] left-[5%] z-50"
                >
                    Where Elephants Go
                </h1>

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

            {/* {data.map((item) => {
                return (
                    <EntityDetail
                        key={item.id}
                        data={item}
                    />
                );
            })} */}
        </div>
    );
}
