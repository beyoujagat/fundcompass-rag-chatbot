/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          primary: '#00D09C',
          dark: '#121212',
          card: '#1E222B',
          border: '#2C3240',
          hover: '#00B88A',
        }
      }
    },
  },
  plugins: [],
}

