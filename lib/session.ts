/**
 * lib/session.ts
 *
 * Server-side helpers to read the current session from httpOnly cookies.
 * Only usable in Server Components, Server Actions, and Route Handlers.
 */

import { cookies } from 'next/headers'
import type { SessionUser } from '@/types/auth'

/** Returns the parsed session or null if not authenticated. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('pharma_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

/** Returns the raw JWT or null. */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('pharma_token')?.value ?? null
}

/** Returns the session and throws if the user is not authenticated. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')
  return session
}
