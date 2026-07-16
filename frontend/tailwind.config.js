import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      ...colors,
      slate: {
        50: '#020617',
        100: '#0f172a',
        200: '#1e293b',
        300: '#334155',
        400: '#475569',
        500: '#64748b',
        600: '#94a3b8',
        700: '#cbd5e1',
        800: '#e2e8f0',
        900: '#f1f5f9',
        950: '#ffffff',
      },
    },
    extend: {
      colors: {
        // Colores corporativos elegantes
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
