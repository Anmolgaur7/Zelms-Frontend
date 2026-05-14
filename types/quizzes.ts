/**
 * types/quizzes.ts
 *
 * Quiz authoring + bulk-assignment payloads. Postman E2E reference:
 *
 *   POST /api/quizzes/manual
 *   {
 *     "sopId": "...",
 *     "difficulty": "BASIC",
 *     "questions": [
 *       {
 *         "question": "...",
 *         "options": ["A", "B", "C", "D"],
 *         "correctAnswer": "B",
 *         "explanation": "..."
 *       }
 *     ]
 *   }
 *
 *   POST /api/assignments/bulk-department
 *   {
 *     "departmentId": "...",
 *     "quizId": "...",
 *     "dueDate"?: "YYYY-MM-DD",
 *     "reason": "..."
 *   }
 */

// ─── Manual quiz authoring ─────────────────────────────────────────────────

export type QuizDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = [
  'BASIC',
  'INTERMEDIATE',
  'ADVANCED',
]

export interface ManualQuizQuestion {
  question: string
  options: string[]
  /** Must exactly match one of `options`. */
  correctAnswer: string
  explanation?: string
}

export interface ManualQuizBody {
  sopId: string
  difficulty: QuizDifficulty
  questions: ManualQuizQuestion[]
}

/** Loose response — backend has no documented shape; we only need the id. */
export interface ManualQuizResponse {
  id?: string
  quizId?: string
  sopId?: string
  questionsCount?: number
  [key: string]: unknown
}

// ─── Bulk department assignment ────────────────────────────────────────────

export interface BulkAssignmentBody {
  departmentId: string
  quizId: string
  dueDate?: string
  reason: string
}

export interface BulkAssignmentResult {
  /** Backend may return `assigned`, `created`, `skipped`, or `count`. Aliased. */
  assigned?: number
  created?: number
  skipped?: number
  /** §6a / API — users in department (bulk-department response). */
  departmentUserCount?: number
  count?: number
  /** Some implementations return the list of created assignment IDs. */
  assignmentIds?: string[]
  message?: string
  [key: string]: unknown
}

export function bulkAssignedCount(r: BulkAssignmentResult | null): number {
  if (!r) return 0
  return (
    r.assigned ??
    r.created ??
    r.count ??
    (Array.isArray(r.assignmentIds) ? r.assignmentIds.length : 0) ??
    0
  )
}
