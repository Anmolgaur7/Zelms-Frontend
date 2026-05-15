/**
 * SOP-related API error copy — docs/FRONTEND_IMPLEMENTATION_GUIDE.md §6
 */

export function formatSopUploadError(message: string, errorCode?: string): string {
  if (errorCode === 'SOP_DUPLICATE_TITLE_VERSION') {
    return 'An SOP with this title and version already exists. Change the title or version and try again.'
  }
  return message
}

export function formatSopStatusError(message: string, errorCode?: string): string {
  if (errorCode === 'SOP_ACTIVATION_FORBIDDEN') {
    return 'Only an administrator can publish (activate) an SOP. Ask an admin to publish this procedure.'
  }
  if (errorCode === 'SOP_INVALID_STATUS_TRANSITION') {
    return 'That status change is not allowed for this SOP.'
  }
  return message
}

/** TRAINER may not transition a non-ACTIVE SOP to ACTIVE (Phase 2). */
export function canUserActivateSop(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}
