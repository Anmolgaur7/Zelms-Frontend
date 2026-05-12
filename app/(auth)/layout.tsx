/**
 * app/(auth)/layout.tsx
 *
 * Shared layout for all auth pages: login, set-password, change-password.
 * Centered card on a branded gradient background.
 */
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      {/* Theme toggle in the top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
              Kx
            </span>
            <span>Klonix</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Pharma Training LMS</p>
        </div>
        {children}
      </div>
    </div>
  )
}
