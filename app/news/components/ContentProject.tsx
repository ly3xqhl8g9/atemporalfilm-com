import {
    useState,
} from 'react';

import {
    Language,
} from '@/data/index';



export default function ContentProject({
    language,
} : {
    language: Language,
}) {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <>
            <h1>
                {language === 'en' ? 'PRESS RELEASE' : 'COMUNICAT DE PRESĂ'}
            </h1>
            <h3>
                {language === 'en'
                    ? '04/30/2024'
                    : '30.04.2024'
                }
            </h3>
            <h2>
                {language === 'en'
                    ? 'Announcement to begin the implementation of the project "DEVELOPMENT OF DIGITAL RESOURCES OF SC ATEMPORAL FILM SRL", SMIS Code 312248'
                    : 'Anunț începere implementare proiect „DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL”, Cod SMIS 312248'
                }
            </h2>

            <button
                onClick={toggleExpand}
                className="px-4 py-2 bg-black/10 hover:bg-black/20 text-white rounded my-4 transition-all"
            >
                {expanded
                    ? (language === 'en' ? 'Show less' : 'Arată mai puțin')
                    : (language === 'en' ? 'Show more' : 'Arată mai mult')
                }
            </button>

            {expanded && (
                <>
                    <p>
                        {language === 'en'
                            ? 'SC ATEMPORAL FILM S.R.L., fiscal identification code 39509159, registered with the Trade Register under no. J27/604/2018, headquartered in Piatra Neamț Municipality, Traian Boulevard, no. 6, Block S5, Floor 4, App. 83, Neamț County, Romania, announces the signing, on 10.04.2024, of Financing Contract no. 21 for the implementation of the project entitled: "DEVELOPMENT OF DIGITAL RESOURCES OF SC ATEMPORAL FILM SRL", corresponding to SMIS Code 312248.'
                            : 'SC ATEMPORAL FILM S.R.L., cod de identificare fiscală  39509159, înregistrată la Registrul Comerțului sub nr.  J27/604/2018, cu sediul în localitatea Municipiul Piatra Neamț, Bulevardul Traian, nr. 6, Bloc S5, Etaj 4, Ap. 83, județul Neamț, România, anunță semnarea, în data de 10.04.2024,  a Contractului de finanțare nr. 21 pentru implementarea proiectului cu titlul: „DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL”, aferent Cod SMIS 312248.'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The project will be implemented at the company\'s headquarters in Piatra Neamț Municipality, Traian Boulevard, no. 6, Block S5, Floor 4, Apartment 83, Neamț County, through a non-reimbursable funding granted through the North-East Regional Program 2021-2027, Priority 2: North-East - A more digitalized region, Specific Objective RSO1.2 - ERDF - RSO1.2_Capturing the advantages of digitalization, for the benefit of citizens, companies, research organizations and public authorities.'
                            : 'Proiectul va fi implementat la sediul companiei din localitatea Municipiul Piatra Neamț, Bulevardul Traian, nr. 6, Bloc S5, Etaj 4, Ap. 83, județul Neamț, prin intermediul unei finanțări nerambursabile acordate prin Programul Regional Nord-Est 2021-2027, Prioritatea 2:  Nord-Est – O regiune mai digitalizată, Obiectivul specific RSO1.2 - FEDR - RSO1.2_Valorificarea avantajelor digitalizării, în beneficiul cetățenilor, al companiilor, al organizațiilor de cercetare și al autorităților publice.'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The total value of the project is 436,324.73 lei, of which 392,691.78 lei represents the non-reimbursable financing (equivalent to 90% of the total eligible amount approved), of which 333,788.01 lei the non-reimbursable eligible amount from the funds (ERDF/ESF+/CF/FTJ) and 58903.77 lei the non-reimbursable eligible amount from the national budget, according to the financing contract signed with the North-East Regional Development Agency, as the Managing Authority for the North-East Regional Program 2021-2027. The value of the eligible co-financing of the Beneficiary is 43,632.95 lei (equivalent to 10% of the total eligible amount approved).'
                            : 'Valoarea totală a proiectului este de 436.324,73 lei, din care 392.691,78 lei reprezintă finanțarea nerambursabilă (echivalentă cu 90% din valoarea totală eligibilă aprobată), din care 333.788.01 lei valoarea eligibilă nerambursabilă din fondurilor (FEDR/FSE+/FC/FTJ) si 58903.77 lei valoarea eligibilă nerambursabilă din bugetul naţional, conform contractului de finanțare semnat cu Agenția pentru Dezvoltare Regională Nord-Est, în calitate de Autoritate de Management pentru Programul Regional Nord-Est 2021-2027. Valoarea co-finanţarii eligibile a Beneficiarului este de 43.632,95 lei (echivalentă cu 10% din valoarea totală eligibilă aprobată).'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The general objective of the project is the digitization of the resources of the company S.C. ATEMPORAL FILM S.R.L. to streamline and digitize a series of processes of our company. These processes are: Data storage (audio recordings), Radio frequency transmission, Cloud computing. Based on the investment, we will acquire modern, state-of-the-art equipment that will allow our employees to perform these processes at a performant and competitive level. To promote the investment and to attract new customers and markets, we will develop and launch a web platform for the promotion of the company\'s activity and portfolio.'
                            : 'Obiectivul general al proiectului este digitalizarea resurselor societății S.C. ATEMPORAL FILM S.R.L. pentru a eficientiza și digitaliza o serie de procese ale companiei noastre. Aceste procese sunt: Stocarea de date (înregistrări audio), Transmisiei în radiofrecvență, Cloud computing. Pe baza investiției, vom achiziționa echipamente moderne, de ultimă generație, care vor permite angajaților noștri efectuarea acestor procese la un nivel performant și competitiv. Pentru a promova investiția și pentru a atrage clienți și piețe noi, vom dezvolta și lansa o platformă web pentru promovarea activității și portofoliului companiei.'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The project contributes to achieving the specific objective of the call PRNE/107/PRNE_P2/OP1/RSO1.2/PRNE_A29 - PR/NE/2023/PI2/RSO1.2/1 – SME DIGITALISATION since by making the investment proposed by the beneficiary, it aims to digitize the commercial company.'
                            : 'Proiectul contribuie la realizarea obiectivului specific al apelului PRNE/107/PRNE_P2/OP1/RSO1.2/PRNE_A29 - PR/NE/2023/PI2/RSO1.2/1 – DIGITALIZARE IMM întrucât prin realizarea investiției propuse de către beneficiar, acesta urmărește digitalizarea societății comerciale.'
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

                    <p>
                        {language === 'en'
                            ? 'Contact details for the beneficiary:'
                            : 'Date de contact beneficiar:'
                        }
                        <br />
                        {language === 'en'
                            ? 'IULIAN-ȘTEFAN AZAHARIOAIE, Project Manager'
                            : 'IULIAN-ȘTEFAN AZAHARIOAIE, Manager de proiect'
                        }
                        <br />
                        Phone: +40743343800, +40770789376
                        <br />
                        Email: atemporalfilm@gmail.com
                    </p>
                </>
            )}
        </>
    );
}
