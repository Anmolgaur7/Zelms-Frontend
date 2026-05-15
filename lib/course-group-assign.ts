import type { CourseGroupAssignResult, SkippedSopRef } from '@/types/phase3'

export function normalizeCourseGroupAssignResult(
  raw: CourseGroupAssignResult,
): {
  created: number
  skippedCount: number
  skippedDetails: SkippedSopRef[]
  quizzesAssigned: number
} {
  const skipped = raw.skippedSops
  if (Array.isArray(skipped)) {
    return {
      created: raw.created ?? 0,
      skippedCount: skipped.length,
      skippedDetails: skipped,
      quizzesAssigned: raw.quizzesAssigned ?? 0,
    }
  }
  return {
    created: raw.created ?? 0,
    skippedCount: typeof skipped === 'number' ? skipped : 0,
    skippedDetails: [],
    quizzesAssigned: raw.quizzesAssigned ?? 0,
  }
}
