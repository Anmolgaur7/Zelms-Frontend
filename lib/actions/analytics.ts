'use server'

/**
 * lib/actions/analytics.ts
 *
 * Reads for the admin dashboard tiles and the three analytics pages:
 *
 *   GET /api/admin/stats              → AdminStats (KPI tiles)
 *   GET /api/analytics/compliance     → ComplianceReport
 *   GET /api/analytics/risk-report    → RiskReport
 *   GET /api/analytics/sop-difficulty → SopDifficultyReport
 *   GET /api/export/training-report   → file download (Buffer-friendly)
 *
 * None of these mutate state. All actions follow the same pattern: wrap the
 * call, log on failure, return a non-throwing envelope so the UI can render
 * an empty state instead of crashing when the API returns 403 / 500.
 */

import { cookies } from 'next/headers'
import { api, ApiError, BASE_URL } from '@/lib/api'
import { QUIET_TENANT_READ } from '@/lib/api-quiet'
import type {
  AdminStats,
  ComplianceReport,
  RiskReport,
  SopDifficultyReport,
} from '@/types/analytics'

export interface AnalyticsFetchError {
  path: string
  message: string
  code: string
  status?: number
  requestId?: string
}

function toFetchError(path: string, e: unknown): AnalyticsFetchError {
  if (e instanceof ApiError) {
    return {
      path,
      message: e.message,
      code: e.errorCode,
      status: e.status,
      requestId: e.requestId,
    }
  }
  return {
    path,
    message: e instanceof Error ? e.message : 'Unknown error',
    code: 'CLIENT_ERROR',
  }
}

// ─── Admin stats (dashboard tiles) ────────────────────────────────────────

export interface AdminStatsResult {
  stats: AdminStats | null
  error: AnalyticsFetchError | null
}

export async function getAdminStats(): Promise<AdminStatsResult> {
  const path = '/api/admin/stats'
  try {
    const data = await api.get<AdminStats>(path, QUIET_TENANT_READ)
    if (data == null) {
      return {
        stats: null,
        error: {
          path,
          message: 'Admin stats unavailable for this session.',
          code: 'FORBIDDEN',
          status: 403,
        },
      }
    }
    return { stats: data, error: null }
  } catch (e) {
    console.error('[analytics.getAdminStats]', e)
    return { stats: null, error: toFetchError(path, e) }
  }
}

// ─── Compliance report ────────────────────────────────────────────────────

export interface ComplianceResult {
  report: ComplianceReport | null
  error: AnalyticsFetchError | null
}

export async function getComplianceReport(): Promise<ComplianceResult> {
  const path = '/api/analytics/compliance'
  try {
    const data = await api.get<ComplianceReport>(path, QUIET_TENANT_READ)
    if (data == null) {
      return {
        report: null,
        error: {
          path,
          message: 'Compliance report unavailable for this session.',
          code: 'FORBIDDEN',
          status: 403,
        },
      }
    }
    return { report: data, error: null }
  } catch (e) {
    console.error('[analytics.getComplianceReport]', e)
    return { report: null, error: toFetchError(path, e) }
  }
}

// ─── Risk report ──────────────────────────────────────────────────────────

export interface RiskResult {
  report: RiskReport | null
  error: AnalyticsFetchError | null
}

export async function getRiskReport(): Promise<RiskResult> {
  const path = '/api/analytics/risk-report'
  try {
    const data = await api.get<RiskReport>(path, QUIET_TENANT_READ)
    if (data == null) {
      return {
        report: null,
        error: {
          path,
          message: 'Risk report unavailable for this session.',
          code: 'FORBIDDEN',
          status: 403,
        },
      }
    }
    return { report: data, error: null }
  } catch (e) {
    console.error('[analytics.getRiskReport]', e)
    return { report: null, error: toFetchError(path, e) }
  }
}

// ─── SOP difficulty ───────────────────────────────────────────────────────

export interface SopDifficultyResult {
  report: SopDifficultyReport | null
  error: AnalyticsFetchError | null
}

export async function getSopDifficulty(): Promise<SopDifficultyResult> {
  const path = '/api/analytics/sop-difficulty'
  try {
    const data = await api.get<SopDifficultyReport>(path, QUIET_TENANT_READ)
    if (data == null) {
      return {
        report: null,
        error: {
          path,
          message: 'SOP difficulty report unavailable for this session.',
          code: 'FORBIDDEN',
          status: 403,
        },
      }
    }
    return { report: data, error: null }
  } catch (e) {
    console.error('[analytics.getSopDifficulty]', e)
    return { report: null, error: toFetchError(path, e) }
  }
}

// ─── Export training report (file download) ───────────────────────────────
//
// The endpoint may return JSON (which we forward as a downloadable file) or a
// CSV/Excel blob. We bypass the JSON-parsing `api` wrapper because we need raw
// bytes + the original `content-disposition`/`content-type` headers.

export interface TrainingReportFile {
  filename: string
  mimeType: string
  /** Base64-encoded bytes — server actions cannot return Buffers/Blobs. */
  base64: string
}

export interface TrainingReportResult {
  file: TrainingReportFile | null
  error: AnalyticsFetchError | null
}

function defaultFilename(mime: string): string {
  if (mime.includes('csv')) return 'training-report.csv'
  if (mime.includes('excel') || mime.includes('spreadsheetml'))
    return 'training-report.xlsx'
  if (mime.includes('pdf')) return 'training-report.pdf'
  if (mime.includes('json')) return 'training-report.json'
  return 'training-report.bin'
}

function parseFilenameFromHeader(header: string | null): string | null {
  if (!header) return null
  // Handle both `filename=foo.csv` and `filename*=UTF-8''foo.csv`.
  const match =
    header.match(/filename\*=UTF-8''([^;]+)/i) ??
    header.match(/filename="?([^";]+)"?/i)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export async function getTrainingReport(): Promise<TrainingReportResult> {
  const path = '/api/export/training-report'
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pharma_token')?.value
    const outboundId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const headers: Record<string, string> = {
      'X-Request-ID': outboundId,
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    const responseRequestId =
      res.headers.get('x-request-id') ?? res.headers.get('X-Request-ID') ?? outboundId

    if (!res.ok) {
      // Try to surface the JSON envelope when present.
      let message = `HTTP ${res.status}`
      let errorCode = 'EXPORT_FAILED'
      try {
        const body = (await res.json()) as {
          message?: string
          errorCode?: string
        }
        if (body.message) message = body.message
        if (body.errorCode) errorCode = body.errorCode
      } catch {
        // ignore
      }
      return {
        file: null,
        error: {
          path,
          message,
          code: errorCode,
          status: res.status,
          requestId: responseRequestId,
        },
      }
    }

    const mimeType = res.headers.get('content-type') ?? 'application/octet-stream'
    const filename =
      parseFilenameFromHeader(res.headers.get('content-disposition')) ??
      defaultFilename(mimeType)

    const buf = Buffer.from(await res.arrayBuffer())
    return {
      file: {
        filename,
        mimeType,
        base64: buf.toString('base64'),
      },
      error: null,
    }
  } catch (e) {
    console.error('[analytics.getTrainingReport]', e)
    return { file: null, error: toFetchError(path, e) }
  }
}
