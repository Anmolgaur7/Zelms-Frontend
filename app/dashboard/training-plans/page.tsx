import Link from 'next/link'
import { getTrainingPlansWithMeta } from '@/lib/actions/phase3'
import { CreateTrainingPlanDialog } from '@/components/phase3/create-training-plan-dialog'
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
import { CalendarRangeIcon } from 'lucide-react'

export const metadata = { title: 'Training plans' }
export const dynamic = 'force-dynamic'

export default async function TrainingPlansPage() {
  const { plans, apiAvailable } = await getTrainingPlansWithMeta()

  return (
    <CatalogPageLayout
      guideId="training-plans"
      apiUnavailable={!apiAvailable}
      count={plans.length}
      countLabel="plan"
      action={apiAvailable ? <CreateTrainingPlanDialog /> : null}
    >
      <CatalogListCard
        title="Yearly plans"
        description="DRAFT → ACTIVE → CLOSED. Add line items on each plan."
        icon={CalendarRangeIcon}
        isEmpty={plans.length === 0}
        emptyMessage="No training plans yet. Create a plan for a calendar year, then add monthly line items."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.calendarYear}</TableCell>
                <TableCell>
                  {p.status ? <Badge variant="outline">{p.status}</Badge> : '—'}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/training-plans/${p.id}`}>Manage</Link>
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
