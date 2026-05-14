import type { UserRole } from './auth'

// ─── User ──────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
  name: string
  employeeId: string
  role: UserRole
  email: string | null
  departmentId: string | null
  department?: { id: string; name: string } | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
  id: string
  name: string
  description?: string | null
  _count?: { users: number }
  createdAt?: string
}

// ─── Company ──────────────────────────────────────────────────────────────────
export interface Company {
  id: string
  name: string
  employeeIdPrefix: string
  licenseId: string
  logoUrl?: string | null
  logoDisplayUrl?: string | null
}

// ─── Create / Bulk ────────────────────────────────────────────────────────────
export interface CreateUserBody {
  name: string
  role: UserRole
  reason: string           // required for audit trail — min 5 chars
  email?: string           // optional — omit for floor workers
  employeeId?: string      // omit → auto PREFIX-n; digits → PREFIX+digits; else full string
  departmentId?: string
}

export interface CreateUserResponse {
  message: string
  userId: string
  employeeId: string
  temporaryPassword: string
  email?: string
}

export interface BulkUserEntry {
  name: string
  role: UserRole
  email?: string
  employeeId?: string
  departmentId?: string
}

export interface BulkCreateBody {
  reason: string
  users: BulkUserEntry[]
}

export interface BulkCreateResponse {
  message: string
  users: Array<{
    employeeId: string
    temporaryPassword: string
    email?: string
  }>
}

// ─── SOP ──────────────────────────────────────────────────────────────────────
export type SopStatus = 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'ARCHIVED'

/**
 * Query params for `GET /api/sops/`. All optional; backend supports filtering
 * by category, status, and a free-text search.
 */
export interface SopListQuery {
  category?: string
  status?: SopStatus
  search?: string
}

/** Status values that the e-sign status-change endpoint accepts. */
export const SOP_STATUS_VALUES: SopStatus[] = [
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'ARCHIVED',
]

export interface SOP {
  id: string
  title: string
  description?: string | null
  version?: string | null
  category?: string | null
  fileUrl?: string | null
  /** Short-lived signed URL (≈600 s) for opening the PDF in the browser. */
  sopDisplayUrl?: string | null
  sopSignedUrlExpiresInSeconds?: number | null
  status?: SopStatus
  /** When this row is a clone of another SOP (created via `POST /:id/revise`). */
  parentSopId?: string | null
  createdAt: string
  updatedAt?: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer?: string   // server hides this on employee fetches; admins may see it
  explanation?: string
}

export interface Quiz {
  id: string
  sopId?: string
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  sop?: Pick<SOP, 'id' | 'title' | 'version' | 'fileUrl' | 'sopDisplayUrl'>
  questions: QuizQuestion[]
  createdAt?: string
}

// ─── Study materials (AI summary + flashcards) ───────────────────────────────
export interface StudyFlashcard {
  question: string
  answer: string
}

export interface StudyMaterials {
  summary?: string | null
  keyPoints?: string[] | null
  flashcards?: StudyFlashcard[] | null
  /** Raw payload — backend shape can drift; keep a passthrough. */
  [key: string]: unknown
}

// ─── Quiz submission ──────────────────────────────────────────────────────────
export interface QuizSubmitBody {
  answers: Array<{ questionIndex: number; selectedAnswer: string }>
  signature: { value: string; meaning: string }
}

export interface QuizSubmitResponse {
  message?: string
  score?: number
  passed?: boolean
  passingScore?: number
  certificateUrl?: string | null
  assignmentId?: string
}

// ─── Assignment ───────────────────────────────────────────────────────────────
export type AssignmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'OVERDUE'
  | 'LOCKED_OUT'

export interface Assignment {
  id: string
  userId: string
  sopId?: string
  quizId?: string
  /** Phase 1 — frozen at assign time; prefer for audit/compliance display. */
  assignedSopId?: string | null
  assignedSopTitle?: string | null
  assignedSopVersion?: string | null
  assignedQuizDifficulty?: string | null
  status: AssignmentStatus
  dueDate?: string | null
  deadline?: string | null
  completedAt?: string | null
  score?: number | null
  passed?: boolean | null
  attempts?: number
  user?: Pick<AdminUser, 'name' | 'employeeId'> & { id?: string; email?: string | null }
  sop?: Pick<SOP, 'id' | 'title' | 'version' | 'fileUrl' | 'sopDisplayUrl'>
  quiz?: {
    id: string
    difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    sop?: Pick<SOP, 'id' | 'title' | 'version' | 'fileUrl' | 'sopDisplayUrl'>
    questions?: QuizQuestion[]
  }
  /** Resolved signed URL for the SOP PDF (populated by `/api/assignments/company`). */
  sopDisplayUrl?: string | null
  createdAt: string
  updatedAt?: string
}

