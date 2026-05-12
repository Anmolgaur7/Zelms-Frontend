'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { submitQuiz } from '@/lib/actions/employee'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2Icon,
  Loader2,
  AlertCircleIcon,
  ShieldCheckIcon,
  AwardIcon,
} from 'lucide-react'
import type { Assignment, Quiz } from '@/types/admin'

interface QuizProps {
  assignment: Assignment
  quiz: Quiz
}

export function QuizInterface({ assignment, quiz }: QuizProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [signature, setSignature] = useState('')
  const [isFinished, setIsFinished] = useState(false)
  const [resultScore, setResultScore] = useState<number | null>(null)
  const [resultPassed, setResultPassed] = useState<boolean | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const questions = quiz.questions ?? []
  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1
  const isSignatureStep = currentStep === questions.length
  const passingScore = 80

  const handleNext = () => {
    if (!answers[currentStep]) {
      toast.error('Please select an answer to continue.')
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleSubmit = () => {
    if (signature.trim().length < 3) {
      toast.error('Please type your full name as a digital signature.')
      return
    }
    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer every question before signing.')
      return
    }

    startTransition(async () => {
      const payload = {
        answers: questions.map((_, i) => ({
          questionIndex: i,
          selectedAnswer: answers[i] ?? '',
        })),
        signature: {
          value: signature.trim(),
          meaning:
            'I attest that I have read the SOP and completed this quiz personally.',
        },
      }

      const result = await submitQuiz(assignment.id, payload)

      if (result.error) {
        toast.error(result.error.message)
        return
      }

      const score = typeof result.data!.score === 'number' ? result.data!.score : null
      const passed =
        typeof result.data!.passed === 'boolean'
          ? result.data!.passed
          : score !== null
          ? score >= passingScore
          : false

      setResultScore(score)
      setResultPassed(passed)
      setResultMessage(result.data!.message ?? null)
      setIsFinished(true)
      toast.success(passed ? 'Training validated!' : 'Quiz submitted.')
    })
  }

  // ── Finished view ──────────────────────────────────────────────────────────
  if (isFinished) {
    const passed = resultPassed === true
    return (
      <Card className="max-w-2xl mx-auto border-2">
        <CardContent className="pt-12 pb-10 flex flex-col items-center text-center space-y-6">
          {passed ? (
            <div className="bg-emerald-100 p-4 rounded-full">
              <CheckCircle2Icon className="h-12 w-12 text-emerald-600" />
            </div>
          ) : (
            <div className="bg-rose-100 p-4 rounded-full">
              <AlertCircleIcon className="h-12 w-12 text-rose-600" />
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              {passed ? 'Training Validated!' : 'Assessment Failed'}
            </h2>
            {resultScore !== null && (
              <p className="text-muted-foreground text-lg">
                Your score:{' '}
                <span className="font-bold text-foreground">{resultScore}%</span>
              </p>
            )}
            {resultMessage && (
              <p className="text-sm text-muted-foreground">{resultMessage}</p>
            )}
          </div>

          <p className="max-w-md text-sm text-muted-foreground">
            {passed
              ? 'Congratulations! Your compliance record has been updated. You can download your certificate below.'
              : `You did not meet the minimum passing score (${passingScore}%). Please review the SOP again and retake the quiz.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {passed && (
              <Button size="lg" variant="outline" asChild>
                <Link href={`/my-trainings/certificate/${assignment.id}`}>
                  <AwardIcon className="mr-2 h-4 w-4" />
                  View Certificate
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              className="sm:px-12"
              onClick={() => router.push('/my-trainings')}
            >
              {passed ? 'Finish' : 'Back to Trainings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── In-progress view ──────────────────────────────────────────────────────
  const totalSteps = questions.length + 1
  const progress = Math.min(100, ((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between px-2 gap-3">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {isSignatureStep
            ? 'Final Attestation'
            : `Question ${currentStep + 1} of ${questions.length}`}
        </span>
        <div className="h-2 flex-1 max-w-48 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b py-6">
          <CardTitle className="text-xl">
            {isSignatureStep
              ? 'Electronic Signature'
              : currentQuestion?.question ?? '—'}
          </CardTitle>
          <CardDescription>
            {isSignatureStep
              ? 'By signing, you confirm that you have read the SOP and the answers provided are your own.'
              : 'Select the most appropriate answer based on the SOP documentation.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 pb-10 min-h-[300px]">
          {!isSignatureStep ? (
            <RadioGroup
              value={answers[currentStep] ?? ''}
              onValueChange={(v) =>
                setAnswers({ ...answers, [currentStep]: v })
              }
              className="space-y-4"
            >
              {(currentQuestion?.options ?? []).map((option, i) => (
                <div
                  key={i}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-accent/50 ${
                    answers[currentStep] === option
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30'
                  }`}
                  onClick={() =>
                    setAnswers({ ...answers, [currentStep]: option })
                  }
                >
                  <RadioGroupItem value={option} id={`opt-${i}`} />
                  <Label
                    htmlFor={`opt-${i}`}
                    className="flex-1 cursor-pointer font-medium leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>GxP Compliance Notice:</strong> This is a legally
                  binding electronic signature. Your name, timestamp, and IP
                  address will be recorded in the system audit log.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sig-name">
                  Type your full name as Signature
                </Label>
                <Input
                  id="sig-name"
                  placeholder="John Doe"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="text-lg py-6 font-serif"
                  autoFocus
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 || isPending}
          >
            Back
          </Button>

          {isSignatureStep ? (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isPending || signature.trim().length < 3}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Finalize & Sign'
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!answers[currentStep]}
            >
              {isLastStep ? 'Continue to Signature' : 'Next Question'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
