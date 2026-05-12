'use client'

/**
 * components/modals/create-department-modal.tsx
 *
 * Modal overlay for creating a department.
 * Can be triggered from any page.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createDepartment } from '@/lib/actions/admin'
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
import { Loader2, PlusIcon } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  description: z.string().optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters').trim(),
})
type FormValues = z.infer<typeof schema>

export function CreateDepartmentModal({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) { reset(); setServerError(null) }
  }

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createDepartment(values)
      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(`Department "${values.name}" created.`)
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-primary" />
            New Department
          </DialogTitle>
          <DialogDescription>
            Create a department to organise employees and training assignments.
          </DialogDescription>
        </DialogHeader>

        <form id="create-dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="modal-dept-name">
              Department Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-dept-name"
              {...register('name')}
              placeholder="e.g. Quality Assurance"
              disabled={isPending}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-dept-desc">
              Description{' '}
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Textarea
              id="modal-dept-desc"
              {...register('description')}
              placeholder="Brief description of this department…"
              rows={2}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-dept-reason">
              Audit Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-dept-reason"
              {...register('reason')}
              placeholder="e.g. Restructuring Q2 2025"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Required for the GxP audit trail.</p>
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t mt-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            id="modal-create-dept-submit"
            type="submit"
            form="create-dept-form"
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
            ) : (
              'Create Department'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
