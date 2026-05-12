/**
 * app/my-trainings/view/[id]/page.tsx
 *
 * SOP Document Viewer for a specific assignment.
 * Uses the short-lived signed URL exposed on the assignment include.
 */

import { getAssignmentById, refreshSopSignedUrl } from '@/lib/actions/employee'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeftIcon,
  FileTextIcon,
  PlayIcon,
  BookOpenIcon,
  AlertCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { BASE_URL } from '@/lib/api'
import type { Assignment } from '@/types/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

/** Resolve the best PDF URL we can give to the iframe. */
function resolvePdfSrc(a: Assignment): string | null {
  const sop = a.quiz?.sop ?? a.sop
  if (!sop) return null

  if (sop.sopDisplayUrl) {
    return `${sop.sopDisplayUrl}#toolbar=0&view=FitH`
  }
  if (sop.fileUrl) {
    if (sop.fileUrl.startsWith('http://') || sop.fileUrl.startsWith('https://')) {
      return `${sop.fileUrl}#toolbar=0&view=FitH`
    }
    const trimmed = sop.fileUrl.startsWith('/') ? sop.fileUrl.slice(1) : sop.fileUrl
    return `${BASE_URL}/${trimmed}#toolbar=0&view=FitH`
  }
  return null
}

export default async function ViewSOPPage({ params }: PageProps) {
  const { id } = await params
  const assignment = await getAssignmentById(id)

  if (!assignment) notFound()

  const isCompleted = assignment.status === 'COMPLETED'
  const sop = assignment.quiz?.sop ?? assignment.sop
  const title = sop?.title ?? 'SOP Document'
  const version = sop?.version
  const sopId = sop?.id ?? assignment.sopId

  // The include should already carry a signed URL, but if it's missing or
  // expired, fall back to /api/sops/:id/file.
  let pdfSrc = resolvePdfSrc(assignment)
  if (!pdfSrc && sopId) {
    const signed = await refreshSopSignedUrl(sopId)
    if (signed.sopDisplayUrl) {
      pdfSrc = `${signed.sopDisplayUrl}#toolbar=0&view=FitH`
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/my-trainings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Trainings
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileTextIcon className="h-8 w-8 text-primary" />
              {title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
              {version && <Badge variant="secondary">Version {version}</Badge>}
              <span className="text-sm">
                Assigned on{' '}
                {new Date(assignment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {sopId && (
              <Button variant="outline" asChild>
                <Link href={`/my-trainings/library/${sopId}`}>
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  Study Materials
                </Link>
              </Button>
            )}
            {!isCompleted && (
              <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                <Link href={`/my-trainings/quiz/${id}`}>
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Take Validation Quiz
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF view */}
      <Card className="flex-1 min-h-[700px] border-2 shadow-xl overflow-hidden bg-slate-50">
        <CardContent className="p-0 h-full">
          {pdfSrc ? (
            <iframe
              src={pdfSrc}
              className="w-full h-[800px] border-none"
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
              <div className="bg-muted p-4 rounded-full">
                <AlertCircleIcon className="h-12 w-12 text-muted-foreground opacity-40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Document Not Available</h3>
                <p className="text-muted-foreground max-w-sm">
                  The PDF file for this SOP could not be loaded. Its access link
                  may have expired — refresh the page, or contact your
                  supervisor.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer CTA */}
      {!isCompleted && (
        <div className="flex flex-col items-center justify-center py-8 gap-4 rounded-2xl border border-primary/10 bg-primary/5">
          <div className="text-center space-y-1">
            <p className="font-semibold">Finished reading?</p>
            <p className="text-sm text-muted-foreground">
              You must pass the validation quiz (≥ 80 %) to complete this training.
            </p>
          </div>
          <Button size="lg" className="px-12" asChild>
            <Link href={`/my-trainings/quiz/${id}`}>
              Start Quiz Now
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
