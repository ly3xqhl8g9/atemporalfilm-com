'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';



export default function ProjectDisclaimer() {
    const {
        language,
    } = useContext(LanguageContext);


    return (
        <>
            <p>
                {language === 'en'
                    ? 'For detailed information on the other programs co-financed by the European Union, please visit'
                    : 'Pentru informații detaliate despre celelalte programe cofinanțate de Uniunea Europeană, vă invităm să vizitați'
                }
                &nbsp;
                <a
                    href="https://mfe.gov.ro"
                    target="_blank"
                    className="underline"
                >
                    mfe.gov.ro
                </a>
            </p>

            <div
                className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-end text-right"
            >
                <div>
                    <a
                        href="https://regionordest.ro"
                        target="_blank"
                        className="underline"
                    >
                        www.regionordest.ro
                    </a>

                    <br />

                    <a
                        href="https://www.facebook.com/RegioNordEst.ro"
                        target="_blank"
                        className="underline"
                    >
                        www.facebook.com/RegioNordEst.ro
                    </a>
                </div>

                <div
                    className="my-4"
                >
                    <div
                        className="select-none text-center font-bold italic"
                        style={{
                            width: '190px',
                            height: '60px',
                            padding: '1rem',
                            borderTopRightRadius: '2rem',
                            borderBottomRightRadius: '2rem',
                            backgroundColor: '#fcc300',
                            color: 'white',
                            fontSize: '1.2rem',
                        }}
                    >
                        Aproape de tine
                    </div>
                </div>
            </div>
        </>
    );
}
