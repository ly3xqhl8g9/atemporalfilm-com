import { createContext } from 'react';

import {
    Language,
} from '@/data/index';



export interface ILanguageContext {
    language: Language;
    setLanguage: (language: Language) => void;
}

export interface IAppContext {
    contactMenu: boolean;
    setContactMenu: (contactMenu: boolean) => void;
}


export const LanguageContext = createContext<ILanguageContext>({
    language: 'en',
    setLanguage: (language) => {},
});

export const AppContext = createContext<IAppContext>({
    contactMenu: false,
    setContactMenu: (contactMenu) => {},
});
