import Link from 'next/link'
import { getInductionProgramsWithMeta, getCoursesWithMeta } from '@/lib/actions/phase3'
import { CreateInductionProgramDialog } from '@/components/phase3/create-induction-program-dialog'
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
import { GraduationCapIcon } from 'lucide-react'

export const metadata = { title: 'Induction programs' }
export const dynamic = 'force-dynamic'

export default async function InductionPage() {
  const [{ programs, apiAvailable }, { courses }] = await Promise.all([
    getInductionProgramsWithMeta(),
    getCoursesWithMeta(),
  ])

  return (
    <CatalogPageLayout
      guideId="induction"
      apiUnavailable={!apiAvailable}
      count={programs.length}
      countLabel="program"
      action={apiAvailable ? <CreateInductionProgramDialog /> : null}
    >
      {courses.length > 0 && programs.length === 0 && apiAvailable ? (
        <p className="text-sm rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground">
          You have courses but no induction programs. Create a program, add steps that reference
          your courses, then enroll learners.
        </p>
      ) : null}

      <CatalogListCard
        title="Programs"
        description="Multi-step onboarding — learners use My induction."
        icon={GraduationCapIcon}
        isEmpty={programs.length === 0}
        emptyMessage="No programs yet. Create one, add course and acknowledgment steps, then enroll users."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  {p.status ? <Badge variant="outline">{p.status}</Badge> : '—'}
                </TableCell>
                <TableCell>{p.steps?.length ?? '—'}</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/induction/${p.id}`}>Manage</Link>
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
