import type { Metadata } from 'next';

import LandingHero from '@/containers/LandingHero';



/* ABOUT (03.11.2026): aceeași pagină ca WORK și PEOPLE — pelicula, rama,
   lampa — cu pozele de pe platou în locul afișelor și textul paginii sub
   meniu. Pagina veche (text + Person) rămâne în istoricul Git și în
   app/about/components/. */
export const metadata: Metadata = {
    title: 'About — Atemporal Film',
};

export default function About() {
    return (
        <LandingHero kind="about" />
    );
}
