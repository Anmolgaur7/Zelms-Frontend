/**
 * app/my-trainings/library/page.tsx
 *
 * Employee-facing SOP Library — all company SOPs available for self-study.
 * Backed by GET /api/sops/ (tenant JWT).
 */

import { Suspense } from 'react'
import {
  getAllSops,
  getEmployeeSopCategories,
} from '@/lib/actions/employee'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpenIcon,
  ChevronLeftIcon,
  FileTextIcon,
  ChevronRightIcon,
} from 'lucide-react'
import Link from 'next/link'
import { SopFilters } from '@/components/admin/sop-filters'
import type { SopStatus } from '@/types/admin'

export const metadata = { title: 'SOP Library' }
export const dynamic = 'force-dynamic'

const LIBRARY_STATUSES: { value: SopStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Active + archived' },
  { value: 'ACTIVE', label: 'Active only' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const STATUS_COLOURS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-amber-100 text-amber-700 border-amber-200',
}

function FiltersFallback() {
  return <div className="h-16 animate-pulse rounded-lg border bg-card" />
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
  }>
}) {
  const params = await searchParams
  const filterStatus =
    params.status === 'ACTIVE' || params.status === 'ARCHIVED'
      ? (params.status as SopStatus)
      : undefined

  const [sops, categories] = await Promise.all([
    getAllSops({
      search: params.search?.trim() || undefined,
      status: filterStatus,
      category: params.category?.trim() || undefined,
    }),
    getEmployeeSopCategories(),
  ])

  // Library default: hide DRAFT/UNDER_REVIEW; show ARCHIVED only if asked.
  const visible = sops.filter((s) => {
    if (!s.status) return true
    if (s.status === 'DRAFT' || s.status === 'UNDER_REVIEW') return false
    if (s.status === 'ARCHIVED' && filterStatus !== 'ARCHIVED') return false
    return true
  })

  const hasFilters = !!params.search || !!filterStatus || !!params.category

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      <Link
        href="/my-trainings"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Trainings
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpenIcon className="h-7 w-7 text-primary" />
          SOP Library
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse all Standard Operating Procedures available to your company.
          Open any document to read, study with AI flashcards, or chat with the SOP assistant.
        </p>
      </div>

      <Suspense fallback={<FiltersFallback />}>
        <SopFilters
          categories={categories}
          statusOptions={LIBRARY_STATUSES}
          searchPlaceholder="Search title or description…"
        />
      </Suspense>

      {visible.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileTextIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <CardTitle className="text-lg">
              {hasFilters ? 'No matching SOPs' : 'No SOPs published yet'}
            </CardTitle>
            <CardDescription className="max-w-[360px] mt-2">
              {hasFilters
                ? 'Try clearing the filters above or searching by a different keyword.'
                : 'Your company has not published any SOPs in the library. Once your trainer uploads procedures, they will show up here.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((sop) => (
            <Link
              key={sop.id}
              href={`/my-trainings/library/${sop.id}`}
              className="block group"
            >
              <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <FileTextIcon className="h-5 w-5 text-primary" />
                    </div>
                    {sop.status && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          STATUS_COLOURS[sop.status] ?? ''
                        }`}
                      >
                        {sop.status}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {sop.title}
                  </CardTitle>
                  {sop.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {sop.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {sop.version && (
                        <span className="font-mono">v{sop.version}</span>
                      )}
                      {sop.category && (
                        <>
                          <span>·</span>
                          <span>{sop.category}</span>
                        </>
                      )}
                    </div>
                    <ChevronRightIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
