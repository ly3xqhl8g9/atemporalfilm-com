'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import Image from 'next/image';

import './styles.css';

import Content from './components/Content';



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

            <div className="relative z-10 mx-auto max-w-[700px] px-8 lg:px-2 py-8 lg:pt-24">
                <Content
                    language={language}
                />
            </div>
        </div>
    );
}
