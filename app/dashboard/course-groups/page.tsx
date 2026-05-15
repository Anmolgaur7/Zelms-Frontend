import Link from 'next/link'
import {
  getCourseGroupsWithMeta,
  getCoursesWithMeta,
} from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateCourseGroupDialog } from '@/components/phase3/create-course-group-dialog'
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
import { LayersIcon } from 'lucide-react'

export const metadata = { title: 'Course groups' }
export const dynamic = 'force-dynamic'

export default async function CourseGroupsPage() {
  const [{ groups, apiAvailable }, { courses }] = await Promise.all([
    getCourseGroupsWithMeta(),
    getCoursesWithMeta(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Course groups</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bundle courses from the catalog, then assign the group to a department.
          </p>
        </div>
        {apiAvailable ? <CreateCourseGroupDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Course groups API not available</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              <code className="text-xs">GET /api/course-groups</code> is not registered on{' '}
              <code className="text-xs">{BASE_URL}</code>. Deploy the latest backend
              (Phase 3) or update <code className="text-xs">NEXT_PUBLIC_API_URL</code>.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {courses.length > 0 && groups.length === 0 ? (
        <Card className="border-border/80">
          <CardContent className="py-4 text-sm">
            <p className="font-medium">You have courses but no groups yet</p>
            <p className="mt-1 text-muted-foreground">
              Creating a course on{' '}
              <Link href="/dashboard/courses" className="underline underline-offset-2">
                Courses
              </Link>{' '}
              does not show it here automatically. Click{' '}
              <span className="font-medium">New group</span>, then add your course(s) and
              assign a department.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LayersIcon className="h-4 w-4" /> Groups
          </CardTitle>
          <CardDescription>
            Open a group to add courses and run department assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No course groups yet.
              {apiAvailable ? ' Create one with New group above.' : ''}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>
                      {g.status ? (
                        <Badge variant="outline">{g.status}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {g.courses?.length ?? g._count?.courses ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/course-groups/${g.id}`}>Manage</Link>
                      </Button>
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
