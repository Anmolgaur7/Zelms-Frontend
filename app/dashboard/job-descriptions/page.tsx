import Link from 'next/link'
import { getJobDescriptionsWithMeta } from '@/lib/actions/phase3'
import { CreateJobDescriptionDialog } from '@/components/phase3/create-job-description-dialog'
import {
  CatalogListCard,
  CatalogPageLayout,
} from '@/components/phase3/catalog-page-layout'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BriefcaseIcon } from 'lucide-react'

export const metadata = { title: 'Job descriptions' }
export const dynamic = 'force-dynamic'

export default async function JobDescriptionsPage() {
  const { items, apiAvailable } = await getJobDescriptionsWithMeta()

  return (
    <CatalogPageLayout
      guideId="job-descriptions"
      apiUnavailable={!apiAvailable}
      count={items.length}
      countLabel="job description"
      action={apiAvailable ? <CreateJobDescriptionDialog /> : null}
    >
      <CatalogListCard
        title="Role matrix"
        description="Link required courses and assign employees to each JD."
        icon={BriefcaseIcon}
        isEmpty={items.length === 0}
        emptyMessage="No job descriptions yet. Create a JD, link courses, then assign people."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((jd) => (
              <TableRow key={jd.id}>
                <TableCell className="font-mono text-sm">{jd.code}</TableCell>
                <TableCell className="font-medium">{jd.title}</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/job-descriptions/${jd.id}`}>Manage</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CatalogListCard>
    </CatalogPageLayout>
  )
}
