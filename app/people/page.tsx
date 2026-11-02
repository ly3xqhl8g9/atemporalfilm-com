import type { Metadata } from 'next';

import LandingHero from '@/containers/LandingHero';



/* PEOPLE (02.11.2026): aceeași pagină ca WORK (homepage-ul) — pelicula, rama,
   lista din stânga, creditul din dreapta — cu oamenii în locul afișelor. */
export const metadata: Metadata = {
    title: 'People — Atemporal Film',
};

export default function People() {
    return (
        <LandingHero kind="people" />
    );
}
