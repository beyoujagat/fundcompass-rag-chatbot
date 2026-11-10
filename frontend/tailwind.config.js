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
          dark: '#0f172a',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#00B88A',
        }
      }
    },
  },
  plugins: [],
}
