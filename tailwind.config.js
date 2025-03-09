/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#39817c', // Main brand color
          light: '#4ba5a0',   // Lighter variation
          dark: '#2d6663',    // Darker variation
        },
        dark: {
          bg: {
            primary: '#0f172a',    // Primary dark background
            secondary: '#1e293b',  // Secondary dark background
            accent: '#334155',     // Dark accent background
          },
          text: {
            primary: '#f8fafc',    // Primary text in dark mode
            secondary: '#cbd5e1',  // Secondary text in dark mode
            muted: '#94a3b8',      // Muted text in dark mode
          }
        },
        light: {
          bg: {
            primary: '#ffffff',    // Primary light background
            secondary: '#f8fafc',  // Secondary light background
            accent: '#e2e8f0',     // Light accent background
          },
          text: {
            primary: '#0f172a',    // Primary text in light mode
            secondary: '#334155',  // Secondary text in light mode
            muted: '#64748b',      // Muted text in light mode
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} 