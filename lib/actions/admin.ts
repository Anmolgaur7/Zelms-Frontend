'use server'

/**
 * lib/actions/admin.ts
 * Server Actions for admin CRUD operations.
 * Called from server components (for reads) and client forms (for mutations).
 */

import { api, ApiError } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/auth'
import type {
  AdminUser,
  Department,
  Company,
  CreateUserBody,
  CreateUserResponse,
  BulkCreateBody,
  BulkCreateResponse,
  SOP,
  SopStatus,
  Assignment,
  AssignmentListQuery,
  AssignmentStatus,
  CompanyAssignmentList,
  CompanyAssignmentStats,
  TraineeDossier,
  AuditLogEntry,
  AuditLogFeed,
  AuditLogVerification,
  CompanyLogoResponse,
} from '@/types/admin'
import type { UserRole } from '@/types/auth'

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AdminUser[]> {
  try {
    const data = await api.get<AdminUser[] | { users: AdminUser[] }>('/api/admin/users')
    // Handle both array and wrapped shapes
    return Array.isArray(data) ? data : (data as { users: AdminUser[] }).users ?? []
  } catch {
    return []
  }
}

export async function createUser(
  body: CreateUserBody,
): Promise<ActionResult<CreateUserResponse>> {
  try {
    const data = await api.post<CreateUserResponse>('/api/admin/users', body)
    revalidatePath('/dashboard/users')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to create user.' }
  }
}

export async function bulkCreateUsers(
  body: BulkCreateBody,
): Promise<ActionResult<BulkCreateResponse>> {
  try {
    const data = await api.post<BulkCreateResponse>('/api/admin/users/bulk', body)
    revalidatePath('/dashboard/users')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Bulk import failed.' }
  }
}

// ─── Departments ──────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  try {
    const data = await api.get<Department[] | { departments: Department[] }>(
      '/api/admin/departments',
    )
    return Array.isArray(data) ? data : (data as { departments: Department[] }).departments ?? []
  } catch {
    return []
  }
}

export async function createDepartment(
  body: { name: string; description?: string; reason: string },
): Promise<ActionResult<Department>> {
  try {
    const data = await api.post<Department>('/api/admin/departments', body)
    revalidatePath('/dashboard/departments')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to create department.' }
  }
}

// ─── Company ──────────────────────────────────────────────────────────────────

export async function getCompany(): Promise<Company | null> {
  try {
    return await api.get<Company>('/api/admin/company')
  } catch (e) {
    console.error('[admin.getCompany]', e)
    return null
  }
}

/**
 * Multipart upload of the company logo (PNG/JPEG). Refreshes the dashboard
 * routes that show branding so the new logo appears immediately.
 */
export async function uploadCompanyLogo(
  formData: FormData,
): Promise<ActionResult<CompanyLogoResponse>> {
  try {
    const data = await api.postForm<CompanyLogoResponse>(
      '/api/admin/company/logo',
      formData,
    )
    // Sidebar header + every dashboard page reads getCompany().
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/company')
    return { data }
  } catch (e) {
    console.error('[admin.uploadCompanyLogo]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to upload logo.' }
  }
}

// ─── Audit log ────────────────────────────────────────────────────────────────

interface AuditFetchOpts {
  page?: number
  limit?: number
}

/**
 * Tenant-side audit feed: `GET /api/audit/company?page=&limit=`.
 * Tolerant of array or `{ logs, page, limit, total }` envelopes.
 */
export async function getAuditFeed(
  opts: AuditFetchOpts = {},
): Promise<AuditLogFeed> {
  const page = opts.page ?? 1
  const limit = opts.limit ?? 25
  try {
    const raw = await api.get<unknown>(
      `/api/audit/company?page=${page}&limit=${limit}`,
    )
    if (Array.isArray(raw)) {
      return { logs: raw as AuditLogEntry[], page, limit, total: raw.length }
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      const logs = Array.isArray(obj.logs)
        ? (obj.logs as AuditLogEntry[])
        : Array.isArray(obj.data)
        ? (obj.data as AuditLogEntry[])
        : []
      return {
        logs,
        page: typeof obj.page === 'number' ? obj.page : page,
        limit: typeof obj.limit === 'number' ? obj.limit : limit,
        total: typeof obj.total === 'number' ? obj.total : undefined,
        hasMore: typeof obj.hasMore === 'boolean' ? obj.hasMore : undefined,
      }
    }
    return { logs: [], page, limit, total: 0 }
  } catch (e) {
    console.error('[admin.getAuditFeed]', e)
    return { logs: [], page, limit, total: 0 }
  }
}

export async function getAuditEntry(id: string): Promise<AuditLogEntry | null> {
  try {
    return await api.get<AuditLogEntry>(`/api/audit/${id}`)
  } catch (e) {
    console.error('[admin.getAuditEntry]', e)
    return null
  }
}

