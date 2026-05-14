'use client'

/**
 * components/modals/create-assignment-modal.tsx
 *
 * Modal for assigning SOP training to a user.
 */

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createAssignment, getUsers, getSOPs, getQuizzesBySOP } from '@/lib/actions/admin'
import { formatAssignmentActionError } from '@/lib/assignment-display'
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
import { Loader2, ClipboardCheckIcon, CalendarIcon } from 'lucide-react'
import type { AdminUser, SOP } from '@/types/admin'

const schema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  sopId: z.string().min(1, 'Please select an SOP'),
  dueDate: z.string().optional(),
  reason: z.string().min(5, 'Audit reason must be at least 5 characters').trim(),
})
type FormValues = z.infer<typeof schema>

export function CreateAssignmentModal({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sops, setSops] = useState<SOP[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getUsers().then(setUsers)
      getSOPs().then((data) => setSops(data.filter((s) => s.status === 'ACTIVE')))
    }
  }, [open])

  const {
    handleSubmit,
    setValue,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      reset()
      setServerError(null)
    }
  }

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      // 1. Fetch quizzes for the selected SOP
      const quizzes = await getQuizzesBySOP(values.sopId)
      if (!quizzes || quizzes.length === 0) {
        setServerError('This SOP has no associated quizzes. Please create a quiz first.')
        return
      }

      // 2. Use the first available quiz (typically the most relevant one)
      const quizId = quizzes[0].id

      const result = await createAssignment({
        userId: values.userId,
        quizId,
        reason: values.reason,
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
      })

      if (result.error) {
        const msg = formatAssignmentActionError(
          result.error,
          result.errorCode,
        )
        setServerError(msg)
        toast.error(msg)
        return
      }

      toast.success('Assignment created successfully.')
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheckIcon className="h-5 w-5 text-primary" />
            Assign Training
          </DialogTitle>
          <DialogDescription>
            Assign an active SOP to an employee for mandatory training.
          </DialogDescription>
        </DialogHeader>

        <form id="create-assignment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* User Select */}
          <div className="space-y-1.5">
            <Label>Employee <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setValue('userId', v)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
          </div>

          {/* SOP Select */}
          <div className="space-y-1.5">
            <Label>SOP <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setValue('sopId', v)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select SOP" />
              </SelectTrigger>
              <SelectContent>
                {sops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} {s.version ? `(v${s.version})` : ''}
                  </SelectItem>
                ))}
                {sops.length === 0 && (
                  <div className="px-2 py-3 text-xs text-center text-muted-foreground italic">
                    No active SOPs found.
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.sopId && <p className="text-xs text-destructive">{errors.sopId.message}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="assign-due">
              Due Date <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Input
              id="assign-due"
              type="date"
              {...register('dueDate')}
              disabled={isPending}
            />
          </div>

          {/* Audit Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="assign-reason">
              Audit Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="assign-reason"
              {...register('reason')}
              placeholder="e.g. Mandatory annual retraining"
              disabled={isPending}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-4 border-t mt-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            id="modal-create-assignment-submit"
            type="submit"
            form="create-assignment-form"
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
            ) : (
              'Assign SOP'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
