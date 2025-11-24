import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#A32144',
          50: '#F8E8ED',
          100: '#F1D1DB',
          200: '#E3A3B7',
          300: '#D57593',
          400: '#C7476F',
          500: '#A32144',
          600: '#821A36',
          700: '#621429',
          800: '#410D1B',
          900: '#21070E',
          dark: '#821A36',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
      spacing: {
        'header': '80px',
        'header-sm': '64px',
        'logo': '180px',
      },
      maxWidth: {
        'container': '1280px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
