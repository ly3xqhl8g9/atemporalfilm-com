import Image from 'next/image';

import {
    Entity,
} from '@/data/index';



export default function EntityDetail({
    data,
} : {
    data: Entity;
}) {
    const {
        id,
        type,
        year,
        title,
        titleRo,
        director,
        producer,
        coproducer,
        production,
        press,
        festivals,
        images,
        heroImage,
        trailer,
        imdb,
    } = data;

    return (
        <div
            className="flex flex-wrap m-10"
        >
            <div
                className="w-full md:w-1/2 p-4 flex place-content-center"
            >
                <Image
                    src={`/assets/entities/${heroImage}`}
                    alt={title}
                    width={300}
                    height={300}
                />
            </div>

            <div
                className="w-full md:w-1/2 p-4"
            >
                <h1
                    className="text-3xl"
                >
                    {title}
                </h1>

                <h2>
                    {titleRo}
                </h2>

                <h3>
                    {type} {year}
                </h3>

                <p>
                    directed by {director}
                </p>

                <p>
                    produced by {producer}
                </p>

                {coproducer && (
                    <p>
                        coproduced by {coproducer}
                    </p>
                )}

                <p>
                    production {production}
                </p>
            </div>
        </div>
    );
}