// ─── Pagination (common list wrapper) ────────────────────────────────────────
export interface PaginatedList<T> {
  data: T[]
  total: number
  page: number
  /** Backend uses `limit`; some legacy callers still expect `pageSize`. */
  limit?: number
  pageSize?: number
}

// ─── Company assignment endpoints (tenant-only) ──────────────────────────────
export interface CompanyAssignmentStatsByStatus {
  PENDING?: number
  IN_PROGRESS?: number
  COMPLETED?: number
  FAILED?: number
  OVERDUE?: number
  LOCKED_OUT?: number
  /** Backend may add more keys we haven't typed yet. */
  [key: string]: number | undefined
}

export interface CompanyAssignmentStats {
  totalAssignments: number
  byStatus: CompanyAssignmentStatsByStatus
  /** §6a.1 — completed rows that passed. */
  completedPassedCount?: number
  /** §6a.1 — completed rows that failed. */
  completedFailedCount?: number
  /** §6a.1 — mean score among passed (0–100 integer per doc; may be ratio on older APIs). */
  averageScoreAmongPassed?: number | null
  /** §6a.1 — PENDING with deadline strictly before now. */
  overduePendingCount?: number
  /** §6a.1 — same idea as `byStatus.LOCKED_OUT` when provided explicitly. */
  lockedOutCount?: number
  traineesWithAssignments: number
  /** Legacy aliases (pre–§6a naming). */
  passed?: number
  failed?: number
  averageScore?: number | null
  overduePending?: number
  lockouts?: number
}

export interface AssignmentListQuery {
  page?: number
  limit?: number
  userId?: string
  assignmentId?: string
  status?: AssignmentStatus
  quizId?: string
  sopId?: string
  /** Trainee name contains (case-insensitive). */
  search?: string
  overdueOnly?: boolean
}

export type CompanyAssignmentList = PaginatedList<Assignment>

export interface TraineeProfile {
  id: string
  name: string
  employeeId: string
  email?: string | null
  role?: UserRole | string
  departmentId?: string | null
  department?: { id: string; name: string } | null
  isActive?: boolean
}

export interface TraineeSummary {
  byStatus: CompanyAssignmentStatsByStatus
  totalAssignments?: number
  completedPassedCount?: number
  completedFailedCount?: number
  averageScoreAmongPassed?: number | null
  passed?: number
  failed?: number
  averageScore?: number | null
  lastCompletedAt?: string | null
}

export interface TraineeDossier {
  trainee: TraineeProfile
  summary: TraineeSummary
  assignments: PaginatedList<Assignment>
}

// ─── Audit logs ──────────────────────────────────────────────────────────────
export interface AuditLogActor {
  id?: string
  name?: string | null
  employeeId?: string | null
  role?: string | null
  email?: string | null
}

export interface AuditLogEntry {
  id: string
  /** Stable event code, e.g. USER_CREATED, SOP_STATUS_CHANGED, ASSIGNMENT_SUBMITTED */
  action: string
  /** Entity affected by the event (e.g. "SOP", "User") */
  targetType?: string | null
  targetId?: string | null
  /** Human-readable reason captured at action time. */
  reason?: string | null
  /** Actor (admin/trainer/employee who performed the action). */
  user?: AuditLogActor | null
  actor?: AuditLogActor | null
  /** Network context. */
  ip?: string | null
  userAgent?: string | null
  /** Free-form payload — shape varies per event. */
  metadata?: Record<string, unknown> | null
  details?: Record<string, unknown> | null
  /** Cryptographic chain links (when backend exposes them). */
  hash?: string | null
  previousHash?: string | null
  createdAt: string
}

export interface AuditLogFeed {
  logs: AuditLogEntry[]
  page: number
  limit: number
  total?: number
  hasMore?: boolean
}

export interface AuditLogVerification {
  id: string
  /** Server returns `true` when the chain hash matches stored value. */
  valid: boolean
  /** Optional human note (e.g. "previousHash mismatch"). */
  message?: string | null
  computedHash?: string | null
  expectedHash?: string | null
}

// ─── Company logo response ────────────────────────────────────────────────────
export interface CompanyLogoResponse {
  message?: string
  logoUrl?: string | null
  logoDisplayUrl?: string | null
}
