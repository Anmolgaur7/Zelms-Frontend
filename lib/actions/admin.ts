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
  Assignment,
} from '@/types/admin'

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
  } catch {
    return null
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

// ─── Assignments ──────────────────────────────────────────────────────────────

// The backend does not document a single "list all assignments" endpoint for
// admins. We probe known candidates in order, then fall back to deriving the
// list from /api/analytics/compliance (which returns per-user training rows).
const ADMIN_ASSIGNMENT_LIST_ENDPOINTS = [
  '/api/assignments/',
  '/api/assignments',
  '/api/admin/assignments',
  '/api/admin/assignments/',
  '/api/analytics/compliance',
] as const

export interface AdminAssignmentsResult {
  data: Assignment[]
  errors: Array<{ path: string; message: string; code: string; status?: number }>
  endpointUsed: string | null
}

/** Try every known key on which a payload might hide the assignment array. */
function extractAssignments(raw: unknown): Assignment[] | null {
  if (Array.isArray(raw)) return raw as Assignment[]
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>

  // Common envelope keys
  for (const key of ['assignments', 'data', 'items', 'results', 'rows', 'records']) {
    const v = obj[key]
    if (Array.isArray(v)) return v as Assignment[]
  }

  // Analytics-style: { users: [{ assignments: [...] }] } → flatten
  if (Array.isArray(obj.users)) {
    const flattened: Assignment[] = []
    for (const user of obj.users as Array<Record<string, unknown>>) {
      const userAssignments = user.assignments
      if (Array.isArray(userAssignments)) {
        for (const a of userAssignments as Assignment[]) {
          flattened.push({
            ...a,
            user: a.user ?? {
              name: (user.name as string) ?? '',
              employeeId: (user.employeeId as string) ?? '',
            },
          })
        }
      }
    }
    if (flattened.length > 0 || obj.users.length > 0) return flattened
  }

  return null
}

export async function fetchAssignments(): Promise<AdminAssignmentsResult> {
  const errors: AdminAssignmentsResult['errors'] = []

  for (const path of ADMIN_ASSIGNMENT_LIST_ENDPOINTS) {
    try {
      const raw = await api.get<unknown>(path)
      const list = extractAssignments(raw)
      if (list !== null) {
        return { data: list, errors, endpointUsed: path }
      }
      // Endpoint responded 2xx but in an unexpected shape — record and keep probing.
      errors.push({
        path,
        message: 'Unexpected response shape (no assignment array found).',
        code: 'UNEXPECTED_SHAPE',
        status: 200,
      })
    } catch (e) {
      if (e instanceof ApiError) {
        errors.push({ path, message: e.message, code: e.errorCode, status: e.status })
        // Auth / permission errors mean we shouldn't keep probing — stop.
        if (e.status === 401 || e.status === 403) break
      } else {
        errors.push({
          path,
          message: e instanceof Error ? e.message : 'Unknown error',
          code: 'CLIENT_ERROR',
        })
        break
      }
    }
  }

  console.error('[admin.fetchAssignments] all endpoints failed', errors)
  return { data: [], errors, endpointUsed: null }
}

export async function getAssignments(): Promise<Assignment[]> {
  const result = await fetchAssignments()
  return result.data
}

export async function getQuizzesBySOP(sopId: string): Promise<any[]> {
  try {
    return await api.get<any[]>(`/api/quizzes/sop/${sopId}`)
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
