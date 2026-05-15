/**
 * app/dashboard/analytics/risk/page.tsx
 *
 * Lists trainees flagged as compliance risks: overdue assignments, repeated
 * quiz failures, or lockouts. Sorted by descending risk score; clicking a
 * row jumps to the trainee dossier so admins can act (unlock, reassign, …).
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

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
import { AlertTriangleIcon, ChevronRightIcon } from 'lucide-react'

import { getSession } from '@/lib/session'
import { getRiskReport } from '@/lib/actions/analytics'
import { normaliseRiskUsers } from '@/types/analytics'
import type { RiskUser } from '@/types/analytics'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'

export const metadata = { title: 'Risk Report' }
export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR']

function riskBadge(user: RiskUser) {
  const level =
    typeof user.riskLevel === 'string' ? user.riskLevel.toUpperCase() : null
  const score = typeof user.riskScore === 'number' ? user.riskScore : null

  // Derive level from score when backend omits it.
  let derived: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  if (score != null) {
    if (score >= 75) derived = 'CRITICAL'
    else if (score >= 50) derived = 'HIGH'
    else if (score >= 25) derived = 'MEDIUM'
  }
  const label = level ?? derived

  const tone =
    label === 'CRITICAL'
      ? 'bg-red-500/10 text-red-600 border-red-500/20'
      : label === 'HIGH'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : label === 'MEDIUM'
          ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'

  return <Badge className={tone}>{label}</Badge>
}

function safeUserId(u: RiskUser): string | null {
  return u.userId ?? u.id ?? null
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export default async function RiskPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ALLOWED_ROLES.includes(session.role)) redirect('/dashboard')

  const { report, error } = await getRiskReport()
  const users = normaliseRiskUsers(report)

  // Sort: highest risk score first; fall back to overdueCount + failedCount.
  const ranked = users.slice().sort((a, b) => {
    const aScore = a.riskScore ?? (a.overdueCount ?? 0) * 10 + (a.failedCount ?? 0) * 5
    const bScore = b.riskScore ?? (b.overdueCount ?? 0) * 10 + (b.failedCount ?? 0) * 5
    return bScore - aScore
  })

  const counts = {
    critical: ranked.filter(
      (u) => (u.riskLevel ?? '').toUpperCase() === 'CRITICAL',
    ).length,
    high: ranked.filter(
      (u) => (u.riskLevel ?? '').toUpperCase() === 'HIGH',
    ).length,
    overdue: ranked.reduce((sum, u) => sum + (u.overdueCount ?? 0), 0),
    lockouts: ranked.reduce((sum, u) => sum + (u.lockouts ?? 0), 0),
  }

  const countDescription =
    error != null
      ? undefined
      : `${ranked.length} trainee${ranked.length === 1 ? '' : 's'} on the risk list`

  return (
    <CatalogPageLayout
      guideId="risk"
      showTrainingFlow={false}
      countDescription={countDescription}
      countHint={
        error
          ? undefined
          : `${counts.critical + counts.high} flagged high or critical · ${counts.overdue.toLocaleString()} overdue items · ${counts.lockouts.toLocaleString()} lockout${counts.lockouts === 1 ? '' : 's'}`
      }
      helpDefaultOpen={!!error || ranked.length === 0}
    >
      {error ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Risk data unavailable
            </CardTitle>
            <CardDescription className="text-xs">
              {error.message} ({error.code})
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* KPI tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SimpleStat
          title="Critical trainees"
          value={counts.critical}
          accent="bad"
          description="Risk score ≥ 75"
        />
        <SimpleStat
          title="High-risk trainees"
          value={counts.high}
          accent="warn"
          description="Risk score 50–74"
        />
        <SimpleStat
          title="Total overdue"
          value={counts.overdue}
          description="Across flagged trainees"
        />
        <SimpleStat
          title="Lockouts"
          value={counts.lockouts}
          description="Currently locked out"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
            Flagged trainees
          </CardTitle>
          <CardDescription>
            Click a row to open the trainee dossier and take action (unlock,
            reassign, change role).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ranked.length === 0 ? (
            <div className="px-6 py-12 text-sm text-muted-foreground text-center">
              No risky trainees right now. 🎉
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Lockouts</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((u, i) => {
                  const id = safeUserId(u)
                  const name = u.name ?? u.email ?? u.employeeId ?? 'Unknown'
                  return (
                    <TableRow key={id ?? `${name}-${i}`}>
                      <TableCell>
                        {id ? (
                          <Link
                            href={`/dashboard/users/${id}`}
                            className="font-medium hover:underline"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="font-medium">{name}</span>
                        )}
                        {u.employeeId ? (
                          <div className="text-xs text-muted-foreground">
                            {u.employeeId}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.departmentName ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(u.overdueCount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(u.failedCount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(u.lockouts ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {u.riskScore != null ? Math.round(u.riskScore) : '—'}
                      </TableCell>
                      <TableCell>{riskBadge(u)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDateTime(u.lastActivityAt)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {id ? (
                          <Link
                            href={`/dashboard/users/${id}`}
                            aria-label="Open dossier"
                            className="inline-flex"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </CatalogPageLayout>
  )
}

function SimpleStat({
  title,
  value,
  description,
  accent,
}: {
  title: string
  value: number
  description: string
  accent?: 'warn' | 'bad'
}) {
  const accentClass =
    accent === 'bad'
      ? 'text-red-600'
      : accent === 'warn'
        ? 'text-amber-600'
        : ''
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accentClass}`}>
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
