/**
 * app/dashboard/page.tsx
 *
 * Admin dashboard — overview stats and activity.
 * Server component: fetches company info + user count.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  getUsers,
  getCompanyAssignmentStats,
  getSOPs,
  getDepartments,
  getAuditFeed,
} from '@/lib/actions/admin'
import {
  getAdminStats,
  getComplianceReport,
  getSopDifficulty,
} from '@/lib/actions/analytics'
import { getSession } from '@/lib/session'
import {
  UsersIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ActivityIcon,
  TargetIcon,
  Building2Icon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateUserModal } from '@/components/modals/create-user-modal'
import { CreateDepartmentModal } from '@/components/modals/create-department-modal'
import { CreateSOPModal } from '@/components/modals/create-sop-modal'
import { CreateAssignmentModal } from '@/components/modals/create-assignment-modal'
import { DashboardOverviewCharts } from '@/components/dashboard/dashboard-overview-charts'
import { DashboardExtendedCharts } from '@/components/dashboard/dashboard-extended-charts'
import type { CompanyAssignmentStats, SOP, AdminUser, AuditLogEntry, Department } from '@/types/admin'
import type { UserRole } from '@/types/auth'
import type {
  ComplianceReport,
  SopDifficultyReport,
  SopDifficultyRow,
} from '@/types/analytics'
import {
  complianceRateOf,
  departmentLabel,
  normaliseDepartments,
  normaliseDifficultyRows,
  normaliseSops,
  overallComplianceOf,
} from '@/types/analytics'
import type { ComplianceChartRow } from '@/components/analytics/compliance-chart'
import type { DifficultyChartRow } from '@/components/analytics/difficulty-chart'

export const metadata = { title: 'Dashboard' }

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  index = 0,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  index?: number
}) {
  return (
    <Card
      className="card-hover animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 11) * 60}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 hover:scale-105">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trendLabel && (
            <Badge
              variant="outline"
              className={`h-4 text-[10px] px-1 ml-auto ${
                trend === 'up'
                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                  : trend === 'down'
                  ? 'text-rose-600 border-rose-200 bg-rose-50/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900'
                  : ''
              }`}
            >
              {trend === 'up' && <TrendingUpIcon className="h-2.5 w-2.5 mr-0.5" />}
              {trendLabel}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stats skeleton ───────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((row) => (
        <div key={row} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

function fmtNum(v: number | undefined | null): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—'
  return v.toLocaleString()
}

function fmtPct(v: number | undefined | null): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—'
  // Backend sometimes ships 0.93, sometimes 93.
  const pct = v <= 1 ? v * 100 : v
  return `${pct.toFixed(0)}%`
}

type AssignmentBreakdown = {
  pending: number
  inProgress: number
  completed: number
  failed: number
  overdue: number
}

function sumAssignmentBreakdown(a: AssignmentBreakdown): number {
  return a.pending + a.inProgress + a.completed + a.failed + a.overdue
}

/** Same shape as the assignments console — fills charts when admin stats omit counts. */
function assignmentsFromCompanyStats(
  s: CompanyAssignmentStats | null,
): AssignmentBreakdown | null {
  if (!s?.byStatus) return null
  const b = s.byStatus
  return {
    pending: b.PENDING ?? 0,
    inProgress: b.IN_PROGRESS ?? 0,
    completed: b.COMPLETED ?? 0,
    failed: (b.FAILED ?? 0) + (b.LOCKED_OUT ?? 0),
    overdue: b.OVERDUE ?? 0,
  }
}

/** Matches the SOP list page — draft bucket includes DRAFT + UNDER_REVIEW. */
function tallySopsByBucket(sops: SOP[]): {
  active: number
  draft: number
  archived: number
} {
  let active = 0
  let draft = 0
  let archived = 0
  for (const sop of sops) {
    const st = sop.status ?? 'DRAFT'
    if (st === 'ACTIVE') active++
    else if (st === 'ARCHIVED') archived++
    else draft++
  }
  return { active, draft, archived }
}

