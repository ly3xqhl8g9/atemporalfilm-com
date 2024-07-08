import './styles.css';

import ProjectImages from '@/components/ProjectImages';
import ProjectDisclaimer from '@/components/ProjectDisclaimer';



export default function Project() {
    return (
        <div
            className="m-auto max-w-[800px] p-4 project-text"
        >
            <ProjectImages />


            <h1>
                Titlul proiectului
            </h1>
            <h2>
                DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL
            </h2>

            <h1>
                Descrierea proiectului
            </h1>
            <h2>
                ATEMPORAL FILM S.R.L. implementează proiectul cu titlul DEZVOLTAREA RESURSELOR DIGITALE ALE SOCIETATII SC ATEMPORAL FILM SRL.
            </h2>

            <p>
                Obiectivul general al proiectului este digitalizarea resurselor societății S.C. ATEMPORAL FILM S.R.L. pentru a eficientiza și digitaliza o serie de procese ale companiei noastre. Aceste procese sunt: Stocarea de date (înregistrări audio), Transmisiei în radiofrecvență, Cloud computing. Pe baza investiției, vom achiziționa echipamente moderne, de ultimă generație, care vor permite angajaților noștri efectuarea acestor procese la un nivel performant și competitiv. Pentru a promova investiția și pentru a atrage clienți și piețe noi, vom dezvolta și lansa o platformă web pentru promovarea activității și portofoliului companiei.
            </p>

            <h3>
                Obiective specifice ale proiectului:
            </h3>

            <ul>
                <li>
                    Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii
                </li>

                <li>
                    Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe
                </li>

                <li>
                    Crearea a trei conturi pe rețele de social media (Facebook, Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei
                </li>
            </ul>


            <h3>
                Rezultate așteptate
            </h3>

            <ul>
                <li>
                    Achiziționarea a 10 unități hardware TIC și a altor dispozitive și echipamente aferente pentru digitalizarea unor procese ale companiei (precum stocare, transmisie în radiofrecvență) și pentru facilitarea telemuncii
                </li>

                <li>
                    Dezvoltarea și lansarea unui website de prezentare a companiei, cu funcții complexe
                </li>

                <li>
                    Crearea a trei conturi pe rețele de social media (Facebook, Instagram și LinkedIn) pentru promovarea activității și portofoliului companiei
                </li>
            </ul>

            <p>
                Valoarea totală a proiectului este de 436.324,73 lei, din care 392.691,78 lei reprezintă finanțarea nerambursabilă (echivalentă cu 90% din valoarea totală eligibilă aprobată), din care 333.788.01 lei valoarea eligibilă nerambursabilă din fondurilor (FEDR/FSE+/FC/FTJ) si 58903.77 lei valoarea eligibilă nerambursabilă din bugetul naţional, conform contractului de finanțare semnat cu Agenția pentru Dezvoltare Regională Nord-Est, în calitate de Autoritate de Management pentru Programul Regional Nord-Est 2021-2027. Valoarea co-finanţarii eligibile a Beneficiarului este de 43.632,95 lei (echivalentă cu 10% din valoarea totală eligibilă aprobată).
            </p>

            <p>
                Perioada de implementare a proiectului este de la data semnării contractului de finanțare, 10.04.2024, până la 10.04.2025.
            </p>

            <p>
                Proiect cofinanțat din Fondul European de Dezvoltare Regională prin Regional Nord-Est 2021-2027.
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
