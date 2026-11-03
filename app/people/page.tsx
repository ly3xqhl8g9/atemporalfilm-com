import { redirect } from 'next/navigation';



/* PEOPLE (03.11.2026, 12:41): s-a unit cu ABOUT — oamenii sunt acum pe /about
   (fețele pe peliculă, descrierea fiecăruia în stânga). Adresa veche duce acolo. */
export default function People() {
    redirect('/about');
}
