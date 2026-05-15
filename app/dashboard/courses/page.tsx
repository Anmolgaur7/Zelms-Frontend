import Link from 'next/link'
import { getCoursesWithMeta } from '@/lib/actions/phase3'
import { CreateCourseDialog } from '@/components/phase3/create-course-dialog'
import {
  CatalogListCard,
  CatalogPageLayout,
} from '@/components/phase3/catalog-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    <CatalogPageLayout
      guideId="courses"
      apiUnavailable={!apiAvailable}
      count={courses.length}
      countLabel="course"
      action={apiAvailable ? <CreateCourseDialog /> : null}
    >
      <CatalogListCard
        title="Course catalog"
        description="Each row is one training item linked to a published SOP."
        icon={BookOpenIcon}
        isEmpty={courses.length === 0}
        emptyMessage="No courses yet. Create one linked to an ACTIVE SOP, then use it in course groups, induction, or job descriptions."
      >
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
      </CatalogListCard>
    </CatalogPageLayout>
  )
}