function overallCompliancePct(report: ComplianceReport | null): number | null {
  const v = overallComplianceOf(report)
  if (v == null || Number.isNaN(v)) return null
  return v <= 1 ? v * 100 : v
}

function buildComplianceDashboardRows(report: ComplianceReport | null): ComplianceChartRow[] {
  if (!report) return []
  const departments = normaliseDepartments(report)
  if (departments.length > 0) {
    return departments
      .map((d) => {
        const raw = complianceRateOf(d) ?? 0
        return {
          label: departmentLabel(d),
          rate: raw <= 1 ? raw * 100 : raw,
          total: d.total ?? d.totalAssignments ?? 0,
          completed: d.completed ?? 0,
        }
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 10)
  }
  return normaliseSops(report)
    .map((s) => {
      const r = s.complianceRate ?? 0
      const title = (s.sopTitle ?? 'SOP').trim() || 'SOP'
      return {
        label: title.length > 28 ? `${title.slice(0, 27)}…` : title,
        rate: r <= 1 ? r * 100 : r,
        total: s.assigned ?? 0,
        completed: s.completed ?? 0,
      }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 10)
}

function passRateForDifficulty(row: SopDifficultyRow): number | null {
  if (typeof row.passRate === 'number') {
    return row.passRate <= 1 ? row.passRate * 100 : row.passRate
  }
  const attempts = row.attempts ?? row.totalAttempts
  const passes = row.passes
  if (typeof attempts === 'number' && attempts > 0 && typeof passes === 'number') {
    return (passes / attempts) * 100
  }
  return null
}

function buildDifficultyChartRows(report: SopDifficultyReport | null): DifficultyChartRow[] {
  const enriched = normaliseDifficultyRows(report)
  return enriched
    .map((r) => {
      const rate = passRateForDifficulty(r)
      const attempts = r.attempts ?? r.totalAttempts ?? 0
      const avg =
        typeof r.averageScore === 'number'
          ? r.averageScore <= 1
            ? r.averageScore * 100
            : r.averageScore
          : null
      const title = (r.sopTitle ?? 'SOP').trim() || 'Untitled'
      return { row: r, rate, attempts, avg, title }
    })
    .filter((x) => x.rate != null && x.attempts > 0)
    .sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))
    .slice(0, 10)
    .map((x) => ({
      label: x.title.length > 22 ? `${x.title.slice(0, 21)}…` : x.title,
      passRate: x.rate ?? 0,
      attempts: x.attempts,
      averageScore: x.avg,
    }))
}

