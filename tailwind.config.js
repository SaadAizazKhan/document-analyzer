/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          navy: '#0F172A',
          slate: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          blue: '#1D4ED8',
          'blue-hover': '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
