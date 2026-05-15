import { getPlatformAssignments } from '@/lib/actions/platform'
import { Badge } from '@/components/ui/badge'
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
import type { PlatformAssignmentRow } from '@/types/platform'

export const metadata = { title: 'Platform assignments' }
export const dynamic = 'force-dynamic'

function sopLabel(row: PlatformAssignmentRow): string {
  const snap = row.assignedSopTitle?.trim()
  if (snap) return snap
  return row.quiz?.sop?.title ?? '—'
}

export default async function PlatformAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const { list, error } = await getPlatformAssignments({
    page,
    limit: 25,
    search: params.search?.trim(),
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cross-tenant assignments
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {list.total.toLocaleString()} rows — no signed PDF URLs (by design).
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error.code}: {error.message}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assignment feed</CardTitle>
          <CardDescription>GET /api/platform/assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Trainee</TableHead>
                <TableHead>SOP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No rows.
                  </TableCell>
                </TableRow>
              ) : (
                list.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">
                      {row.company?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{row.user?.name}</div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {row.user?.employeeId}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{sopLabel(row)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
