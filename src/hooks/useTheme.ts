import { useCallback, useEffect, useState } from 'react'

/**
 * Hand-rolled theme hook. The bundled .dark palette in index.css is otherwise
 * dead code — no next-themes / no provider exists in this app. Pair this with
 * the inline anti-FOUC bootstrap in index.html (must read the same storage key
 * and use the same prefers-color-scheme fallback) to avoid first-paint flicker.
 *
 * The bootstrap script is what actually paints the correct theme before React
 * mounts; this hook keeps the class in sync afterwards and exposes a setter
 * for the toggle UI.
 *
 * Multiple instances of this hook can be alive at once (e.g. desktop + mobile
 * `<ThemeToggle>` rendered in the same viewport band). To keep them in sync,
 * each write also dispatches a window-scoped custom event that every other
 * instance listens for; this is lighter than wrapping the app in a context
 * provider for a single piece of state.
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'mojju-theme'
const THEME_CHANGE_EVENT = 'mojju-theme-change'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(stored)) return stored
  } catch {
    // localStorage may throw in private mode / sandboxed iframes — fall through.
  }
  return 'system'
}

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemPreference() : mode
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  // Keep native form controls / scrollbars in sync with the active theme.
  root.style.colorScheme = resolved
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(readStoredTheme()),
  )

  // Apply theme + persist preference whenever the user changes mode, then
  // notify every other useTheme() instance so multiple toggles stay aligned.
  useEffect(() => {
    const resolved = resolveTheme(theme)
    applyResolvedTheme(resolved)
    setResolvedTheme(resolved)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore storage failures
    }

    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: theme }))
  }, [theme])

  // Listen for changes made by sibling instances of useTheme().
  useEffect(() => {
    const handler = (event: Event) => {
      const next = (event as CustomEvent<ThemeMode>).detail
      if (isThemeMode(next)) {
        setThemeState((prev) => (prev === next ? prev : next))
      }
    }
    window.addEventListener(THEME_CHANGE_EVENT, handler)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handler)
  }, [])

  // Also pick up changes made in *other tabs* via the native storage event.
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = event.newValue
      if (isThemeMode(next)) {
        setThemeState((prev) => (prev === next ? prev : next))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Track OS-level preference changes while in system mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? 'dark' : 'light'
      applyResolvedTheme(next)
      setResolvedTheme(next)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeState((prev) =>
      prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light',
    )
  }, [])

  return { theme, resolvedTheme, setTheme, cycleTheme }
}
