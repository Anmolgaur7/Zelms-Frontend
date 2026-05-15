import { notFound } from 'next/navigation'
import { getCourseGroup, getCourses } from '@/lib/actions/phase3'
import { CatalogDetailHeader } from '@/components/phase3/catalog-detail-header'
import { CourseGroupManagePanel } from '@/components/phase3/course-group-manage-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function CourseGroupDetailPage({ params }: Props) {
  const { id } = await params
  const [group, courses] = await Promise.all([getCourseGroup(id), getCourses()])
  if (!group) notFound()

  return (
    <div className="flex flex-1 flex-col pb-8">
      <CatalogDetailHeader
        guideId="course-groups"
        backHref="/dashboard/course-groups"
        backLabel="Course groups"
        title={group.name}
        status={group.status}
        subtitle={
          group.description ??
          'Add courses, then assign this bundle to a department.'
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <CourseGroupManagePanel group={group} allCourses={courses} />
      </div>
    </div>
  )
}
