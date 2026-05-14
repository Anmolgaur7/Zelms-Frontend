/**
 * Normalizes §6a company / trainee assignment stats from the API
 * (`docs/FRONTEND_INTEGRATION.md` §6a.1, §6a.3) vs older field aliases.
 */

import type { CompanyAssignmentStats, TraineeSummary } from '@/types/admin'

/** `averageScoreAmongPassed` is 0–100; legacy `averageScore` may be ratio or percent. */
export function formatAverageScoreAmongPassed(
  value: number | null | undefined,
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct * 10) / 10}%`
}

export function resolvedCompanyStatsKpis(stats: CompanyAssignmentStats) {
  const byStatus = stats.byStatus ?? {}
  const passedCount =
    stats.completedPassedCount ?? stats.passed ?? 0
  const failedCount =
    stats.completedFailedCount ?? stats.failed ?? 0
  const avgAmongPassed =
    stats.averageScoreAmongPassed ?? stats.averageScore
  const overduePendingCount =
    stats.overduePendingCount ??
    stats.overduePending ??
    byStatus.OVERDUE ??
    0
  const lockedOutCount =
    stats.lockedOutCount ??
    stats.lockouts ??
    byStatus.LOCKED_OUT ??
    0
  return {
    passedCount,
    failedCount,
    overduePendingCount,
    lockedOutCount,
    avgAmongPassedDisplay: formatAverageScoreAmongPassed(avgAmongPassed),
  }
}

export function resolvedTraineeSummaryCounts(summary: TraineeSummary) {
  const passed =
    summary.completedPassedCount ?? summary.passed ?? 0
  const failed =
    summary.completedFailedCount ?? summary.failed ?? 0
  const avgDisplay = formatAverageScoreAmongPassed(
    summary.averageScoreAmongPassed ?? summary.averageScore,
  )
  return { passed, failed, avgDisplay }
}
