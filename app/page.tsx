import Link from 'next/link';

import ProjectImages from '@/components/ProjectImages';
import LandingHero from '@/components/LandingHero';



export default function Home() {
    return (
        <>
            <div
                className="absolute top-16 lg:top-2 left-[50%] -translate-x-1/2 z-40 text-center"
            >
                <Link
                    href="/project"
                    draggable={false}
                >
                    <ProjectImages />
                </Link>
            </div>

            <LandingHero />
        </>
    );
}
