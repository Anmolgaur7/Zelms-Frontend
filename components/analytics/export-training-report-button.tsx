'use client'

/**
 * components/analytics/export-training-report-button.tsx
 *
 * Triggers the server action that proxies `GET /api/export/training-report`,
 * then turns the base64 payload into a browser download. Kept as a tiny
 * client component because we need a real DOM click to trigger the save.
 */

import { useState, useTransition } from 'react'
import { DownloadIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toastActionError } from '@/lib/toast-action-error'
import { getTrainingReport } from '@/lib/actions/analytics'

export function ExportTrainingReportButton({
  className,
  size = 'sm',
}: {
  className?: string
  size?: 'default' | 'sm' | 'lg'
}) {
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  function downloadBase64(base64: string, mime: string, filename: string) {
    const byteString = atob(base64)
    const bytes = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Defer revoke so Safari has a chance to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function onClick() {
    if (busy || pending) return
    setBusy(true)
    startTransition(async () => {
      try {
        const { file, error } = await getTrainingReport()
        if (error || !file) {
          toastActionError(
            error?.message ?? 'Failed to export training report.',
            error?.requestId,
          )
          return
        }
        downloadBase64(file.base64, file.mimeType, file.filename)
        toast.success('Training report downloaded')
      } finally {
        setBusy(false)
      }
    })
  }

  const loading = busy || pending

  return (
    <Button
      size={size}
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4" />
      )}
      <span>Export training report</span>
    </Button>
  )
}
