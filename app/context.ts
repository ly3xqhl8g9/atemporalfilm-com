import { createContext } from 'react';

import {
    Language,
} from '@/data/index';



export interface ILanguageContext {
    language: Language;
    setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<ILanguageContext>({
    language: 'ro',
    setLanguage: (language) => {}
});
