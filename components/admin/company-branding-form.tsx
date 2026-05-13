'use client'

/**
 * components/admin/company-branding-form.tsx
 *
 * Client form for uploading the company logo. Reads the current logo (passed
 * from the server) and POSTs a multipart `file` field to /api/admin/company/logo.
 */

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UploadIcon, BuildingIcon } from 'lucide-react'

import { uploadCompanyLogo } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ACCEPT = 'image/png,image/jpeg'

export interface CompanyBrandingFormProps {
  initialLogoUrl?: string | null
  companyName: string
}

export function CompanyBrandingForm({
  initialLogoUrl,
  companyName,
}: CompanyBrandingFormProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl ?? null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handlePick = (file: File | null) => {
    setError(null)
    if (!file) {
      setPendingFile(null)
      setPreviewUrl(initialLogoUrl ?? null)
      return
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Logo must be a PNG or JPEG image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Logo must be smaller than 2 MB.')
      return
    }
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = () => {
    if (!pendingFile) {
      toast.error('Pick a PNG or JPEG first.')
      return
    }
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', pendingFile)

      const result = await uploadCompanyLogo(fd)
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Logo updated.')
      setPendingFile(null)
      if (inputRef.current) inputRef.current.value = ''
      // Pull fresh logoDisplayUrl into the sidebar/header.
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`${companyName} logo`}
              className="h-full w-full object-contain"
            />
          ) : (
            <BuildingIcon className="h-8 w-8 text-muted-foreground/60" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{companyName}</p>
          <p className="text-xs text-muted-foreground">
            PNG or JPEG, max 2 MB. Square images render best.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-logo">New logo</Label>
        <Input
          id="company-logo"
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          disabled={isPending}
          onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleUpload} disabled={!pendingFile || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" /> Upload logo
            </>
          )}
        </Button>
        {pendingFile && (
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => handlePick(null)}
          >
            Cancel
          </Button>
        )}
      </div>

    </div>
  )
}
