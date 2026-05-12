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
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
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
export interface Assignment {
  id: string
  userId: string
  sopId?: string
  quizId?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'OVERDUE'
  dueDate?: string | null
  deadline?: string | null
  completedAt?: string | null
  score?: number | null
  attempts?: number
  user?: Pick<AdminUser, 'name' | 'employeeId'>
  sop?: Pick<SOP, 'id' | 'title' | 'version' | 'fileUrl' | 'sopDisplayUrl'>
  quiz?: {
    id: string
    sop?: Pick<SOP, 'id' | 'title' | 'version' | 'fileUrl' | 'sopDisplayUrl'>
    questions?: QuizQuestion[]
  }
  createdAt: string
}

// ─── Pagination (common list wrapper) ────────────────────────────────────────
export interface PaginatedList<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
