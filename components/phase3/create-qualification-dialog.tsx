'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { createQualification } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'
import { SearchSelect, useTenantUsers } from '@/components/phase3/search-select'
import { CatalogField } from '@/components/phase3/catalog-form'

const schema = z.object({
  subjectUserId: z.string().min(1),
  qualificationType: z.enum(['EMPLOYEE', 'TRAINER']),
  reason: z.string().min(10).trim(),
})

export function CreateQualificationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [userId, setUserId] = useState<string>()
  const { users, loading } = useTenantUsers()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: { qualificationType: 'EMPLOYEE' },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> New request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start qualification request</DialogTitle>
          <DialogDescription>
            Creates HOD then Head QA approval steps. Not tied to courses or
            induction — pick the subject employee below.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => {
            start(async () => {
              const r = await createQualification({
                ...v,
                subjectUserId: userId ?? v.subjectUserId,
              })
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Qualification request created')
              setOpen(false)
              if (r.data?.id) router.push(`/dashboard/qualifications/${r.data.id}`)
              else router.refresh()
            })
          })}
        >
          <CatalogField
            label="Subject employee"
            required
            error={errors.subjectUserId?.message}
          >
            <SearchSelect
              value={userId}
              onValueChange={(id) => {
                setUserId(id)
                setValue('subjectUserId', id, { shouldValidate: true })
              }}
              items={users}
              loading={loading}
              placeholder="Search users…"
              emptyText="No users found."
            />
          </CatalogField>
          <CatalogField label="Qualification type" required>
            <Select
              defaultValue="EMPLOYEE"
              onValueChange={(t: 'EMPLOYEE' | 'TRAINER') =>
                setValue('qualificationType', t)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="TRAINER">Trainer</SelectItem>
              </SelectContent>
            </Select>
          </CatalogField>
          <CatalogField
            label="Audit reason"
            required
            hint="Minimum 10 characters."
            error={errors.reason?.message}
          >
            <Textarea rows={3} {...register('reason')} />
          </CatalogField>
          <Button type="submit" disabled={pending || loading} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
