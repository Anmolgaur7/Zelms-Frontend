import Link from 'next/link'
import { getCoursesWithMeta } from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateCourseDialog } from '@/components/phase3/create-course-dialog'
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
import { BookOpenIcon } from 'lucide-react'

export const metadata = { title: 'Courses' }
export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const { courses, apiAvailable } = await getCoursesWithMeta()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Phase 3 catalog — each course links to one SOP.
          </p>
        </div>
        {apiAvailable ? <CreateCourseDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Courses API not available</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              <code className="text-xs">POST /api/courses</code> is not registered on{' '}
              <code className="text-xs">{BASE_URL}</code>. Deploy the latest backend
              (Phase 3) or point <code className="text-xs">NEXT_PUBLIC_API_URL</code>{' '}
              at a server that includes the catalog routes in{' '}
              <code className="text-xs">docs/API_ENDPOINTS.md</code>.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4" />
            Course catalog
          </CardTitle>
          <CardDescription>
            Employees only see ACTIVE courses. Publish the linked SOP first.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No courses yet. After creating a course, bundle it in{' '}
              <Link href="/dashboard/course-groups" className="underline underline-offset-2">
                Course groups
              </Link>
              .
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SOP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.sop?.title ?? '—'}
                    </TableCell>
                    <TableCell>
                      {c.status ? (
                        <Badge variant="outline">{c.status}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="link" className="w-fit px-0">
        <Link href="/dashboard/course-groups">Manage course groups →</Link>
      </Button>
    </div>
  )
}
