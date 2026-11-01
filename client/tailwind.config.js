/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: { 950: '#07070d', 900: '#0d0d17', 800: '#15151f', 700: '#1e1e2b', 600: '#2a2a3a' },
        brand: { 300: '#f7b8d2', 400: '#f28dba', 500: '#e8619e', 600: '#c94584' },
        gold: { 300: '#f5d99a', 400: '#eec46a', 500: '#d9a63f' },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(232, 97, 158, 0.55)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fadeUp .45s ease-out both',
      },
    },
  },
  plugins: [],
};
