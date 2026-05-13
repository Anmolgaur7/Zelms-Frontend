'use client'

/**
 * components/analytics/compliance-chart.tsx
 *
 * Horizontal bar chart of compliance rate per department. The server passes
 * normalised rows in (label/rate/totals) so this stays a tiny client island.
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

export interface ComplianceChartRow {
  label: string
  rate: number
  total: number
  completed: number
}

const config = {
  rate: {
    label: 'Compliance %',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function ComplianceChart({ rows }: { rows: ComplianceChartRow[] }) {
  if (!rows.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No department data yet.
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 12, right: 24, top: 8, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => {
                const r = item.payload as ComplianceChartRow
                return (
                  <div className="space-y-0.5">
                    <div>{r.rate.toFixed(1)}% compliant</div>
                    <div className="text-muted-foreground text-xs">
                      {r.completed}/{r.total} completed
                    </div>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="rate" fill="var(--color-rate)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="rate"
            position="right"
            formatter={(v: number) => `${v.toFixed(0)}%`}
            className="fill-foreground text-xs"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
