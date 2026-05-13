/**
 * app/(auth)/layout.tsx
 *
 * Shared layout for all auth pages: login, set-password, change-password.
 * Centered card on a branded gradient background.
 */
import type { Metadata } from 'next'

import { ZeavarWordmark } from '@/components/brand/zeavar-mark'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Account',
  description:
    'Secure sign-in and password management for ZEAVAR Pharma Training LMS — GxP-compliant pharma training.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-auth-shell p-4 overflow-hidden">
      {/* Decorative floating blobs — pure CSS, ignored by screen readers. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl opacity-70 motion-safe:animate-pulse-soft"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[hsl(199,89%,60%)]/15 blur-3xl motion-safe:animate-pulse-soft"
        style={{ animationDelay: '1.2s' }}
      />

      {/* Theme toggle in the top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md animate-fade-up motion-reduce:animate-none">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <ZeavarWordmark size="auth" className="max-w-full" />
          <p className="mt-3 text-sm text-muted-foreground">Pharma Training LMS</p>
        </div>
        {children}
      </div>
    </div>
  )
}
