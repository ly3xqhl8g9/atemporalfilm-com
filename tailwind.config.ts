import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        fadeinout: {
          '0%': { filter: 'invert(0)' },
          '50%': { filter: 'invert(0.4)' },
          '100%': { filter: 'invert(0)' },
        },
        "slide-in-right": {
            "0%": {
                transform: "translate3d(200%, 0, 0)",
            },
            "100%": {
                transform: "translate3d(0%, 0, 0)",
            },
        },
      },
      animation: {
        'fade-in-out': 'fadeinout 0.7s linear infinite',
        // 'slideinright': 'slide-in-right  1s ease-in-out 0.25s 1',
        'slideinright': 'slide-in-right 0.5s ease forwards',
      },
    },
  },
  plugins: [],
};
export default config;
