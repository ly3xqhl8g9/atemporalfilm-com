import type { NextConfig } from "next";



const nextConfig: NextConfig = {
    /* config options here */
    // Ascunde butonul rotund „N” al Next.js din previzualizarea locală
    // (acoperea panoul Modului Regie). Nu afectează site-ul public.
    devIndicators: false,
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
