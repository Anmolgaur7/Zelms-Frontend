'use client'

/**
 * app/(auth)/login/page.tsx
 *
 * Tenant login — three fields: Company Code, Employee ID, Password.
 * Docs rule: organization = employeeIdPrefix OR licenseId (NOT the UUID).
 * On mustChangePassword, middleware will redirect to /change-password.
 */

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { tenantLogin } from '@/lib/actions/auth'
import { toastActionError } from '@/lib/toast-action-error'
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
import { AuthTrustBadges } from '@/components/auth/auth-trust-badges'
import { ArrowRight, Building2, IdCard, Loader2, Lock } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  organization: z
    .string()
    .min(1, 'Company code is required')
    .trim(),
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .trim(),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
// Next 15 requires a Suspense boundary around useSearchParams() so the page
// can be rendered without query strings during prerendering.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pb-2 pt-0">
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded bg-muted" />
      </CardHeader>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await tenantLogin(values)

      if (result.error) {
        // Show inline error for credential failures
        if (
          result.errorCode === 'AUTH_INVALID_CREDENTIALS' ||
          result.errorCode === 'AUTH_NOT_VERIFIED' ||
          result.errorCode === 'ACCOUNT_SUSPENDED'
        ) {
          setServerError(result.error)
        } else {
          toastActionError(result.error, result.requestId)
        }
        return
      }

      // Middleware handles redirecting based on role / mustChangePassword
      const from = searchParams.get('from') ?? '/dashboard'
      router.push(from)
      router.refresh()
    })
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pb-6 pt-0">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Employee portal
        </p>
        <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Sign in with your company credentials to continue your training.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 px-0 pb-2">
          {/* Server-level error banner */}
          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive animate-fade-up motion-reduce:animate-none"
            >
              {serverError}
            </div>
          )}

          {/* Company Code */}
          <div className="space-y-1.5">
            <Label htmlFor="organization">Company Code</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="organization"
                {...register('organization')}
                placeholder="e.g. ACME"
                autoComplete="organization"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.organization && (
              <p className="text-xs text-destructive">{errors.organization.message}</p>
            )}
          </div>

          {/* Employee ID */}
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Employee ID</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="employeeId"
                {...register('employeeId')}
                placeholder="e.g. ACME-2"
                autoComplete="username"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.employeeId && (
              <p className="text-xs text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-0 px-0 pt-0">
          <Button
            id="tenant-login-submit"
            type="submit"
            className="group h-12 w-full gap-2 text-[0.9375rem] shadow-md shadow-primary/25 transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-lg hover:shadow-primary/30 active:translate-y-0"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
          <AuthTrustBadges />
        </CardFooter>
      </form>
    </Card>
  )
}
