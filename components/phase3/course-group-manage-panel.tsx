'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { LayersIcon, Loader2, SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  addCourseToGroup,
  assignCourseGroupDepartment,
} from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'
import { normalizeCourseGroupAssignResult } from '@/lib/course-group-assign'
import {
  CatalogEmptyState,
  CatalogField,
  CatalogFormActions,
} from '@/components/phase3/catalog-form'
import {
  SearchSelect,
  coursesToSelectItems,
  useTenantDepartments,
} from '@/components/phase3/search-select'
import type { Course, CourseGroup, CourseGroupAssignResult } from '@/types/phase3'

const addSchema = z.object({
  courseId: z.string().min(1, 'Select a course'),
  reason: z.string().min(5).trim(),
})

const assignSchema = z.object({
  departmentId: z.string().min(1, 'Select a department'),
  deadline: z.string().optional(),
  reason: z.string().min(5).trim(),
})

function AssignResultSummary({ result }: { result: CourseGroupAssignResult }) {
  const { created, skippedCount, skippedDetails, quizzesAssigned } =
    normalizeCourseGroupAssignResult(result)

  return (
    <div className="mt-4 rounded-md border bg-muted/30 px-4 py-3 text-sm space-y-2">
      <p className="font-medium text-foreground">Assignment result</p>
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">{created}</span> created ·{' '}
        <span className="text-foreground font-medium">{skippedCount}</span> SOPs
        skipped ·{' '}
        <span className="text-foreground font-medium">{quizzesAssigned}</span>{' '}
        quizzes assigned
      </p>
      {skippedDetails.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {skippedDetails.map((s) => (
            <li key={s.sopId}>
              SOP {s.sopId.slice(0, 8)}…{s.reason ? ` — ${s.reason}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function CourseGroupManagePanel({
  group,
  allCourses,
}: {
  group: CourseGroup
  allCourses: Course[]
}) {
  const router = useRouter()
  const [addPending, startAdd] = useTransition()
  const [assignPending, startAssign] = useTransition()
  const [assignResult, setAssignResult] = useState<CourseGroupAssignResult | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>()
  const [selectedDeptId, setSelectedDeptId] = useState<string>()
  const { departments, loading: deptLoading } = useTenantDepartments()

  const inGroup = new Set((group.courses ?? []).map((c) => c.id))
  const available = allCourses.filter((c) => !inGroup.has(c.id))
  const availableItems = useMemo(
    () => coursesToSelectItems(available),
    [available],
  )

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
  })
  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
  })

  const courseCount = group.courses?.length ?? 0

  return (
    <Tabs defaultValue="courses" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="courses" className="gap-2">
          <LayersIcon className="h-4 w-4" />
          Courses ({courseCount})
        </TabsTrigger>
        <TabsTrigger value="assign" className="gap-2">
          <SendIcon className="h-4 w-4" />
          Assign
        </TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-primary" />
              Courses in group
            </CardTitle>
            <CardDescription>
              Pick courses from your catalog. Creating a course does not add it
              here automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {courseCount === 0 ? (
              <CatalogEmptyState
                title="No courses in this group"
                description="Add one or more catalog courses, then assign the bundle to a department."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Name</TableHead>
                      <TableHead>Linked SOP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.courses!.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.sop?.title ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <form
              className="space-y-4 rounded-lg border bg-muted/20 p-4"
              onSubmit={addForm.handleSubmit((v) => {
                startAdd(async () => {
                  const r = await addCourseToGroup(group.id, {
                    courseId: selectedCourseId ?? v.courseId,
                    reason: v.reason,
                  })
                  if (r.error) {
                    toast.error(formatCatalogError(r.error, r.errorCode))
                    return
                  }
                  toast.success('Course added to group')
                  addForm.reset()
                  setSelectedCourseId(undefined)
                  router.refresh()
                })
              })}
            >
              <p className="text-sm font-medium">Add course</p>
              <CatalogField
                label="Catalog course"
                required
                error={addForm.formState.errors.courseId?.message}
              >
                <SearchSelect
                  value={selectedCourseId}
                  onValueChange={(id) => {
                    setSelectedCourseId(id)
                    addForm.setValue('courseId', id, { shouldValidate: true })
                  }}
                  items={availableItems}
                  placeholder="Search courses…"
                  emptyText={
                    available.length === 0
                      ? 'All catalog courses are already in this group.'
                      : 'No courses available.'
                  }
                  disabled={available.length === 0}
                />
              </CatalogField>
              <CatalogField
                label="Audit reason"
                required
                error={addForm.formState.errors.reason?.message}
              >
                <Textarea rows={2} {...addForm.register('reason')} />
              </CatalogField>
              <CatalogFormActions>
                <Button type="submit" disabled={addPending || available.length === 0}>
                  {addPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add to group
                </Button>
              </CatalogFormActions>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="assign" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <SendIcon className="h-4 w-4 text-primary" />
              Assign to department
            </CardTitle>
            <CardDescription>
              Uses the first quiz per ACTIVE SOP in the group. Existing
              user+quiz pairs are skipped.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseCount === 0 ? (
              <CatalogEmptyState
                title="Add courses first"
                description="Include at least one course before assigning to a department."
              />
            ) : (
              <form
                className="space-y-4 max-w-lg"
                onSubmit={assignForm.handleSubmit((v) => {
                  startAssign(async () => {
                    const r = await assignCourseGroupDepartment(group.id, {
                      departmentId: selectedDeptId ?? v.departmentId,
                      deadline: v.deadline,
                      reason: v.reason,
                    })
                    if (r.error) {
                      toast.error(formatCatalogError(r.error, r.errorCode))
                      return
                    }
                    setAssignResult(r.data ?? null)
                    toast.success('Department assignment completed')
                    router.refresh()
                  })
                })}
              >
                <CatalogField
                  label="Department"
                  required
                  error={assignForm.formState.errors.departmentId?.message}
                >
                  <SearchSelect
                    value={selectedDeptId}
                    onValueChange={(id) => {
                      setSelectedDeptId(id)
                      assignForm.setValue('departmentId', id, { shouldValidate: true })
                    }}
                    items={departments}
                    loading={deptLoading}
                    placeholder="Search departments…"
                    emptyText="No departments. Create one under Organization → Departments."
                  />
                </CatalogField>

                <CatalogField label="Deadline" hint="Optional due date for new assignments.">
                  <Input type="date" className="max-w-xs" {...assignForm.register('deadline')} />
                </CatalogField>

                <CatalogField
                  label="Audit reason"
                  required
                  error={assignForm.formState.errors.reason?.message}
                >
                  <Textarea rows={2} {...assignForm.register('reason')} />
                </CatalogField>

                <CatalogFormActions className="max-w-lg">
                  <Button type="submit" disabled={assignPending}>
                    {assignPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Assign department
                  </Button>
                </CatalogFormActions>

                {assignResult ? <AssignResultSummary result={assignResult} /> : null}
              </form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
