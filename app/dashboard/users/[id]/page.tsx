/**
 * app/dashboard/users/[id]/page.tsx
 *
 * Trainee dossier — per-user assignment history for ADMIN | TRAINER | AUDITOR.
 * Backed by GET /api/assignments/company/users/:userId
 *   → { trainee, summary, assignments: { data, total, page, limit } }
 *
 * URL params: ?page=&limit=&status=
 */

import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  LockIcon,
  MailIcon,
  TrendingUpIcon,
  UnlockIcon,
  UserIcon,
  XCircleIcon,
  AlertCircleIcon,
  BuildingIcon,
} from 'lucide-react'

import { getTraineeDossier } from '@/lib/actions/admin'
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
import { SopViewButton } from '@/components/admin/sop-view-button'
import { AssignmentStatusFilter } from '@/components/admin/assignment-status-filter'
import { PaginationBar } from '@/components/admin/pagination-bar'
import { UnlockAssignmentDialog } from '@/components/admin/unlock-assignment-dialog'
import type { AssignmentStatus } from '@/types/admin'

export const metadata = { title: 'Trainee dossier' }

const VALID_STATUSES: AssignmentStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'OVERDUE',
  'LOCKED_OUT',
]

const STATUS_COLOURS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  OVERDUE: 'bg-amber-100 text-amber-700 border-amber-200',
  LOCKED_OUT: 'bg-rose-100 text-rose-700 border-rose-200',
}

const ROLE_COLOURS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
  TRAINER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EMPLOYEE: 'bg-slate-100 text-slate-700 border-slate-200',
  AUDITOR: 'bg-amber-100 text-amber-700 border-amber-200',
}

function intParam(value: string | undefined, fallback: number, min = 1, max = 1000) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

function StatLine({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold leading-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default async function TraineeDossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const page = intParam(sp.page, 1, 1, 10_000)
  const limit = intParam(sp.limit, 25, 1, 100)
  const status = VALID_STATUSES.includes(sp.status as AssignmentStatus)
    ? (sp.status as AssignmentStatus)
    : undefined

  const [{ dossier, error }, session] = await Promise.all([
    getTraineeDossier(id, { page, limit, status }),
    getSession(),
  ])
  const canMutateAssignments = canAdministerAssignments(session?.role)

  // ─── Error state ───────────────────────────────────────────────────────────
  if (!dossier) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/dashboard/assignments">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to assignments
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <AlertCircleIcon className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Trainee dossier unavailable.</p>
            {error && (
              <p className="text-xs font-mono opacity-70">
                {error.path} → {error.status ? `${error.status} ` : ''}
                {error.code} · {error.message}
              </p>
            )}
            {error?.status === 404 && (
              <p className="text-xs opacity-80">
                The user id <code className="px-1">{id}</code> does not match any
                trainee in your tenant.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { trainee, summary, assignments } = dossier
  const totalAssignments =
    summary.totalAssignments ??
    Object.values(summary.byStatus ?? {}).reduce<number>(
      (acc, n) => acc + (typeof n === 'number' ? n : 0),
      0,
    )
  const lastCompletedAt = summary.lastCompletedAt
    ? new Date(summary.lastCompletedAt).toLocaleString()
    : null
  const avgScore =
    typeof summary.averageScore === 'number'
      ? `${Math.round(summary.averageScore * 10) / 10}%`
      : '—'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/dashboard/assignments">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to assignments
          </Link>
        </Button>
      </div>

      {/* ── Trainee profile card ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-start gap-6 p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {trainee.name}
              </h1>
              {trainee.role && (
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                    ROLE_COLOURS[String(trainee.role)] ??
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {String(trainee.role)}
                </span>
              )}
              {trainee.isActive === false && (
                <Badge
                  variant="outline"
                  className="border-rose-300 bg-rose-50 text-rose-700"
                >
                  Inactive
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {trainee.employeeId}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
              {trainee.email && (
                <span className="inline-flex items-center gap-1.5">
                  <MailIcon className="h-3.5 w-3.5" />
                  {trainee.email}
                </span>
              )}
              {trainee.department?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <BuildingIcon className="h-3.5 w-3.5" />
                  {trainee.department.name}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary KPI strip ─────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-muted/60 p-2 text-muted-foreground">
              <ClipboardCheckIcon className="h-4 w-4" />
            </div>
            <StatLine label="Total" value={totalAssignments} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-muted/60 p-2 text-emerald-600">
              <CheckCircle2Icon className="h-4 w-4" />
            </div>
            <StatLine
              label="Passed"
              value={summary.passed ?? summary.byStatus?.COMPLETED ?? 0}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-muted/60 p-2 text-rose-600">
              <XCircleIcon className="h-4 w-4" />
            </div>
            <StatLine
              label="Failed"
              value={summary.failed ?? summary.byStatus?.FAILED ?? 0}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-muted/60 p-2 text-emerald-600">
              <TrendingUpIcon className="h-4 w-4" />
            </div>
            <StatLine label="Avg score" value={avgScore} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-muted/60 p-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <StatLine
              label="Last completed"
              value={lastCompletedAt ?? '—'}
              hint={
                lastCompletedAt
                  ? undefined
                  : 'No completed trainings yet.'
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Assignment history ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ClipboardCheckIcon className="h-4 w-4 text-muted-foreground" />
                Assignment history
              </CardTitle>
              <CardDescription>
                Paginated; filter by status.{' '}
                {typeof assignments.total === 'number' && (
                  <>{assignments.total} record(s) total.</>
                )}
              </CardDescription>
            </div>
            <AssignmentStatusFilter />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <ClipboardCheckIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">
                {status
                  ? `No ${status.replaceAll('_', ' ').toLowerCase()} assignments.`
                  : 'No assignments recorded.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SOP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.data.map((ass) => {
                    const sopId =
                      ass.sop?.id ?? ass.quiz?.sop?.id ?? ass.sopId ?? undefined
                    const sopTitle =
                      ass.sop?.title ?? ass.quiz?.sop?.title ?? '—'
                    const sopVersion =
                      ass.sop?.version ?? ass.quiz?.sop?.version
                    const due = ass.dueDate ?? ass.deadline ?? null
                    return (
                      <TableRow key={ass.id}>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {ass.completedAt
                            ? new Date(ass.completedAt).toLocaleDateString()
                            : '—'}
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
                                  traineeName={trainee.name}
                                  sopTitle={sopTitle}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <PaginationBar
                page={assignments.page}
                pageCount={assignments.data.length}
                limit={assignments.limit ?? limit}
                total={assignments.total}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
