// ─── Role ────────────────────────────────────────────────────────────────────
// NOTE: PLATFORM_ADMIN logs into a separate admin panel app — not this frontend.
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'EMPLOYEE' | 'AUDITOR'

// ─── Session (stored in httpOnly cookie, used by middleware + server) ─────────
export interface SessionUser {
  name: string
  role: UserRole
  employeeId?: string
  email?: string | null
  companyName?: string
  mustChangePassword: boolean
}

// ─── Login request body ───────────────────────────────────────────────────────
export interface TenantLoginBody {
  organization: string   // employeeIdPrefix OR licenseId — NOT the internal UUID
  employeeId: string     // full id e.g. "ACME-2"
  password: string
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface LoginResponse {
  token: string
  role: UserRole
  name: string
  employeeId?: string
  email?: string | null
  companyName?: string
  mustChangePassword?: boolean
}

export interface SetPasswordBody {
  token: string          // UUID invite token from query string
  password: string
}

export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
  token: string
  mustChangePassword: false
  role: UserRole
  name: string
  employeeId?: string
  email?: string | null
  companyName?: string
}

// ─── Standard API error envelope ─────────────────────────────────────────────
export interface ApiErrorBody {
  message: string
  errorCode: string
  details?: unknown
}

// ─── Action return shape (used by server actions returning errors to UI) ──────
export interface ActionResult<T = void> {
  data?: T
  error?: string
  errorCode?: string
}
