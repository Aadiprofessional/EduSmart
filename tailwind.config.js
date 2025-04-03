/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E', // Teal from the image
          light: '#14B8A6', // Lighter teal
        },
        secondary: {
          DEFAULT: '#F97316', // Orange from the image
          light: '#FB923C', // Lighter orange
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 