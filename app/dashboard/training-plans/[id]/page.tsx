import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrainingPlan, getCourses } from '@/lib/actions/phase3'
import { TrainingPlanManagePanel } from '@/components/phase3/training-plan-manage-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function TrainingPlanDetailPage({ params }: Props) {
  const { id } = await params
  const [plan, courses] = await Promise.all([getTrainingPlan(id), getCourses()])
  if (!plan) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/dashboard/training-plans">
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Training plans
        </Link>
      </Button>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
          {plan.status ? <Badge variant="outline">{plan.status}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Calendar year {plan.calendarYear} — add line items below.
        </p>
      </div>
      <TrainingPlanManagePanel plan={plan} courses={courses} />
    </div>
  )
}
