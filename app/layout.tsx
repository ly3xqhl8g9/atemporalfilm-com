import type { Metadata } from 'next';
import type { Viewport } from 'next';

import { League_Spartan } from 'next/font/google';

import './globals.css';

import AppWrapper from '@/components/AppWrapper';



const font = League_Spartan({
    subsets: ['latin'],
    weight: ['300', '400'],
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
    icons: {
        other: [
            {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#000000',
            },
        ],
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
        <html lang="en">
            <body className={`${font.className} max-w-[2560px] min-h-screen mx-auto`}>
                <AppWrapper>
                    {children}
                </AppWrapper>
            </body>
        </html>
    );
}
