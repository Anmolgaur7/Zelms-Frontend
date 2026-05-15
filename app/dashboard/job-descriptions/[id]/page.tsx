import { notFound } from 'next/navigation'
import { getJobDescription, getCourses } from '@/lib/actions/phase3'
import { CatalogDetailHeader } from '@/components/phase3/catalog-detail-header'
import { JobDescriptionManagePanel } from '@/components/phase3/job-description-manage-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function JobDescriptionDetailPage({ params }: Props) {
  const { id } = await params
  const [jd, courses] = await Promise.all([getJobDescription(id), getCourses()])
  if (!jd) notFound()

  return (
    <div className="flex flex-1 flex-col pb-8">
      <CatalogDetailHeader
        guideId="job-descriptions"
        backHref="/dashboard/job-descriptions"
        backLabel="Job descriptions"
        title={jd.title}
        subtitle={
          jd.description ??
          `Role code ${jd.code} — link courses and assign employees.`
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <JobDescriptionManagePanel jd={jd} courses={courses} />
      </div>
    </div>
  )
}
