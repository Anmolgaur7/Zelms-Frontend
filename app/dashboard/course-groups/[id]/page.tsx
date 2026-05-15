import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCourseGroup,
  getCourses,
} from '@/lib/actions/phase3'
import { CourseGroupManagePanel } from '@/components/phase3/course-group-manage-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const group = await getCourseGroup(id)
  return { title: group?.name ?? 'Course group' }
}

export default async function CourseGroupDetailPage({ params }: Props) {
  const { id } = await params
  const [group, courses] = await Promise.all([
    getCourseGroup(id),
    getCourses(),
  ])

  if (!group) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/course-groups">
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Course groups
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
          {group.status ? (
            <Badge variant="outline">{group.status}</Badge>
          ) : null}
        </div>
        {group.description ? (
          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Add courses from your catalog, then assign this bundle to a department.
          </p>
        )}
      </div>

      <CourseGroupManagePanel group={group} allCourses={courses} />
    </div>
  )
}
