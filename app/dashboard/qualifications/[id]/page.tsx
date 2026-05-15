import { notFound } from 'next/navigation'
import { getQualification } from '@/lib/actions/phase3'
import { CatalogDetailHeader } from '@/components/phase3/catalog-detail-header'
import { QualificationDetailPanel } from '@/components/phase3/qualification-detail-panel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function QualificationDetailPage({ params }: Props) {
  const { id } = await params
  const qualification = await getQualification(id)
  if (!qualification) notFound()

  return (
    <div className="flex flex-1 flex-col pb-8">
      <CatalogDetailHeader
        guideId="qualifications"
        backHref="/dashboard/qualifications"
        backLabel="Qualifications"
        title={qualification.subject?.name ?? 'Qualification request'}
        status={qualification.status}
        subtitle={`${qualification.qualificationType} qualification — approve or reject pending steps below.`}
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <QualificationDetailPanel qualification={qualification} />
      </div>
    </div>
  )
}
