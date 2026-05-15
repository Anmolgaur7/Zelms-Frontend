/**
 * app/dashboard/assignments/page.tsx
 *
 * Tenant-wide training assignment console (ADMIN | TRAINER | AUDITOR).
 *
 * Backed by:
 *   - GET /api/assignments/company        (paginated list, filters)
 *   - GET /api/assignments/company/stats  (KPI cards)
 *
 * URL params drive everything (page, status, search, overdueOnly, sopId, userId).
 */

import Link from 'next/link'
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  LockIcon,
  TrendingUpIcon,
  UnlockIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react'

import { getCompanyAssignmentsPageData } from '@/lib/actions/admin'
import { getSession } from '@/lib/session'
import { canAdministerAssignments } from '@/lib/tenant-permissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { resolvedCompanyStatsKpis } from '@/lib/company-assignment-stats'
import { assignmentDisplaySop } from '@/lib/assignment-display'
import { CreateAssignmentModal } from '@/components/modals/create-assignment-modal'
import { BulkAssignDialog } from '@/components/admin/bulk-assign-dialog'
import { SopViewButton } from '@/components/admin/sop-view-button'
import { AssignmentFilters } from '@/components/admin/assignment-filters'
import { PaginationBar } from '@/components/admin/pagination-bar'
import { UnlockAssignmentDialog } from '@/components/admin/unlock-assignment-dialog'
import type {
  AssignmentListQuery,
  AssignmentStatus,
  CompanyAssignmentStats,
} from '@/types/admin'

export const metadata = { title: 'Assignments' }

const STATUS_COLOURS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  OVERDUE: 'bg-amber-100 text-amber-700 border-amber-200',
  LOCKED_OUT: 'bg-rose-100 text-rose-700 border-rose-200',
}

const VALID_STATUSES: AssignmentStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'OVERDUE',
  'LOCKED_OUT',
]

function intParam(value: string | undefined, fallback: number, min = 1, max = 1000) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

function parseQuery(searchParams: Record<string, string | undefined>): AssignmentListQuery {
  const page = intParam(searchParams.page, 1, 1, 10_000)
  const limit = intParam(searchParams.limit, 25, 1, 100)
  const status = VALID_STATUSES.includes(searchParams.status as AssignmentStatus)
    ? (searchParams.status as AssignmentStatus)
    : undefined
  return {
    page,
    limit,
    status,
    search: searchParams.search?.trim() || undefined,
    userId: searchParams.userId?.trim() || undefined,
    sopId: searchParams.sopId?.trim() || undefined,
    quizId: searchParams.quizId?.trim() || undefined,
    overdueOnly: searchParams.overdueOnly === 'true',
  }
}

interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  tone?: 'default' | 'good' | 'warn' | 'bad'
  subline?: string
  index?: number
}

