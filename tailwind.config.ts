import type { Config } from 'tailwindcss'

// ============================================================================
// Avernic UK design system tokens.
//
// A sophisticated graphite palette with a single warm accent (ochre/brass,
// echoing the trident mark) — deliberately NOT "pharmacy green".
//
// THEMING: every colour below resolves to a CSS custom property declared in
// src/index.css, where `:root` holds the light palette and `.dark` (set on
// <html> by src/lib/theme/ThemeProvider.tsx, and by the no-flash script in
// index.html) holds the dark one. The `ink` scale is *semantic*, not literal:
// ink-950 is always "the strongest foreground" and `white` is always "the page
// surface", so in dark mode the scale is remapped rather than the components
// being rewritten. `bg-white text-ink-950` therefore means "page surface,
// strongest text" in both themes. Use `dark:` variants only for genuinely
// theme-specific flourishes (glows, glass), never for basic colours.
//
// The `<alpha-value>` form keeps opacity modifiers working (border-ink-200/70).
// ============================================================================

function v(name: string) {
  return `rgb(var(--${name}) / <alpha-value>)`
}

function scale(prefix: string, steps: number[]) {
  return Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]))
}

const full = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: v('surface'),
        ink: scale('ink', full),
        accent: scale('accent', full),
        success: scale('success', [50, 500, 600, 700]),
        warning: scale('warning', [50, 500, 600, 700]),
        danger: scale('danger', [50, 500, 600, 700]),
        // Theme-INDEPENDENT literals, for text sitting on a fixed-colour
        // background (white on a red danger button, near-black on brass).
        literal: { white: '#ffffff', ink: '#101014' },
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
        display: ['"Fraunces"', '"Inter var"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        popover: 'var(--shadow-popover)',
        glow: '0 0 0 1px rgb(var(--accent-500) / 0.35), 0 8px 32px -8px rgb(var(--accent-500) / 0.45)',
        'glow-sm': '0 0 0 1px rgb(var(--accent-500) / 0.25), 0 4px 16px -4px rgb(var(--accent-500) / 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        content: '80rem',
      },
      backgroundImage: {
        'accent-gradient':
          'linear-gradient(135deg, rgb(var(--accent-300)) 0%, rgb(var(--accent-500)) 55%, rgb(var(--accent-600)) 100%)',
        'hero-glow':
          'radial-gradient(60% 60% at 50% 40%, rgb(var(--accent-500) / 0.28) 0%, rgb(var(--accent-500) / 0) 70%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '-200% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
