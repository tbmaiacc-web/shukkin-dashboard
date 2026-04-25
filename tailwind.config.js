/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef2f9',
          100: '#d9e3f3',
          200: '#b3c7e7',
          300: '#8daadb',
          400: '#678ecf',
          500: '#4172c3',
          600: '#2855a0',
          700: '#1B3A6B',
          800: '#132c52',
          900: '#0d1f3c',
        },
      },
    },
  },
  plugins: [],
}
