/**
 * app/my-trainings/certificate/[id]/page.tsx
 *
 * Renders a single training certificate for a passed assignment.
 * Backend: GET /api/assignments/:id/certificate → { signedUrl, expiresInSeconds }
 */

import { getCertificate, getAssignmentById } from '@/lib/actions/employee'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AwardIcon,
  ChevronLeftIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Certificate' }

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params

  const [assignment, certificate] = await Promise.all([
    getAssignmentById(id),
    getCertificate(id),
  ])

  if (!assignment) notFound()

  const isCompleted = assignment.status === 'COMPLETED'
  const sopTitle = assignment.quiz?.sop?.title ?? assignment.sop?.title ?? 'SOP'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <Link
        href="/my-trainings"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Trainings
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <AwardIcon className="h-8 w-8 text-amber-500" />
            Training Certificate
          </h1>
          <p className="text-muted-foreground mt-1">{sopTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
              Validated
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              Not yet completed
            </Badge>
          )}
        </div>
      </div>

      {!isCompleted ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircleIcon className="h-4 w-4 text-amber-600" />
              Certificate locked
            </CardTitle>
            <CardDescription>
              You must complete this training and pass the validation quiz
              before a certificate is issued.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/my-trainings/quiz/${id}`}>Take Quiz</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !certificate?.signedUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircleIcon className="h-4 w-4 text-amber-600" />
              Certificate is being prepared
            </CardTitle>
            <CardDescription>
              Your certificate has not been generated yet, or the access link
              has expired. Refresh in a few minutes.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-amber-50/50 border-b">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <AwardIcon className="h-6 w-6 text-amber-500" />
                <div>
                  <CardTitle className="text-base">{sopTitle}</CardTitle>
                  {assignment.completedAt && (
                    <CardDescription>
                      Completed{' '}
                      {new Date(assignment.completedAt).toLocaleDateString()}
                      {typeof assignment.score === 'number' &&
                        ` · score ${assignment.score}%`}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Button asChild>
                <a
                  href={certificate.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
            {certificate.expiresInSeconds && (
              <p className="text-xs text-muted-foreground pt-2">
                Link expires in ~{Math.round(certificate.expiresInSeconds / 60)} min — refresh the page if it stops loading.
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={certificate.signedUrl}
              className="w-full h-[700px] border-none bg-slate-50"
              title={`Certificate · ${sopTitle}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
