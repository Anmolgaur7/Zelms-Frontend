'use client'

/**
 * components/modals/create-user-modal.tsx
 *
 * Modal overlay for creating a single user.
 * Triggered from any page via the trigger prop.
 * Shows one-time temporaryPassword in a highlighted section after success.
 */

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createUser, getDepartments } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  KeyRoundIcon,
  CopyIcon,
  CheckIcon,
  UserPlusIcon,
} from 'lucide-react'
import type { Department } from '@/types/admin'
import type { UserRole } from '@/types/auth'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  role: z.enum(['ADMIN', 'TRAINER', 'EMPLOYEE', 'AUDITOR'] as const),
  reason: z.string().min(5, 'Audit reason must be at least 5 characters').trim(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────
export function CreateUserModal({
  trigger,
}: {
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [departments, setDepartments] = useState<Department[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Load departments once the modal opens
  useEffect(() => {
    if (open) getDepartments().then(setDepartments)
  }, [open])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const resetState = () => {
    reset()
    setServerError(null)
    setCreatedPassword(null)
    setCreatedEmployeeId(null)
    setCopied(false)
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) resetState()
  }

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createUser({
        name: values.name,
        role: values.role as UserRole,
        reason: values.reason,
        ...(values.email ? { email: values.email } : {}),
        ...(values.employeeId ? { employeeId: values.employeeId } : {}),
        ...(values.departmentId ? { departmentId: values.departmentId } : {}),
      })

      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }

      setCreatedPassword(result.data!.temporaryPassword)
      setCreatedEmployeeId(result.data!.employeeId)
      toast.success(`User ${result.data!.employeeId} created successfully.`)
      router.refresh()
    })
  }

  const copyPassword = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlusIcon className="h-5 w-5 text-primary" />
            Add User
          </DialogTitle>
          <DialogDescription>
            Create a new employee account. A one-time temporary password will be generated.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 space-y-4">

            {/* ── One-time password reveal ─────────────────────── */}
            {createdPassword && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                <KeyRoundIcon className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-400">
                  User Created — Save This Password!
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Employee ID: <strong>{createdEmployeeId}</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-green-100 dark:bg-green-900 px-3 py-1.5 font-mono text-sm text-green-800 dark:text-green-200 break-all">
                      {createdPassword}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyPassword}
                      className="h-8 w-8 shrink-0"
                    >
                      {copied
                        ? <CheckIcon className="h-4 w-4 text-green-600" />
                        : <CopyIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ⚠ This password will not be shown again. Share it securely.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* ── Error ───────────────────────────────────────── */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* ── Form ────────────────────────────────────────── */}
            <form id="create-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-user-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-user-name"
                  {...register('name')}
                  placeholder="e.g. Jane Smith"
                  disabled={isPending}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-user-role">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(v) => setValue('role', v as FormValues['role'])}
                  disabled={isPending}
                >
                  <SelectTrigger id="modal-user-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="TRAINER">Trainer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-user-email">
                  Email{' '}
                  <span className="text-muted-foreground text-xs font-normal">
                    (optional — omit for floor workers)
                  </span>
                </Label>
                <Input
                  id="modal-user-email"
                  type="email"
                  {...register('email')}
                  placeholder="user@company.com"
                  disabled={isPending}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Employee ID */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-user-empid">
                  Employee ID{' '}
                  <span className="text-muted-foreground text-xs font-normal">
                    (optional — auto-assigned if blank)
                  </span>
                </Label>
                <Input
                  id="modal-user-empid"
                  {...register('employeeId')}
                  placeholder="Blank → PREFIX-n, digits → PREFIX-42"
                  disabled={isPending}
                />
              </div>

              {/* Department */}
              {departments.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="modal-user-dept">
                    Department{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue('departmentId', v)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="modal-user-dept">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Audit reason */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-user-reason">
                  Reason for Creation <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="modal-user-reason"
                  {...register('reason')}
                  placeholder="e.g. New hire onboarding — Q2 2025 batch"
                  rows={2}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Required for the GxP audit trail. Min 5 characters.
                </p>
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason.message}</p>
                )}
              </div>
            </form>
          </div>
        </ScrollArea>

        {/* ── Footer actions ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4 bg-muted/30">
          {createdPassword ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Done — Close
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                id="modal-create-user-submit"
                type="submit"
                form="create-user-form"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
