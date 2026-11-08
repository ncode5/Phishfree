/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fbf8',
          100: '#d7f4ec',
          200: '#b1e7da',
          300: '#7ed4c3',
          400: '#43b8a2',
          500: '#1e9b86',
          600: '#147c6c',
          700: '#0d5c4d', // Signature pine teal from Figma design
          800: '#0c4d41',
          900: '#0a4037',
          950: '#042520',
        },
        cyber: {
          950: '#070b14',
          900: '#0b1329',
          800: '#14213d',
          700: '#1f315a',
          accent: '#3b82f6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444',
          purple: '#8b5cf6'
        }
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
