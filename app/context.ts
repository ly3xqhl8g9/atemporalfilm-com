import { createContext } from 'react';



export const LanguageContext = createContext({
    language: 'en',
    setLanguage: (language: 'en' | 'ro') => {}
});
