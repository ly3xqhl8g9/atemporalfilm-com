import Image from 'next/image';

import {
    data,
} from '@/data/index';

import Menu from '@/components/Menu';



const projectImages = [
    'logo-proiect-1.png',
    'logo-proiect-2.png',
    'logo-proiect-3.png',
    'logo-proiect-4.png',
];


export default function Home() {
    return (
        <div
            className="grid place-content-center h-screen"
        >
            <div
                className="absolute top-5 left-[50%] text-center"
                style={{
                    transform: "translateX(-50%)"
                }}
            >
                <div>
                    Titlul Proiectului: Dezvoltarea resurselor digitale ale societatii SC Atemporal Film SRL
                </div>

                <div>
                    Pentru informații detaliate despre celelalte programe cofinanțate de Uniunea Europeană, vă invităm să vizitați&nbsp;
                    <a
                        href="https://www.mfe.gov.ro"
                        target="_blank"
                    >
                        www.mfe.gov.ro
                    </a>
                </div>
                <div
                    className="flex gap-4 place-content-center m-4 bg-white p-4"
                >
                    {projectImages.map(projectImage => (
                        <Image
                            key={projectImage}
                            src={`/assets/logos/${projectImage}`}
                            style={{
                                width: 'auto',
                                height: '50px',
                            }}
                            width={100}
                            height={50}
                            alt={projectImage}
                        />
                    ))}
                </div>
            </div>


            <div
                className="absolute top-5 right-5"
            >
                english
            </div>


            <Menu />


            <h1
                className="text-4xl"
            >
                atemporal film
            </h1>

            {data.map((item) => {
                const {
                    id,
                    year,
                    title,
                    type,
                } = item;

                return (
                    <div
                        key={id}
                        className="min-h-[300px] flex place-content-center"
                    >
                        {type} {year} {title}
                    </div>
                );
            })}
        </div>
    );
}
