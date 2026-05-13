'use client'

/**
 * components/modals/create-sop-modal.tsx
 *
 * Multi-phase SOP upload + AI quiz preview.
 *
 *   form        → admin fills title / version / file / audit reason
 *   uploading   → POST /api/sops/upload (multipart) — short-lived
 *   generating  → poll GET /api/quizzes/sop/:id until the AI quiz lands
 *                 (or until we hit `MAX_POLL_ATTEMPTS`)
 *   preview     → show the AI-generated questions; admin confirms (close +
 *                 refresh) or "Try again" to re-poll
 *   timeout     → AI didn't return in time. Admin can keep waiting (retry) or
 *                 close the modal — the SOP itself is already created.
 *
 * The dialog stays open across all phases so the admin sees an end-to-end
 * confirmation; closing during the "generating" phase is allowed but warns
 * the SOP was already created.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createSOP, getQuizzesBySOP } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileTextIcon,
  FileUpIcon,
  Loader2,
  RefreshCwIcon,
  SparklesIcon,
  TimerIcon,
} from 'lucide-react'
import type { Quiz, QuizQuestion } from '@/types/admin'

// ─── Form ────────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim(),
  description: z.string().optional(),
  version: z.string().optional(),
  reason: z.string().min(5, 'Audit reason must be at least 5 characters').trim(),
})
type FormValues = z.infer<typeof schema>

// ─── Polling config ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 4_000
const MAX_POLL_ATTEMPTS = 12 // 12 × 4 s = ~48 s budget

type Phase = 'form' | 'uploading' | 'generating' | 'preview' | 'timeout'

interface UploadOutcome {
  sopId: string
  title: string
}

export function CreateSOPModal({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cancelPollRef = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const resetAll = useCallback(() => {
    reset()
    setFile(null)
    setServerError(null)
    setOutcome(null)
    setQuiz(null)
    setAttempt(0)
    setPhase('form')
    cancelPollRef.current = true
  }, [reset])

  const handleOpenChange = (next: boolean) => {
    if (!next && phase === 'uploading') return // never close mid-upload
    setOpen(next)
    if (!next) {
      // If the SOP was created, refresh the SOPs list as we leave.
      if (outcome) router.refresh()
      resetAll()
    }
  }

  const onSubmit = (values: FormValues) => {
    if (!file) {
      toast.error('Please select an SOP file (PDF).')
      return
    }

    setServerError(null)
    setPhase('uploading')
    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('file', file)
      formData.append('reason', values.reason)
      if (values.description) formData.append('description', values.description)
      if (values.version) formData.append('version', values.version)

      const result = await createSOP(formData)

      if (result.error || !result.data) {
        setServerError(result.error ?? 'Failed to upload SOP.')
        toast.error(result.error ?? 'Failed to upload SOP.')
        setPhase('form')
        return
      }

      const sopId =
        (result.data as { id?: string }).id ??
        (result.data as { _id?: string })._id ??
        null
      if (!sopId) {
        // SOP saved but no id returned — bail safely.
        toast.success(`SOP "${values.title}" uploaded.`)
        handleOpenChange(false)
        return
      }
      setOutcome({ sopId, title: values.title })
      setPhase('generating')
      setAttempt(0)
    })
  }

  // ─── AI polling loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'generating' || !outcome) return
    cancelPollRef.current = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const tick = async (currentAttempt: number) => {
      if (cancelPollRef.current) return
      setAttempt(currentAttempt)

      const quizzes = await getQuizzesBySOP(outcome.sopId)
      if (cancelPollRef.current) return

      const withQuestions = quizzes.find(
        (q) => Array.isArray(q.questions) && q.questions.length > 0,
      )
      if (withQuestions) {
        setQuiz(withQuestions)
        setPhase('preview')
        toast.success('AI quiz draft ready for review.')
        return
      }
      if (currentAttempt + 1 >= MAX_POLL_ATTEMPTS) {
        setPhase('timeout')
        return
      }
      timeoutId = setTimeout(
        () => void tick(currentAttempt + 1),
        POLL_INTERVAL_MS,
      )
    }

    // Kick off with a short initial delay so the backend has a moment to start
    // generating before we hit /api/quizzes/sop/:id the first time.
    timeoutId = setTimeout(() => void tick(0), 1_500)
    return () => {
      cancelPollRef.current = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [phase, outcome])

  const retryGeneration = () => {
    setAttempt(0)
    setQuiz(null)
    setPhase('generating')
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className={
          phase === 'preview'
            ? 'sm:max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col'
            : 'sm:max-w-[520px]'
        }
      >
        {/* Header changes per phase so the user knows where they are. */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {phase === 'form' || phase === 'uploading' ? (
              <>
                <FileUpIcon className="h-5 w-5 text-primary" />
                Upload SOP
              </>
            ) : phase === 'generating' ? (
              <>
                <SparklesIcon className="h-5 w-5 text-primary motion-safe:animate-pulse-soft" />
                AI is drafting your quiz…
              </>
            ) : phase === 'preview' ? (
              <>
                <SparklesIcon className="h-5 w-5 text-primary" />
                AI quiz preview
              </>
            ) : (
              <>
                <TimerIcon className="h-5 w-5 text-amber-500" />
                Still generating…
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {phase === 'form' || phase === 'uploading'
              ? 'Add a new Standard Operating Procedure. Only PDF files are accepted.'
              : phase === 'generating'
                ? `Reading "${outcome?.title}" and generating a validation quiz. This usually takes 10–40 seconds.`
                : phase === 'preview'
                  ? 'Review the questions before assigning them to trainees. You can author additional questions later from the SOP page.'
                  : 'The AI hasn\u2019t returned a quiz yet. You can keep waiting or close this — your SOP is already saved.'}
          </DialogDescription>
        </DialogHeader>

        {/* ─── form / uploading ─────────────────────────────────────── */}
        {(phase === 'form' || phase === 'uploading') && (
          <form
            id="create-sop-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pt-2 animate-fade-up motion-reduce:animate-none"
          >
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sop-title">
                SOP Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sop-title"
                {...register('title')}
                placeholder="e.g. Cleanroom Entry Procedure"
                disabled={isPending}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sop-version">
                Version{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="sop-version"
                {...register('version')}
                placeholder="e.g. 1.0.2"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sop-desc">
                Description{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="sop-desc"
                {...register('description')}
                placeholder="Brief overview of the SOP…"
                rows={2}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sop-file">
                SOP File (PDF) <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="sop-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                  disabled={isPending}
                />
                {file && (
                  <div className="flex h-10 items-center justify-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    PDF
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sop-reason">
                Audit Reason <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sop-reason"
                {...register('reason')}
                placeholder="e.g. New compliance requirement"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Required for the GxP audit trail. Min 5 characters.
              </p>
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason.message}</p>
              )}
            </div>
          </form>
        )}

        {/* ─── generating ───────────────────────────────────────────── */}
        {phase === 'generating' && (
          <GeneratingState
            sopTitle={outcome?.title ?? ''}
            attempt={attempt}
            maxAttempts={MAX_POLL_ATTEMPTS}
          />
        )}

        {/* ─── preview ──────────────────────────────────────────────── */}
        {phase === 'preview' && quiz && (
          <QuizPreview quiz={quiz} sopTitle={outcome?.title ?? ''} />
        )}

        {/* ─── timeout ──────────────────────────────────────────────── */}
        {phase === 'timeout' && outcome && (
          <TimeoutState sopTitle={outcome.title} />
        )}

        {/* ─── footer ──────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-2">
          {(phase === 'form' || phase === 'uploading') && (
            <>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                id="modal-create-sop-submit"
                type="submit"
                form="create-sop-form"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Upload SOP'
                )}
              </Button>
            </>
          )}

          {phase === 'generating' && (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Continue in background
            </Button>
          )}

          {phase === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={retryGeneration}
                title="Discard this draft and regenerate"
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                <CheckIcon className="mr-2 h-4 w-4" />
                Looks good
              </Button>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <Button variant="outline" onClick={retryGeneration}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Keep waiting
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function GeneratingState({
  sopTitle,
  attempt,
  maxAttempts,
}: {
  sopTitle: string
  attempt: number
  maxAttempts: number
}) {
  const progress = Math.min(100, Math.round(((attempt + 1) / maxAttempts) * 100))
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center animate-fade-up motion-reduce:animate-none">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl motion-safe:animate-pulse-soft" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(243,75%,42%)] text-primary-foreground shadow-soft-lg">
          <SparklesIcon className="h-7 w-7 motion-safe:animate-pulse-soft" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Drafting validation questions for &ldquo;{sopTitle}&rdquo;
        </p>
        <p className="text-xs text-muted-foreground">
          The AI reads your SOP, picks the high-impact concepts, and writes a
          multi-choice quiz.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(199,89%,60%)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Checking again every 4s</span>
          <span>
            attempt {Math.min(attempt + 1, maxAttempts)} / {maxAttempts}
          </span>
        </div>
      </div>
    </div>
  )
}

function TimeoutState({ sopTitle }: { sopTitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-up motion-reduce:animate-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 text-amber-600 dark:text-amber-400">
        <TimerIcon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-medium">
          AI quiz for &ldquo;{sopTitle}&rdquo; hasn&apos;t arrived yet.
        </p>
        <p className="text-xs text-muted-foreground">
          The SOP is saved and visible in the SOPs list. Quizzes usually appear
          within a minute or two — you can keep waiting, or close and come back
          to it from the SOP&apos;s detail page.
        </p>
      </div>
    </div>
  )
}

function QuizPreview({ quiz, sopTitle }: { quiz: Quiz; sopTitle: string }) {
  const total = quiz.questions.length
  const difficulty = quiz.difficulty ?? 'BASIC'

  return (
    <div className="flex flex-col gap-3 overflow-hidden animate-fade-up motion-reduce:animate-none">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-inset ring-primary/20">
          <CheckCircle2Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">
            &ldquo;{sopTitle}&rdquo; · {total} question{total === 1 ? '' : 's'}{' '}
            drafted
          </p>
          <p className="text-xs text-muted-foreground">
            Review the correct answers below — they&apos;ll be hidden from
            trainees when they take the quiz.
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {difficulty.toLowerCase()}
        </Badge>
      </div>

      {/* Questions */}
      <ScrollArea className="max-h-[58vh] pr-2 -mr-2">
        <ol className="space-y-3">
          {quiz.questions.map((q, idx) => (
            <li
              key={`${idx}-${q.question.slice(0, 24)}`}
              className="rounded-lg border bg-card p-4 shadow-soft motion-safe:animate-fade-up"
              style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            >
              <QuestionCard question={q} index={idx} />
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}

function QuestionCard({
  question,
  index,
}: {
  question: QuizQuestion
  index: number
}) {
  const correct = question.correctAnswer ?? null
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
          {index + 1}
        </span>
        <p className="text-sm font-medium leading-snug">{question.question}</p>
      </div>

      <ul className="space-y-1.5 pl-8">
        {question.options.map((opt, i) => {
          const isCorrect = correct != null && opt === correct
          return (
            <li
              key={`${i}-${opt.slice(0, 20)}`}
              className={
                isCorrect
                  ? 'flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'
                  : 'flex items-start gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground/85'
              }
            >
              {isCorrect ? (
                <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
              )}
              <span className="leading-snug">{opt}</span>
            </li>
          )
        })}
      </ul>

      {question.explanation && (
        <div className="ml-8 flex items-start gap-2 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="leading-snug">
            <span className="font-medium text-foreground/80">Why:</span>{' '}
            {question.explanation}
          </span>
        </div>
      )}
    </div>
  )
}