export async function verifyAuditEntry(
  id: string,
): Promise<ActionResult<AuditLogVerification>> {
  try {
    const data = await api.get<AuditLogVerification>(`/api/audit/${id}/verify`)
    return { data }
  } catch (e) {
    console.error('[admin.verifyAuditEntry]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not verify entry.' }
  }
}

// ─── SOPs ─────────────────────────────────────────────────────────────────────

export async function getSOPs(): Promise<SOP[]> {
  try {
    const data = await api.get<SOP[] | { sops: SOP[] }>('/api/sops/')
    return Array.isArray(data) ? data : (data as { sops: SOP[] }).sops ?? []
  } catch {
    return []
  }
}

export async function createSOP(
  formData: FormData,
): Promise<ActionResult<SOP>> {
  try {
    const data = await api.postForm<SOP>('/api/sops/upload', formData)
    revalidatePath('/dashboard/sops')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to upload SOP.' }
  }
}

/**
 * Get a short-lived signed URL to view the SOP PDF in the browser.
 * Works for any authenticated tenant user. Use this from admin / trainer UIs
 * instead of trying to link directly to the storage key in `fileUrl`.
 */
export async function getSopSignedUrl(
  sopId: string,
): Promise<ActionResult<{ sopDisplayUrl: string; expiresInSeconds?: number }>> {
  try {
    const raw = await api.get<{
      sopDisplayUrl?: string | null
      signedUrl?: string | null
      sopSignedUrlExpiresInSeconds?: number | null
      expiresInSeconds?: number | null
    }>(`/api/sops/${sopId}/file`)
    const url = raw.sopDisplayUrl ?? raw.signedUrl
    if (!url) {
      return { error: 'No signed URL returned by server.', errorCode: 'NO_SIGNED_URL' }
    }
    return {
      data: {
        sopDisplayUrl: url,
        expiresInSeconds:
          raw.sopSignedUrlExpiresInSeconds ?? raw.expiresInSeconds ?? undefined,
      },
    }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not load PDF.' }
  }
}

// ─── Lifecycle mutations (e-signed) ──────────────────────────────────────────
//
// All four actions below correspond to privileged GxP operations. The backend
// records every call in the audit log together with the supplied `reason` (and
// the `password` re-auth proof when required).
//
//   - changeSopStatus     PATCH /api/sops/:id/status        password + reason
//   - reviseSop           POST  /api/sops/:id/revise        reason only
//   - unlockAssignment    PATCH /api/assignments/:id/unlock password + reason
//   - changeUserRole      PATCH /api/admin/users/:id/role   reason only
//
// The shared <EsignFormDialog/> on the client side enforces a ≥10-char reason
// (matching the backend zod schema). Errors are forwarded verbatim so the UI
// can show `INVALID_PASSWORD`, `VALIDATION_ERROR`, etc.

/** Body accepted by `PATCH /api/sops/:id/status`. */
export interface ChangeSopStatusBody {
  status: SopStatus
  reason: string
  password: string
}

export async function changeSopStatus(
  sopId: string,
  body: ChangeSopStatusBody,
): Promise<ActionResult<SOP>> {
  try {
    const data = await api.patch<SOP>(`/api/sops/${sopId}/status`, body)
    revalidatePath('/dashboard/sops')
    revalidatePath('/dashboard/assignments')
    return { data }
  } catch (e) {
    console.error('[admin.changeSopStatus]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not change SOP status.' }
  }
}

/** Body accepted by `POST /api/sops/:id/revise`. */
export interface ReviseSopBody {
  version: string
  reason: string
}

export async function reviseSop(
  sopId: string,
  body: ReviseSopBody,
): Promise<ActionResult<SOP>> {
  try {
    const data = await api.post<SOP>(`/api/sops/${sopId}/revise`, body)
    revalidatePath('/dashboard/sops')
    return { data }
  } catch (e) {
    console.error('[admin.reviseSop]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not revise SOP.' }
  }
}

/** Body accepted by `PATCH /api/assignments/:id/unlock`. */
export interface UnlockAssignmentBody {
  reason: string
  password: string
}

