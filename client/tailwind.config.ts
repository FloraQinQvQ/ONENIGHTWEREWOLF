import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#0a0b14',
          900: '#0f1022',
          800: '#161829',
          700: '#1e2140',
        },
        moon: {
          400: '#f0d060',
          500: '#e8c840',
        },
        blood: {
          500: '#cc2222',
          600: '#aa1a1a',
        },
        forest: {
          500: '#2d7a4a',
          600: '#236040',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
