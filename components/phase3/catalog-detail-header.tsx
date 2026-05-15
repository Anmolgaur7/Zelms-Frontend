import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeftIcon, MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrainingFlowStrip } from '@/components/phase3/training-flow-strip'
import {
  getWorkflowStep,
  TRAINING_WORKFLOW_STEPS,
  type CatalogGuideId,
} from '@/lib/training-workflow'

export function CatalogDetailHeader({
  guideId,
  backHref,
  backLabel,
  title,
  subtitle,
  status,
  badge,
}: {
  guideId: CatalogGuideId
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  status?: string
  badge?: ReactNode
}) {
  const workflow = getWorkflowStep(guideId)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 md:px-6 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
          <Link href={backHref}>
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/dashboard/training-setup">
            <MapIcon className="mr-1.5 h-3.5 w-3.5" />
            Start here
          </Link>
        </Button>
      </div>

      <TrainingFlowStrip currentId={guideId} />

      <div className="space-y-1 pb-2">
        {workflow ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Step {workflow.step}</span> of{' '}
            {TRAINING_WORKFLOW_STEPS.length} — {workflow.short}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {status ? <Badge variant="outline">{status}</Badge> : null}
          {badge}
        </div>
        {subtitle ? (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
