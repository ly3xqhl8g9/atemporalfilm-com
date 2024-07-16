'use client';

import {
    useContext,
} from 'react';

import Image from 'next/image';

import {
    Entity,
} from '@/data/index';

import {
    LanguageContext,
} from '@/app/context';

import IMDBLink from '@/components/IMDBLink';
import YouTubeLink from '@/components/YouTubeLink';



const typeText = {
    en: {
        feature: 'feature',
        short: 'short',
        commercial: 'commercial',
    },
    ro: {
        feature: 'lungmetraj',
        short: 'scurtmetraj',
        commercial: 'reclamă',
    },
} as const;

const kindText = {
    en: {
        documentary: 'documentary',
        animation: 'animation',
    },
    ro: {
        documentary: 'documentar',
        animation: 'animație',
    },
} as const;


export default function EntityDetail({
    data,
} : {
    data: Entity;
}) {
    const {
        language,
    } = useContext(LanguageContext);

    const {
        id,
        type,
        kind,
        year,
        title,
        titleRo,
        director,
        cinematography,
        producer,
        coproducer,
        productionCompany,
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
                className="w-full min-h-[500px] md:w-1/2 p-4 flex place-content-center relative"
            >
                <Image
                    src={`/assets/entities/${heroImage || 'default-hero.png'}`}
                    alt={title}
                    priority={true}
                    fill={true}
                    draggable={false}
                    className="object-contain pointer-events-none select-none"
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

                <h2
                    className="mb-2"
                >
                    {titleRo}
                </h2>

                <h3
                    className="mb-2"
                >
                    {typeText[language][type]} {year} {kind && `(${kindText[language][kind]})`}
                </h3>

                {director && (
                    <p>
                        {language === 'en' ? 'directed by' : 'regizat de'} {director}
                    </p>
                )}

                {cinematography && (
                    <p>
                        {language === 'en' ? 'cinematography by' : 'cinematografie'} {cinematography}
                    </p>
                )}

                {producer && (
                    <p>
                        {language === 'en' ? 'produced by' : 'produs de'} {producer}
                    </p>
                )}

                {coproducer && (
                    <p>
                        {language === 'en' ? 'coproduced by' : 'coprodus de'} {coproducer}
                    </p>
                )}

                {productionCompany && (
                    <p>
                        {language === 'en' ? 'production' : 'producție'} {productionCompany}
                    </p>
                )}

                {press.length > 0 && (
                    <div
                        className="my-4"
                    >
                        <p>
                            {language === 'en' ? 'press' : 'publicitate'}
                        </p>

                        {press.map((item, index) => {
                            const hostname = new URL(item).hostname;

                            return (
                                <div
                                    key={id + 'press' + index}
                                >
                                    <a
                                        href={item}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {hostname}
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}

                {festivals.length > 0 && (
                    <div
                        className="my-4"
                    >
                        <p>
                            {language === 'en' ? 'festivals' : 'festivaluri'}
                        </p>

                        {festivals.map((item, index) => {
                            return (
                                <div
                                    key={id + 'festivals' + index}
                                >
                                    {item}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div
                    className="flex flex-row items-center gap-8"
                >
                    {imdb && (
                        <IMDBLink
                            href={imdb}
                        />
                    )}

                    {trailer && (
                        <YouTubeLink
                            href={trailer}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
