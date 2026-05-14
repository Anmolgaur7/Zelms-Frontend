'use client'

/**
 * Extra dashboard visuals: compliance, SOP difficulty, department headcount,
 * and recent audit activity.
 */

import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ActivityIcon, FolderTreeIcon, GavelIcon, TargetIcon } from 'lucide-react'

import { ComplianceChart } from '@/components/analytics/compliance-chart'
import type { ComplianceChartRow } from '@/components/analytics/compliance-chart'
import { DifficultyChart } from '@/components/analytics/difficulty-chart'
import type { DifficultyChartRow } from '@/components/analytics/difficulty-chart'
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
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types/auth'

const COMPLIANCE_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR']
const DIFFICULTY_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TRAINER']

export interface DashboardExtendedChartsProps {
  role: UserRole
  compliance: {
    error?: string | null
    overallPct: number | null
    chartRows: ComplianceChartRow[]
  }
  difficulty: {
    error?: string | null
    rows: DifficultyChartRow[]
  }
  departments: { label: string; users: number }[]
  audit: {
    error?: string | null
    byAction: { label: string; count: number }[]
  }
}

const deptConfig = {
  users: { label: 'Users', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

const auditConfig = {
  count: { label: 'Events', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/15 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function DashboardExtendedCharts(props: DashboardExtendedChartsProps) {
  const { role } = props
  const showCompliance = COMPLIANCE_ROLES.includes(role)
  const showDifficulty = DIFFICULTY_ROLES.includes(role)

  return (
    <div className="space-y-6 pt-2 animate-fade-up motion-reduce:animate-none">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Insights &amp; activity</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pulled from analytics, audit, and directory data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showCompliance && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/analytics/compliance">Compliance report</Link>
            </Button>
          )}
          {showDifficulty && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/analytics/sop-difficulty">SOP difficulty</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Compliance + difficulty */}
      <div className="grid gap-4 xl:grid-cols-2">
        {showCompliance && (
          <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ActivityIcon className="h-4 w-4 text-primary" />
                  Compliance snapshot
                </CardTitle>
                <CardDescription>
                  Lowest-performing departments or SOPs (same data as the compliance report).
                </CardDescription>
              </div>
              {typeof props.compliance.overallPct === 'number' && (
                <div className="rounded-lg border bg-muted/30 px-3 py-1.5 text-right">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Overall
                  </div>
                  <div className="text-lg font-bold tabular-nums text-primary">
                    {props.compliance.overallPct.toFixed(0)}%
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {props.compliance.error ? (
                <EmptyPanel message={`Compliance data unavailable (${props.compliance.error}).`} />
              ) : props.compliance.chartRows.length ? (
                <ComplianceChart rows={props.compliance.chartRows} />
              ) : (
                <EmptyPanel message="No compliance breakdown returned yet." />
              )}
            </CardContent>
          </Card>
        )}

        {showDifficulty && (
          <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TargetIcon className="h-4 w-4 text-primary" />
                Hardest SOPs (quiz pass rate)
              </CardTitle>
              <CardDescription>Lowest pass rates first — matches SOP difficulty analytics.</CardDescription>
            </CardHeader>
            <CardContent>
              {props.difficulty.error ? (
                <EmptyPanel message={`SOP difficulty unavailable (${props.difficulty.error}).`} />
              ) : props.difficulty.rows.length ? (
                <DifficultyChart rows={props.difficulty.rows} />
              ) : (
                <EmptyPanel message="No quiz attempt data for SOPs yet." />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Departments + audit */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTreeIcon className="h-4 w-4 text-primary" />
              Headcount by department
            </CardTitle>
            <CardDescription>Derived from the user directory (same cohort as Users).</CardDescription>
          </CardHeader>
          <CardContent>
            {props.departments.length ? (
              <ChartContainer config={deptConfig} className="h-72 w-full">
                <BarChart
                  layout="vertical"
                  data={props.departments}
                  margin={{ left: 4, right: 12, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" radius={[0, 6, 6, 0]} fill="hsl(var(--chart-2))" maxBarSize={22} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyPanel message="No users with department assignments yet." />
            )}
          </CardContent>
        </Card>

        <Card className="card-hover overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <GavelIcon className="h-4 w-4 text-primary" />
                Recent audit activity
              </CardTitle>
              <CardDescription>Top event codes from the latest audit page (first 100 entries).</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href="/dashboard/audit">Open audit log</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {props.audit.error ? (
              <EmptyPanel message={`Audit feed unavailable (${props.audit.error}).`} />
            ) : props.audit.byAction.length ? (
              <ChartContainer config={auditConfig} className="h-72 w-full">
                <BarChart
                  layout="vertical"
                  data={props.audit.byAction}
                  margin={{ left: 4, right: 12, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="hsl(var(--chart-3))" maxBarSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyPanel message="No audit entries returned for this page." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
