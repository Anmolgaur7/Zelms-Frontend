/**
 * app/dashboard/analytics/compliance/page.tsx
 *
 * Tenant-wide compliance report.
 *
 * - Headline KPI tiles (overall %, totals, overdue, failed)
 * - Department compliance bar chart
 * - SOP compliance table sorted by lowest rate
 * - "Download training report" button (server action → base64 → blob)
 */

import { redirect } from 'next/navigation'

import { getSession } from '@/lib/session'
import { getComplianceReport } from '@/lib/actions/analytics'
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
import { Badge } from '@/components/ui/badge'
import { ActivityIcon } from 'lucide-react'

import {
  complianceRateOf,
  departmentLabel,
  normaliseDepartments,
  normaliseSops,
  overallComplianceOf,
} from '@/types/analytics'
import { ComplianceChart } from '@/components/analytics/compliance-chart'
import { ExportTrainingReportButton } from '@/components/analytics/export-training-report-button'

export const metadata = { title: 'Compliance Report' }
export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR']

function pctFmt(v: number | null | undefined): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—'
  const pct = v <= 1 ? v * 100 : v
  return `${pct.toFixed(1)}%`
}

function rateBadge(rate: number | null) {
  if (rate == null) return <Badge variant="outline">—</Badge>
  const normalised = rate <= 1 ? rate * 100 : rate
  if (normalised >= 90)
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
        {normalised.toFixed(0)}%
      </Badge>
    )
  if (normalised >= 70)
    return (
      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15">
        {normalised.toFixed(0)}%
      </Badge>
    )
  return (
    <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15">
      {normalised.toFixed(0)}%
    </Badge>
  )
}

export default async function CompliancePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ALLOWED_ROLES.includes(session.role)) redirect('/dashboard')

  const { report, error } = await getComplianceReport()

  const overall = overallComplianceOf(report)
  const departments = normaliseDepartments(report)
  const sops = normaliseSops(report).slice().sort((a, b) => {
    const ar = (a.complianceRate ?? 100)
    const br = (b.complianceRate ?? 100)
    return ar - br
  })

  const chartRows = departments.map((d) => {
    const rate = complianceRateOf(d) ?? 0
    return {
      label: departmentLabel(d),
      rate: rate <= 1 ? rate * 100 : rate,
      total: d.total ?? d.totalAssignments ?? 0,
      completed: d.completed ?? 0,
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-up motion-reduce:animate-none">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Compliance report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live training compliance across every department and SOP.
          </p>
        </div>
        {(session.role === 'ADMIN' ||
          session.role === 'SUPER_ADMIN' ||
          session.role === 'AUDITOR') && (
          <ExportTrainingReportButton />
        )}
      </div>

      {error ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Compliance data unavailable
            </CardTitle>
            <CardDescription className="text-xs">
              {error.message} ({error.code})
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          index={0}
          title="Overall compliance"
          value={pctFmt(overall)}
          description="Across all assignments"
        />
        <KpiCard
          index={1}
          title="Total assignments"
          value={(report?.totalAssignments ?? 0).toLocaleString()}
          description="In scope this period"
        />
        <KpiCard
          index={2}
          title="Overdue"
          value={(report?.totalOverdue ?? 0).toLocaleString()}
          description="Past due date"
          accent="warn"
        />
        <KpiCard
          index={3}
          title="Failed"
          value={(report?.totalFailed ?? 0).toLocaleString()}
          description="Quiz attempts failed"
          accent="bad"
        />
      </div>

      {/* Department chart */}
      <Card className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '260ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/15">
              <ActivityIcon className="h-3.5 w-3.5 text-primary" />
            </span>
            Compliance by department
          </CardTitle>
          <CardDescription>
            Higher is better. Departments below 70% are highlighted in the SOP
            table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceChart rows={chartRows} />
        </CardContent>
      </Card>

      {/* SOP table */}
      <Card className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '320ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Compliance by SOP
          </CardTitle>
          <CardDescription>
            Sorted by lowest compliance first so corrective action is easy to
            prioritise.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sops.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground text-center">
              No SOP-level compliance data yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SOP</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sops.map((s, i) => (
                  <TableRow key={s.sopId ?? `${s.sopTitle}-${i}`}>
                    <TableCell>
                      <div className="font-medium">
                        {s.sopTitle ?? '—'}
                      </div>
                      {s.version ? (
                        <div className="text-xs text-muted-foreground">
                          v{s.version}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.assigned ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.completed ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.pending ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.failed ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {rateBadge(s.complianceRate ?? null)}
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

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  description,
  accent,
  index = 0,
}: {
  title: string
  value: string
  description: string
  accent?: 'good' | 'warn' | 'bad'
  index?: number
}) {
  const accentClass =
    accent === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : accent === 'bad'
          ? 'text-rose-600 dark:text-rose-400'
          : ''
  return (
    <Card
      className="card-hover animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tracking-tight ${accentClass}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
