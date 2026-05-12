/**
 * app/my-trainings/certificates/page.tsx
 *
 * Lists every completed assignment as a downloadable certificate card.
 */

import { fetchMyAssignments } from '@/lib/actions/employee'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AwardIcon,
  ChevronLeftIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const result = await fetchMyAssignments()
  const assignments = result.data ?? []
  const completed = assignments.filter((a) => a.status === 'COMPLETED')

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <Link
        href="/my-trainings"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Trainings
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <AwardIcon className="h-7 w-7 text-amber-500" />
          My Certificates
        </h1>
        <p className="text-muted-foreground mt-1">
          Every training you have completed and the certificate that proves it.
        </p>
      </div>

      {result.error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Could not load your training history.</p>
            <p className="text-xs opacity-80">{result.error.message}</p>
          </div>
        </div>
      )}

      {completed.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <AwardIcon className="h-12 w-12 text-amber-500/30 mb-4" />
            <CardTitle className="text-lg">No certificates yet</CardTitle>
            <CardDescription className="max-w-[360px] mt-2">
              Complete a training assignment with a passing quiz score (≥ 80 %)
              to earn your first certificate.
            </CardDescription>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/my-trainings">See My Trainings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {completed.map((a) => {
            const title = a.quiz?.sop?.title ?? a.sop?.title ?? 'SOP'
            return (
              <Card key={a.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                      <AwardIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        <CheckCircle2Icon className="inline h-3 w-3 mr-1 text-emerald-600" />
                        Completed{' '}
                        {a.completedAt
                          ? new Date(a.completedAt).toLocaleDateString()
                          : '—'}
                        {typeof a.score === 'number' && ` · ${a.score}%`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/my-trainings/certificate/${a.id}`}>View</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/my-trainings/certificate/${a.id}`}>
                      <DownloadIcon className="mr-2 h-3.5 w-3.5" />
                      Open
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
