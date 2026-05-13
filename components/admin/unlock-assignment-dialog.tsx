'use client'

/**
 * components/admin/unlock-assignment-dialog.tsx
 *
 * Wraps <EsignFormDialog/> for `PATCH /api/assignments/:id/unlock`.
 * Body: { reason, password }.
 *
 * The backend only accepts unlock for assignments in `LOCKED_OUT` state
 * (≥3 failed quiz submits). Calling this on any other state returns 400.
 */

import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { EsignFormDialog } from './esign-form-dialog'
import { unlockAssignment } from '@/lib/actions/admin'

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters.'),
  password: z.string().min(1, 'Password is required.'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  assignmentId: string
  traineeName?: string | null
  sopTitle?: string | null
  trigger: React.ReactNode
}

export function UnlockAssignmentDialog({
  assignmentId,
  traineeName,
  sopTitle,
  trigger,
}: Props) {
  const router = useRouter()

  const description =
    traineeName && sopTitle
      ? `Reset the lockout for ${traineeName} on "${sopTitle}" so they can retake the quiz. This is e-signed and recorded in the audit log.`
      : 'Reset this lockout so the trainee can retake the quiz. This is e-signed and recorded in the audit log.'

  return (
    <EsignFormDialog
      trigger={trigger}
      tooltip="Unlock (e-signed)"
      title="Unlock assignment"
      description={description}
      schema={schema}
      defaultValues={{ reason: '', password: '' }}
      submitLabel="Unlock"
      onSubmit={(values: FormValues) => unlockAssignment(assignmentId, values)}
      successToast="Assignment unlocked. Trainee can attempt the quiz again."
      onSuccess={() => router.refresh()}
    />
  )
}
