import Link from 'next/link'
import { getJobDescriptionsWithMeta } from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateJobDescriptionDialog } from '@/components/phase3/create-job-description-dialog'
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
import { BriefcaseIcon } from 'lucide-react'

export const metadata = { title: 'Job descriptions' }
export const dynamic = 'force-dynamic'

export default async function JobDescriptionsPage() {
  const { items, apiAvailable } = await getJobDescriptionsWithMeta()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job descriptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Role matrix — required courses and assigned users per JD.
          </p>
        </div>
        {apiAvailable ? <CreateJobDescriptionDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Job descriptions API not available</p>
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
            <BriefcaseIcon className="h-4 w-4" /> Matrix
          </CardTitle>
          <CardDescription>
            Not the same as Courses — create a JD, link courses, then assign people.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No job descriptions yet.
              {apiAvailable ? ' Create one with New JD above.' : ''}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((jd) => (
                  <TableRow key={jd.id}>
                    <TableCell className="font-mono text-sm">{jd.code}</TableCell>
                    <TableCell className="font-medium">{jd.title}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/job-descriptions/${jd.id}`}>Manage</Link>
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
