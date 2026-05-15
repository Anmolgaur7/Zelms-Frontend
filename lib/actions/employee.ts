'use server'

/**
 * lib/actions/employee.ts
 *
 * Server actions used by the Employee Training Portal (/my-trainings/*).
 * Every call requires a tenant employee JWT (cookie 'pharma_token').
 *
 * Endpoints (see docs/FRONTEND_INTEGRATION.md):
 *   GET  /api/assignments/my            — list assigned trainings
 *   GET  /api/assignments/my-training   — extended training dashboard (when available)
 *   GET  /api/assignments/:id           — single assignment (quiz + SOP includes)
 *   POST /api/assignments/:id/submit    — submit quiz answers + e-signature
 *   GET  /api/assignments/:id/certificate — signed cert URL
 *   GET  /api/sops/                     — list company SOPs (self-study library)
 *   GET  /api/sops/:id                  — SOP details (when supported by backend)
 *   GET  /api/sops/:id/file             — signed PDF URL
 *   GET  /api/sops/:id/study            — AI summary + flashcards
 *   POST /api/sops/:id/chat             — AI Q&A against SOP context
 *   GET  /api/quizzes/sop/:sopId        — quizzes attached to an SOP
 */

import { api, ApiError } from '@/lib/api'
import type {
  Assignment,
  SOP,
  Quiz,
  StudyMaterials,
  QuizSubmitBody,
  QuizSubmitResponse,
} from '@/types/admin'

// ─── Internal helpers ─────────────────────────────────────────────────────────

export interface FetchError {
  message: string
  code: string
  status?: number
  requestId?: string
}

export type FetchResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: FetchError }

function toError(e: unknown): FetchError {
  if (e instanceof ApiError) {
    return {
      message: e.message,
      code: e.errorCode,
      status: e.status,
      requestId: e.requestId,
    }
  }
  return {
    message: e instanceof Error ? e.message : 'Unknown error',
    code: 'CLIENT_ERROR',
  }
}

function unwrapList<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>)[key])) {
    return (value as Record<string, T[]>)[key]
  }
  return []
}

// ─── Assignments ──────────────────────────────────────────────────────────────

/** Plain array shape preferred — `.fetch().error` lets the UI distinguish "no data" from "fetch failed". */
export async function fetchMyAssignments(): Promise<FetchResult<Assignment[]>> {
  try {
    const raw = await api.get<unknown>('/api/assignments/my')
    return { data: unwrapList<Assignment>(raw, 'assignments') }
  } catch (e) {
    console.error('[employee.fetchMyAssignments]', e)
    return { error: toError(e) }
  }
}

/** Convenience wrapper used by existing pages — returns [] on error. */
export async function getMyAssignments(): Promise<Assignment[]> {
  const result = await fetchMyAssignments()
  return result.data ?? []
}

export async function getMyTrainingDashboard(): Promise<Assignment[]> {
  try {
    const raw = await api.get<unknown>('/api/assignments/my-training')
    return unwrapList<Assignment>(raw, 'assignments')
  } catch (e) {
    console.error('[employee.getMyTrainingDashboard]', e)
    return []
  }
}

/**
 * The backend does not expose `GET /api/assignments/:id` for employees;
 * the list endpoint already includes the full `quiz.sop` shape. So we
 * fetch the list and resolve locally.
 */
export async function getAssignmentById(id: string): Promise<Assignment | null> {
  try {
    const raw = await api.get<unknown>('/api/assignments/my')
    const list = unwrapList<Assignment>(raw, 'assignments')
    return list.find((a) => a.id === id) ?? null
  } catch (e) {
    console.error('[employee.getAssignmentById]', e)
    return null
  }
}

export async function submitQuiz(
  assignmentId: string,
  body: QuizSubmitBody,
): Promise<FetchResult<QuizSubmitResponse>> {
  try {
    const data = await api.post<QuizSubmitResponse>(
      `/api/assignments/${assignmentId}/submit`,
      body,
    )
    return { data }
  } catch (e) {
    console.error('[employee.submitQuiz]', e)
    return { error: toError(e) }
  }
}

