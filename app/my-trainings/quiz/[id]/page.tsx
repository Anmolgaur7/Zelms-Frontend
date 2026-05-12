/**
 * app/my-trainings/quiz/[id]/page.tsx
 *
 * Quiz page wrapper. If the assignment include already carries the quiz
 * (with questions), we skip the secondary fetch.
 */

import { getAssignmentById, getQuizzesBySop } from '@/lib/actions/employee'
import { notFound, redirect } from 'next/navigation'
import { QuizInterface } from '@/components/training/quiz-interface'
import { ChevronLeftIcon, AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Quiz } from '@/types/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params
  const assignment = await getAssignmentById(id)

  if (!assignment) notFound()

  if (assignment.status === 'COMPLETED') {
    redirect('/my-trainings')
  }

  // Prefer the quiz already embedded on the assignment, if it has questions
  let quiz: Quiz | null = null
  const embedded = assignment.quiz
  if (embedded && Array.isArray(embedded.questions) && embedded.questions.length > 0) {
    quiz = {
      id: embedded.id,
      sopId: embedded.sop?.id,
      sop: embedded.sop,
      questions: embedded.questions,
    }
  } else {
    const sopId = assignment.sopId || embedded?.sop?.id
    if (sopId) {
      const quizzes = await getQuizzesBySop(sopId)
      if (quizzes.length > 0) {
        quiz = quizzes[0]
      }
    }
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4 text-center">
        <div className="rounded-full bg-amber-100 p-3">
          <AlertCircleIcon className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">Quiz Not Available</h2>
        <p className="text-muted-foreground max-w-sm">
          There are no validation questions on file for this SOP yet. Please
          ask your trainer to attach a quiz, then come back.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/my-trainings/view/${id}`}>Return to SOP</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <Link
        href={`/my-trainings/view/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Document
      </Link>

      <QuizInterface assignment={assignment} quiz={quiz} />
    </div>
  )
}
