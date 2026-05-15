import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQualification } from '@/lib/actions/phase3'
import { QualificationDetailPanel } from '@/components/phase3/qualification-detail-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function QualificationDetailPage({ params }: Props) {
  const { id } = await params
  const qualification = await getQualification(id)
  if (!qualification) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/dashboard/qualifications">
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Qualifications
        </Link>
      </Button>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {qualification.subject?.name ?? 'Qualification request'}
          </h1>
          <Badge variant="outline">{qualification.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {qualification.qualificationType} qualification · approval ladder below
        </p>
      </div>
      <QualificationDetailPanel qualification={qualification} />
    </div>
  )
}
