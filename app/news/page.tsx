'use client';

import {
    useContext,
} from 'react';

import Image from 'next/image';

import {
    LanguageContext,
} from '@/app/context';

import ContentProject from './components/ContentProject';
import ContentPressRelease from './components/ContentPressRelease';

import ProjectImages from '@/containers/ProjectImages';
import ProjectDisclaimer from '@/containers/ProjectDisclaimer';

import './styles.css';



export default function Project() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <div className="project-text relative min-h-screen w-full">
            <div className="fixed inset-0 w-full h-full z-0">
                <Image
                    src="/assets/news-bg.jpg"
                    alt="News Background"
                    fill={true}
                    priority={true}
                    draggable={false}
                    className="object-cover opacity-50 select-none"
                />
            </div>

            <div className="relative z-10 mx-auto max-w-[700px] px-8 lg:px-2 py-8 pt-48">
                <ProjectImages
                    width="w-auto"
                    withLink={true}
                />

                <div
                    className="my-24"
                >
                    <ContentProject
                        language={language}
                    />
                </div>

                <div
                    className="my-24"
                >
                    <ContentPressRelease
                        language={language}
                    />
                </div>

                <ProjectDisclaimer />
            </div>
        </div>
    );
}
