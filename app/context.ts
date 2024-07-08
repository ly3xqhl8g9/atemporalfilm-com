import { createContext } from 'react';



export const LanguageContext = createContext({
    language: 'ro',
    setLanguage: (language: 'en' | 'ro') => {}
});
