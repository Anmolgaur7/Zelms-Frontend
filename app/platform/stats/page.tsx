import { getPlatformAssignmentStats } from '@/lib/actions/platform'
import { resolvedCompanyStatsKpis } from '@/lib/company-assignment-stats'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'Platform KPIs' }
export const dynamic = 'force-dynamic'

export default async function PlatformStatsPage() {
  const { stats, error } = await getPlatformAssignmentStats()
  const k = stats ? resolvedCompanyStatsKpis(stats) : null

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform KPIs</h1>
        <p className="text-sm text-muted-foreground">
          GET /api/platform/assignments/stats
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive">
          {error.code}: {error.message}
        </p>
      ) : null}
      {stats && k ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {stats.totalAssignments}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Avg pass score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {k.avgAmongPassedDisplay}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Overdue pending
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {k.overduePendingCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Locked out
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {k.lockedOutCount}
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No stats returned.</p>
      )}
    </div>
  )
}
