/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': {
          primary: '#ffffff',
          secondary: '#f8f9fa',
          accent: '#f1f5f9',
        },
        'dark-bg': {
          primary: '#0f172a',
          secondary: '#1e293b',
          accent: '#334155',
        },
        'light-text': {
          primary: '#171717',
          secondary: '#4b5563',
        },
        'dark-text': {
          primary: '#f9fafb',
          secondary: '#d1d5db',
        },
        'brand': {
          primary: '#39817c',
          light: '#4db5b0',
          dark: '#2d6663',
          50: '#ebf7f6',
          100: '#c6e9e6',
          200: '#9ad8d3',
          300: '#6ec7c0',
          400: '#4db5b0',
          500: '#39817c',
          600: '#307876',
          700: '#276663',
          800: '#1e5452',
          900: '#15403e',
        },
        'glass': {
          white: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(15, 23, 42, 0.75)',
          brand: 'rgba(57, 129, 124, 0.85)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.5s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.2s ease-in-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '60px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(to right bottom, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.3))',
        'dark-glass-gradient': 'linear-gradient(to right bottom, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.3))',
        'brand-gradient': 'linear-gradient(to right bottom, rgba(57, 129, 124, 0.85), rgba(57, 129, 124, 0.4))',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
        'glass-strong': '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
        'glass-inner': 'inset 0 8px 32px 0 rgba(31, 38, 135, 0.1)',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
} 