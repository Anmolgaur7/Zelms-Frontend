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
import { createCourseGroup } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'

const schema = z.object({
  name: z.string().min(2).trim(),
  description: z.string().optional(),
  reason: z.string().min(5).trim(),
})

export function CreateCourseGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> New group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create course group</DialogTitle>
          <DialogDescription>
            A group bundles several courses. After creating, open the group to
            add courses and assign a department.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => {
            start(async () => {
              const r = await createCourseGroup(v)
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Course group created')
              setOpen(false)
              const id = r.data?.id
              if (id) {
                router.push(`/dashboard/course-groups/${id}`)
              } else {
                router.refresh()
              }
            })
          })}
        >
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea rows={2} {...register('description')} />
          </div>
          <div className="space-y-1.5">
            <Label>Audit reason</Label>
            <Textarea rows={2} {...register('reason')} />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
