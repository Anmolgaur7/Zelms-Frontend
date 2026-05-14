'use client'

/**
 * app/(auth)/change-password/page.tsx
 *
 * CRITICAL COMPLIANCE FLOW:
 * Users with mustChangePassword === true are blocked from ALL other routes
 * by middleware until they complete this page.
 *
 * - No sidebar, no navigation escape (except logout).
 * - On success: backend returns a NEW token → replace cookie → go to dashboard.
 * - API: POST /api/auth/change-password  { currentPassword, newPassword }
 *        Authorization: Bearer <current_token>
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { changePassword, logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Lock, Loader2, AlertTriangle, LogOut } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  })

type FormValues = z.infer<typeof schema>

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChangePasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoggingOut, startLogoutTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      if (result.error) {
        if (result.errorCode === 'AUTH_INVALID_CREDENTIALS') {
          setServerError('Current password is incorrect.')
        } else {
          setServerError(result.error)
        }
        return
      }

      toast.success('Password updated successfully! Welcome to ZEAVAR.')
      router.push('/dashboard')
      router.refresh()
    })
  }

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout()
    })
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-3 px-0 pb-4 pt-0">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Your account requires a password change before you can continue.
          </span>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Change Your Password</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Choose a strong password. You&apos;ll use it for all future logins.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 px-0">
          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {/* Current password */}
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current (Temporary) Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                {...register('currentPassword')}
                placeholder="Your temporary password"
                autoComplete="current-password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="change-new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="change-new-password"
                type="password"
                {...register('newPassword')}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <Label htmlFor="change-confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="change-confirm-password"
                type="password"
                {...register('confirmPassword')}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 px-0 pt-2">
          <Button
            id="change-password-submit"
            type="submit"
            className="w-full"
            disabled={isPending || isLoggingOut}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Update Password & Continue'
            )}
          </Button>

          <Button
            id="change-password-logout"
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleLogout}
            disabled={isPending || isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out instead
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
