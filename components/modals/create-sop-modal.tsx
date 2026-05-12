'use client'

/**
 * components/modals/create-sop-modal.tsx
 *
 * Modal for uploading a new SOP (Standard Operating Procedure).
 * Uses FormData for file upload.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createSOP } from '@/lib/actions/admin'
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
import { Loader2, FileUpIcon, FileTextIcon } from 'lucide-react'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim(),
  description: z.string().optional(),
  version: z.string().optional(),
  reason: z.string().min(5, 'Audit reason must be at least 5 characters').trim(),
})
type FormValues = z.infer<typeof schema>

export function CreateSOPModal({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      reset()
      setFile(null)
      setServerError(null)
    }
  }

  const onSubmit = (values: FormValues) => {
    if (!file) {
      toast.error('Please select an SOP file (PDF).')
      return
    }

    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('file', file)
      formData.append('reason', values.reason)
      if (values.description) formData.append('description', values.description)
      if (values.version) formData.append('version', values.version)

      const result = await createSOP(formData)

      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }

      toast.success(`SOP "${values.title}" uploaded successfully.`)
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUpIcon className="h-5 w-5 text-primary" />
            Upload SOP
          </DialogTitle>
          <DialogDescription>
            Add a new Standard Operating Procedure. Only PDF files are accepted.
          </DialogDescription>
        </DialogHeader>

        <form id="create-sop-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="sop-title">
              SOP Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sop-title"
              {...register('title')}
              placeholder="e.g. Cleanroom Entry Procedure"
              disabled={isPending}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Version */}
          <div className="space-y-1.5">
            <Label htmlFor="sop-version">
              Version <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Input
              id="sop-version"
              {...register('version')}
              placeholder="e.g. 1.0.2"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="sop-desc">
              Description{' '}
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Textarea
              id="sop-desc"
              {...register('description')}
              placeholder="Brief overview of the SOP…"
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-1.5">
            <Label htmlFor="sop-file">
              SOP File (PDF) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="sop-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
                disabled={isPending}
              />
              {file && (
                <div className="flex h-10 items-center justify-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  PDF
                </div>
              )}
            </div>
          </div>

          {/* Audit Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="sop-reason">
              Audit Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sop-reason"
              {...register('reason')}
              placeholder="e.g. New compliance requirement"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Required for the GxP audit trail. Min 5 characters.
            </p>
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-4 border-t mt-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            id="modal-create-sop-submit"
            type="submit"
            form="create-sop-form"
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</>
            ) : (
              'Upload SOP'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
