'use server'

/**
 * lib/actions/auth.ts
 *
 * Server Actions for tenant authentication flows only.
 * NOTE: Platform admin panel is a SEPARATE application — no platform routes here.
 *
 *  - Tenant login: { organization, employeeId, password }
 *  - set-password: POST /api/auth/set-password { token, password }  (invite UUID)
 *  - change-password: POST /api/auth/change-password { currentPassword, newPassword }
 *      → response contains a NEW token → replace stored JWT
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BASE_URL, ApiError } from '@/lib/api'
import type {
  TenantLoginBody,
  LoginResponse,
  ChangePasswordBody,
  ChangePasswordResponse,
  SetPasswordBody,
  SessionUser,
  ActionResult,
} from '@/types/auth'

// ─── Cookie configuration ─────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day — matches JWT expiry
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Raw POST to backend without relying on lib/api (cookies not set yet at login). */
async function backendPost<T>(
  path: string,
  body: unknown,
  bearerToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(
      data.message ?? `HTTP ${res.status}`,
      data.errorCode ?? 'UNKNOWN_ERROR',
      res.status,
      data.details,
    )
  }

  return data as T
}

/** Write both auth cookies after a successful login / password change. */
async function setAuthCookies(
  response: LoginResponse | ChangePasswordResponse,
): Promise<void> {
  const cookieStore = await cookies()

  const session: SessionUser = {
    name: response.name,
    role: response.role,
    employeeId: response.employeeId,
    email: response.email ?? null,
    companyName: 'companyName' in response ? response.companyName : undefined,
    mustChangePassword:
      'mustChangePassword' in response
        ? Boolean(response.mustChangePassword)
        : false,
  }

  cookieStore.set('pharma_token', response.token, COOKIE_OPTS)
  cookieStore.set('pharma_session', JSON.stringify(session), COOKIE_OPTS)
}

// ─── Public Server Actions ────────────────────────────────────────────────────

/**
 * Tenant employee / admin login.
 * Fields: organization (prefix or licenseId), employeeId, password.
 */
export async function tenantLogin(
  body: TenantLoginBody,
): Promise<ActionResult> {
  try {
    const data = await backendPost<LoginResponse>('/api/auth/login', body)
    await setAuthCookies(data)
    return {}
  } catch (e) {
    if (e instanceof ApiError)
      return { error: e.message, errorCode: e.errorCode }
    return { error: 'Login failed. Please try again.' }
  }
}

/**
 * First-time super admin password setup via invite link.
 * Reads UUID token from URL query on the client; passed in here.
 * After success, the user must log in normally.
 */
export async function setPassword(
  body: SetPasswordBody,
): Promise<ActionResult> {
  try {
    await backendPost('/api/auth/set-password', body)
    return {}
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to set password. The link may have expired.' }
  }
}

/**
 * Forced password change for users with mustChangePassword === true.
 * Backend returns a NEW token — we replace the stored cookie.
 */
export async function changePassword(
  body: ChangePasswordBody,
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies()
    const currentToken = cookieStore.get('pharma_token')?.value

    const data = await backendPost<ChangePasswordResponse>(
      '/api/auth/change-password',
      body,
      currentToken,
    )

    await setAuthCookies(data)
    return {}
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Failed to change password.' }
  }
}

/**
 * Logout — clears both cookies and redirects to /login.
 */
export async function logout(): Promise<never> {
  const cookieStore = await cookies()
  cookieStore.delete('pharma_token')
  cookieStore.delete('pharma_session')
  redirect('/login')
}
