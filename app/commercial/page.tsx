'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import PageDetail from '@/components/PageDetail';
import EntityLoop from '@/components/EntityLoop';



export default function Commercial() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <PageDetail
            name={language === 'en' ? 'commercial' : 'reclame'}
        >
            <EntityLoop
                type="commercial"
            />
        </PageDetail>
    );
}
