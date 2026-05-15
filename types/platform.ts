/**
 * Platform (SaaS operator) API types — Phase 3
 */

import type { AssignmentStatus, CompanyAssignmentStats } from '@/types/admin'

export interface PlatformCompanyRef {
  id: string
  name: string
  employeeIdPrefix?: string
  licenseId?: string
  status?: string
}

export interface PlatformAssignmentRow {
  id: string
  status: AssignmentStatus | string
  deadline?: string | null
  score?: number | null
  passed?: boolean | null
  user?: {
    id: string
    name: string
    employeeId?: string
    email?: string | null
  }
  company?: PlatformCompanyRef
  quiz?: {
    id: string
    sop?: { id: string; title?: string; version?: string | null }
  }
  assignedSopTitle?: string | null
  assignedSopVersion?: string | null
}

export interface PlatformAssignmentsList {
  page: number
  limit: number
  total: number
  data: PlatformAssignmentRow[]
}

export interface PlatformAssignmentStats extends CompanyAssignmentStats {
  companyId?: string | null
}

export interface PlatformCompanyAssignmentStatsRow {
  company: PlatformCompanyRef
  stats: CompanyAssignmentStats
}

export interface PlatformCompaniesStatsList {
  page: number
  limit: number
  totalCompanies: number
  data: PlatformCompanyAssignmentStatsRow[]
}

export interface PlatformAuditLogEntry {
  id: string
  action: string
  targetType?: string | null
  targetId?: string | null
  reason?: string | null
  createdAt?: string
  company?: PlatformCompanyRef | null
}

export interface PlatformAuditFeed {
  page: number
  limit: number
  total: number
  data: PlatformAuditLogEntry[]
}
