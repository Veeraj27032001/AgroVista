import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4C7A3F',
          dark: '#365B2C',
          light: '#E8F0E4'
        },
        accent: {
          DEFAULT: '#E3A93A',
          hover: '#C1621B'
        },
        ink: '#201F17',
        paper: '#F6F2E7'
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      },
      borderRadius: {
        lg2: '20px'
      }
    }
  },
  plugins: []
};

export default config;
