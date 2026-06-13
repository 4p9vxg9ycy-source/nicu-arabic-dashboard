/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#0EA5E9',
          secondary: '#0284C7',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          light: '#F0F9FF',
          dark: '#0C4A6E',
        },
        status: {
          green: '#22C55E',
          blue: '#3B82F6',
          red: '#EF4444',
          yellow: '#EAB308',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};