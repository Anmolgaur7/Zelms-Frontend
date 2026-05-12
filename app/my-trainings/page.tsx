/**
 * app/my-trainings/page.tsx
 *
 * Employee training dashboard — assigned SOPs and their status.
 * If the backend errors, we surface a real banner instead of pretending
 * the list is empty.
 */

import { fetchMyAssignments } from '@/lib/actions/employee'
import { getSession } from '@/lib/session'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileTextIcon,
  PlayIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  BookOpenIcon,
  AwardIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Assignment } from '@/types/admin'

export const metadata = { title: 'My Trainings' }

type StatusKey = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'FAILED'

const STATUS_CONFIG: Record<StatusKey, { label: string; icon: any; class: string; textClass: string }> = {
  PENDING: {
    label: 'Not Started',
    icon: ClockIcon,
    class: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayIcon,
    class: 'bg-blue-100 text-blue-700 border-blue-200',
    textClass: 'text-blue-700',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2Icon,
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-700',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertCircleIcon,
    class: 'bg-rose-100 text-rose-700 border-rose-200',
    textClass: 'text-rose-700',
  },
  FAILED: {
    label: 'Retake Required',
    icon: AlertCircleIcon,
    class: 'bg-amber-100 text-amber-700 border-amber-200',
    textClass: 'text-amber-700',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sopTitle(a: Assignment): string {
  return a.quiz?.sop?.title || a.sop?.title || 'Untitled SOP'
}

function sopVersion(a: Assignment): string | undefined {
  return a.quiz?.sop?.version ?? a.sop?.version ?? undefined
}

function dueAt(a: Assignment): string | null {
  return a.dueDate || a.deadline || null
}

function statusConfig(status: string) {
  return STATUS_CONFIG[(status as StatusKey)] ?? STATUS_CONFIG.PENDING
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyTrainingsPage() {
  const [result, session] = await Promise.all([fetchMyAssignments(), getSession()])

  const assignments = result.data ?? []
  const fetchFailed = !!result.error

  const pending = assignments.filter((a) => a.status !== 'COMPLETED')
  const completed = assignments.filter((a) => a.status === 'COMPLETED')
  const overdue = pending.filter((a) => a.status === 'OVERDUE')

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {session?.name ? `Welcome, ${session.name.split(' ')[0]}` : 'My Training Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete your assigned Standard Operating Procedures to stay GxP-compliant.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/my-trainings/library">
              <BookOpenIcon className="mr-2 h-4 w-4" />
              Browse SOP Library
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/my-trainings/certificates">
              <AwardIcon className="mr-2 h-4 w-4" />
              My Certificates
            </Link>
          </Button>
        </div>
      </div>

      {/* Backend error banner */}
      {fetchFailed && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Could not load your assignments.</p>
            <p className="text-xs opacity-80 mt-0.5">
              {result.error!.message}
              {result.error!.code !== 'CLIENT_ERROR' && (
                <span className="font-mono"> · {result.error!.code}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdue.length > 0
                ? `${overdue.length} overdue · review now`
                : 'Pending assignments'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">SOPs validated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {assignments.length > 0
                ? Math.round((completed.length / assignments.length) * 100)
                : 100}
              %
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${
                    assignments.length > 0
                      ? (completed.length / assignments.length) * 100
                      : 100
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileTextIcon className="h-5 w-5 text-primary" />
          Active Assignments
        </h2>

        {pending.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <CheckCircle2Icon className="h-12 w-12 text-emerald-500/30 mb-4" />
              <CardTitle className="text-lg">
                {fetchFailed ? 'No assignments to show' : 'All caught up!'}
              </CardTitle>
              <CardDescription className="max-w-[360px] mt-2">
                {fetchFailed
                  ? 'We could not reach the training service. Try again or contact your admin.'
                  : 'You have no pending training assignments at this time. Use the SOP Library to study procedures on your own.'}
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/my-trainings/library">
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  Open SOP Library
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pending.map((item) => {
              const cfg = statusConfig(item.status)
              const Icon = cfg.icon
              const due = dueAt(item)
              const version = sopVersion(item)

              return (
                <Card
                  key={item.id}
                  className="group hover:border-primary/40 transition-all overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg leading-tight">
                          {sopTitle(item)}
                        </h3>
                        {version && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            v{version}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 ${cfg.class}`}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${cfg.textClass}`} />
                          <span>{cfg.label}</span>
                        </div>
                        {due && (
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>
                              Due {new Date(due).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {typeof item.score === 'number' && (
                          <span className="font-mono text-xs">
                            Last score: {item.score}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" asChild>
                        <Link href={`/my-trainings/view/${item.id}`}>
                          View Document
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href={`/my-trainings/quiz/${item.id}`}>
                          <PlayIcon className="mr-2 h-4 w-4" />
                          {item.status === 'FAILED' ? 'Retake Quiz' : 'Start Quiz'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completed.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Recently Completed
          </h2>
          <div className="grid gap-3 opacity-90">
            {completed.map((item) => (
              <Card key={item.id} className="bg-muted/30">
                <div className="flex items-center p-4 gap-4">
                  <CheckCircle2Icon className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{sopTitle(item)}</p>
                    <p className="text-xs text-muted-foreground">
                      Validated on{' '}
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleDateString()
                        : 'N/A'}
                      {typeof item.score === 'number' && ` · score ${item.score}%`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                    <Link href={`/my-trainings/certificate/${item.id}`}>
                      <AwardIcon className="mr-1.5 h-3.5 w-3.5" />
                      Certificate
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
