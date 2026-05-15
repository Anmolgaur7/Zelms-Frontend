'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  ListOrderedIcon,
  Loader2,
  UserPlusIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addInductionStep, enrollUserInduction } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'
import {
  CatalogEmptyState,
  CatalogField,
  CatalogFormActions,
} from '@/components/phase3/catalog-form'
import {
  SearchSelect,
  coursesToSelectItems,
  useTenantUsers,
} from '@/components/phase3/search-select'
import type { Course, InductionProgram } from '@/types/phase3'

const stepSchema = z.discriminatedUnion('stepType', [
  z.object({
    stepType: z.literal('COURSE'),
    title: z.string().min(2).trim(),
    courseId: z.string().min(1, 'Select a course'),
    reason: z.string().min(5).trim(),
  }),
  z.object({
    stepType: z.literal('ACKNOWLEDGMENT'),
    title: z.string().min(2).trim(),
    ackText: z.string().min(10).trim(),
    reason: z.string().min(5).trim(),
  }),
])

const enrollSchema = z.object({
  userId: z.string().min(1, 'Select a user'),
  deadline: z.string().optional(),
  reason: z.string().min(5).trim(),
})

type StepFormValues = z.infer<typeof stepSchema>

export function InductionProgramManagePanel({
  program,
  courses,
}: {
  program: InductionProgram
  courses: Course[]
}) {
  const router = useRouter()
  const [stepPending, startStep] = useTransition()
  const [enrollPending, startEnroll] = useTransition()
  const [stepType, setStepType] = useState<'COURSE' | 'ACKNOWLEDGMENT'>('COURSE')
  const [selectedCourseId, setSelectedCourseId] = useState<string>()
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const { users, loading: usersLoading } = useTenantUsers()

  const courseItems = useMemo(() => coursesToSelectItems(courses), [courses])

  const stepForm = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: { stepType: 'COURSE', title: '', courseId: '', reason: '' },
  })

  const enrollForm = useForm<z.infer<typeof enrollSchema>>({
    resolver: zodResolver(enrollSchema),
  })

  const steps = program.steps ?? []
  const hasCourseStep = steps.some((s) => s.stepType === 'COURSE')

  return (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="steps" className="gap-2">
          <ListOrderedIcon className="h-4 w-4" />
          Steps ({steps.length})
        </TabsTrigger>
        <TabsTrigger value="enroll" className="gap-2">
          <UserPlusIcon className="h-4 w-4" />
          Enroll
        </TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCapIcon className="h-4 w-4 text-primary" />
              Program steps
            </CardTitle>
            <CardDescription>
              Link catalog courses or add acknowledgment text. Learners complete
              enrolled programs under <strong>My induction</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.length === 0 ? (
              <CatalogEmptyState
                title="No steps yet"
                description="Add a course step from your catalog, or an acknowledgment learners must sign."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {steps.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">
                          {s.sortOrder ?? i + 1}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              s.stepType === 'COURSE'
                                ? 'border-primary/30 text-primary'
                                : ''
                            }
                          >
                            {s.stepType === 'COURSE' ? (
                              <BookOpenIcon className="mr-1 h-3 w-3 inline" />
                            ) : (
                              <ClipboardCheckIcon className="mr-1 h-3 w-3 inline" />
                            )}
                            {s.stepType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                          {s.stepType === 'COURSE'
                            ? (s.course?.name ?? '—')
                            : s.ackText
                              ? s.ackText.slice(0, 60)
                              : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <form
              className="space-y-4 rounded-lg border bg-muted/20 p-4"
              onSubmit={stepForm.handleSubmit((v) => {
                startStep(async () => {
                  const body =
                    stepType === 'COURSE'
                      ? {
                          stepType: 'COURSE' as const,
                          title: v.title,
                          courseId: selectedCourseId ?? ('courseId' in v ? v.courseId : ''),
                          reason: v.reason,
                        }
                      : {
                          stepType: 'ACKNOWLEDGMENT' as const,
                          title: v.title,
                          ackText: 'ackText' in v ? v.ackText : '',
                          reason: v.reason,
                        }
                  const r = await addInductionStep(program.id, body)
                  if (r.error) {
                    toast.error(formatCatalogError(r.error, r.errorCode))
                    return
                  }
                  toast.success('Step added')
                  stepForm.reset({
                    stepType: stepType,
                    title: '',
                    reason: '',
                    ...(stepType === 'COURSE' ? { courseId: '' } : { ackText: '' }),
                  })
                  setSelectedCourseId(undefined)
                  router.refresh()
                })
              })}
            >
              <p className="text-sm font-medium">Add step</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <CatalogField label="Step type" required>
                  <Select
                    value={stepType}
                    onValueChange={(t: 'COURSE' | 'ACKNOWLEDGMENT') => {
                      setStepType(t)
                      stepForm.setValue('stepType', t)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COURSE">Course (training)</SelectItem>
                      <SelectItem value="ACKNOWLEDGMENT">Acknowledgment</SelectItem>
                    </SelectContent>
                  </Select>
                </CatalogField>

                <CatalogField
                  label="Step title"
                  required
                  error={stepForm.formState.errors.title?.message}
                >
                  <Input placeholder="e.g. GMP basics" {...stepForm.register('title')} />
                </CatalogField>
              </div>

              {stepType === 'COURSE' ? (
                <CatalogField
                  label="Catalog course"
                  required
                  hint={
                    courses.length === 0
                      ? 'Create courses under Content → Courses first.'
                      : undefined
                  }
                  error={stepForm.formState.errors.courseId?.message}
                >
                  <SearchSelect
                    value={selectedCourseId}
                    onValueChange={(id) => {
                      setSelectedCourseId(id)
                      stepForm.setValue('courseId', id, { shouldValidate: true })
                    }}
                    items={courseItems}
                    placeholder="Search courses…"
                    searchPlaceholder="Filter by name or SOP…"
                    emptyText="No courses in catalog."
                    disabled={courses.length === 0}
                  />
                </CatalogField>
              ) : (
                <CatalogField
                  label="Acknowledgment text"
                  required
                  hint="Minimum 10 characters — shown to the learner before e-sign."
                  error={
                    stepForm.formState.errors.ackText?.message as string | undefined
                  }
                >
                  <Textarea
                    rows={3}
                    placeholder="I confirm I have read and understood…"
                    {...stepForm.register('ackText')}
                  />
                </CatalogField>
              )}

              <CatalogField
                label="Audit reason"
                required
                hint="Required for compliance traceability (min. 5 characters)."
                error={stepForm.formState.errors.reason?.message}
              >
                <Textarea rows={2} {...stepForm.register('reason')} />
              </CatalogField>

              <CatalogFormActions>
                <Button
                  type="submit"
                  disabled={
                    stepPending ||
                    (stepType === 'COURSE' && courses.length === 0)
                  }
                >
                  {stepPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Add step
                </Button>
              </CatalogFormActions>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="enroll" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlusIcon className="h-4 w-4 text-primary" />
              Enroll learner
            </CardTitle>
            <CardDescription>
              Creates assignments for each <strong>COURSE</strong> step. The user
              tracks progress under My induction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <CatalogEmptyState
                title="Add steps first"
                description="Define at least one step before enrolling anyone."
              />
            ) : !hasCourseStep ? (
              <CatalogEmptyState
                title="Add a course step"
                description="Enrollment creates training assignments — include at least one COURSE step."
              />
            ) : (
              <form
                className="space-y-4 max-w-lg"
                onSubmit={enrollForm.handleSubmit((v) => {
                  startEnroll(async () => {
                    const r = await enrollUserInduction(program.id, v)
                    if (r.error) {
                      toast.error(formatCatalogError(r.error, r.errorCode))
                      return
                    }
                    toast.success('User enrolled')
                    enrollForm.reset()
                    setSelectedUserId(undefined)
                    router.refresh()
                  })
                })}
              >
                <CatalogField
                  label="Learner"
                  required
                  hint="Search by name, employee ID, department, or email."
                  error={enrollForm.formState.errors.userId?.message}
                >
                  <SearchSelect
                    value={selectedUserId}
                    onValueChange={(id) => {
                      setSelectedUserId(id)
                      enrollForm.setValue('userId', id, { shouldValidate: true })
                    }}
                    items={users}
                    loading={usersLoading}
                    placeholder="Search users…"
                    searchPlaceholder="Name, ID, department…"
                    emptyText={
                      usersLoading
                        ? 'Loading users…'
                        : 'No users found. Add users under Organization → Users.'
                    }
                  />
                </CatalogField>

                <CatalogField label="Deadline" hint="Optional due date for course assignments.">
                  <Input type="date" className="max-w-xs" {...enrollForm.register('deadline')} />
                </CatalogField>

                <CatalogField
                  label="Audit reason"
                  required
                  error={enrollForm.formState.errors.reason?.message}
                >
                  <Textarea rows={2} {...enrollForm.register('reason')} />
                </CatalogField>

                <CatalogFormActions className="max-w-lg">
                  <Button type="submit" disabled={enrollPending || usersLoading}>
                    {enrollPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Enroll learner
                  </Button>
                </CatalogFormActions>
              </form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
