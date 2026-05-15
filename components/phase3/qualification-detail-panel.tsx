'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { BadgeCheckIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { decideQualificationStep } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'
import { CatalogField, CatalogFormActions } from '@/components/phase3/catalog-form'
import type { Qualification, QualificationStep } from '@/types/phase3'

function stepRoleLabel(step: QualificationStep): string {
  const raw = step.stepRole ?? step.role ?? 'Approval step'
  return String(raw).replace(/_/g, ' ')
}

function stepKey(step: QualificationStep, index: number): string {
  return step.id ?? `step-${index}`
}

const decideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().min(10).trim(),
  password: z.string().min(1),
})

export function QualificationDetailPanel({
  qualification,
}: {
  qualification: Qualification
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const steps = qualification.steps ?? []
  const pendingStep = steps.find(
    (s) => (s.status ?? '').toUpperCase() === 'PENDING',
  )

  const form = useForm<z.infer<typeof decideSchema>>({
    resolver: zodResolver(decideSchema),
    defaultValues: { decision: 'APPROVE' },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="card-hover shadow-soft border-border/80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BadgeCheckIcon className="h-4 w-4 text-primary" />
            Approval ladder
          </CardTitle>
          <CardDescription>
            {qualification.subject?.name ?? qualification.subjectUserId} ·{' '}
            {qualification.qualificationType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No steps returned.</p>
          ) : (
            steps.map((step, i) => {
              const status = (step.status ?? 'PENDING').toUpperCase()
              return (
                <div
                  key={stepKey(step, i)}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {step.sortOrder ?? i + 1}. {stepRoleLabel(step)}
                    </p>
                    {step.id ? (
                      <p className="text-xs text-muted-foreground font-mono">
                        {step.id.slice(0, 8)}…
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    variant={
                      status === 'APPROVED'
                        ? 'default'
                        : status === 'REJECTED'
                          ? 'destructive'
                          : 'outline'
                    }
                  >
                    {status}
                  </Badge>
                </div>
              )
            })
          )}
          <Badge variant="outline" className="mt-2">
            Overall: {qualification.status}
          </Badge>
        </CardContent>
      </Card>

      <Card className="card-hover shadow-soft border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Record decision</CardTitle>
          <CardDescription>
            {pendingStep
              ? `Pending step: ${stepRoleLabel(pendingStep)}`
              : 'No pending step — ladder complete or awaiting prior approval.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingStep ? (
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => {
                start(async () => {
                  if (!pendingStep.id) {
                    toast.error('Step id missing — refresh and try again.')
                    return
                  }
                  const r = await decideQualificationStep(
                    qualification.id,
                    pendingStep.id,
                    v,
                  )
                  if (r.error) {
                    toast.error(formatCatalogError(r.error, r.errorCode))
                    return
                  }
                  toast.success(`Step ${v.decision.toLowerCase()}d`)
                  form.reset({ decision: 'APPROVE', reason: '', password: '' })
                  router.refresh()
                })
              })}
            >
              <CatalogField label="Decision" required>
                <Select
                  defaultValue="APPROVE"
                  onValueChange={(d: 'APPROVE' | 'REJECT') =>
                    form.setValue('decision', d)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Approve</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </CatalogField>
              <CatalogField
                label="Audit reason"
                required
                error={form.formState.errors.reason?.message}
              >
                <Textarea rows={2} {...form.register('reason')} />
              </CatalogField>
              <CatalogField label="E-sign password" required>
                <Input type="password" autoComplete="current-password" {...form.register('password')} />
              </CatalogField>
              <CatalogFormActions>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit decision
                </Button>
              </CatalogFormActions>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to decide on this request right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
