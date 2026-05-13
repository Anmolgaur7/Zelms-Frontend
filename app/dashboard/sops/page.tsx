/**
 * app/dashboard/sops/page.tsx
 *
 * SOP management — List all uploaded procedures.
 */

import { getSOPs } from '@/lib/actions/admin'
import { getSession } from '@/lib/session'
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
  FileTextIcon,
  FileUpIcon,
  GitBranchIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { CreateSOPModal } from '@/components/modals/create-sop-modal'
import { SopViewButton } from '@/components/admin/sop-view-button'
import { SopStatusDialog } from '@/components/admin/sop-status-dialog'
import { SopReviseDialog } from '@/components/admin/sop-revise-dialog'
import { ManualQuizDialog } from '@/components/admin/manual-quiz-dialog'

export const metadata = { title: 'SOPs' }

const STATUS_COLOURS: Record<string, string> = {
  DRAFT:        'bg-slate-100 text-slate-700 border-slate-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  ACTIVE:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  ARCHIVED:     'bg-amber-100 text-amber-700 border-amber-200',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

export default async function SOPsPage() {
  const [sops, session] = await Promise.all([getSOPs(), getSession()])
  const canAuthorQuizzes =
    session?.role === 'ADMIN' ||
    session?.role === 'SUPER_ADMIN' ||
    session?.role === 'TRAINER'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Standard Operating Procedures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sops.length} document{sops.length !== 1 ? 's' : ''} in the library
          </p>
        </div>
        <CreateSOPModal
          trigger={
            <Button size="sm">
              <FileUpIcon className="mr-2 h-4 w-4" />
              Upload SOP
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            SOP Library
          </CardTitle>
          <CardDescription>
            All procedures must be reviewed and approved before being marked as ACTIVE.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sops.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <FileTextIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">No SOPs found.</p>
              <CreateSOPModal
                trigger={
                  <Button size="sm" variant="outline">
                    <FileUpIcon className="mr-2 h-4 w-4" /> Upload your first SOP
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sops.map((sop) => (
                  <TableRow key={sop.id}>
                    <TableCell className="font-medium">{sop.title}</TableCell>
                    <TableCell className="text-sm font-mono">{sop.version ?? '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLOURS[sop.status ?? ''] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {STATUS_LABELS[sop.status ?? ''] ?? sop.status ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(sop.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <SopViewButton sopId={sop.id} />

                        <SopStatusDialog
                          sopId={sop.id}
                          sopTitle={sop.title}
                          currentStatus={sop.status}
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Change SOP status"
                            >
                              <ShieldCheckIcon className="h-4 w-4" />
                            </Button>
                          }
                        />

                        <SopReviseDialog
                          sopId={sop.id}
                          sopTitle={sop.title}
                          currentVersion={sop.version}
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Revise SOP"
                            >
                              <GitBranchIcon className="h-4 w-4" />
                            </Button>
                          }
                        />

                        {canAuthorQuizzes ? (
                          <ManualQuizDialog
                            sopId={sop.id}
                            sopTitle={sop.title}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Author manual quiz"
                                title="Author manual quiz"
                              >
                                <ListChecksIcon className="h-4 w-4" />
                              </Button>
                            }
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
