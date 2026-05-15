'use client'

/**
 * components/admin/sop-status-dialog.tsx
 *
 * Wraps <EsignFormDialog/> for `PATCH /api/sops/:id/status`.
 * Body: { status, reason, password }.
 */

import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { EsignFormDialog } from './esign-form-dialog'
import { changeSopStatus } from '@/lib/actions/admin'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SOP_STATUS_VALUES, type SopStatus } from '@/types/admin'

const schema = z.object({
  status: z.enum(SOP_STATUS_VALUES as [SopStatus, ...SopStatus[]]),
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters.'),
  password: z.string().min(1, 'Password is required.'),
})

type FormValues = z.infer<typeof schema>

const STATUS_LABELS: Record<SopStatus, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

interface Props {
  sopId: string
  sopTitle: string
  currentStatus: SopStatus | null | undefined
  /** When false, ACTIVE is hidden (TRAINER cannot publish — Phase 2). */
  canActivate?: boolean
  trigger: React.ReactNode
}

export function SopStatusDialog({
  sopId,
  sopTitle,
  currentStatus,
  canActivate = true,
  trigger,
}: Props) {
  const router = useRouter()

  return (
    <EsignFormDialog
      trigger={trigger}
      tooltip="Change status (e-signed)"
      title="Change SOP status"
      description={`Update lifecycle status for "${sopTitle}". This is e-signed and recorded in the audit log.`}
      schema={schema}
      defaultValues={{
        status: (currentStatus ?? 'DRAFT') as SopStatus,
        reason: '',
        password: '',
      }}
      submitLabel="Save status change"
      destructive={false}
      onSubmit={(values: FormValues) => changeSopStatus(sopId, values)}
      successToast={(data) =>
        `SOP status changed to ${(data as { status?: SopStatus } | undefined)?.status ?? 'updated'}.`
      }
      onSuccess={() => router.refresh()}
      extraFields={(form) => (
        <div className="space-y-1.5">
          <Label htmlFor="sop-status-select">
            New status <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) =>
              form.setValue('status', v as SopStatus, { shouldDirty: true })
            }
          >
            <SelectTrigger id="sop-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOP_STATUS_VALUES.filter(
                (s) => s !== 'ACTIVE' || canActivate || currentStatus === 'ACTIVE',
              ).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentStatus && (
            <p className="text-[11px] text-muted-foreground">
              Current status: <span className="font-medium">{STATUS_LABELS[currentStatus]}</span>
            </p>
          )}
        </div>
      )}
    />
  )
}
