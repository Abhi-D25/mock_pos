/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',
        secondary: '#FFD700',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      }
    },
  },
  plugins: [],
}