function KpiCard({ title, value, icon: Icon, tone = 'default', subline, index = 0 }: KpiCardProps) {
  const toneClasses: Record<NonNullable<KpiCardProps['tone']>, string> = {
    default: 'text-muted-foreground from-muted/80 to-muted/40 ring-border/60',
    good: 'text-emerald-600 from-emerald-500/15 to-emerald-500/5 ring-emerald-500/20 dark:text-emerald-400',
    warn: 'text-amber-600 from-amber-500/15 to-amber-500/5 ring-amber-500/20 dark:text-amber-400',
    bad: 'text-rose-600 from-rose-500/15 to-rose-500/5 ring-rose-500/20 dark:text-rose-400',
  }
  return (
    <Card
      className="card-hover animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 rounded-md bg-gradient-to-br p-2 ring-1 ring-inset transition-transform duration-200 hover:scale-105 ${toneClasses[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-semibold leading-tight tracking-tight">
            {value}
          </p>
          {subline && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subline}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KpiRow({ stats }: { stats: CompanyAssignmentStats }) {
  const byStatus = stats.byStatus ?? {}
  const k = resolvedCompanyStatsKpis(stats)
  const completed = byStatus.COMPLETED ?? 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        index={0}
        title="Total assignments"
        value={stats.totalAssignments ?? 0}
        icon={ClipboardCheckIcon}
        subline={`${stats.traineesWithAssignments ?? 0} trainee(s)`}
      />
      <KpiCard
        index={1}
        title="Completed"
        value={completed}
        icon={CheckCircle2Icon}
        tone="good"
        subline={
          k.passedCount || k.failedCount
            ? `${k.passedCount} passed · ${k.failedCount} failed`
            : undefined
        }
      />
      <KpiCard
        index={2}
        title="Avg pass score"
        value={k.avgAmongPassedDisplay}
        icon={TrendingUpIcon}
        tone="good"
      />
      <KpiCard
        index={3}
        title="Overdue (pending)"
        value={k.overduePendingCount}
        icon={ClockIcon}
        tone="warn"
      />
      <KpiCard
        index={4}
        title="Locked out"
        value={k.lockedOutCount}
        icon={LockIcon}
        tone="bad"
      />
    </div>
  )
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const query = parseQuery(params)
  const [result, session] = await Promise.all([
    getCompanyAssignmentsPageData(query),
    getSession(),
  ])

  const { list, stats, error, statsError } = result
  const canMutateAssignments = canAdministerAssignments(session?.role)
  const assignments = list.data
  const hasFilters =
    !!query.search ||
    !!query.status ||
    !!query.userId ||
    !!query.sopId ||
    !!query.quizId ||
    !!query.overdueOnly

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-up motion-reduce:animate-none">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Training Assignments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typeof list.total === 'number'
              ? `${list.total.toLocaleString()} total assignment${list.total === 1 ? '' : 's'}`
              : `${assignments.length} on this page`}
          </p>
        </div>
        {canMutateAssignments ? (
          <div className="flex flex-wrap items-center gap-2">
            <BulkAssignDialog
              trigger={
                <Button size="sm" variant="outline">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Bulk assign
                </Button>
              }
            />
            <CreateAssignmentModal
              trigger={
                <Button size="sm">
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Assign Training
                </Button>
              }
            />
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Auditors cannot create assignments. Ask an admin or trainer."
          >
            <ClipboardCheckIcon className="mr-2 h-4 w-4" />
            Assign Training
          </Button>
        )}
      </div>

      {/* KPI strip */}
      {stats ? (
        <KpiRow stats={stats} />
      ) : statsError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
          <p>
            KPIs unavailable: {statsError.code} · {statsError.message}
          </p>
          {statsError.requestId ? (
            <p className="mt-1 font-mono text-[10px] opacity-90">
              Request ID: {statsError.requestId}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* List error banner (separate from stats — list can fail independently). */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-300">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Could not load assignments.</p>
            <p className="text-xs font-mono opacity-80">
              {error.path} → {error.status ? `${error.status} ` : ''}
              {error.code} · {error.message}
            </p>
            {error.requestId ? (
              <p className="text-xs font-mono opacity-80">
                Request ID: {error.requestId}
              </p>
            ) : null}
            {error.code === 'TENANT_REQUIRED' && (
              <p className="text-xs opacity-80">
                You are signed in as a platform admin. Switch to a tenant admin
                account to view assignments.
              </p>
            )}
          </div>
        </div>
      )}

      <AssignmentFilters />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            Active Assignments
          </CardTitle>
          <CardDescription>
            Tenant-wide list from <code>/api/assignments/company</code>. Click an
            employee to open their dossier.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <ClipboardCheckIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">
                {error
                  ? 'No assignments to show.'
                  : hasFilters
                  ? 'No assignments match the current filters.'
                  : 'No assignments yet.'}
              </p>
              {!error && !hasFilters && (
                <CreateAssignmentModal
                  trigger={
                    <Button size="sm" variant="outline">
                      <ClipboardCheckIcon className="mr-2 h-4 w-4" />
                      Create first assignment
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>SOP</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((ass) => {
                    const disp = assignmentDisplaySop(ass)
                    const sopId = disp.sopId
                    const sopTitle = disp.title
                    const sopVersion = disp.version
                    const due = ass.dueDate ?? ass.deadline ?? null
                    const userId = ass.user?.id ?? ass.userId

                    return (
                      <TableRow key={ass.id}>
                        <TableCell>
                          {userId ? (
                            <Link
                              href={`/dashboard/users/${userId}`}
                              className="group flex flex-col hover:text-primary"
                            >
                              <span className="font-medium group-hover:underline">
                                {ass.user?.name ?? '—'}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {ass.user?.employeeId ?? ''}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {ass.user?.name ?? '—'}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {ass.user?.employeeId ?? ''}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{sopTitle}</span>
                            {sopVersion && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                v{sopVersion}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {ass.assignedQuizDifficulty ?? '—'}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLOURS[ass.status] ??
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ass.status === 'LOCKED_OUT' && (
                              <LockIcon className="h-3 w-3" />
                            )}
                            {ass.status === 'FAILED' && (
                              <XCircleIcon className="h-3 w-3" />
                            )}
                            {ass.status === 'COMPLETED' && (
                              <CheckCircle2Icon className="h-3 w-3" />
                            )}
                            {ass.status.replaceAll('_', ' ')}
                          </span>
                        </TableCell>

                        <TableCell className="text-sm">
                          {typeof ass.score === 'number' ? (
                            <Badge
                              variant="outline"
                              className={
                                ass.passed
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-300 bg-rose-50 text-rose-700'
                              }
                            >
                              {ass.score}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm">
                          {due ? (
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              {new Date(due).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ass.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {sopId && (
                              <SopViewButton
                                sopId={sopId}
                                label="View SOP"
                                presignedUrl={ass.sopDisplayUrl ?? null}
                              />
                            )}
                            {ass.status === 'LOCKED_OUT' &&
                              (canMutateAssignments ? (
                                <UnlockAssignmentDialog
                                  assignmentId={ass.id}
                                  traineeName={ass.user?.name}
                                  sopTitle={ass.sop?.title ?? ass.quiz?.sop?.title}
                                  trigger={
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-rose-600 hover:text-rose-700"
                                      aria-label="Unlock locked-out assignment"
                                    >
                                      <UnlockIcon className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 cursor-not-allowed opacity-45"
                                  disabled
                                  title="Auditors cannot unlock assignments. Ask an admin or trainer."
                                  aria-label="Unlock not available for your role"
                                >
                                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              ))}
                            {userId && (
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                aria-label="Open trainee dossier"
                              >
                                <Link href={`/dashboard/users/${userId}`}>
                                  <UsersIcon className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <PaginationBar
                page={list.page}
                pageCount={assignments.length}
                limit={list.limit ?? query.limit ?? 25}
                total={list.total}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
