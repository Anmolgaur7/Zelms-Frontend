'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  TRAINING_WORKFLOW_STEPS,
  type CatalogGuideId,
} from '@/lib/training-workflow'

export function TrainingFlowStrip({ currentId }: { currentId?: CatalogGuideId }) {
  const currentIdx =
    currentId !== undefined ? TRAINING_WORKFLOW_STEPS.findIndex((s) => s.id === currentId) : -1

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2 md:px-4">
        <p className="text-xs font-medium text-muted-foreground">
          Jump between steps · tap a step anytime
        </p>
      </div>
      <nav
        className="overflow-x-auto px-2 py-2 md:px-3 [scrollbar-width:thin]"
        aria-label="Training setup workflow"
      >
        <ol className="flex min-w-max items-center gap-0.5 list-none">
          {TRAINING_WORKFLOW_STEPS.map((step, i) => {
            const isCurrent = step.id === currentId
            const isPast = currentIdx >= 0 && i < currentIdx
            return (
              <li key={step.id} className="flex items-center">
                {i > 0 ? (
                  <span className="text-muted-foreground/35 px-0.5 text-[10px] select-none" aria-hidden>
                    →
                  </span>
                ) : null}
                <Link
                  href={step.href}
                  title={`${step.title}: ${step.short}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${step.step}, ${step.title}. ${step.short}`}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isPast
                        ? 'text-muted-foreground hover:bg-muted'
                        : 'text-foreground/85 hover:bg-muted',
                  )}
                >
                  <span aria-hidden>{step.step}.</span>{' '}
                  <span className="inline sm:hidden">{step.compactLabel}</span>
                  <span className="hidden sm:inline">{step.title}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
