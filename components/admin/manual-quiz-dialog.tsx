'use client'

/**
 * components/admin/manual-quiz-dialog.tsx
 *
 * Author a manual MCQ quiz for an SOP. Wraps `POST /api/quizzes/manual`.
 *
 * UX notes:
 *  - Each question has its own card with question text, 2–6 options, a radio
 *    pointing at the correct option, and an optional explanation.
 *  - Up/Down arrows reorder questions (lighter dependency footprint than
 *    dnd-kit; dnd can come later if real drag is needed).
 *  - Submit is disabled until every question has text, ≥ 2 non-empty options,
 *    and a correctAnswer that matches one of the options.
 *  - On success we toast and `router.refresh()` so the SOPs table re-renders.
 */

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  Loader2,
  PlusIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createManualQuiz } from '@/lib/actions/admin'
import {
  QUIZ_DIFFICULTIES,
  type ManualQuizQuestion,
  type QuizDifficulty,
} from '@/types/quizzes'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6
const MAX_QUESTIONS = 50

function emptyQuestion(): ManualQuizQuestion {
  return {
    question: '',
    options: ['', ''],
    correctAnswer: '',
    explanation: '',
  }
}

interface QuestionDraft extends ManualQuizQuestion {
  /** Stable client-side key for React reorder. */
  uid: string
}

function withUid(q: ManualQuizQuestion): QuestionDraft {
  return {
    ...q,
    uid:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
  }
}

function questionIsValid(q: QuestionDraft): boolean {
  const opts = q.options.map((o) => o.trim()).filter(Boolean)
  if (q.question.trim().length < 5) return false
  if (opts.length < MIN_OPTIONS) return false
  if (!q.correctAnswer) return false
  return opts.includes(q.correctAnswer)
}

export function ManualQuizDialog({
  sopId,
  sopTitle,
  trigger,
}: {
  sopId: string
  sopTitle?: string
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('BASIC')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [
    withUid(emptyQuestion()),
  ])
  const [serverError, setServerError] = useState<string | null>(null)

  function reset() {
    setDifficulty('BASIC')
    setQuestions([withUid(emptyQuestion())])
    setServerError(null)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    )
  }

  function updateOption(idx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q
        const nextOpts = [...q.options]
        const oldValue = nextOpts[optIdx]
        nextOpts[optIdx] = value
        // If renaming the previously selected correct option, follow the value.
        const nextCorrect =
          q.correctAnswer === oldValue ? value : q.correctAnswer
        return { ...q, options: nextOpts, correctAnswer: nextCorrect }
      }),
    )
  }

  function addOption(idx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q
        if (q.options.length >= MAX_OPTIONS) return q
        return { ...q, options: [...q.options, ''] }
      }),
    )
  }

  function removeOption(idx: number, optIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q
        if (q.options.length <= MIN_OPTIONS) return q
        const removed = q.options[optIdx]
        const nextOpts = q.options.filter((_, j) => j !== optIdx)
        const nextCorrect =
          q.correctAnswer === removed ? '' : q.correctAnswer
        return { ...q, options: nextOpts, correctAnswer: nextCorrect }
      }),
    )
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[target]
      next[target] = tmp
      return next
    })
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions((prev) => [...prev, withUid(emptyQuestion())])
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))
  }

  const allValid = questions.every(questionIsValid)
  const canSubmit = !pending && allValid

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setServerError(null)
    startTransition(async () => {
      const cleaned: ManualQuizQuestion[] = questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation?.trim() || undefined,
      }))
      const result = await createManualQuiz({
        sopId,
        difficulty,
        questions: cleaned,
      })
      if (result.error) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(
        `Manual quiz created with ${cleaned.length} question${
          cleaned.length === 1 ? '' : 's'
        }.`,
      )
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2Icon className="h-5 w-5 text-primary" />
            Author manual quiz
          </DialogTitle>
          <DialogDescription>
            {sopTitle
              ? `Build a multiple-choice quiz for ${sopTitle}.`
              : 'Build a multiple-choice quiz for this SOP.'}{' '}
            Each question needs at least two options and one correct answer.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto space-y-4 pr-1"
        >
          {serverError ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm" htmlFor="quiz-difficulty">
              Difficulty
            </Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as QuizDifficulty)}
              disabled={pending}
            >
              <SelectTrigger id="quiz-difficulty" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUIZ_DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {questions.length} / {MAX_QUESTIONS} questions
            </span>
          </div>

          {questions.map((q, idx) => {
            const valid = questionIsValid(q)
            return (
              <div
                key={q.uid}
                className={`rounded-lg border p-4 space-y-3 ${
                  valid ? '' : 'border-amber-500/40 bg-amber-500/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">Question</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveQuestion(idx, -1)}
                      disabled={pending || idx === 0}
                      aria-label="Move question up"
                    >
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveQuestion(idx, 1)}
                      disabled={pending || idx === questions.length - 1}
                      aria-label="Move question down"
                    >
                      <ArrowDownIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeQuestion(idx)}
                      disabled={pending || questions.length === 1}
                      aria-label="Remove question"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                  placeholder="What does the SOP require…?"
                  disabled={pending}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Options ({q.options.length})
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => addOption(idx)}
                      disabled={pending || q.options.length >= MAX_OPTIONS}
                    >
                      <PlusIcon className="mr-1 h-3.5 w-3.5" /> Add option
                    </Button>
                  </div>

                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={`correct-${q.uid}`}
                        className="h-4 w-4 accent-primary"
                        checked={!!opt && q.correctAnswer === opt}
                        onChange={() =>
                          opt
                            ? updateQuestion(idx, { correctAnswer: opt })
                            : undefined
                        }
                        disabled={pending || !opt}
                        aria-label={`Mark option ${optIdx + 1} as correct`}
                      />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOption(idx, optIdx, e.target.value)
                        }
                        placeholder={`Option ${optIdx + 1}`}
                        disabled={pending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeOption(idx, optIdx)}
                        disabled={pending || q.options.length <= MIN_OPTIONS}
                        aria-label="Remove option"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {!q.correctAnswer ? (
                    <p className="text-xs text-amber-600">
                      Select the radio next to the correct option.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`${q.uid}-explanation`}
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Explanation{' '}
                    <span className="font-normal normal-case">(optional)</span>
                  </Label>
                  <Textarea
                    id={`${q.uid}-explanation`}
                    rows={2}
                    value={q.explanation ?? ''}
                    onChange={(e) =>
                      updateQuestion(idx, { explanation: e.target.value })
                    }
                    placeholder="Shown to trainees after they answer."
                    disabled={pending}
                  />
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            disabled={pending || questions.length >= MAX_QUESTIONS}
            className="w-full"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add another question
          </Button>
        </form>

        <div className="flex items-center justify-end gap-3 pt-3 border-t mt-2">
          <span className="mr-auto text-xs text-muted-foreground">
            {allValid
              ? 'Looks good. Save when you’re ready.'
              : 'Fill out every question with at least two options and a correct answer.'}
          </span>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!canSubmit}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save quiz'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
