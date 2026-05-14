'use client'

/**
 * app/(auth)/set-password/page.tsx
 *
 * First-time super admin password setup via invite link.
 * The invite URL contains ?token=<uuid> — we read it from searchParams.
 * After setting the password, redirect to /login to sign in normally.
 *
 * API: POST /api/auth/set-password { token, password }
 */

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

import { setPassword } from '@/lib/actions/auth'
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
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
// useSearchParams() forces CSR bailout; Next 15 requires a Suspense boundary
// around the part of the tree that reads search params during prerendering.
export default function SetPasswordPage() {
  return (
    <Suspense fallback={<SetPasswordSkeleton />}>
      <SetPasswordForm />
    </Suspense>
  )
}

function SetPasswordSkeleton() {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pb-4 pt-0">
        <CardTitle className="text-xl">Set Your Password</CardTitle>
        <CardDescription>Loading…</CardDescription>
      </CardHeader>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')

  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // No invite token in URL — show error
  if (!inviteToken) {
    return (
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Invalid Invite Link</CardTitle>
          <CardDescription>
            This link is missing or has expired. Contact your platform administrator.
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-0">
          <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (done) {
    return (
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-3 px-0 pt-0 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle>Password Set!</CardTitle>
          <CardDescription>
            Your account is now active. Sign in with your company code and employee ID.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center px-0">
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await setPassword({ token: inviteToken, password: values.password })
      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      setDone(true)
    })
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pb-6 pt-0">
        <CardTitle className="text-3xl font-bold tracking-tight">Set Your Password</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Create a strong password to activate your administrator account
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

          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                {...register('password')}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="pl-9"
                disabled={isPending}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                {...register('confirmPassword')}
                placeholder="Repeat your password"
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

        <CardFooter className="px-0 pt-2">
          <Button
            id="set-password-submit"
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting password…
              </>
            ) : (
              'Set Password & Activate Account'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
