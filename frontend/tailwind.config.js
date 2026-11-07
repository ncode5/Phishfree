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
      }
    },
  },
  plugins: [],
}

