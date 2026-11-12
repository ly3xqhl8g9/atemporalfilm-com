import type { NextConfig } from "next";



const nextConfig: NextConfig = {
    output: 'standalone',
    /* config options here */
    // Ascunde butonul rotund „N” al Next.js din previzualizarea locală
    // (acoperea panoul Modului Regie). Nu afectează site-ul public.
    devIndicators: false,
    // 11.11.2026: www.atemporalfilm.com → atemporalfilm.com (aceeași pagină).
    // Google a indexat pagina About pe adresa cu „www”, iar în Safari adresa
    // aceea poate răspunde „misdirected request” (serverul din fața site-ului,
    // când Safari refolosește conexiunea deschisă pentru adresa fără „www”).
    // Cu redirecționarea, Google trece rezultatele pe adresa fără „www”.
    // /api rămâne neatins (verificarea de după publicare citește /api/health
    // pe amândouă adresele).
    async redirects() {
        return [
            {
                source: '/:path((?!api/).*)',
                has: [{ type: 'host', value: 'www.atemporalfilm.com' }],
                destination: 'https://atemporalfilm.com/:path',
                permanent: true,
            },
        ];
    },
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
