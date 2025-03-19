import {
    useState,
} from 'react';

import {
    Language,
} from '@/data/index';



export default function ContentPressRelease({
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
                    ? '02/28/2025'
                    : '28.02.2025'
                }
            </h3>
            <h2>
                {language === 'en'
                    ? 'Announcement of completion of the implementation of the project "DEVELOPMENT OF DIGITAL RESOURCES OF SC ATEMPORAL FILM SRL", SMIS Code 312248'
                    : 'Anunț finalizare implementare proiect „DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL”, Cod SMIS 312248'
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
                            ? 'SC ATEMPORAL FILM S.R.L., with fiscal identification code 39509159, registered at the Trade Register under no. J27/604/2018, with its headquarters in Piatra Neamț, Traian Boulevard, no. 6, Block S5, Floor 4, Apt. 83, Neamț County, Romania, announces the completion of the implementation of the project titled: "DEVELOPMENT OF DIGITAL RESOURCES OF SC ATEMPORAL FILM SRL," under SMIS Code 312248.'
                            : 'SC ATEMPORAL FILM S.R.L., cod de identificare fiscală 39509159, înregistrată la Registrul Comerțului sub nr.  J27/604/2018, cu sediul în localitatea Municipiul Piatra Neamț, Bulevardul Traian, nr. 6, Bloc S5, Etaj 4, Ap. 83, județul Neamț, România, anunță finalizarea implementării proiectului cu titlul: „DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL”, aferent Cod SMIS 312248.'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The project was implemented at the company’s workplace located at Str. Progresului, no. 71, bl. D30, sc. C, ground floor, apt. 38, Piatra Neamț, Neamț County, through non-reimbursable funding granted by the North-East Regional Program 2021-2027, Priority 2: North-East – A More Digitalized Region, Specific Objective RSO1.2 - ERDF - RSO1.2_Leveraging the advantages of digitalization, for the benefit of citizens, companies, research organizations, and public authorities.'
                            : 'Proiectul a fost implementat la punctul de lucru al companiei situat pe Str. Progresului, nr. 71, bl. D30, sc. C, parter, ap. 38, Piatra-Neamț, județul Neamț, prin intermediul unei finanțări nerambursabile acordate prin Programul Regional Nord-Est 2021-2027, Prioritatea 2:  Nord-Est – O regiune mai digitalizată, Obiectivul specific RSO1.2 - FEDR - RSO1.2_Valorificarea avantajelor digitalizării, în beneficiul cetățenilor, al companiilor, al organizațiilor de cercetare și al autorităților publice.'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The total value of the project is 436,324.73 RON, of which 392,691.78 RON represents non-reimbursable funding (equivalent to 90% of the total approved eligible value), with 333,788.01 RON being the non-reimbursable eligible amount from EU funds (ERDF/ESF+/FC/FTJ) and 58,903.77 RON from the national budget, according to the financing contract signed with the North-East Regional Development Agency, as the Managing Authority for the North-East Regional Program 2021-2027. The beneficiary’s eligible co-financing value is 43,632.95 RON (equivalent to 10% of the total approved eligible value).'
                            : 'Valoarea totală a proiectului este de 436.324,73 lei, din care 392.691,78 lei reprezintă finanțarea nerambursabilă (echivalentă cu 90% din valoarea totală eligibilă aprobată), din care 333.788.01 lei valoarea eligibilă nerambursabilă din fondurilor (FEDR/FSE+/FC/FTJ) si 58903.77 lei valoarea eligibilă nerambursabilă din bugetul naţional, conform contractului de finanțare semnat cu Agenția pentru Dezvoltare Regională Nord-Est, în calitate de Autoritate de Management pentru Programul Regional Nord-Est 2021-2027. Valoarea co-finanţarii eligibile a Beneficiarului este de 43.632,95 lei (echivalentă cu 10% din valoarea totală eligibilă aprobată).'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The general objective of the project is the digitalization of the resources of SC ATEMPORAL FILM S.R.L. to streamline and digitize a series of company processes. These processes include: data storage (audio recordings), radio frequency transmission, and cloud computing. Based on this investment, we acquired modern, state-of-the-art equipment, which enables our employees to perform these processes at a high and competitive level. To promote the investment and attract new clients and markets, we developed and launched a website for promoting the company’s activity and portfolio (www.atemporalfilm.com).'
                            : 'Obiectivul general al proiectului este digitalizarea resurselor societății S.C. ATEMPORAL FILM S.R.L. pentru a eficientiza și digitaliza o serie de procese ale companiei noastre. Aceste procese sunt: Stocarea de date (înregistrări audio), Transmisiei în radiofrecvență, Cloud computing. Pe baza investiției, am achiziționat echipamente moderne, de ultimă generație, care permit angajaților noștri efectuarea acestor procese la un nivel performant și competitiv. Pentru a promova investiția și pentru a atrage clienți și piețe noi, am dezvoltat și lansat o platformă web pentru promovarea activității și portofoliului companiei (www.atemporalfilm.com).'
                        }
                    </p>

                    <p>
                        {language === 'en'
                            ? 'The project contributes to achieving the specific objective of the PRNE/107/PRNE_P2/OP1/RSO1.2/PRNE_A29 - PR/NE/2023/PI2/RSO1.2/1 – SME DIGITALIZATION as the beneficiary’s proposed investment aimed at digitizing the company.'
                            : 'Proiectul contribuie la realizarea obiectivului specific al apelului PRNE/107/PRNE_P2/OP1/RSO1.2/PRNE_A29 - PR/NE/2023/PI2/RSO1.2/1 – DIGITALIZARE IMM întrucât prin realizarea investiției propuse de către beneficiar, acesta a urmărit digitalizarea societății comerciale.'
                        }
                    </p>


                    <h3>
                        {language === 'en' ? 'Specific objectives:' : 'Obiective specifice:'}
                    </h3>

                    <ul>
                        <li>
                            {language === 'en'
                                ? 'Purchase of 10 ICT hardware units and other related devices and equipment for digitalizing the company’s processes (such as storage, radio frequency transmission) and facilitating teleworking.'
                                : 'Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Development and launch of a company presentation website with advanced features.'
                                : 'Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe.'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Creation of social media accounts (Instagram and LinkedIn) to promote the company’s activity and portfolio.'
                                : 'Crearea de conturi pe rețele de social media (Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei.'
                            }
                        </li>
                    </ul>


                    <h3>
                        {language === 'en' ? 'Results:' : 'Rezultate:'}
                    </h3>

                    <ul>
                        <li>
                            {language === 'en'
                                ? 'Purchase of 10 ICT hardware units and other related devices and equipment for digitalizing the company’s processes (such as storage, radio frequency transmission) and facilitating teleworking.'
                                : 'Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Development and launch of a company presentation website with advanced features.'
                                : 'Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe.'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Creation of social media accounts (Instagram and LinkedIn) to promote the company’s activity and portfolio.'
                                : 'Crearea de conturi pe rețele de social media (Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei.'
                            }
                        </li>
                    </ul>


                    <h3>
                        {language === 'en' ? 'Impact of the investment on the locality/region:' : 'Impactul investiției la nivelul localității / regiunii:'}
                    </h3>

                    <ul>
                        <li>
                            {language === 'en'
                                ? 'Improvement in the quality of sound post-production services (sound recording and mixing services) in the North-East region and Romania.'
                                : 'Creșterea calității serviciilor de post-producție sunet (servicii înregistrare și mixare sunet) în zona de Nord-Est și în România.'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Increased competitiveness of the enterprise in the sound post-production and editing field in regional, national, European, and international markets.'
                                : 'Creșterea competitivității întreprinderii în domeniul de post-producție și editării sunetului pe piețele regionale, naționale, europene și internaționale.'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'High access to quality services: The creation of the website and promotion on social media networks allows wider access for clients to services, improving visibility and attractiveness of the North-East region as a media services hub.'
                                : 'Acces ridicat la servicii de calitate: Crearea platformei web și promovarea pe rețelele social media permite un acces mai larg al clienților la servicii, îmbunătățind vizibilitatea și atractivitatea regiunii Nord-Est ca centru pentru servicii media.'
                            }
                        </li>

                        <li>
                            {language === 'en'
                                ? 'Contribution to the regional digitalization process through the purchase of advanced equipment.'
                                : 'Contribuție la procesul de digitalizare regională prin achiziționarea de echipamente avansate'
                            }
                        </li>
                    </ul>


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
                    </p>

                    <p>
                        {language === 'en'
                            ? 'IULIAN-ȘTEFAN AZAHARIOAIE, Project Manager'
                            : 'IULIAN-ȘTEFAN AZAHARIOAIE, Manager de proiect'
                        }
                    </p>

                    <p>
                        Phone: +40743343800, +40770789376
                    </p>

                    <p>
                        Email: atemporalfilm@gmail.com
                    </p>
                </>
            )}
        </>
    );
}
