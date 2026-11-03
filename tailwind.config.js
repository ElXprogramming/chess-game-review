/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#1e2024',
          darker: '#16171a',
          card: '#26282e',
          accent: '#81b64c',
          accentHover: '#95c65f',
          boardLight: '#eeeed2',
          boardDark: '#769656',
          brilliant: '#26c2a3',
          great: '#5b8baf',
          best: '#81b64c',
          excellent: '#9ecb6a',
          good: '#a8b98b',
          inaccuracy: '#e69d27',
          mistake: '#e67327',
          miss: '#db4d4d',
          blunder: '#b33430',
          book: '#d5a47e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
