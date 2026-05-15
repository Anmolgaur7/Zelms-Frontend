import Link from 'next/link'
import { getQualificationsWithMeta } from '@/lib/actions/phase3'
import { CreateQualificationDialog } from '@/components/phase3/create-qualification-dialog'
import {
  CatalogListCard,
  CatalogPageLayout,
} from '@/components/phase3/catalog-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BadgeCheckIcon } from 'lucide-react'

export const metadata = { title: 'Qualifications' }
export const dynamic = 'force-dynamic'

export default async function QualificationsPage() {
  const { items, apiAvailable } = await getQualificationsWithMeta()

  return (
    <CatalogPageLayout
      guideId="qualifications"
      apiUnavailable={!apiAvailable}
      count={items.length}
      countLabel="request"
      action={apiAvailable ? <CreateQualificationDialog /> : null}
    >
      <CatalogListCard
        title="Approval requests"
        description="HOD then Head QA — not the same as assigning training."
        icon={BadgeCheckIcon}
        isEmpty={items.length === 0}
        emptyMessage="No requests yet. Start a qualification for an employee or trainer, then approve steps on the detail page."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.subject?.name ?? q.subjectUserId}</TableCell>
                <TableCell>{q.qualificationType}</TableCell>
                <TableCell>
                  <Badge variant="outline">{q.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/qualifications/${q.id}`}>View</Link>
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
