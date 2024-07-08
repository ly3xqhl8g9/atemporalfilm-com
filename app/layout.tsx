'use client';

import {
    useState,
} from 'react';

import type { Metadata } from 'next';
import { Didact_Gothic } from 'next/font/google';
import './globals.css';

import {
    LanguageContext,
} from '@/app/context';

import Menu from '@/components/Menu';
import LanguageSwitch from '@/components/LanguageSwitch';



const inter = Didact_Gothic({
    subsets: ["latin"],
    weight: '400',
});

// export const metadata: Metadata = {
//     title: "atemporal film",
//     description: "features and shorts production company",
// };

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [
        language,
        setLanguage,
    ] = useState<'en' | 'ro'>('ro');


    return (
        <html lang="en">
            <body className={`${inter.className}`}>
                <LanguageContext.Provider
                    value={{
                        language,
                        setLanguage,
                    }}
                >
                    <Menu />
                    <LanguageSwitch />

                    {children}
                </LanguageContext.Provider>
            </body>
        </html>
    );
}