export async function unlockAssignment(
  assignmentId: string,
  body: UnlockAssignmentBody,
): Promise<ActionResult<Assignment>> {
  try {
    const data = await api.patch<Assignment>(
      `/api/assignments/${assignmentId}/unlock`,
      body,
    )
    // Many surfaces show locked-out rows; refresh all of them.
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${(data as Assignment).userId ?? ''}`)
    return { data }
  } catch (e) {
    console.error('[admin.unlockAssignment]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not unlock assignment.' }
  }
}

/** Body accepted by `PATCH /api/admin/users/:id/role`. */
export interface ChangeUserRoleBody {
  role: UserRole
  reason: string
}

export async function changeUserRole(
  userId: string,
  body: ChangeUserRoleBody,
): Promise<ActionResult<AdminUser>> {
  try {
    const data = await api.patch<AdminUser>(
      `/api/admin/users/${userId}/role`,
      body,
    )
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    return { data }
  } catch (e) {
    console.error('[admin.changeUserRole]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not change user role.' }
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export interface FetchError {
  path: string
  message: string
  code: string
  status?: number
}

export interface CompanyAssignmentsResult {
  list: CompanyAssignmentList
  stats: CompanyAssignmentStats | null
  error: FetchError | null
  statsError: FetchError | null
}

const EMPTY_LIST: CompanyAssignmentList = { data: [], total: 0, page: 1, limit: 25 }

function toFetchError(path: string, e: unknown): FetchError {
  if (e instanceof ApiError) {
    return { path, message: e.message, code: e.errorCode, status: e.status }
  }
  return {
    path,
    message: e instanceof Error ? e.message : 'Unknown error',
    code: 'CLIENT_ERROR',
  }
}

function buildCompanyQuery(q: AssignmentListQuery = {}): string {
  const params = new URLSearchParams()
  params.set('page', String(q.page ?? 1))
  params.set('limit', String(Math.min(Math.max(q.limit ?? 25, 1), 100)))
  if (q.userId) params.set('userId', q.userId)
  if (q.assignmentId) params.set('assignmentId', q.assignmentId)
  if (q.status) params.set('status', q.status)
  if (q.quizId) params.set('quizId', q.quizId)
  if (q.sopId) params.set('sopId', q.sopId)
  if (q.search) params.set('search', q.search)
  if (q.overdueOnly) params.set('overdueOnly', 'true')
  return params.toString()
}

/**
 * `GET /api/assignments/company` — paginated tenant-wide list.
 * Tenant token required (ADMIN | TRAINER | AUDITOR). Returns the documented
 * `{ data, total, page, limit }` shape directly.
 */
export async function getCompanyAssignments(
  query: AssignmentListQuery = {},
): Promise<{ list: CompanyAssignmentList; error: FetchError | null }> {
  const path = '/api/assignments/company'
  try {
    const raw = await api.get<CompanyAssignmentList>(`${path}?${buildCompanyQuery(query)}`)
    const data = Array.isArray(raw.data) ? raw.data : []
    return {
      list: {
        data,
        total: typeof raw.total === 'number' ? raw.total : data.length,
        page: typeof raw.page === 'number' ? raw.page : (query.page ?? 1),
        limit: typeof raw.limit === 'number' ? raw.limit : (query.limit ?? 25),
      },
      error: null,
    }
  } catch (e) {
    console.error('[admin.getCompanyAssignments]', e)
    return { list: { ...EMPTY_LIST, page: query.page ?? 1 }, error: toFetchError(path, e) }
  }
}

/**
 * `GET /api/assignments/company/stats` — KPI snapshot for the tenant.
 */
export async function getCompanyAssignmentStats(): Promise<{
  stats: CompanyAssignmentStats | null
  error: FetchError | null
}> {
  const path = '/api/assignments/company/stats'
  try {
    const raw = await api.get<CompanyAssignmentStats>(path)
    return { stats: raw, error: null }
  } catch (e) {
    console.error('[admin.getCompanyAssignmentStats]', e)
    return { stats: null, error: toFetchError(path, e) }
  }
}

/**
 * `GET /api/assignments/company/users/:userId` — per-user dossier.
 * Supports pagination + status filter on the inner `assignments` block.
 */
export async function getTraineeDossier(
  userId: string,
  opts: { page?: number; limit?: number; status?: AssignmentStatus } = {},
): Promise<{ dossier: TraineeDossier | null; error: FetchError | null }> {
  const path = `/api/assignments/company/users/${userId}`
  const params = new URLSearchParams()
  params.set('page', String(opts.page ?? 1))
  params.set('limit', String(Math.min(Math.max(opts.limit ?? 25, 1), 100)))
  if (opts.status) params.set('status', opts.status)

  try {
    const raw = await api.get<TraineeDossier>(`${path}?${params.toString()}`)
    return { dossier: raw, error: null }
  } catch (e) {
    console.error('[admin.getTraineeDossier]', e)
    return { dossier: null, error: toFetchError(path, e) }
  }
}

/**
 * One-shot fetch used by the `/dashboard/assignments` page server component:
 * list + stats in parallel, surfaces errors per call.
 */
export async function getCompanyAssignmentsPageData(
  query: AssignmentListQuery = {},
): Promise<CompanyAssignmentsResult> {
  const [listRes, statsRes] = await Promise.all([
    getCompanyAssignments(query),
    getCompanyAssignmentStats(),
  ])
  return {
    list: listRes.list,
    stats: statsRes.stats,
    error: listRes.error,
    statsError: statsRes.error,
  }
}

export async function getQuizzesBySOP(sopId: string): Promise<unknown[]> {
  try {
    return await api.get<unknown[]>(`/api/quizzes/sop/${sopId}`)
  } catch {
    return []
  }
}

export async function createAssignment(
  body: { userId: string; quizId: string; dueDate?: string; reason: string },
): Promise<ActionResult<Assignment>> {
  try {
    const data = await api.post<Assignment>('/api/assignments/', body)
    revalidatePath('/dashboard/assignments')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to create assignment.' }
  }
}
