'use client'

/**
 * components/analytics/difficulty-chart.tsx
 *
 * Vertical bar chart of pass rate by SOP — lowest pass-rate first so the
 * "hardest" SOPs are at the left. Hover reveals attempt counts.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export interface DifficultyChartRow {
  label: string
  passRate: number
  attempts: number
  averageScore: number | null
}

const config = {
  passRate: {
    label: 'Pass rate %',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function DifficultyChart({ rows }: { rows: DifficultyChartRow[] }) {
  if (!rows.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No quiz attempts logged yet.
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-80 w-full">
      <BarChart
        data={rows}
        margin={{ left: 12, right: 12, top: 8, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          interval={0}
          tickLine={false}
          axisLine={false}
          height={60}
          angle={-30}
          textAnchor="end"
        />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => {
                const r = item.payload as DifficultyChartRow
                return (
                  <div className="space-y-0.5">
                    <div>{r.passRate.toFixed(1)}% pass rate</div>
                    <div className="text-muted-foreground text-xs">
                      {r.attempts.toLocaleString()} attempts
                      {r.averageScore != null
                        ? ` • avg ${r.averageScore.toFixed(0)}%`
                        : ''}
                    </div>
                  </div>
                )
              }}
            />
          }
        />
        <Bar
          dataKey="passRate"
          fill="var(--color-passRate)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="passRate"
            position="top"
            formatter={(v: number) => `${v.toFixed(0)}%`}
            className="fill-foreground text-xs"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
