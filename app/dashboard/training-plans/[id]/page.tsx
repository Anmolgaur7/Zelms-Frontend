import { notFound } from 'next/navigation'
import { getTrainingPlan, getCourses } from '@/lib/actions/phase3'
import { CatalogDetailHeader } from '@/components/phase3/catalog-detail-header'
import { TrainingPlanManagePanel } from '@/components/phase3/training-plan-manage-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function TrainingPlanDetailPage({ params }: Props) {
  const { id } = await params
  const [plan, courses] = await Promise.all([getTrainingPlan(id), getCourses()])
  if (!plan) notFound()

  return (
    <div className="flex flex-1 flex-col pb-8">
      <CatalogDetailHeader
        guideId="training-plans"
        backHref="/dashboard/training-plans"
        backLabel="Training plans"
        title={plan.title}
        status={plan.status}
        subtitle={`Calendar year ${plan.calendarYear} — add line items below.`}
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <TrainingPlanManagePanel plan={plan} courses={courses} />
      </div>
    </div>
  )
}
