import type { NextConfig } from "next";



const nextConfig: NextConfig = {
    /* config options here */
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
