import Link from 'next/link'
import {
  getInductionProgramsWithMeta,
  getCoursesWithMeta,
} from '@/lib/actions/phase3'
import { BASE_URL } from '@/lib/api'
import { CreateInductionProgramDialog } from '@/components/phase3/create-induction-program-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Induction programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Onboarding paths with course training and acknowledgment steps.
          </p>
        </div>
        {apiAvailable ? <CreateInductionProgramDialog /> : null}
      </div>

      {!apiAvailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="py-4 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">Induction API not available</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              <code className="text-xs">GET /api/induction-programs</code> is not registered on{' '}
              <code className="text-xs">{BASE_URL}</code>. Deploy the latest backend
              (Phase 3) or update <code className="text-xs">NEXT_PUBLIC_API_URL</code>.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {courses.length > 0 && programs.length === 0 ? (
        <Card className="border-border/80">
          <CardContent className="py-4 text-sm">
            <p className="font-medium">You have courses but no induction programs yet</p>
            <p className="mt-1 text-muted-foreground">
              A course on{' '}
              <Link href="/dashboard/courses" className="underline underline-offset-2">
                Courses
              </Link>{' '}
              is not an induction program by itself. Click{' '}
              <span className="font-medium">New program</span>, add steps that reference your
              course(s), then enroll learners.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4" /> Programs
          </CardTitle>
          <CardDescription>
            Open a program to add steps and enroll users. Learners use My induction.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {programs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No programs yet.
              {apiAvailable ? ' Create one with New program above.' : ''}
            </p>
          ) : (
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
                      {p.status ? (
                        <Badge variant="outline">{p.status}</Badge>
                      ) : (
                        'â€”'
                      )}
                    </TableCell>
                    <TableCell>{p.steps?.length ?? 'â€”'}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/induction/${p.id}`}>Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
