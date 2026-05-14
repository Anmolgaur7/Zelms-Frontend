/**
 * app/(auth)/layout.tsx
 *
 * Shared layout for all auth pages: login, set-password, change-password.
 * Split view (reference): marketing column on large screens, form column with theme-aware surface.
 */
import type { Metadata } from 'next'

import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'
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
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2 lg:overflow-hidden">
      <AuthMarketingPanel className="hidden lg:flex" />

      <div className="relative flex min-h-dvh flex-col lg:min-h-screen lg:bg-card">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
          <div className="relative w-full max-w-md animate-fade-up motion-reduce:animate-none">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <ZeavarWordmark size="hero" className="max-w-full" />
              <p className="mt-2 text-center text-xs text-muted-foreground">Pharma Training LMS</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
