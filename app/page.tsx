import Link from 'next/link';

import {
    data,
} from '@/data/index';

import ProjectImages from '@/components/ProjectImages';
import EntityDetail from '@/components/EntityDetail';



export default function Home() {
    return (
        <div>
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

            <h1
                className="text-8xl grid place-content-center h-screen"
            >
                atemporal film
            </h1>

            {data.map((item) => {
                return (
                    <EntityDetail
                        key={item.id}
                        data={item}
                    />
                );
            })}
        </div>
    );
}
