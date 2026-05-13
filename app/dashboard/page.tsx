/**
 * app/dashboard/page.tsx
 *
 * Admin dashboard — overview stats and activity.
 * Server component: fetches company info + user count.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers } from '@/lib/actions/admin'
import { getAdminStats } from '@/lib/actions/analytics'
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

// ─── Stats (async) ────────────────────────────────────────────────────────────
async function DashboardStats() {
  const [users, { stats, error }] = await Promise.all([
    getUsers(),
    getAdminStats(),
  ])

  // User-role tallies fall back to the users list so the tiles still render
  // if `/api/admin/stats` is unreachable (e.g. role-gated for TRAINER).
  const fallbackTotal = users.length
  const fallbackEmployees = users.filter((u) => u.role === 'EMPLOYEE').length
  const fallbackAdmins = users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN',
  ).length
  const fallbackTrainers = users.filter((u) => u.role === 'TRAINER').length

  const totalUsers = stats?.totalUsers ?? fallbackTotal
  const employees = stats?.employees ?? fallbackEmployees
  const admins = stats?.admins ?? fallbackAdmins
  const trainers = stats?.trainers ?? fallbackTrainers

  const totalAssignments = stats?.totalAssignments
  const pending = stats?.pending
  const overdue = stats?.overdue
  const completionRate = stats?.completionRate

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
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()

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
        <DashboardStats />
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
