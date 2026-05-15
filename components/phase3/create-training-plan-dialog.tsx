'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, PlusIcon } from 'lucide-react'
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
import { createTrainingPlan } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'

const schema = z.object({
  title: z.string().min(2).trim(),
  calendarYear: z.coerce.number().int().min(2020).max(2100),
  reason: z.string().min(5).trim(),
})

export function CreateTrainingPlanDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const year = new Date().getFullYear()
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: { calendarYear: year },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> New plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create training plan</DialogTitle>
          <DialogDescription>
            Yearly planner starts in DRAFT. Add line items on the plan detail page.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => {
            start(async () => {
              const r = await createTrainingPlan(v)
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Training plan created')
              setOpen(false)
              if (r.data?.id) router.push(`/dashboard/training-plans/${r.data.id}`)
              else router.refresh()
            })
          })}
        >
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="2026 GMP training plan" />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Calendar year</Label>
            <Input type="number" {...register('calendarYear')} />
          </div>
          <div className="space-y-1.5">
            <Label>Audit reason</Label>
            <Textarea rows={2} {...register('reason')} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
