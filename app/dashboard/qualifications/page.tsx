import Link from 'next/link'
import { getQualificationsWithMeta } from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateQualificationDialog } from '@/components/phase3/create-qualification-dialog'
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
import { BadgeCheckIcon } from 'lucide-react'

export const metadata = { title: 'Qualifications' }
export const dynamic = 'force-dynamic'

export default async function QualificationsPage() {
  const { items, apiAvailable } = await getQualificationsWithMeta()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Qualifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            HOD → Head QA approval ladders for employee and trainer qualification.
          </p>
        </div>
        {apiAvailable ? <CreateQualificationDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Qualifications API not available</p>
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
            <BadgeCheckIcon className="h-4 w-4" /> Requests
          </CardTitle>
          <CardDescription>
            Separate from courses or induction — start a request, then approve steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No qualification requests yet.
              {apiAvailable ? ' Use New request above.' : ''}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      {q.subject?.name ?? q.subjectUserId}
                    </TableCell>
                    <TableCell>{q.qualificationType}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/qualifications/${q.id}`}>View</Link>
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
