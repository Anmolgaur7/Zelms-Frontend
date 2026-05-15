'use server'

/**
 * Platform operator APIs — Phase 3 (PLATFORM_ADMIN JWT).
 * See docs/API_ENDPOINTS.md § Platform
 */

import { api, ApiError } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/auth'
import type {
  PlatformAssignmentsList,
  PlatformAssignmentStats,
  PlatformCompaniesStatsList,
  PlatformAuditFeed,
} from '@/types/platform'
import type { AssignmentStatus } from '@/types/admin'

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    sp.set(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export async function getPlatformAssignments(query?: {
  page?: number
  limit?: number
  companyId?: string
  status?: AssignmentStatus
  userId?: string
  quizId?: string
  sopId?: string
  search?: string
}): Promise<{
  list: PlatformAssignmentsList
  error: { message: string; code: string } | null
}> {
  const empty: PlatformAssignmentsList = {
    page: 1,
    limit: 25,
    total: 0,
    data: [],
  }
  try {
    const list = await api.get<PlatformAssignmentsList>(
      `/api/platform/assignments${buildQuery({
        page: query?.page ?? 1,
        limit: query?.limit ?? 25,
        companyId: query?.companyId,
        status: query?.status,
        userId: query?.userId,
        quizId: query?.quizId,
        sopId: query?.sopId,
        search: query?.search,
      })}`,
    )
    return { list, error: null }
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        list: empty,
        error: { message: e.message, code: e.errorCode },
      }
    }
    return { list: empty, error: { message: 'Failed to load assignments.', code: 'UNKNOWN' } }
  }
}

export async function getPlatformAssignmentStats(companyId?: string): Promise<{
  stats: PlatformAssignmentStats | null
  error: { message: string; code: string } | null
}> {
  try {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
    const stats = await api.get<PlatformAssignmentStats>(
      `/api/platform/assignments/stats${qs}`,
    )
    return { stats, error: null }
  } catch (e) {
    if (e instanceof ApiError) {
      return { stats: null, error: { message: e.message, code: e.errorCode } }
    }
    return { stats: null, error: { message: 'Failed to load stats.', code: 'UNKNOWN' } }
  }
}

export async function getPlatformCompaniesAssignmentStats(query?: {
  page?: number
  limit?: number
  companyStatus?: string
}): Promise<{
  list: PlatformCompaniesStatsList
  error: { message: string; code: string } | null
}> {
  const empty: PlatformCompaniesStatsList = {
    page: 1,
    limit: 25,
    totalCompanies: 0,
    data: [],
  }
  try {
    const list = await api.get<PlatformCompaniesStatsList>(
      `/api/platform/companies/assignment-stats${buildQuery({
        page: query?.page ?? 1,
        limit: query?.limit ?? 25,
        companyStatus: query?.companyStatus,
      })}`,
    )
    return { list, error: null }
  } catch (e) {
    if (e instanceof ApiError) {
      return { list: empty, error: { message: e.message, code: e.errorCode } }
    }
    return {
      list: empty,
      error: { message: 'Failed to load company stats.', code: 'UNKNOWN' },
    }
  }
}

export async function getPlatformAuditFeed(query?: {
  page?: number
  limit?: number
}): Promise<PlatformAuditFeed> {
  try {
    return await api.get<PlatformAuditFeed>(
      `/api/audit/platform${buildQuery({
        page: query?.page ?? 1,
        limit: query?.limit ?? 50,
      })}`,
    )
  } catch {
    return { page: 1, limit: 50, total: 0, data: [] }
  }
}

export interface OnboardCompanyBody {
  companyName: string
  employeeIdPrefix: string
  adminName: string
  adminEmail: string
  reason: string
}

export async function onboardCompany(
  body: OnboardCompanyBody,
): Promise<ActionResult<{ inviteToken?: string; message?: string }>> {
  try {
    const data = await api.post<{ inviteToken?: string; message?: string }>(
      '/api/platform/onboard',
      body,
    )
    revalidatePath('/platform')
    return { data }
  } catch (e) {
    if (e instanceof ApiError) {
      return { error: e.message, errorCode: e.errorCode, requestId: e.requestId }
    }
    return { error: 'Onboarding failed.' }
  }
}
