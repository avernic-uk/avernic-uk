import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'avernic-theme'
const DEFAULT_THEME: Theme = 'dark'

// Keep in sync with the <meta name="theme-color"> values used in index.html
// (they colour the browser chrome / PWA title bar on mobile).
const THEME_COLOR: Record<Theme, string> = { dark: '#0b0b10', light: '#ffffff' }

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage can throw in private windows / with storage disabled — fall through
  }
  return DEFAULT_THEME
}

/** Applies a theme to <html>. Also used by the inline no-flash script in index.html (kept in sync by hand). */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[theme])
}

/**
 * Site-wide theme: dark by default (the brand look), with a toggle in the
 * header that is remembered per browser. The initial class is set before
 * first paint by a tiny inline script in index.html so there is no flash of
 * the wrong theme; this provider takes over from there.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === 'undefined' ? DEFAULT_THEME : readStoredTheme(),
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Follow changes made in another tab of the same site.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // ignore — the choice simply won't persist
    }
  }, [])

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
