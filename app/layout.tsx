import type { Metadata } from "next";
import { Didact_Gothic } from "next/font/google";
import "./globals.css";



const inter = Didact_Gothic({
    subsets: ["latin"],
    weight: '400',
});

export const metadata: Metadata = {
    title: "atemporal film",
    description: "features and shorts production company",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
