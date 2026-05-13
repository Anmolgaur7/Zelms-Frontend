'use client'

/**
 * components/theme-toggle.tsx
 *
 * Light / Dark / System theme switcher. Wraps `next-themes`.
 *
 *   <ThemeToggle />                 → one-click toggle (sun ↔ moon) — default
 *   <ThemeToggle variant="dropdown" /> → 3-way Light / Dark / System menu
 */

import * as React from 'react'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon, MonitorIcon, CheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  /** `switch` (default) is a one-click toggle; `dropdown` shows a 3-way menu. */
  variant?: 'dropdown' | 'switch'
  /** Icon button size — passed to <Button>. */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
}

export function ThemeToggle({
  variant = 'switch',
  size = 'icon',
  className,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // next-themes is client-only; avoid hydration mismatch by rendering a
  // neutral placeholder on first paint.
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={className}
        aria-label="Toggle theme"
      >
        <SunIcon className="h-4 w-4" />
      </Button>
    )
  }

  // ── Simple single-click toggle (default) ───────────────────────────────────
  if (variant === 'switch') {
    const isDark = resolvedTheme === 'dark'
    return (
      <Button
        variant="ghost"
        size={size}
        className={className}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? (
          <SunIcon className="h-4 w-4" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )}
      </Button>
    )
  }

  // ── Dropdown with Light / Dark / System (opt-in) ───────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={className}
          aria-label="Toggle theme"
        >
          <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <ThemeMenuItem
          label="Light"
          icon={SunIcon}
          active={theme === 'light'}
          onClick={() => setTheme('light')}
        />
        <ThemeMenuItem
          label="Dark"
          icon={MoonIcon}
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
        />
        <ThemeMenuItem
          label="System"
          icon={MonitorIcon}
          active={theme === 'system'}
          onClick={() => setTheme('system')}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeMenuItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active: boolean
  onClick: () => void
}) {
  return (
    <DropdownMenuItem onClick={onClick} className="cursor-pointer">
      <Icon className="mr-2 h-4 w-4" />
      <span className="flex-1">{label}</span>
      {active && <CheckIcon className="h-3.5 w-3.5 text-primary" />}
    </DropdownMenuItem>
  )
}
