import { notFound } from 'next/navigation'
import { getInductionProgram, getCourses } from '@/lib/actions/phase3'
import { CatalogDetailHeader } from '@/components/phase3/catalog-detail-header'
import { InductionProgramManagePanel } from '@/components/phase3/induction-program-manage-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function InductionProgramDetailPage({ params }: Props) {
  const { id } = await params
  const [program, courses] = await Promise.all([
    getInductionProgram(id),
    getCourses(),
  ])
  if (!program) notFound()

  return (
    <div className="flex flex-1 flex-col pb-8">
      <CatalogDetailHeader
        guideId="induction"
        backHref="/dashboard/induction"
        backLabel="Induction programs"
        title={program.name}
        status={program.status}
        subtitle={
          program.description ??
          'Add steps on the tabs below, then enroll learners (My induction).'
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <InductionProgramManagePanel program={program} courses={courses} />
      </div>
    </div>
  )
}
