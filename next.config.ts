import type { NextConfig } from "next";



const nextConfig: NextConfig = {
    output: 'standalone',
    /* config options here */
    // Ascunde butonul rotund „N” al Next.js din previzualizarea locală
    // (acoperea panoul Modului Regie). Nu afectează site-ul public.
    devIndicators: false,
    // 16.11.2026: redirecționarea www → fără www (pusă pe 11.11) e SCOASĂ.
    // Serverul din fața site-ului (Envoy) răspunde 421 „misdirected request”
    // când Safari trimite cererea pentru un nume pe conexiunea deschisă pentru
    // celălalt (același IP, același certificat); Safari nu reîncearcă, Chrome
    // și Firefox da. Redirecționarea făcea exact asta la fiecare click pe
    // linkul cu „www” din Google: conexiune deschisă pe www → 308 → cererea
    // pentru atemporalfilm.com pe aceeași conexiune → 421. Fără ea, pagina se
    // deschide direct pe www; Google trece oricum rezultatele pe adresa fără
    // „www” după `canonical` (metadataBase în app/layout.tsx). Rezolvarea
    // completă e pe server (ambele nume pe aceeași rută în Envoy) — după aceea
    // redirecționarea poate reveni, de preferat chiar în Envoy.
    webpack: (config) => {
        // Ignore node-specific modules when bundling for the browser
        // https://webpack.js.org/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        };

        return config;
    },

    serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;
