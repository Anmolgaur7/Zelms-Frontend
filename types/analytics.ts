/**
 * types/analytics.ts
 *
 * Response shapes for `/api/admin/stats` and `/api/analytics/*`. The backend
 * has no OpenAPI yet, so each interface keeps fields **optional** and adds an
 * index signature for forward-compat. UI accessors normalise common aliases
 * (`pass_rate` vs `passRate`, etc.) so a backend tweak doesn't break the page.
 */

// ─── /api/admin/stats ─────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers?: number
  activeUsers?: number
  employees?: number
  trainers?: number
  admins?: number
  auditors?: number

  totalSops?: number
  activeSops?: number
  draftSops?: number
  archivedSops?: number

  totalAssignments?: number
  pending?: number
  inProgress?: number
  completed?: number
  failed?: number
  overdue?: number
  lockedOut?: number

  /** 0–100 percent. */
  completionRate?: number
  averageScore?: number

  generatedAt?: string

  [key: string]: unknown
}

// ─── /api/analytics/compliance ────────────────────────────────────────────

export interface ComplianceByDepartment {
  departmentId?: string | null
  departmentName?: string | null
  /** Aliases the backend has used. */
  name?: string | null
  total?: number
  totalAssignments?: number
  completed?: number
  pending?: number
  overdue?: number
  /** Percent 0–100. */
  complianceRate?: number
  rate?: number
  [key: string]: unknown
}

export interface ComplianceBySop {
  sopId?: string | null
  sopTitle?: string | null
  version?: string | null
  assigned?: number
  completed?: number
  pending?: number
  failed?: number
  complianceRate?: number
  [key: string]: unknown
}

export interface ComplianceReport {
  /** Overall percent across the tenant. */
  overallCompliance?: number
  overallRate?: number
  rate?: number

  totalAssignments?: number
  totalCompleted?: number
  totalPending?: number
  totalOverdue?: number
  totalFailed?: number

  byDepartment?: ComplianceByDepartment[]
  bySop?: ComplianceBySop[]
  departments?: ComplianceByDepartment[]
  sops?: ComplianceBySop[]

  generatedAt?: string

  [key: string]: unknown
}

// ─── /api/analytics/risk-report ───────────────────────────────────────────

export interface RiskUser {
  userId?: string | null
  id?: string | null
  name?: string | null
  employeeId?: string | null
  email?: string | null
  departmentName?: string | null

  overdueCount?: number
  failedCount?: number
  attempts?: number
  lockouts?: number
  riskScore?: number
  /** 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' — kept as string. */
  riskLevel?: string | null

  lastActivityAt?: string | null

  [key: string]: unknown
}

export interface RiskReport {
  users?: RiskUser[]
  riskyUsers?: RiskUser[]
  data?: RiskUser[]

  generatedAt?: string
  threshold?: number

  [key: string]: unknown
}

// ─── /api/analytics/sop-difficulty ────────────────────────────────────────

export interface SopDifficultyRow {
  sopId?: string | null
  sopTitle?: string | null
  version?: string | null
  category?: string | null

  attempts?: number
  totalAttempts?: number
  passes?: number
  fails?: number
  passRate?: number
  failRate?: number
  averageScore?: number

  /** Optional difficulty hint surfaced by the backend. */
  difficulty?: string | null

  [key: string]: unknown
}

export interface SopDifficultyReport {
  rows?: SopDifficultyRow[]
  sops?: SopDifficultyRow[]
  data?: SopDifficultyRow[]

  generatedAt?: string

  [key: string]: unknown
}

// ─── Normalisation helpers (tolerant of backend drift) ────────────────────

export function normaliseDepartments(
  report: ComplianceReport | null,
): ComplianceByDepartment[] {
  if (!report) return []
  return report.byDepartment ?? report.departments ?? []
}

export function normaliseSops(
  report: ComplianceReport | null,
): ComplianceBySop[] {
  if (!report) return []
  return report.bySop ?? report.sops ?? []
}

export function normaliseRiskUsers(report: RiskReport | null): RiskUser[] {
  if (!report) return []
  return report.users ?? report.riskyUsers ?? report.data ?? []
}

export function normaliseDifficultyRows(
  report: SopDifficultyReport | null,
): SopDifficultyRow[] {
  if (!report) return []
  return report.rows ?? report.sops ?? report.data ?? []
}

export function overallComplianceOf(report: ComplianceReport | null): number | null {
  if (!report) return null
  const v =
    report.overallCompliance ?? report.overallRate ?? report.rate ?? null
  return typeof v === 'number' ? v : null
}

export function complianceRateOf(d: ComplianceByDepartment): number | null {
  const v = d.complianceRate ?? d.rate
  return typeof v === 'number' ? v : null
}

export function departmentLabel(d: ComplianceByDepartment): string {
  return d.departmentName ?? d.name ?? 'Unassigned'
}
