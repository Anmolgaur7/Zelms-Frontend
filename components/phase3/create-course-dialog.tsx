'use client'

import { useEffect, useState, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCourse } from '@/lib/actions/phase3'
import { getSOPs } from '@/lib/actions/admin'
import { formatCatalogError } from '@/lib/phase3-errors'
import type { SOP } from '@/types/admin'

const schema = z.object({
  name: z.string().min(2).trim(),
  sopId: z.string().min(1, 'Select an SOP'),
  reason: z.string().min(5).trim(),
})

export function CreateCourseDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [sops, setSops] = useState<SOP[]>([])
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) getSOPs({ status: 'ACTIVE' }).then(setSops)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> New course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
          <DialogDescription>Links training to an ACTIVE SOP.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => {
            start(async () => {
              const r = await createCourse(v)
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Course created')
              setOpen(false)
              router.refresh()
            })
          })}
        >
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register('name')} />
          </div>
          <div className="space-y-1.5">
            <Label>SOP</Label>
            <Select onValueChange={(id) => setValue('sopId', id)}>
              <SelectTrigger>
                <SelectValue placeholder="Select SOP" />
              </SelectTrigger>
              <SelectContent>
                {sops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sopId && (
              <p className="text-xs text-destructive">{errors.sopId.message}</p>
            )}
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
