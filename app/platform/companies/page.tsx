import { getPlatformCompaniesAssignmentStats } from '@/lib/actions/platform'
import { resolvedCompanyStatsKpis } from '@/lib/company-assignment-stats'
import {
  Card,
  CardContent,
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

export const metadata = { title: 'Company stats' }
export const dynamic = 'force-dynamic'

export default async function PlatformCompaniesPage() {
  const { list, error } = await getPlatformCompaniesAssignmentStats({
    page: 1,
    limit: 50,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Per-company KPIs</h1>
        <p className="text-sm text-muted-foreground">
          GET /api/platform/companies/assignment-stats
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive">
          {error.code}: {error.message}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants ({list.totalCompanies})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Lockouts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((row) => {
                const k = resolvedCompanyStatsKpis(row.stats)
                return (
                  <TableRow key={row.company.id}>
                    <TableCell className="font-medium">{row.company.name}</TableCell>
                    <TableCell>{row.stats.totalAssignments}</TableCell>
                    <TableCell>{k.overduePendingCount}</TableCell>
                    <TableCell>{k.lockedOutCount}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
