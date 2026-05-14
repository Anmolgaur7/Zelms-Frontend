'use client'

/**
 * Dashboard overview charts — fed from the same AdminStats + role fallbacks
 * as the KPI tiles. Pure presentation; all numbers come from the server.
 */

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const CHART_FILLS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const

export interface DashboardOverviewChartsProps {
  /** Role headcount (non-negative integers). */
  roles: {
    employees: number
    trainers: number
    admins: number
    auditors: number
  }
  /** Assignment pipeline counts. */
  assignments: {
    pending: number
    inProgress: number
    completed: number
    failed: number
    overdue: number
  }
  /** SOP inventory. */
  sops: {
    active: number
    draft: number
    archived: number
  }
  /** 0–100 for radial / bar display; null if unknown. */
  completionRatePct: number | null
  averageScorePct: number | null
}

const roleConfig = {
  value: { label: 'Users', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const assignmentConfig = {
  count: { label: 'Count', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const sopConfig = {
  count: { label: 'SOPs', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const kpiBarConfig = {
  pct: { label: 'Percent', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

function useRolePieData(roles: DashboardOverviewChartsProps['roles']) {
  return React.useMemo(
    () =>
      [
        { name: 'Employees', key: 'employees' as const, value: roles.employees },
        { name: 'Trainers', key: 'trainers' as const, value: roles.trainers },
        { name: 'Admins', key: 'admins' as const, value: roles.admins },
        { name: 'Auditors', key: 'auditors' as const, value: roles.auditors },
      ].filter((d) => d.value > 0),
    [roles],
  )
}

function useAssignmentBars(assignments: DashboardOverviewChartsProps['assignments']) {
  return React.useMemo(
    () => [
      { label: 'Pending', count: assignments.pending },
      { label: 'In progress', count: assignments.inProgress },
      { label: 'Completed', count: assignments.completed },
      { label: 'Failed', count: assignments.failed },
      { label: 'Overdue', count: assignments.overdue },
    ],
    [assignments],
  )
}

function useSopBars(sops: DashboardOverviewChartsProps['sops']) {
  return React.useMemo(
    () => [
      { label: 'Active', count: sops.active },
      { label: 'Draft', count: sops.draft },
      { label: 'Archived', count: sops.archived },
    ],
    [sops],
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/20 px-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function DashboardOverviewCharts({
  roles,
  assignments,
  sops,
  completionRatePct,
  averageScorePct,
}: DashboardOverviewChartsProps) {
  const roleData = useRolePieData(roles)
  const assignmentData = useAssignmentBars(assignments)
  const sopData = useSopBars(sops)
  const assignmentTotal = assignmentData.reduce((s, d) => s + d.count, 0)

  const kpiRows = React.useMemo(() => {
    const rows: { label: string; pct: number }[] = []
    if (typeof completionRatePct === 'number' && !Number.isNaN(completionRatePct)) {
      rows.push({
        label: 'Completion rate',
        pct: Math.min(100, Math.max(0, completionRatePct)),
      })
    }
    if (typeof averageScorePct === 'number' && !Number.isNaN(averageScorePct)) {
      const v = averageScorePct <= 1 ? averageScorePct * 100 : averageScorePct
      rows.push({
        label: 'Avg quiz score',
        pct: Math.min(100, Math.max(0, v)),
      })
    }
    return rows
  }, [completionRatePct, averageScorePct])

  const totalRole = roleData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-4 animate-fade-up motion-reduce:animate-none">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Overview charts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Uses assignment status totals and your live SOP list when admin KPIs
          don&apos;t include a breakdown.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Roles — donut */}
        <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Users by role</CardTitle>
            <CardDescription>Active headcount mix</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!roleData.length || totalRole === 0 ? (
              <EmptyChart message="No role breakdown yet — invite users to see this chart." />
            ) : (
              <ChartContainer config={roleConfig} className="mx-auto aspect-square max-h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const v = Number(value)
                          const pct = totalRole > 0 ? ((v / totalRole) * 100).toFixed(1) : '0'
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{item.payload.name}</span>
                              <span className="text-muted-foreground tabular-nums">
                                {v.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Pie
                    data={roleData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                    paddingAngle={2}
                  >
                    {roleData.map((_, i) => (
                      <Cell key={roleData[i].key} fill={CHART_FILLS[i % CHART_FILLS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Assignments</CardTitle>
            <CardDescription>Pipeline by status</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {assignmentTotal === 0 ? (
              <EmptyChart message="No assignment counts yet — create assignments to see this chart." />
            ) : (
              <ChartContainer config={assignmentConfig} className="h-72 w-full">
                <BarChart
                  data={assignmentData}
                  margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {assignmentData.map((_, i) => (
                      <Cell key={assignmentData[i].label} fill={CHART_FILLS[i % CHART_FILLS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* SOPs */}
        <Card className="card-hover overflow-hidden border-border/80 shadow-sm lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">SOP library</CardTitle>
            <CardDescription>Published vs draft vs archived</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {sopData.every((d) => d.count === 0) ? (
              <EmptyChart message="No SOP counts returned yet — upload SOPs to populate this chart." />
            ) : (
              <ChartContainer config={sopConfig} className="h-72 w-full">
                <BarChart
                  layout="vertical"
                  data={sopData}
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={72}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {sopData.map((_, i) => (
                      <Cell key={sopData[i].label} fill={CHART_FILLS[(i + 1) % CHART_FILLS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI strip */}
      {kpiRows.length > 0 ? (
        <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Training outcomes</CardTitle>
            <CardDescription>Completion and quiz performance (0–100%)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={kpiBarConfig} className="h-48 w-full max-w-2xl">
              <BarChart
                layout="vertical"
                data={kpiRows}
                margin={{ left: 4, right: 24, top: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => `${Number(v).toFixed(0)}%`} />}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" maxBarSize={22} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
