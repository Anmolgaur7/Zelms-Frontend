/**
 * app/dashboard/analytics/sop-difficulty/page.tsx
 *
 * Quiz performance per SOP. Helps trainers spot SOPs that need clearer
 * material or remedial training. Sorted lowest pass-rate first.
 */

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
import { TargetIcon } from 'lucide-react'

import { getSession } from '@/lib/session'
import { getSopDifficulty } from '@/lib/actions/analytics'
import { normaliseDifficultyRows } from '@/types/analytics'
import type { SopDifficultyRow } from '@/types/analytics'
import { DifficultyChart } from '@/components/analytics/difficulty-chart'

export const metadata = { title: 'SOP Difficulty' }
export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRAINER']

function passRate(row: SopDifficultyRow): number | null {
  if (typeof row.passRate === 'number') {
    return row.passRate <= 1 ? row.passRate * 100 : row.passRate
  }
  const attempts = row.attempts ?? row.totalAttempts
  const passes = row.passes
  if (typeof attempts === 'number' && attempts > 0 && typeof passes === 'number') {
    return (passes / attempts) * 100
  }
  return null
}

function difficultyBadge(rate: number | null) {
  if (rate == null) return <Badge variant="outline">—</Badge>
  if (rate >= 90)
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        Easy
      </Badge>
    )
  if (rate >= 70)
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        Moderate
      </Badge>
    )
  return (
    <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
      Hard
    </Badge>
  )
}

function fmtPct(v: number | null): string {
  if (v == null) return '—'
  return `${v.toFixed(0)}%`
}

function truncate(label: string, len = 24): string {
  if (label.length <= len) return label
  return label.slice(0, len - 1) + '…'
}

export default async function SopDifficultyPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ALLOWED_ROLES.includes(session.role)) redirect('/dashboard')

  const { report, error } = await getSopDifficulty()
  const rows = normaliseDifficultyRows(report)

  const enriched = rows
    .map((r) => ({
      row: r,
      rate: passRate(r),
      attempts: r.attempts ?? r.totalAttempts ?? 0,
      avgScore:
        typeof r.averageScore === 'number'
          ? r.averageScore <= 1
            ? r.averageScore * 100
            : r.averageScore
          : null,
    }))
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))

  const chartRows = enriched
    .filter((e) => e.rate != null && e.attempts > 0)
    .slice(0, 10) // hardest 10 SOPs
    .map((e) => ({
      label: truncate(e.row.sopTitle ?? 'Untitled'),
      passRate: e.rate ?? 0,
      attempts: e.attempts,
      averageScore: e.avgScore,
    }))

  const totalAttempts = enriched.reduce((s, e) => s + e.attempts, 0)
  const averagePassRate = (() => {
    const samples = enriched
      .map((e) => e.rate)
      .filter((v): v is number => typeof v === 'number')
    if (samples.length === 0) return null
    return samples.reduce((s, v) => s + v, 0) / samples.length
  })()
  const hardCount = enriched.filter(
    (e) => typeof e.rate === 'number' && e.rate < 70,
  ).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SOP difficulty</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quiz pass rates and average scores per SOP. Lowest pass-rate is
          listed first so you can prioritise content reviews.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Difficulty data unavailable
            </CardTitle>
            <CardDescription className="text-xs">
              {error.message} ({error.code})
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SimpleStat
          title="SOPs analysed"
          value={enriched.length.toLocaleString()}
          description="With recorded attempts"
        />
        <SimpleStat
          title="Total attempts"
          value={totalAttempts.toLocaleString()}
          description="Quiz attempts logged"
        />
        <SimpleStat
          title="Average pass rate"
          value={fmtPct(averagePassRate)}
          description="Mean across SOPs"
        />
        <SimpleStat
          title="Difficult SOPs"
          value={hardCount.toLocaleString()}
          description="Pass rate < 70%"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-muted-foreground" />
            Top 10 hardest SOPs
          </CardTitle>
          <CardDescription>
            Bars show pass rate; hover for attempt counts and average score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DifficultyChart rows={chartRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">All SOPs</CardTitle>
          <CardDescription>
            Sorted by ascending pass rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {enriched.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground text-center">
              No SOP attempts yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SOP</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Passes</TableHead>
                  <TableHead className="text-right">Fails</TableHead>
                  <TableHead className="text-right">Avg score</TableHead>
                  <TableHead className="text-right">Pass rate</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((e, i) => (
                  <TableRow key={e.row.sopId ?? `${e.row.sopTitle}-${i}`}>
                    <TableCell>
                      <div className="font-medium">
                        {e.row.sopTitle ?? '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.row.version ? `v${e.row.version}` : ''}
                        {e.row.category && e.row.version ? ' • ' : ''}
                        {e.row.category ?? ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {e.attempts.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(e.row.passes ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(e.row.fails ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtPct(e.avgScore)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmtPct(e.rate)}
                    </TableCell>
                    <TableCell>{difficultyBadge(e.rate)}</TableCell>
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

// ─── Simple stat tile ─────────────────────────────────────────────────────────

function SimpleStat({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
