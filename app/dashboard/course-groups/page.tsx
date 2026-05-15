import Link from 'next/link'
import { getCourseGroupsWithMeta, getCoursesWithMeta } from '@/lib/actions/phase3'
import { CreateCourseGroupDialog } from '@/components/phase3/create-course-group-dialog'
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
import { LayersIcon } from 'lucide-react'

export const metadata = { title: 'Course groups' }
export const dynamic = 'force-dynamic'

export default async function CourseGroupsPage() {
  const [{ groups, apiAvailable }, { courses }] = await Promise.all([
    getCourseGroupsWithMeta(),
    getCoursesWithMeta(),
  ])

  return (
    <CatalogPageLayout
      guideId="course-groups"
      apiUnavailable={!apiAvailable}
      count={groups.length}
      countLabel="group"
      action={apiAvailable ? <CreateCourseGroupDialog /> : null}
    >
      {courses.length > 0 && groups.length === 0 && apiAvailable ? (
        <p className="text-sm rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground">
          You have {courses.length} course{courses.length === 1 ? '' : 's'} but no groups yet.
          Create a group, add courses, then assign a department.
        </p>
      ) : null}

      <CatalogListCard
        title="Groups"
        description="Open Manage to add courses and assign a department."
        icon={LayersIcon}
        isEmpty={groups.length === 0}
        emptyMessage="No course groups yet. Create a group, add catalog courses, then assign to a department."
      >
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
                  {g.status ? <Badge variant="outline">{g.status}</Badge> : '—'}
                </TableCell>
                <TableCell>{g.courses?.length ?? g._count?.courses ?? '—'}</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/course-groups/${g.id}`}>Manage</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CatalogListCard>
    </CatalogPageLayout>
  )
}
