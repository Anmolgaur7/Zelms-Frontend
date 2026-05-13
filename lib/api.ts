/**
 * lib/api.ts
 *
 * Server-side API client for Klonixpharback.
 * Only usable in Server Components and Server Actions (reads httpOnly cookies via next/headers).
 *
 * Usage:
 *   import { api } from '@/lib/api'
 *   const users = await api.get<User[]>('/api/admin/users')
 */

import { cookies } from 'next/headers'

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://klonixpharback.onrender.com'

// ─── Typed API error ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  errorCode: string
  status: number
  details?: unknown
  /** From response `x-request-id` or the outbound `X-Request-ID` we sent. */
  requestId?: string

  constructor(
    message: string,
    errorCode: string,
    status: number,
    details?: unknown,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.errorCode = errorCode
    this.status = status
    this.details = details
    this.requestId = requestId
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function mergeHeaders(
  base: Record<string, string>,
  extra: RequestInit['headers'],
): Record<string, string> {
  const out: Record<string, string> = { ...base }
  if (!extra) return out
  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      out[key] = value
    })
    return out
  }
  if (Array.isArray(extra)) {
    for (const [k, v] of extra) {
      out[k] = v
    }
    return out
  }
  return { ...out, ...(extra as Record<string, string>) }
}

async function serverRequest<T>(
  path: string,
  options: RequestInit = {},
  /** Pass an explicit token to override the cookie (e.g. when changing password). */
  explicitToken?: string,
): Promise<T> {
  const cookieStore = await cookies()
  const token = explicitToken ?? cookieStore.get('pharma_token')?.value

  // Don't override Content-Type for FormData bodies (let browser set boundary).
  const isFormData = options.body instanceof FormData
  const baseHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' }

  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }

  const outboundId = newRequestId()
  const merged = mergeHeaders(baseHeaders, options.headers)
  if (!merged['X-Request-ID'] && !merged['x-request-id']) {
    merged['X-Request-ID'] = outboundId
  }
  const sentRequestId = merged['X-Request-ID'] ?? merged['x-request-id'] ?? outboundId

  const method = (options.method ?? 'GET').toUpperCase()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: merged,
    cache: 'no-store',
  })

  const responseRequestId =
    res.headers.get('x-request-id') ?? res.headers.get('X-Request-ID') ?? sentRequestId

  // Parse response body
  const contentType = res.headers.get('content-type') ?? ''
  let data: unknown
  try {
    data = contentType.includes('application/json')
      ? await res.json()
      : await res.text()
  } catch {
    data = null
  }

  if (!res.ok) {
    const err = (data && typeof data === 'object'
      ? data
      : {}) as { message?: string; errorCode?: string; details?: unknown }
    const message =
      typeof err.message === 'string'
        ? err.message
        : typeof data === 'string' && data
          ? data
          : `HTTP ${res.status}`
    const errorCode =
      typeof err.errorCode === 'string' ? err.errorCode : 'UNKNOWN_ERROR'

    console.error(
      '[api]',
      method,
      path,
      res.status,
      errorCode,
      responseRequestId,
      message,
    )

    throw new ApiError(message, errorCode, res.status, err.details, responseRequestId)
  }

  return data as T
}

// ─── Public API object ────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    serverRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    serverRequest<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    serverRequest<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    serverRequest<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    serverRequest<T>(path, { ...options, method: 'DELETE' }),

  /** Multipart file upload — do NOT pass Content-Type; fetch sets it with boundary. */
  postForm: <T>(path: string, formData: FormData) =>
    serverRequest<T>(path, { method: 'POST', body: formData }),
}

// ─── Raw fetch (no cookie) — used in server actions before cookies are set ───
export async function rawPost<T>(
  path: string,
  body: unknown,
  bearerToken?: string,
): Promise<T> {
  return serverRequest<T>(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    bearerToken,
  )
}
