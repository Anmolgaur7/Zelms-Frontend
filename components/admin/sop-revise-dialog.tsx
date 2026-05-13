'use client'

/**
 * components/admin/sop-revise-dialog.tsx
 *
 * Wraps <EsignFormDialog/> for `POST /api/sops/:id/revise`.
 * Body: { version, reason }. NOTE: no password — reason-only e-sign.
 *
 * The server clones the current SOP row into a new DRAFT linked via
 * `parentSopId`. The new row will need its own status change to ACTIVE later.
 */

import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { EsignFormDialog } from './esign-form-dialog'
import { reviseSop } from '@/lib/actions/admin'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  version: z
    .string()
    .trim()
    .min(1, 'Version is required.')
    .max(64, 'Version too long.'),
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters.'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  sopId: string
  sopTitle: string
  currentVersion?: string | null
  trigger: React.ReactNode
}

function suggestNextVersion(current?: string | null): string {
  if (!current) return '1.1'
  // Try numeric bump on the LAST dot-separated segment.
  const parts = current.split('.')
  const last = parts[parts.length - 1]
  const m = last.match(/^(\d+)([^\d]*)$/)
  if (m) {
    parts[parts.length - 1] = `${Number(m[1]) + 1}${m[2]}`
    return parts.join('.')
  }
  return `${current}-revB`
}

export function SopReviseDialog({
  sopId,
  sopTitle,
  currentVersion,
  trigger,
}: Props) {
  const router = useRouter()

  return (
    <EsignFormDialog
      trigger={trigger}
      tooltip="Revise (creates a new DRAFT)"
      title="Revise SOP"
      description={`Clone "${sopTitle}" as a new DRAFT to start the next revision. The current SOP remains unchanged until you change its status separately.`}
      requiresPassword={false}
      schema={schema}
      defaultValues={{
        version: suggestNextVersion(currentVersion),
        reason: '',
      }}
      submitLabel="Create draft revision"
      onSubmit={(values: FormValues) => reviseSop(sopId, values)}
      successToast="Draft revision created."
      onSuccess={() => router.refresh()}
      extraFields={(form) => (
        <div className="space-y-1.5">
          <Label htmlFor="sop-revise-version">
            New version <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sop-revise-version"
            placeholder="e.g. 1.1 or 2.0-revA"
            {...form.register('version')}
          />
          {currentVersion && (
            <p className="text-[11px] text-muted-foreground">
              Cloning from version <span className="font-mono">{currentVersion}</span>.
            </p>
          )}
          {form.formState.errors.version && (
            <p className="text-xs text-red-600">
              {String(form.formState.errors.version.message)}
            </p>
          )}
        </div>
      )}
    />
  )
}
