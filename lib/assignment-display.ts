/**
 * Prefer Phase 1 “frozen at assign” SOP metadata when present (see
 * docs/FRONTEND_INTEGRATION.md §6), else live quiz → SOP fields.
 */

import type { Assignment } from '@/types/admin'

export function assignmentDisplaySop(ass: Assignment): {
  title: string
  version: string | null | undefined
  sopId: string | undefined
} {
  const snap = ass.assignedSopTitle?.trim()
  if (snap) {
    return {
      title: snap,
      version: ass.assignedSopVersion ?? undefined,
      sopId:
        ass.assignedSopId ??
        ass.sop?.id ??
        ass.quiz?.sop?.id ??
        ass.sopId ??
        undefined,
    }
  }
  return {
    title: ass.sop?.title ?? ass.quiz?.sop?.title ?? '—',
    version: ass.sop?.version ?? ass.quiz?.sop?.version,
    sopId: ass.sop?.id ?? ass.quiz?.sop?.id ?? ass.sopId ?? undefined,
  }
}

export function formatAssignmentActionError(
  message: string,
  errorCode?: string,
): string {
  if (errorCode === 'SOP_NOT_ASSIGNABLE') {
    return 'The linked SOP must be ACTIVE to create assignments. Activate the procedure or pick another SOP.'
  }
  if (errorCode === 'ASSIGNMENT_ALREADY_EXISTS') {
    return 'This employee already has an assignment for that quiz. Pick another SOP or unlock the existing row if appropriate.'
  }
  return message
}
