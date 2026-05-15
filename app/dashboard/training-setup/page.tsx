import Link from 'next/link'
import {
  BookOpenIcon,
  BriefcaseIcon,
  BadgeCheckIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  LayersIcon,
  ArrowRightIcon,
} from 'lucide-react'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PAGE_GUIDES, TRAINING_WORKFLOW_STEPS } from '@/lib/training-workflow'

const AREA_ICONS = {
  sops: FileTextIcon,
  courses: BookOpenIcon,
  assignments: ClipboardCheckIcon,
  'course-groups': LayersIcon,
  induction: GraduationCapIcon,
  'training-plans': CalendarRangeIcon,
  'job-descriptions': BriefcaseIcon,
  qualifications: BadgeCheckIcon,
} as const

export const metadata = { title: 'Start here — training overview' }
export const dynamic = 'force-dynamic'

export default function TrainingSetupPage() {
  const guide = PAGE_GUIDES['training-setup']

  return (
    <CatalogPageLayout guideId="training-setup">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Most teams start like this</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            You don&apos;t need every area on day one. Follow the numbered cards below when
            you&apos;re ready — each step links to the next screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-0">
          <Button asChild size="sm">
            <Link href="/dashboard/sops">
              Begin at step 1 — SOPs
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/courses">Skip to catalog (step 2)</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {TRAINING_WORKFLOW_STEPS.map((step) => {
          const Icon = AREA_ICONS[step.id as keyof typeof AREA_ICONS] ?? BookOpenIcon
          const pageGuide = PAGE_GUIDES[step.id as keyof typeof PAGE_GUIDES]
          return (
            <Card
              key={step.id}
              className="card-hover shadow-soft border-border/80 transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Step {step.step}
                  </span>
                </div>
                <CardTitle className="text-base pt-2">{step.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{step.short}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {pageGuide?.summary}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={step.href}>
                    Open — {step.compactLabel}
                    <ArrowRightIcon className="ml-2 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground max-w-lg mx-auto">
          <p className="font-medium text-foreground mb-1">Quick mental model</p>
          <p>{guide.summary}</p>
        </CardContent>
      </Card>
    </CatalogPageLayout>
  )
}
