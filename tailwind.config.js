/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a2e',
        paper: '#f8f6f1',
        canvas: '#edeae3',
        accent: '#e63946',
        accentMuted: '#ff6b6b',
        muted: '#6b7280',
        border: '#d4d0c8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
