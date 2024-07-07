import Link from 'next/link';

import {
    data,
} from '@/data/index';

import ProjectImages from '@/components/ProjectImages';



export default function Home() {
    return (
        <div
            className="grid place-content-center h-screen"
        >
            <div
                className="absolute top-0 left-[50%] text-center"
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


            <div
                className="absolute top-5 right-5"
            >
                english
            </div>


            <h1
                className="text-4xl"
            >
                atemporal film
            </h1>

            {data.map((item) => {
                const {
                    id,
                    year,
                    title,
                    type,
                } = item;

                return (
                    <div
                        key={id}
                        className="min-h-[300px] flex place-content-center"
                    >
                        {type} {year} {title}
                    </div>
                );
            })}
        </div>
    );
}
