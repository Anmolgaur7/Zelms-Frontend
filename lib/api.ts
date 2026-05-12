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

  constructor(
    message: string,
    errorCode: string,
    status: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.errorCode = errorCode
    this.status = status
    this.details = details
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  })

  // Parse response body
  const contentType = res.headers.get('content-type') ?? ''
  const data: unknown = contentType.includes('application/json')
    ? await res.json()
    : await res.text()

  if (!res.ok) {
    const err = data as { message?: string; errorCode?: string; details?: unknown }
    throw new ApiError(
      err.message ?? `HTTP ${res.status}`,
      err.errorCode ?? 'UNKNOWN_ERROR',
      res.status,
      err.details,
    )
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
