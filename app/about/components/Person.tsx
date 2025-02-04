'use client';

import {
    Language,
} from '@/data/index';

import {
    Person as IPerson,
} from '@/data/constants';



export default function Person({
    language,
    data,
} : {
    language: Language,
    data: IPerson,
}) {
    return (
        <div
            className="text-center flex flex-col items-center gap-2"
        >
            <div>
                {data.name}
            </div>

            <div>
                {data.role[language]}
            </div>
        </div>
    );
}
