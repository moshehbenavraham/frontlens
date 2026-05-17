import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const LABELS = {
  light: 'Switch to dark theme',
  dark: 'Switch to system theme',
  system: 'Switch to light theme',
} as const

interface ThemeToggleProps {
  /** Visual variant: 'icon' for a circular icon-only button (default), 'inline' for a labelled pill in menus. */
  variant?: 'icon' | 'inline'
  className?: string
}

/**
 * Cycle button: light → dark → system → light. Renders the icon for the
 * currently-active mode so users can tell at a glance which mode is on, and
 * advertises the next-step destination via aria-label so screen readers stay
 * informative.
 */
export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const labelText =
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  // Bright white focus ring with a dark offset so the toggle is legible whether
  // it sits on the transparent navbar (dark video below) or the scrolled glass
  // navbar — keyboard users couldn't tell it had focus before.
  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60'

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={LABELS[theme]}
        title={LABELS[theme]}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 active:bg-white/20 gentle-animation font-medium text-base w-full ${focusRing} ${className}`}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span>Theme: {labelText}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className={`glass-effect p-3 rounded-full text-white hover:bg-white/20 gentle-animation cursor-pointer ${focusRing} ${className}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="sr-only">Current theme: {labelText}</span>
    </button>
  )
}
