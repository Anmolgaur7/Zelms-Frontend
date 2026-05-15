import Link from 'next/link'
import type { ReactNode } from 'react'
import { MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BASE_URL } from '@/lib/api'
import { CatalogHelpPanel } from '@/components/phase3/catalog-help-panel'
import {
  PAGE_GUIDES,
  TRAINING_WORKFLOW_STEPS,
  getWorkflowStep,
  type CatalogGuideId,
} from '@/lib/training-workflow'
import { TrainingFlowStrip } from '@/components/phase3/training-flow-strip'

export function CatalogPageLayout({
  guideId,
  action,
  apiUnavailable,
  count,
  countLabel = 'item',
  /** Full line under the summary; overrides the default count line when set. */
  countDescription,
  /** Smaller second line (e.g. pagination context). */
  countHint,
  /** Suffix for the default `${count} ${countLabel}s…` line. Default: " in your organisation". */
  countSuffix,
  /** When set, controls help panel default open. Otherwise opens when `count === 0`. */
  helpDefaultOpen,
  /** When set, shows or hides the workflow jump strip. Default: training hub + catalog workflow pages. */
  showTrainingFlow,
  children,
}: {
  guideId: CatalogGuideId
  action?: ReactNode
  apiUnavailable?: boolean
  count?: number
  countLabel?: string
  countDescription?: string
  countHint?: string
  countSuffix?: string
  helpDefaultOpen?: boolean
  showTrainingFlow?: boolean
  children: ReactNode
}) {
  const guide = PAGE_GUIDES[guideId]
  const workflow = getWorkflowStep(guideId)

  const stripVisible =
    showTrainingFlow ??
    (guideId === 'training-setup' ||
      TRAINING_WORKFLOW_STEPS.some((s) => s.id === guideId))

  const defaultCountSuffix = ' in your organisation'
  const countLine =
    countDescription ??
    (typeof count === 'number'
      ? `${count} ${countLabel}${count === 1 ? '' : 's'}${countSuffix ?? defaultCountSuffix}`
      : null)

  const helpOpen =
    typeof helpDefaultOpen === 'boolean'
      ? helpDefaultOpen
      : typeof count === 'number' && count === 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          {workflow ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Step {workflow.step}</span> of{' '}
              {TRAINING_WORKFLOW_STEPS.length} — {workflow.short}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {guide.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {guide.summary}
          </p>
          {typeof countLine === 'string' ? (
            <p className="text-xs text-muted-foreground">{countLine}</p>
          ) : null}
          {countHint ? (
            <p className="text-xs text-muted-foreground/90">{countHint}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {guideId !== 'training-setup' ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/training-setup" title="Overview of how training areas connect">
                <MapIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Start here
              </Link>
            </Button>
          ) : null}
          {action}
        </div>
      </header>

      {stripVisible ? <TrainingFlowStrip currentId={guideId} /> : null}

      <CatalogHelpPanel guide={guide} defaultOpen={helpOpen} />

      {apiUnavailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">
              We couldn&apos;t load this section
            </CardTitle>
            <CardDescription className="space-y-2 text-amber-900/85 dark:text-amber-100/85">
              <span className="block">
                Usually this means the connected server isn&apos;t running the latest training
                features yet, or the app isn&apos;t pointed at the right API.
              </span>
              <span className="block text-xs font-mono bg-amber-500/15 rounded px-2 py-1.5 mt-2">
                {BASE_URL}
              </span>
              <span className="block text-xs">
                Ask your team to deploy Phase 3, or check{' '}
                <code className="text-[11px]">NEXT_PUBLIC_API_URL</code> in your env.
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {children}
    </div>
  )
}

export function CatalogListCard({
  title,
  description,
  icon: Icon,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  emptyMessage: string
  isEmpty: boolean
  children: ReactNode
}) {
  return (
    <Card className="card-hover shadow-soft border-border/80 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isEmpty ? (
          <div className="py-14 px-6 text-center max-w-md mx-auto space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground/80">
              Empty lists are normal when you&apos;re setting things up.
            </p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
