'use client'

/**
 * lib/toast-action-error.ts
 *
 * Phase 8 — surface `requestId` from failed server actions in Sonner toasts so
 * support can correlate with backend logs (`x-request-id`).
 */

import { toast } from 'sonner'

export function toastActionError(message: string, requestId?: string | null) {
  const rid = requestId?.trim()
  if (rid) {
    toast.error(message, {
      description: `Request ID: ${rid}`,
      duration: 12_000,
    })
  } else {
    toast.error(message)
  }
}
