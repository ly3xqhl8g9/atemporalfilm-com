import type { Metadata } from 'next';

import LandingHero from '@/containers/LandingHero';



/* ABOUT (03.11.2026, 12:41): PEOPLE și ABOUT sunt o singură pagină — pe
   peliculă fețele celor trei (Diana, Ștefan, Fram), în stânga descrierea
   omului din ramă, în dreapta descrierea Atemporal Film. Pagina veche
   (text + Person) rămâne în istoricul Git și în app/about/components/. */
export const metadata: Metadata = {
    title: 'About — Atemporal Film',
};

export default function About() {
    return (
        <LandingHero kind="about" />
    );
}
