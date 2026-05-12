'use client'

/**
 * components/admin/sop-view-button.tsx
 *
 * Opens an SOP PDF in a new tab using a server-fetched signed URL.
 * Admin/trainer pages cannot link directly to `sop.fileUrl` because the
 * backend stores object keys, not public URLs.
 */

import { useTransition } from 'react'
import { toast } from 'sonner'
import { getSopSignedUrl } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EyeIcon, Loader2 } from 'lucide-react'

interface Props {
  sopId: string
  variant?: 'icon' | 'inline'
  /** Label for inline mode (defaults to "View PDF"). */
  label?: string
  /** Pre-known signed URL — when provided, skips the round-trip. */
  presignedUrl?: string | null
}

export function SopViewButton({
  sopId,
  variant = 'icon',
  label = 'View PDF',
  presignedUrl,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (presignedUrl) {
      window.open(presignedUrl, '_blank', 'noopener,noreferrer')
      return
    }

    startTransition(async () => {
      const result = await getSopSignedUrl(sopId)
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Could not load PDF.')
        return
      }
      window.open(result.data.sopDisplayUrl, '_blank', 'noopener,noreferrer')
    })
  }

  if (variant === 'inline') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <EyeIcon className="mr-2 h-3.5 w-3.5" />
        )}
        {label}
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
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
}
