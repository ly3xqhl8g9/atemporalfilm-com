import type { Metadata } from 'next';
import type { Viewport } from 'next';

import {
    League_Spartan,
    EB_Garamond,
    JetBrains_Mono,
    Caveat,
} from 'next/font/google';

import './globals.css';

import AppWrapper from '@/containers/AppWrapper';
import { INTRO_BOOT } from '@/containers/LandingHero/intro';



const font = League_Spartan({
    subsets: ['latin'],
    weight: ['300', '400'],
});

const fontSerif = EB_Garamond({
    subsets: ['latin'],
    weight: ['400', '500'],
    style: ['normal', 'italic'],
    variable: '--font-serif',
    display: 'swap',
});

const fontMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono',
    display: 'swap',
});

const fontHand = Caveat({
    subsets: ['latin'],
    weight: ['500', '600'],
    variable: '--font-hand',
    display: 'swap',
});

export const metadata: Metadata = {
    applicationName: 'atemporalfilm.com',
    title: 'Atemporal Film',
    description: 'post-production sound, editing services, and field recording services',
    keywords: 'post-production sound, editing services, field recording services',
    category: 'Business',
    creator: 'atemporalfilm.com',
    publisher: 'atemporalfilm.com',
    classification: 'Business',
    robots: 'index, follow',
    referrer: 'origin',
    metadataBase: new URL('https://atemporalfilm.com'),
    alternates: {
        canonical: 'https://atemporalfilm.com',
    },
    openGraph: {
        type: 'website',
        url: 'https://atemporalfilm.com',
        title: 'atemporalfilm.com',
        description: 'post-production sound, editing services, and field recording services',
        siteName: 'atemporalfilm.com',
        images: [
            {
                url: 'https://atemporalfilm.com/og.png',
            },
        ],
    },
    other: {
        'msapplication-TileColor': '#000000',
    },
};

export const viewport: Viewport = {
    themeColor: '#000000',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* /?intro: ascunde pagina înaintea primului cadru (intro „masa luminată”) */}
                <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
            </head>
            <body className={`${font.className} ${fontSerif.variable} ${fontMono.variable} ${fontHand.variable} max-w-[2560px] min-h-screen mx-auto`}>
                <AppWrapper>
                    {children}
                </AppWrapper>
            </body>
        </html>
    );
}
