'use client'

import Link from 'next/link'
import { ChevronDownIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { PageGuide } from '@/lib/training-workflow'

export function CatalogHelpPanel({
  guide,
  defaultOpen = false,
}: {
  guide: PageGuide
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className="border-primary/15 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'group flex w-full items-center gap-3 p-4 text-left transition-colors rounded-lg',
              'hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Need a quick explanation?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plain-language tips for {guide.title}
              </p>
            </div>
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t pt-2 pb-5 px-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.summary}</p>
            {guide.notTheSameAs ? (
              <div
                role="note"
                className="rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-foreground"
              >
                <p className="font-medium text-amber-950 dark:text-amber-100 mb-1">
                  Watch out for this
                </p>
                <p className="text-amber-900/95 dark:text-amber-100/95">{guide.notTheSameAs}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Next actions
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-none pl-0">
                {guide.howToUse.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-primary font-bold leading-snug shrink-0" aria-hidden>
                      ·
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            {guide.nextSteps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs font-medium text-muted-foreground">Quick links</p>
                {guide.nextSteps.map((link) => (
                  <Button key={link.href} asChild variant="secondary" size="sm">
                    <Link href={link.href}>
                      {link.label}
                      <ArrowRightIcon className="ml-1 h-3 w-3" aria-hidden />
                    </Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
