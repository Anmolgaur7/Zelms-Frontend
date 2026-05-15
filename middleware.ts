/**
 * middleware.ts
 *
 * Runs on the Edge Runtime before every request.
 * Reads httpOnly cookies to enforce:
 *   1. Authentication  → redirect to /login if no session
 *   2. Password change → redirect to /change-password if mustChangePassword
 *   3. Role routing    → EMPLOYEE can only see /my-trainings
 *                        PLATFORM_ADMIN can only see /platform/*
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { SessionUser } from '@/types/auth'

// Paths that are always publicly accessible (no auth needed)
const PUBLIC_PATHS = [
  '/login',
  '/platform-login',
  '/set-password',
  '/change-password', // accessible but handled below for redirect logic
]

// Paths that even a mustChangePassword user may visit
const ALLOWED_WHEN_MUST_CHANGE = ['/change-password', '/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always allow Next.js internals and static files ──────────────────
  // (handled by the matcher config below — belt-and-suspenders check)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon')
  ) {
    return NextResponse.next()
  }

  // ── 2. Public paths — no session required ─────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already authenticated and tries to visit /login, redirect home
    const sessionRaw = request.cookies.get('pharma_session')?.value
    if (sessionRaw && (pathname === '/login' || pathname === '/platform-login')) {
      try {
        const session = JSON.parse(sessionRaw) as SessionUser
        const home = resolveHome(session)
        return NextResponse.redirect(new URL(home, request.url))
      } catch {
        // Bad cookie — let them through to login
      }
    }
    return NextResponse.next()
  }

  // ── 3. Require session ────────────────────────────────────────────────
  const sessionRaw = request.cookies.get('pharma_session')?.value

  if (!sessionRaw) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let session: SessionUser
  try {
    session = JSON.parse(sessionRaw) as SessionUser
  } catch {
    // Corrupted cookie — clear and redirect
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('pharma_token')
    res.cookies.delete('pharma_session')
    return res
  }

  // ── 4. Force password change ───────────────────────────────────────────
  if (
    session.mustChangePassword &&
    !ALLOWED_WHEN_MUST_CHANGE.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL('/change-password', request.url))
  }

  // ── 5. Role-based routing ──────────────────────────────────────────────
  const { role } = session

  // PLATFORM_ADMIN → only /platform/* (and auth pages handled above)
  if (role === 'PLATFORM_ADMIN') {
    if (!pathname.startsWith('/platform')) {
      return NextResponse.redirect(new URL('/platform/assignments', request.url))
    }
    return NextResponse.next()
  }

  // Tenant users must not access platform console
  if (pathname.startsWith('/platform')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // EMPLOYEE → only /my-trainings/* routes
  if (
    role === 'EMPLOYEE' &&
    !pathname.startsWith('/my-trainings') &&
    !pathname.startsWith('/change-password')
  ) {
    return NextResponse.redirect(new URL('/my-trainings', request.url))
  }

  return NextResponse.next()
}

/** Resolve the home page for a given role after login. */
function resolveHome(session: SessionUser): string {
  if (session.mustChangePassword) return '/change-password'
  switch (session.role) {
    case 'PLATFORM_ADMIN':
      return '/platform/assignments'
    case 'EMPLOYEE':
      return '/my-trainings'
    default:
      return '/dashboard'
  }
}

export const config = {
  // Match all paths except Next.js internals and static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon.*|apple-icon.*|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$).*)',
  ],
}
