'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import Person from './components/Person';

import {
    persons,
} from '@/data/constants';

import {
    languageData,
} from '@/data/language';



export default function About() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <div
            className="max-w-[1800px] pt-48 pb-24 md:pt-0 md:pb-0 mx-auto min-h-screen flex flex-col items-center justify-center gap-8 select-none"
        >
            <div
                className="w-full h-[300px] flex flex-col gap-8 justify-center place-items-center"
            >
                <div
                    className="text-xl"
                >
                    <p
                        className="max-w-[300px] md:max-w-none mx-auto mb-8 text-center"
                    >
                        {languageData.aboutPage.line1[language]}
                    </p>

                    <p
                        className="max-w-[300px] md:max-w-none mx-auto mb-8 text-center"
                    >
                        {languageData.aboutPage.line2[language]}
                    </p>
                </div>
            </div>

            <div
                className="grid grid-cols-1 sm:grid-cols-5 gap-8 mb-12"
            >
                {persons.map((person, index) => (
                    <Person
                        key={index + person.name}
                        data={person}
                        language={language}
                    />
                ))}
            </div>
        </div>
    );
}
