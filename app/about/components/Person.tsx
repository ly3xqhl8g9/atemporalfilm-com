import {
    Language,
} from '@/data/index';

import Image from 'next/image';



export default function Person({
    language,
    data,
} : {
    language: Language,
    data: any,
}) {
    return (
        <div
            className="text-center flex flex-col items-center gap-2"
        >
            <Image
                src={data.image}
                alt={data.name}
                width={200}
                height={200}
            />

            <div>
                {data.name}
            </div>

            <div>
                {data.role[language]}
            </div>
        </div>
    );
}
