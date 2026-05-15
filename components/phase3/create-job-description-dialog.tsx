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
import { createJobDescription } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'

const schema = z.object({
  code: z.string().min(2).trim(),
  title: z.string().min(2).trim(),
  description: z.string().optional(),
  reason: z.string().min(5).trim(),
})

export function CreateJobDescriptionDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.infer<typeof schema>
  >({ resolver: zodResolver(schema) })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> New JD
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create job description</DialogTitle>
          <DialogDescription>
            Define a role matrix — link required courses and assign users on the
            detail page.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => {
            start(async () => {
              const r = await createJobDescription(v)
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Job description created')
              setOpen(false)
              if (r.data?.id) router.push(`/dashboard/job-descriptions/${r.data.id}`)
              else router.refresh()
            })
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input {...register('code')} placeholder="QA-01" />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register('title')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea rows={2} {...register('description')} />
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