export async function getCertificate(
  assignmentId: string,
): Promise<{ signedUrl: string; expiresInSeconds?: number; assignmentId?: string } | null> {
  try {
    return await api.get<{ signedUrl: string; expiresInSeconds?: number; assignmentId?: string }>(
      `/api/assignments/${assignmentId}/certificate`,
    )
  } catch (e) {
    console.error('[employee.getCertificate]', e)
    return null
  }
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function getQuizzesBySop(sopId: string): Promise<Quiz[]> {
  try {
    const raw = await api.get<unknown>(`/api/quizzes/sop/${sopId}`)
    return unwrapList<Quiz>(raw, 'quizzes')
  } catch (e) {
    console.error('[employee.getQuizzesBySop]', e)
    return []
  }
}

/** Kept under the old name for any existing imports. */
export async function getQuizzesBySOP(sopId: string): Promise<Quiz[]> {
  return getQuizzesBySop(sopId)
}

// ─── SOP library (self-study) ────────────────────────────────────────────────

function buildSopQuery(opts?: {
  category?: string
  status?: SOP['status']
  search?: string
}): string {
  if (!opts) return ''
  const params = new URLSearchParams()
  if (opts.category && opts.category.trim())
    params.set('category', opts.category.trim())
  if (opts.status) params.set('status', opts.status)
  if (opts.search && opts.search.trim())
    params.set('search', opts.search.trim())
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function getAllSops(opts?: {
  category?: string
  status?: SOP['status']
  search?: string
}): Promise<SOP[]> {
  try {
    const raw = await api.get<unknown>(`/api/sops/${buildSopQuery(opts)}`)
    return unwrapList<SOP>(raw, 'sops')
  } catch (e) {
    console.error('[employee.getAllSops]', e)
    return []
  }
}

/** Distinct category list for the library filter chips. */
export async function getEmployeeSopCategories(): Promise<string[]> {
  try {
    const raw = await api.get<unknown>('/api/sops/')
    const list = unwrapList<SOP>(raw, 'sops')
    const set = new Set<string>()
    for (const s of list) {
      if (typeof s.category === 'string' && s.category.trim()) {
        set.add(s.category.trim())
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  } catch (e) {
    console.error('[employee.getEmployeeSopCategories]', e)
    return []
  }
}

/**
 * Backend does not expose `GET /api/sops/:id` either — resolve from the list.
 * Cheap enough for now; if it ever returns hundreds of SOPs we can revisit.
 */
export async function getSopById(sopId: string): Promise<SOP | null> {
  try {
    const list = await getAllSops()
    return list.find((s) => s.id === sopId) ?? null
  } catch (e) {
    console.error('[employee.getSopById]', e)
    return null
  }
}

/** Whether the current user may open this SOP (file/study/chat). */
export async function getSopAccessError(
  sopId: string,
): Promise<{ code: string; message: string } | null> {
  try {
    await api.get(`/api/sops/${sopId}/file`)
    return null
  } catch (e) {
    if (e instanceof ApiError) {
      return { code: e.errorCode, message: e.message }
    }
    return { code: 'UNKNOWN', message: 'This SOP is not available.' }
  }
}

/** Refresh just the signed PDF URL (called from client to extend the iframe before TTL). */
export async function refreshSopSignedUrl(
  sopId: string,
): Promise<{
  sopDisplayUrl: string | null
  expiresInSeconds: number | null
  accessError: { code: string; message: string } | null
}> {
  try {
    const raw = await api.get<{
      sopDisplayUrl?: string | null
      signedUrl?: string | null
      sopSignedUrlExpiresInSeconds?: number | null
      expiresInSeconds?: number | null
    }>(`/api/sops/${sopId}/file`)
    return {
      sopDisplayUrl: raw.sopDisplayUrl ?? raw.signedUrl ?? null,
      expiresInSeconds: raw.sopSignedUrlExpiresInSeconds ?? raw.expiresInSeconds ?? null,
      accessError: null,
    }
  } catch (e) {
    console.error('[employee.refreshSopSignedUrl]', e)
    if (e instanceof ApiError) {
      return {
        sopDisplayUrl: null,
        expiresInSeconds: null,
        accessError: { code: e.errorCode, message: e.message },
      }
    }
    return {
      sopDisplayUrl: null,
      expiresInSeconds: null,
      accessError: { code: 'UNKNOWN', message: 'Could not load SOP file.' },
    }
  }
}

// ─── Study materials & SOP AI chat ────────────────────────────────────────────

export async function getStudyMaterials(sopId: string): Promise<FetchResult<StudyMaterials>> {
  try {
    const data = await api.get<StudyMaterials>(`/api/sops/${sopId}/study`)
    return { data }
  } catch (e) {
    console.error('[employee.getStudyMaterials]', e)
    return { error: toError(e) }
  }
}

export async function askSopChat(
  sopId: string,
  question: string,
): Promise<FetchResult<{ answer: string }>> {
  if (question.trim().length < 3) {
    return { error: { message: 'Question must be at least 3 characters.', code: 'VALIDATION_ERROR' } }
  }
  try {
    const data = await api.post<{ answer: string }>(`/api/sops/${sopId}/chat`, { question })
    return { data }
  } catch (e) {
    console.error('[employee.askSopChat]', e)
    return { error: toError(e) }
  }
}
