/**
 * app/dashboard/sops/page.tsx
 *
 * SOP management — List all uploaded procedures.
 */

import { Suspense } from 'react'
import { getSOPs, getSopCategories } from '@/lib/actions/admin'
import { getSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { SopFilters } from '@/components/admin/sop-filters'
import type { SopStatus } from '@/types/admin'
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
import { canUserActivateSop } from '@/lib/sop-errors'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'

export const metadata = { title: 'SOPs' }
export const dynamic = 'force-dynamic'

const VALID_STATUSES: SopStatus[] = [
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'ARCHIVED',
]

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

function FiltersFallback() {
  return (
    <div className="h-16 animate-pulse rounded-lg border bg-card" />
  )
}

export default async function SOPsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
  }>
}) {
  const params = await searchParams
  const status = VALID_STATUSES.includes(params.status as SopStatus)
    ? (params.status as SopStatus)
    : undefined

  const [sops, session, categories] = await Promise.all([
    getSOPs({
      search: params.search?.trim() || undefined,
      status,
      category: params.category?.trim() || undefined,
    }),
    getSession(),
    getSopCategories(),
  ])
  const canAuthorQuizzes =
    session?.role === 'ADMIN' ||
    session?.role === 'SUPER_ADMIN' ||
    session?.role === 'TRAINER'
  const canActivate = canUserActivateSop(session?.role)
  const hasFilters = !!params.search || !!status || !!params.category

  return (
    <CatalogPageLayout
      guideId="sops"
      count={sops.length}
      countLabel="document"
      countSuffix={hasFilters ? ' match the current filters' : ' in the library'}
      helpDefaultOpen={sops.length === 0 && !hasFilters}
      action={
        <CreateSOPModal
          trigger={
            <Button size="sm">
              <FileUpIcon className="mr-2 h-4 w-4" />
              Upload SOP
            </Button>
          }
        />
      }
    >
      {/* Next 15: useSearchParams() inside SopFilters must sit under Suspense */}
      <Suspense fallback={<FiltersFallback />}>
        <SopFilters categories={categories} />
      </Suspense>

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
              <p className="text-sm">
                {hasFilters
                  ? 'No SOPs match the current filters.'
                  : 'No SOPs found.'}
              </p>
              {!hasFilters ? (
                <CreateSOPModal
                  trigger={
                    <Button size="sm" variant="outline">
                      <FileUpIcon className="mr-2 h-4 w-4" /> Upload your first SOP
                    </Button>
                  }
                />
              ) : null}
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
                          canActivate={canActivate}
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
    </CatalogPageLayout>
  )
}
