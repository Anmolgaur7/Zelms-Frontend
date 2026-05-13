import type { UserRole } from '@/types/auth'

/**
 * Mutating assignment flows (`POST /api/assignments/`, unlock, bulk-department)
 * are documented for ADMIN | TRAINER. SUPER_ADMIN is treated as full tenant control.
 */
export function canAdministerAssignments(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TRAINER'
}