function usersByDepartmentChart(users: AdminUser[], departments: Department[]) {
  const nameById = new Map(departments.map((d) => [d.id, d.name]))
  const m = new Map<string, number>()
  for (const u of users) {
    const label =
      u.departmentId && nameById.has(u.departmentId)
        ? nameById.get(u.departmentId)!
        : u.department?.name?.trim() || 'Unassigned'
    m.set(label, (m.get(label) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([label, usersCount]) => ({
      label: label.length > 26 ? `${label.slice(0, 25)}…` : label,
      users: usersCount,
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 15)
}

function aggregateAuditActions(logs: AuditLogEntry[], top = 14): { label: string; count: number }[] {
  const map = new Map<string, number>()
  for (const log of logs) {
    const action =
      typeof log.action === 'string' && log.action.trim() ? log.action.trim() : 'UNKNOWN'
    map.set(action, (map.get(action) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([full, count]) => ({
      label: full.length > 40 ? `${full.slice(0, 39)}…` : full,
      count,
    }))
}

// ─── Stats (async) ────────────────────────────────────────────────────────────
async function DashboardStats({ role }: { role: UserRole }) {
  const [
    users,
    { stats, error },
    assignStatsRes,
    sopsList,
    complianceRes,
    difficultyRes,
    departments,
    auditFeed,
  ] = await Promise.all([
    getUsers(),
    getAdminStats(),
    getCompanyAssignmentStats(),
    getSOPs(),
    getComplianceReport(),
    getSopDifficulty(),
    getDepartments(),
    getAuditFeed({ page: 1, limit: 100 }),
  ])

  // User-role tallies fall back to the users list so the tiles still render
  // if `/api/admin/stats` is unreachable (e.g. role-gated for TRAINER).
  const fallbackTotal = users.length
  const fallbackEmployees = users.filter((u) => u.role === 'EMPLOYEE').length
  const fallbackAdmins = users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN',
  ).length
  const fallbackTrainers = users.filter((u) => u.role === 'TRAINER').length
  const fallbackAuditors = users.filter((u) => u.role === 'AUDITOR').length

  const totalUsers = stats?.totalUsers ?? fallbackTotal
  const employees = stats?.employees ?? fallbackEmployees
  const admins = stats?.admins ?? fallbackAdmins
  const trainers = stats?.trainers ?? fallbackTrainers

  const totalAssignments = stats?.totalAssignments
  const pending = stats?.pending
  const overdue = stats?.overdue
  const completionRate = stats?.completionRate
  const auditors = stats?.auditors ?? fallbackAuditors

  const completionNorm =
    typeof completionRate === 'number' && !Number.isNaN(completionRate)
      ? completionRate <= 1
        ? completionRate * 100
        : completionRate
      : null

  const rawScore = stats?.averageScore
  const scoreNorm =
    typeof rawScore === 'number' && !Number.isNaN(rawScore)
      ? rawScore <= 1
        ? rawScore * 100
        : rawScore
      : null

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-xs text-muted-foreground">
          Couldn&apos;t load live KPIs ({error.code}). Showing role tallies only.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          title="Total Users"
          value={fmtNum(totalUsers)}
          description="All active accounts"
          icon={UsersIcon}
          trend="up"
          trendLabel={`${fmtNum(employees)} employees`}
        />
        <StatCard
          index={1}
          title="Administrators"
          value={fmtNum(admins)}
          description="Admin & Super Admin"
          icon={ShieldCheckIcon}
        />
        <StatCard
          index={2}
          title="Trainers"
          value={fmtNum(trainers)}
          description="SOP training staff"
          icon={FileTextIcon}
        />
        <StatCard
          index={3}
          title="Pending Assignments"
          value={fmtNum(pending)}
          description={
            typeof totalAssignments === 'number'
              ? `of ${fmtNum(totalAssignments)} total`
              : 'Awaiting completion'
          }
          icon={ClipboardCheckIcon}
          trend={
            typeof overdue === 'number' && overdue > 0 ? 'down' : 'neutral'
          }
          trendLabel={
            typeof overdue === 'number' && overdue > 0
              ? `${fmtNum(overdue)} overdue`
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={4}
          title="Completion Rate"
          value={fmtPct(completionRate)}
          description="Across all assignments"
          icon={ActivityIcon}
        />
        <StatCard
          index={5}
          title="Average Quiz Score"
          value={fmtPct(stats?.averageScore)}
          description="Latest attempts"
          icon={TrendingUpIcon}
        />
        <StatCard
          index={6}
          title="Locked-out Trainees"
          value={fmtNum(stats?.lockedOut)}
          description="Awaiting unlock"
          icon={AlertTriangleIcon}
        />
        <StatCard
          index={7}
          title="Active SOPs"
          value={fmtNum(stats?.activeSops)}
          description={
            typeof stats?.totalSops === 'number'
              ? `of ${fmtNum(stats.totalSops)} total`
              : 'Currently published'
          }
          icon={TargetIcon}
        />
      </div>

      <DashboardOverviewCharts
        roles={{
          employees,
          trainers,
          admins,
          auditors,
        }}
        assignments={(() => {
          const fromAdmin: AssignmentBreakdown = {
            pending: pending ?? 0,
            inProgress:
              typeof stats?.inProgress === 'number' ? stats.inProgress : 0,
            completed:
              typeof stats?.completed === 'number' ? stats.completed : 0,
            failed: typeof stats?.failed === 'number' ? stats.failed : 0,
            overdue: overdue ?? 0,
          }
          const fromCompany = assignmentsFromCompanyStats(assignStatsRes.stats)
          if (
            fromCompany &&
            sumAssignmentBreakdown(fromCompany) > 0
          ) {
            return fromCompany
          }
          return fromAdmin
        })()}
        sops={(() => {
          const fromList = tallySopsByBucket(sopsList)
          const listTotal = fromList.active + fromList.draft + fromList.archived
          if (listTotal > 0) return fromList
          return {
            active:
              typeof stats?.activeSops === 'number' ? stats.activeSops : 0,
            draft:
              typeof stats?.draftSops === 'number' ? stats.draftSops : 0,
            archived:
              typeof stats?.archivedSops === 'number'
                ? stats.archivedSops
                : 0,
          }
        })()}
        completionRatePct={completionNorm}
        averageScorePct={scoreNorm}
      />

      <DashboardExtendedCharts
        role={role}
        compliance={{
          error: complianceRes.error?.code ?? complianceRes.error?.message ?? null,
          overallPct: overallCompliancePct(complianceRes.report),
          chartRows: buildComplianceDashboardRows(complianceRes.report),
        }}
        difficulty={{
          error:
            difficultyRes.error?.code ?? difficultyRes.error?.message ?? null,
          rows: buildDifficultyChartRows(difficultyRes.report),
        }}
        departments={usersByDepartmentChart(users, departments)}
        audit={{
          error: null,
          byAction: aggregateAuditActions(auditFeed.logs ?? []),
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page heading */}
      <div className="animate-fade-up motion-reduce:animate-none">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Welcome back, {session?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s an overview of your pharma training operations.
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats role={session.role} />
      </Suspense>

      {/* Quick actions */}
      <div className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '180ms' }}>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
            <>
              <CreateUserModal
                trigger={
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md w-full">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                      <UsersIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add User</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Create a new employee account</div>
                    </div>
                  </button>
                }
              />

              <CreateDepartmentModal
                trigger={
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md w-full">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                      <Building2Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add Department</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Group employees for training</div>
                    </div>
                  </button>
                }
              />
            </>
          )}

          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN' || session.role === 'TRAINER') && (
            <>
              <CreateSOPModal
                trigger={
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md w-full">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                      <FileTextIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Upload SOP</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Add a new procedure document</div>
                    </div>
                  </button>
                }
              />

              <CreateAssignmentModal
                trigger={
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md w-full">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                      <ClipboardCheckIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Assign Training</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Assign SOPs to employees</div>
                    </div>
                  </button>
                }
              />
            </>
          )}

          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN' || session.role === 'AUDITOR') && (
            <a
              href="/dashboard/audit"
              className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md w-full"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                <ShieldCheckIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">View Audit Log</div>
                <div className="text-xs text-muted-foreground mt-0.5">Review compliance activity</div>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Analytics jump-off */}
      {(session.role === 'ADMIN' ||
        session.role === 'SUPER_ADMIN' ||
        session.role === 'TRAINER' ||
        session.role === 'AUDITOR') && (
        <div className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '260ms' }}>
          <h2 className="text-base font-semibold mb-3">Analytics</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/analytics/compliance"
              className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                <ActivityIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Compliance Report</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Completion by department and SOP
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics/risk"
              className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                <AlertTriangleIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Risk Report</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Overdue, failed, and locked-out trainees
                </div>
              </div>
            </Link>

            {(session.role === 'ADMIN' ||
              session.role === 'SUPER_ADMIN' ||
              session.role === 'TRAINER') && (
              <Link
                href="/dashboard/analytics/sop-difficulty"
                className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/40 hover:border-primary/30 hover:shadow-soft-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                  <TargetIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">SOP Difficulty</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Pass rates and average scores by SOP
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
