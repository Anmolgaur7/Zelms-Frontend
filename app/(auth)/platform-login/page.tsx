'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { platformLogin, type PlatformLoginBody } from '@/lib/actions/auth'
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
import { Loader2, Lock, Mail } from 'lucide-react'

const schema = z.object({
  identifier: z.string().min(1, 'Email is required').trim(),
  password: z.string().min(1, 'Password is required'),
})

export default function PlatformLoginPage() {
  return (
    <Suspense>
      <PlatformLoginForm />
    </Suspense>
  )
}

function PlatformLoginForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  return (
    <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle>Platform sign in</CardTitle>
        <CardDescription>
          SaaS operator access — cross-tenant assignments and audit.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit((values: PlatformLoginBody) => {
          start(async () => {
            const result = await platformLogin(values)
            if (result.error) {
              toastActionError(result.error, result.requestId)
              return
            }
            router.push('/platform/assignments')
            router.refresh()
          })
        })}
      >
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" {...register('identifier')} />
            </div>
            {errors.identifier && (
              <p className="text-xs text-destructive">{errors.identifier.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="password" className="pl-9" {...register('password')} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
