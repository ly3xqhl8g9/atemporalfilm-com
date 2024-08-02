'use client';

import {
    useContext,
} from 'react';

import {
    LanguageContext,
} from '@/app/context';

import './styles.css';

import ProjectImages from '@/components/ProjectImages';
import ProjectDisclaimer from '@/components/ProjectDisclaimer';



export default function Project() {
    const {
        language,
    } = useContext(LanguageContext);

    return (
        <div
            className="mb-8 mt-8 lg:mt-0 p-8 lg:p-2 m-auto max-w-[700px] project-text"
        >
            <ProjectImages
                width="w-auto"
                withLink={true}
            />

            <h1>
                {language === 'en' ? 'Project title' : 'Titlul proiectului'}
            </h1>
            <h2>
                {language === 'en'
                    ? 'DEVELOPMENT OF THE DIGITAL RESOURCES OF THE SOCIETY SC ATEMPORAL FILM SRL'
                    : 'DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL'
                }
            </h2>
            <h2>
                COD SMIS 312248
            </h2>

            <h1>
                {language === 'en' ? 'Project description' : 'Descrierea proiectului'}
            </h1>
            <h2>
                {language === 'en'
                    ? 'ATEMPORAL FILM S.R.L. implements the project entitled DEVELOPMENT OF THE DIGITAL RESOURCES OF THE SOCIETY SC ATEMPORAL FILM S.R.L.'
                    : 'ATEMPORAL FILM S.R.L. implementează proiectul cu titlul DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM S.R.L.'
                }
            </h2>

            <p>
                {language === 'en'
                    ? 'The general objective of the project is the digitization of the resources of the company S.C. ATEMPORAL FILM S.R.L. to streamline and digitize a series of processes of our company. These processes are: Data storage (audio recordings), Radio frequency transmission, Cloud computing. Based on the investment, we will acquire modern, state-of-the-art equipment that will allow our employees to perform these processes at a performant and competitive level. To promote the investment and to attract new customers and markets, we will develop and launch a web platform for the promotion of the company\'s activity and portfolio.'
                    : 'Obiectivul general al proiectului este digitalizarea resurselor societății S.C. ATEMPORAL FILM S.R.L. pentru a eficientiza și digitaliza o serie de procese ale companiei noastre. Aceste procese sunt: Stocarea de date (înregistrări audio), Transmisiei în radiofrecvență, Cloud computing. Pe baza investiției, vom achiziționa echipamente moderne, de ultimă generație, care vor permite angajaților noștri efectuarea acestor procese la un nivel performant și competitiv. Pentru a promova investiția și pentru a atrage clienți și piețe noi, vom dezvolta și lansa o platformă web pentru promovarea activității și portofoliului companiei.'
                }
            </p>

            <h3>
                {language === 'en' ? 'Specific objectives of the project:' : 'Obiective specifice ale proiectului:'}
            </h3>

            <ul>
                <li>
                    {language === 'en'
                        ? 'Acquisition of 10 TIC hardware units and other devices and equipment for the digitization of some company processes (such as storage, radio frequency transmission) and for facilitating teleworking'
                        : 'Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii'
                    }
                </li>

                <li>
                    {language === 'en'
                        ? 'Development and launch of a company presentation website, with complex functions'
                        : 'Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe'
                    }
                </li>

                <li>
                    {language === 'en'
                        ? 'Creating three accounts on social media networks (Facebook, Instagram and LinkedIn) for promoting the company\'s activity and portfolio'
                        : 'Crearea a trei conturi pe rețele de social media (Facebook, Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei'
                    }
                </li>
            </ul>


            <h3>
                {language === 'en' ? 'Expected results' : 'Rezultate așteptate'}
            </h3>

            <ul>
                <li>
                    {language === 'en'
                        ? 'Acquisition of 10 TIC hardware units and other devices and equipment for the digitization of some company processes (such as storage, radio frequency transmission) and for facilitating teleworking'
                        : 'Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii'
                    }
                </li>

                <li>
                    {language === 'en'
                        ? 'Development and launch of a company presentation website, with complex functions'
                        : 'Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe'
                    }
                </li>

                <li>
                    {language === 'en'
                        ? 'Creating three accounts on social media networks (Facebook, Instagram and LinkedIn) for promoting the company\'s activity and portfolio'
                        : 'Crearea a trei conturi pe rețele de social media (Facebook, Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei'
                    }
                </li>
            </ul>

            <p>
                {language === 'en'
                    ? 'The total value of the project is 436,324.73 lei, of which 392,691.78 lei represents non-reimbursable funding (equivalent to 90% of the total eligible value approved), of which 333,788.01 lei represents the eligible non-reimbursable value from the funds (FEDR/FSE+/FC/FTJ) and 58,903.77 lei represents the eligible non-reimbursable value from the national budget, according to the financing contract signed with the North-East Regional Development Agency, as Managing Authority for the North-East Regional Program 2021-2027. The value of the eligible co-financing of the Beneficiary is 43,632.95 lei (equivalent to 10% of the total eligible value approved).'
                    : 'Valoarea totală a proiectului este de 436.324,73 lei, din care 392.691,78 lei reprezintă finanțarea nerambursabilă (echivalentă cu 90% din valoarea totală eligibilă aprobată), din care 333.788.01 lei valoarea eligibilă nerambursabilă din fondurilor (FEDR/FSE+/FC/FTJ) si 58903.77 lei valoarea eligibilă nerambursabilă din bugetul naţional, conform contractului de finanțare semnat cu Agenția pentru Dezvoltare Regională Nord-Est, în calitate de Autoritate de Management pentru Programul Regional Nord-Est 2021-2027. Valoarea co-finanţarii eligibile a Beneficiarului este de 43.632,95 lei (echivalentă cu 10% din valoarea totală eligibilă aprobată).'
                }
            </p>

            <p>
                {language === 'en'
                    ? 'The implementation period of the project is from the date of signing the financing contract, 10.04.2024, until 10.04.2025.'
                    : 'Perioada de implementare a proiectului este de la data semnării contractului de finanțare, 10.04.2024, până la 10.04.2025.'
                }
            </p>

            <p>
                {language === 'en'
                    ? 'The project is co-financed by the European Regional Development Fund through the North-East Regional Program 2021-2027.'
                    : 'Proiect cofinanțat din Fondul European de Dezvoltare Regională prin Regional Nord-Est 2021-2027.'
                }
                &nbsp;
                <a
                    href="https://www.regionordest.ro"
                    target="_blank"
                >
                    www.regionordest.ro
                </a>
            </p>

            <ProjectDisclaimer />
        </div>
    );
}
