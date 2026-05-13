'use client'

/**
 * components/admin/bulk-assign-dialog.tsx
 *
 * Bulk-assign training to every user in a department.
 *
 * Backend contract (per `docs/API_ENDPOINTS.md` §Assignments):
 *
 *   POST /api/assignments/bulk-department
 *   body: { departmentId, quizId, dueDate?, reason }
 *
 * UX:
 *   1. Pick department → preview shows how many users are in it (`_count.users`).
 *   2. Pick an ACTIVE SOP → we resolve `quizId` via `getQuizzesBySOP` (first
 *      published quiz wins, matching the single-user flow).
 *   3. Optional due date + ≥10 char audit reason.
 *   4. Submit → toast the assignment count returned by the server.
 */

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, UsersIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Textarea } from '@/components/ui/textarea'

import {
  bulkAssignByDepartment,
  getDepartments,
  getSOPs,
  getQuizzesBySOP,
} from '@/lib/actions/admin'
import type { Department, SOP } from '@/types/admin'
import { bulkAssignedCount } from '@/types/quizzes'

const schema = z.object({
  departmentId: z.string().min(1, 'Pick a department'),
  sopId: z.string().min(1, 'Pick an SOP'),
  dueDate: z.string().optional(),
  reason: z
    .string()
    .min(10, 'Audit reason must be at least 10 characters')
    .trim(),
})
type FormValues = z.infer<typeof schema>

export function BulkAssignDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [departments, setDepartments] = useState<Department[]>([])
  const [sops, setSops] = useState<SOP[]>([])
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    getDepartments().then(setDepartments)
    getSOPs().then((rows) => setSops(rows.filter((s) => s.status === 'ACTIVE')))
  }, [open])

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      reset()
      setSelectedDept(null)
      setSelectedSop(null)
      setServerError(null)
    }
  }

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      // Resolve a quizId for the chosen SOP (same heuristic as the single-user
      // flow). If none exists the backend will reject anyway; we surface a
      // friendly message first.
      const quizzes = await getQuizzesBySOP(values.sopId)
      if (!quizzes || quizzes.length === 0) {
        setServerError(
          'This SOP has no published quiz yet. Create one before bulk-assigning.',
        )
        return
      }
      const quizId = (quizzes[0] as { id: string }).id

      const result = await bulkAssignByDepartment({
        departmentId: values.departmentId,
        quizId,
        reason: values.reason,
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
      })

      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }

      const count = bulkAssignedCount(result.data ?? null)
      const target = selectedDept?.name ?? 'the department'
      toast.success(
        count > 0
          ? `Assigned to ${count} user${count === 1 ? '' : 's'} in ${target}.`
          : `Bulk assignment created for ${target}.`,
      )
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Bulk assign training
          </DialogTitle>
          <DialogDescription>
            Assign an active SOP to every user in the selected department in
            one go.
          </DialogDescription>
        </DialogHeader>

        <form
          id="bulk-assign-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          {serverError ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          {/* Department */}
          <div className="space-y-1.5">
            <Label>
              Department <span className="text-destructive">*</span>
            </Label>
            <Select
              disabled={pending}
              onValueChange={(v) => {
                setValue('departmentId', v, { shouldValidate: true })
                setSelectedDept(departments.find((d) => d.id === v) ?? null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-center text-muted-foreground italic">
                    No departments yet.
                  </div>
                ) : (
                  departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                      {typeof d._count?.users === 'number'
                        ? ` (${d._count.users} user${
                            d._count.users === 1 ? '' : 's'
                          })`
                        : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.departmentId ? (
              <p className="text-xs text-destructive">
                {errors.departmentId.message}
              </p>
            ) : null}
            {selectedDept && typeof selectedDept._count?.users === 'number' ? (
              <p className="text-xs text-muted-foreground">
                This will create up to {selectedDept._count.users} assignment
                {selectedDept._count.users === 1 ? '' : 's'}. Users already
                holding this quiz will be skipped server-side.
              </p>
            ) : null}
          </div>

          {/* SOP */}
          <div className="space-y-1.5">
            <Label>
              SOP <span className="text-destructive">*</span>
            </Label>
            <Select
              disabled={pending}
              onValueChange={(v) => {
                setValue('sopId', v, { shouldValidate: true })
                setSelectedSop(sops.find((s) => s.id === v) ?? null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an active SOP" />
              </SelectTrigger>
              <SelectContent>
                {sops.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-center text-muted-foreground italic">
                    No active SOPs found.
                  </div>
                ) : (
                  sops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                      {s.version ? ` (v${s.version})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.sopId ? (
              <p className="text-xs text-destructive">{errors.sopId.message}</p>
            ) : null}
            {selectedSop?.category ? (
              <p className="text-xs text-muted-foreground">
                Category: {selectedSop.category}
              </p>
            ) : null}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-assign-due">
              Due date{' '}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="bulk-assign-due"
              type="date"
              disabled={pending}
              {...register('dueDate')}
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-assign-reason">
              Audit reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulk-assign-reason"
              rows={3}
              disabled={pending}
              placeholder="e.g. Quarterly mandatory retraining for the Quality Control department."
              {...register('reason')}
            />
            {errors.reason ? (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Recorded in the audit log.
              </p>
            )}
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-4 border-t mt-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="bulk-assign-form" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              'Assign to department'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
