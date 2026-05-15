import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInductionProgram, getCourses } from '@/lib/actions/phase3'
import { InductionProgramManagePanel } from '@/components/phase3/induction-program-manage-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const program = await getInductionProgram(id)
  return { title: program?.name ?? 'Induction program' }
}

export default async function InductionProgramDetailPage({ params }: Props) {
  const { id } = await params
  const [program, courses] = await Promise.all([
    getInductionProgram(id),
    getCourses(),
  ])

  if (!program) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/dashboard/induction">
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Induction programs
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{program.name}</h1>
          {program.status ? (
            <Badge variant="outline">{program.status}</Badge>
          ) : null}
        </div>
        {program.description ? (
          <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Add steps, then enroll learners. They complete the path under My induction.
          </p>
        )}
      </div>

      <InductionProgramManagePanel program={program} courses={courses} />
    </div>
  )
}
