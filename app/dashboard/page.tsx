/**
 * app/dashboard/page.tsx
 *
 * Admin dashboard — overview stats and activity.
 * Server component: fetches company info + user count.
 */

import { Suspense } from 'react'
import { getUsers } from '@/lib/actions/admin'
import { getSession } from '@/lib/session'
import {
  UsersIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  ClockIcon,
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
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trendLabel && (
            <Badge
              variant="outline"
              className={`h-4 text-[10px] px-1 ml-auto ${
                trend === 'up'
                  ? 'text-green-600 border-green-200'
                  : trend === 'down'
                  ? 'text-red-500 border-red-200'
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
  )
}

// ─── Stats (async) ────────────────────────────────────────────────────────────
async function DashboardStats() {
  const [users, session] = await Promise.all([getUsers(), getSession()])

  const totalUsers = users.length
  const activeEmployees = users.filter((u) => u.role === 'EMPLOYEE').length
  const admins = users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN',
  ).length
  const trainers = users.filter((u) => u.role === 'TRAINER').length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={totalUsers}
        description="All active accounts"
        icon={UsersIcon}
        trend="up"
        trendLabel={`${activeEmployees} employees`}
      />
      <StatCard
        title="Administrators"
        value={admins}
        description="Admin & Super Admin"
        icon={ShieldCheckIcon}
      />
      <StatCard
        title="Trainers"
        value={trainers}
        description="SOP training staff"
        icon={FileTextIcon}
      />
      <StatCard
        title="Pending Assignments"
        value="—"
        description="Awaiting completion"
        icon={ClipboardCheckIcon}
        trendLabel="Live soon"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {session?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s an overview of your pharma training operations
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
            <>
              <CreateUserModal
                trigger={
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 hover:border-primary/30 transition-colors w-full">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 hover:border-primary/30 transition-colors w-full">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 hover:border-primary/30 transition-colors w-full">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
                  <button className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 hover:border-primary/30 transition-colors w-full">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
              className="group flex items-start text-left gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 hover:border-primary/30 transition-colors w-full"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
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

      {/* Coming soon */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Training Analytics</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Completion rates, quiz scores, and overdue assignments charts — coming in Phase 5.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
