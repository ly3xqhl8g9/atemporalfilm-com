'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import PageDetail from '@/components/PageDetail';
import EntityLoop from '@/components/EntityLoop';



export default function Features() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <PageDetail
            name={language === 'en' ? 'features' : 'lungmetraje'}
        >
            <EntityLoop
                type="feature"
            />
        </PageDetail>
    );
}
