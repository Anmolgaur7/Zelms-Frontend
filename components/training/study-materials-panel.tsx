'use client'

import { useState } from 'react'
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
  SparklesIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import type { StudyMaterials, StudyFlashcard } from '@/types/admin'
import { MarkdownView } from './markdown-view'

interface PanelProps {
  result:
    | { data: StudyMaterials; error?: undefined }
    | { data?: undefined; error: { message: string; code: string; status?: number } }
}

export function StudyMaterialsPanel({ result }: PanelProps) {
  // ── Error path ─────────────────────────────────────────────────────────────
  if (result.error) {
    return (
      <Card className="border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircleIcon className="h-4 w-4" />
            Study materials unavailable
          </CardTitle>
          <CardDescription>
            {result.error.message}{' '}
            <span className="font-mono text-xs">· {result.error.code}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The AI summary couldn&apos;t be loaded for this SOP. You can still
          read the document in the <strong>Document</strong> tab or ask
          questions in the <strong>SOP Chat</strong>.
        </CardContent>
      </Card>
    )
  }

  const data = result.data ?? {}
  const summary = typeof data.summary === 'string' ? data.summary : null
  const keyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : []
  const flashcards: StudyFlashcard[] = Array.isArray(data.flashcards)
    ? (data.flashcards as StudyFlashcard[])
    : []

  const hasAny = !!summary || keyPoints.length > 0 || flashcards.length > 0

  if (!hasAny) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center space-y-3">
          <SparklesIcon className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No study materials generated yet for this SOP.
          </p>
          <p className="text-xs text-muted-foreground">
            Open the SOP once more in a few minutes — the AI may still be
            indexing the document.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <MarkdownView>{summary}</MarkdownView>
          </CardContent>
        </Card>
      )}

      {keyPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
              Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {keyPoints.map((kp, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span className="leading-relaxed">
                    <MarkdownView variant="compact">{kp}</MarkdownView>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {flashcards.length > 0 && <FlashcardDeck cards={flashcards} />}
    </div>
  )
}

// ─── Flashcard deck ───────────────────────────────────────────────────────────
function FlashcardDeck({ cards }: { cards: StudyFlashcard[] }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const total = cards.length
  const card = cards[index]

  const next = () => {
    setRevealed(false)
    setIndex((i) => (i + 1) % total)
  }
  const prev = () => {
    setRevealed(false)
    setIndex((i) => (i - 1 + total) % total)
  }
  const reset = () => {
    setRevealed(false)
    setIndex(0)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Flashcards
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {index + 1} / {total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="w-full min-h-[200px] rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-3"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {revealed ? 'Answer' : 'Question'}
          </span>
          <p className="text-lg leading-relaxed">
            {revealed ? card.answer : card.question}
          </p>
          <span className="text-xs text-muted-foreground">
            Click to {revealed ? 'hide' : 'reveal'}
          </span>
        </button>

        <div className="flex items-center justify-between mt-4 gap-2">
          <Button variant="ghost" size="sm" onClick={prev} disabled={total < 2}>
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
            Restart
          </Button>
          <Button variant="ghost" size="sm" onClick={next} disabled={total < 2}>
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
