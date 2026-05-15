/**
 * app/my-trainings/library/[sopId]/page.tsx
 *
 * Employee SOP study page — combines PDF view, AI study materials,
 * and the SOP chat assistant in a single tabbed layout.
 *
 * Endpoints used:
 *   GET  /api/sops/:id          → fetch metadata + signed URL
 *   GET  /api/sops/:id/study    → flashcards/summary (server)
 *   POST /api/sops/:id/chat     → AI Q&A (client → server action)
 */

import {
  getSopById,
  getStudyMaterials,
  refreshSopSignedUrl,
} from '@/lib/actions/employee'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpenIcon,
  ChevronLeftIcon,
  FileTextIcon,
  MessageSquareIcon,
  SparklesIcon,
  AlertCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { BASE_URL } from '@/lib/api'
import { SopChatPanel } from '@/components/training/sop-chat-panel'
import { StudyMaterialsPanel } from '@/components/training/study-materials-panel'

interface PageProps {
  params: Promise<{ sopId: string }>
}

function resolvePdfSrc(sop: { sopDisplayUrl?: string | null; fileUrl?: string | null }): string | null {
  if (sop.sopDisplayUrl) return `${sop.sopDisplayUrl}#toolbar=0&view=FitH`
  if (sop.fileUrl) {
    if (sop.fileUrl.startsWith('http://') || sop.fileUrl.startsWith('https://')) {
      return `${sop.fileUrl}#toolbar=0&view=FitH`
    }
    const trimmed = sop.fileUrl.startsWith('/') ? sop.fileUrl.slice(1) : sop.fileUrl
    return `${BASE_URL}/${trimmed}#toolbar=0&view=FitH`
  }
  return null
}

export default async function LibrarySopPage({ params }: PageProps) {
  const { sopId } = await params
  const sop = await getSopById(sopId)
  if (!sop) notFound()

  // The SOP list endpoint does NOT include a signed PDF URL — we have to
  // ask /api/sops/:id/file for one before rendering the iframe.
  const [studyResult, signed] = await Promise.all([
    getStudyMaterials(sopId),
    refreshSopSignedUrl(sopId),
  ])

  const blocked =
    signed.accessError?.code === 'SOP_NOT_ACCESSIBLE' ||
    studyResult.error?.code === 'SOP_NOT_ACCESSIBLE'

  const pdfSrc = blocked
    ? null
    : resolvePdfSrc({
        sopDisplayUrl: signed.sopDisplayUrl ?? sop.sopDisplayUrl ?? null,
        fileUrl: sop.fileUrl ?? null,
      })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      <Link
        href="/my-trainings/library"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Library
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileTextIcon className="h-7 w-7 text-primary" />
            {sop.title}
          </h1>
          {sop.version && <Badge variant="secondary">v{sop.version}</Badge>}
          {sop.status && (
            <Badge variant="outline" className="text-xs">
              {sop.status}
            </Badge>
          )}
        </div>
        {sop.description && (
          <p className="text-muted-foreground max-w-3xl">{sop.description}</p>
        )}
      </div>

      {blocked ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                This procedure is not available for study yet
              </p>
              <p className="text-amber-800/90 dark:text-amber-300/90">
                Only published (ACTIVE) SOPs can be opened. Ask your trainer or
                admin when this document will be published.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="document">
            <FileTextIcon className="mr-2 h-4 w-4" />
            Document
          </TabsTrigger>
          <TabsTrigger value="study">
            <SparklesIcon className="mr-2 h-4 w-4" />
            Study
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquareIcon className="mr-2 h-4 w-4" />
            SOP Chat
          </TabsTrigger>
        </TabsList>

        {/* PDF */}
        <TabsContent value="document" className="mt-4">
          <Card className="border-2 shadow-xl overflow-hidden bg-slate-50">
            <CardContent className="p-0">
              {pdfSrc ? (
                <iframe
                  src={pdfSrc}
                  className="w-full h-[800px] border-none"
                  title={sop.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <AlertCircleIcon className="h-10 w-10 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-muted-foreground max-w-sm">
                    The PDF for this SOP could not be loaded. Its access link
                    may have expired — refresh the page, or ask an admin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study */}
        <TabsContent value="study" className="mt-4">
          <StudyMaterialsPanel result={studyResult} />
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquareIcon className="h-4 w-4 text-primary" />
                Ask the SOP
              </CardTitle>
              <CardDescription>
                Ask any question about this SOP. The assistant only answers
                from the document content — keep questions specific.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SopChatPanel sopId={sopId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
