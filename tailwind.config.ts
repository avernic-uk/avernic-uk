import type { Config } from 'tailwindcss'

// Avernic UK design system tokens.
// A sophisticated, muted slate/graphite palette with a single warm accent
// (ochre/brass, echoing the trident mark) — deliberately NOT "pharmacy green".
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9dade',
          300: '#b7b9c1',
          400: '#8f929e',
          500: '#6f7280',
          600: '#585a68',
          700: '#474854',
          800: '#2f303a',
          900: '#1c1c22',
          950: '#101014',
        },
        accent: {
          50: '#faf6ed',
          100: '#f3ead2',
          200: '#e6d3a3',
          300: '#d7b96f',
          400: '#c8a047',
          500: '#b08a33',
          600: '#8f6c27',
          700: '#725423',
          800: '#5f4622',
          900: '#513b20',
          950: '#2d1f10',
        },
        success: { 50: '#f0faf4', 500: '#1f9d55', 700: '#166c3b' },
        warning: { 50: '#fffaf0', 500: '#c98a1f', 700: '#8a5f13' },
        danger: { 50: '#fdf2f2', 500: '#c0392b', 700: '#8a2820' },
      },
      fontFamily: {
        sans: [
          '"Inter var"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          '"Fraunces"',
          '"Inter var"',
          'Georgia',
          'serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 16 20 / 0.04), 0 1px 3px 0 rgb(16 16 20 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(16 16 20 / 0.08), 0 2px 6px -2px rgb(16 16 20 / 0.06)',
        popover: '0 12px 32px -8px rgb(16 16 20 / 0.18), 0 4px 12px -4px rgb(16 16 20 / 0.1)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        content: '80rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
