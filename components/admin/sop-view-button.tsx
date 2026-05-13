'use client'

/**
 * components/admin/sop-view-button.tsx
 *
 * Opens the SOP PDF in a modal (iframe) after fetching a signed URL.
 * Admin/trainer pages cannot link directly to `sop.fileUrl` because the
 * backend stores object keys, not public URLs.
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { getSopSignedUrl } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExternalLinkIcon, EyeIcon, Loader2 } from 'lucide-react'

interface Props {
  sopId: string
  variant?: 'icon' | 'inline'
  /** Label for inline mode (defaults to "View PDF"). */
  label?: string
  /** Pre-known signed URL — when provided, skips the round-trip. */
  presignedUrl?: string | null
}

function pdfIframeSrc(url: string): string {
  const u = url.includes('#') ? url : `${url}#toolbar=0&view=FitH`
  return u
}

export function SopViewButton({
  sopId,
  variant = 'icon',
  label = 'View PDF',
  presignedUrl,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const beginLoad = () => {
    setOpen(true)
    setLoadError(null)
    if (presignedUrl) {
      setPdfUrl(presignedUrl)
      return
    }
    setPdfUrl(null)
    startTransition(async () => {
      const result = await getSopSignedUrl(sopId)
      if (result.error || !result.data) {
        const msg = result.error ?? 'Could not load PDF.'
        setLoadError(msg)
        toast.error(msg)
        return
      }
      setPdfUrl(result.data.sopDisplayUrl)
    })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setPdfUrl(null)
      setLoadError(null)
    }
  }

  const triggerButton =
    variant === 'inline' ? (
      <Button variant="outline" size="sm" onClick={beginLoad} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <EyeIcon className="mr-2 h-3.5 w-3.5" />
        )}
        {label}
      </Button>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={beginLoad}
              disabled={isPending}
              aria-label={label}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

  return (
    <>
      {triggerButton}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[min(92vh,900px)] w-[min(96vw,1100px)] max-w-[min(96vw,1100px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1100px)]"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 pr-12 text-left">
            <DialogTitle className="text-base">SOP document</DialogTitle>
            <DialogDescription className="text-xs">
              Signed link expires after a short time. Use “Open in new tab” if the
              embedded viewer is blocked by your browser.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[min(75vh,720px)] flex-1 bg-muted/40">
            {loadError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 p-6 text-center text-sm text-destructive">
                {loadError}
              </div>
            )}
            {!loadError && open && !pdfUrl && isPending && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                Loading PDF…
              </div>
            )}
            {pdfUrl && (
              <iframe
                title="SOP PDF"
                src={pdfIframeSrc(pdfUrl)}
                className="h-[min(75vh,720px)] w-full border-0 bg-background"
              />
            )}
          </div>

          {pdfUrl && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t px-4 py-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
