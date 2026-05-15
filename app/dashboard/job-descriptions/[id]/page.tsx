import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getJobDescription, getCourses } from '@/lib/actions/phase3'
import { JobDescriptionManagePanel } from '@/components/phase3/job-description-manage-panel'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function JobDescriptionDetailPage({ params }: Props) {
  const { id } = await params
  const [jd, courses] = await Promise.all([getJobDescription(id), getCourses()])
  if (!jd) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/dashboard/job-descriptions">
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Job descriptions
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="font-mono text-lg text-muted-foreground mr-2">{jd.code}</span>
          {jd.title}
        </h1>
        {jd.description ? (
          <p className="text-sm text-muted-foreground mt-1">{jd.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Link required courses and assign employees to this JD.
          </p>
        )}
      </div>
      <JobDescriptionManagePanel jd={jd} courses={courses} />
    </div>
  )
}
