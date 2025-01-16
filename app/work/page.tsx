'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import PageDetail from '@/components/PageDetail';
import EntityLoop from '@/components/EntityLoop';



export default function Work() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <PageDetail
            name={language === 'en' ? 'work' : 'proiecte'}
            fullWidth={true}
        >
            <EntityLoop
                type="feature"
            />

            <EntityLoop
                type="short"
            />
        </PageDetail>
    );
}
