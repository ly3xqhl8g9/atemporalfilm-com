import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Telefon from '@/components/Regie/Telefon';



/* /telefon — Modul Regie pe un ecran de telefon (09.11.2026). DOAR în
   previzualizarea locală (localhost:3000/telefon); pe site-ul public nu există. */

export const metadata: Metadata = {
    title: 'REGIE · telefon',
    robots: { index: false, follow: false },
};

export default function TelefonPage() {
    if (process.env.NODE_ENV !== 'development') notFound();
    return <Telefon />;
}
