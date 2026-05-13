'use client'

/**
 * components/admin/user-role-dialog.tsx
 *
 * Wraps <EsignFormDialog/> for `PATCH /api/admin/users/:id/role`.
 * Body: { role, reason }. NOTE: no password — reason-only e-sign.
 *
 * Authorisation rules enforced server-side (and mirrored here to keep the UI
 * honest):
 *
 *   - SUPER_ADMIN can promote/demote anyone in the tenant, including other
 *     SUPER_ADMINs, but the backend always returns 403 USER_ROLE_PROTECTED on
 *     a self-demotion attempt — we already hide the button for the current
 *     user one level up in `app/dashboard/users/page.tsx`.
 *   - ADMIN can manage EMPLOYEE | AUDITOR | TRAINER | ADMIN.
 *
 * The dropdown options are tailored to the actor's role so non-super-admins
 * never see `SUPER_ADMIN` (would always 403). When a SUPER_ADMIN row is shown
 * to an actor that isn't a SUPER_ADMIN, the page disables the trigger entirely.
 */

import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { EsignFormDialog } from './esign-form-dialog'
import { changeUserRole } from '@/lib/actions/admin'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types/auth'

const ALL_ROLES: UserRole[] = [
  'EMPLOYEE',
  'AUDITOR',
  'TRAINER',
  'ADMIN',
  'SUPER_ADMIN',
]

const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: 'Employee',
  AUDITOR: 'Auditor',
  TRAINER: 'Trainer',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
}

const schema = z.object({
  role: z.enum(ALL_ROLES as [UserRole, ...UserRole[]]),
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters.'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  userId: string
  userName: string
  currentRole: UserRole
  /** Role of the user issuing the change (drives the option set). */
  actorRole: UserRole
  trigger: React.ReactNode
}

function getAssignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'SUPER_ADMIN') return ALL_ROLES
  return ['EMPLOYEE', 'AUDITOR', 'TRAINER', 'ADMIN']
}

export function UserRoleDialog({
  userId,
  userName,
  currentRole,
  actorRole,
  trigger,
}: Props) {
  const router = useRouter()
  const assignable = getAssignableRoles(actorRole)
  // Pre-select the user's current role if the actor can choose it; otherwise
  // fall back to EMPLOYEE so they have to explicitly pick something else.
  const initialRole: UserRole = assignable.includes(currentRole)
    ? currentRole
    : assignable[0]

  return (
    <EsignFormDialog
      trigger={trigger}
      tooltip="Change role (audited)"
      title="Change role"
      description={`Update the role for ${userName}. Recorded in the audit log.`}
      requiresPassword={false}
      schema={schema}
      defaultValues={{ role: initialRole, reason: '' }}
      submitLabel="Save role change"
      onSubmit={(values: FormValues) => changeUserRole(userId, values)}
      successToast={(data) => {
        const role = (data as { role?: UserRole } | undefined)?.role
        return role
          ? `Role updated to ${ROLE_LABELS[role] ?? role}.`
          : 'Role updated.'
      }}
      onSuccess={() => router.refresh()}
      extraFields={(form) => (
        <div className="space-y-1.5">
          <Label htmlFor="user-role-select">
            New role <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.watch('role')}
            onValueChange={(v) =>
              form.setValue('role', v as UserRole, { shouldDirty: true })
            }
          >
            <SelectTrigger id="user-role-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignable.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Current role:{' '}
            <span className="font-medium">
              {ROLE_LABELS[currentRole] ?? currentRole}
            </span>
          </p>
        </div>
      )}
    />
  )
}
