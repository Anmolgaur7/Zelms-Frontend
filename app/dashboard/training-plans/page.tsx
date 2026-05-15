import Link from 'next/link'
import { getTrainingPlansWithMeta } from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateTrainingPlanDialog } from '@/components/phase3/create-training-plan-dialog'
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
import { CalendarRangeIcon } from 'lucide-react'

export const metadata = { title: 'Training plans' }
export const dynamic = 'force-dynamic'

export default async function TrainingPlansPage() {
  const { plans, apiAvailable } = await getTrainingPlansWithMeta()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Yearly training planner — DRAFT → ACTIVE → CLOSED.
          </p>
        </div>
        {apiAvailable ? <CreateTrainingPlanDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Training plans API not available</p>
            <p className="mt-1">
              Deploy Phase 3 backend or update{' '}
              <code className="text-xs">{BASE_URL}</code>.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="card-hover shadow-soft border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRangeIcon className="h-4 w-4" /> Plans
          </CardTitle>
          <CardDescription>
            Open a plan to add monthly line items and link courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {plans.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No training plans yet.
              {apiAvailable ? ' Create one with New plan above.' : ''}
            </p>
          ) : (
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
                      {p.status ? (
                        <Badge variant="outline">{p.status}</Badge>
                      ) : (
                        '—'
                      )}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
