/**
 * app/dashboard/assignments/page.tsx
 *
 * Training Assignments management.
 */

import { fetchAssignments } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ClipboardCheckIcon,
  BookOpenIcon,
  ClockIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { CreateAssignmentModal } from '@/components/modals/create-assignment-modal'
import { SopViewButton } from '@/components/admin/sop-view-button'

export const metadata = { title: 'Assignments' }

const STATUS_COLOURS: Record<string, string> = {
  PENDING:     'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED:      'bg-red-100 text-red-700 border-red-200',
  OVERDUE:     'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function AssignmentsPage() {
  const result = await fetchAssignments()
  const assignments = result.data
  const allFailed = !result.endpointUsed && result.errors.length > 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training Assignments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assignments.length} total assignment{assignments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateAssignmentModal
          trigger={
            <Button size="sm">
              <ClipboardCheckIcon className="mr-2 h-4 w-4" />
              Assign Training
            </Button>
          }
        />
      </div>

      {/* Backend error banner */}
      {allFailed && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Could not load assignments.</p>
            <p className="text-xs opacity-80">
              The backend rejected every listing endpoint we tried. Most likely
              this account does not have permission, or the route is named
              differently on your deployment.
            </p>
            <ul className="text-xs font-mono opacity-80 list-disc pl-4 space-y-0.5 mt-2">
              {result.errors.map((err, i) => (
                <li key={i}>
                  {err.path} → {err.status ? `${err.status} ` : ''}
                  {err.code} {err.message ? `· ${err.message}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            Active Assignments
          </CardTitle>
          <CardDescription>
            Monitor employee training progress and compliance status.
            {result.endpointUsed && (
              <span className="block text-[10px] font-mono opacity-60 mt-0.5">
                source: {result.endpointUsed}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <ClipboardCheckIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">
                {allFailed ? 'No assignments to show.' : 'No assignments yet.'}
              </p>
              {!allFailed && (
                <CreateAssignmentModal
                  trigger={
                    <Button size="sm" variant="outline">
                      <ClipboardCheckIcon className="mr-2 h-4 w-4" /> Create first assignment
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>SOP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((ass) => {
                  const sopId = ass.sop?.id ?? ass.quiz?.sop?.id ?? ass.sopId
                  const sopTitle = ass.sop?.title ?? ass.quiz?.sop?.title ?? '—'
                  const sopVersion = ass.sop?.version ?? ass.quiz?.sop?.version

                  return (
                    <TableRow key={ass.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{ass.user?.name ?? '—'}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {ass.user?.employeeId ?? ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{sopTitle}</span>
                          {sopVersion && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              v{sopVersion}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLOURS[ass.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ass.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ass.dueDate || ass.deadline ? (
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date((ass.dueDate || ass.deadline)!).toLocaleDateString()}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(ass.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {sopId && (
                          <SopViewButton sopId={sopId} label="Open SOP" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
