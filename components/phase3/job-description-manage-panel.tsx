'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { BookOpenIcon, BriefcaseIcon, Loader2, UserPlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  assignUserToJobDescription,
  linkCourseToJobDescription,
} from '@/lib/actions/phase3'
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
import type { Course, JobDescription } from '@/types/phase3'

const linkSchema = z.object({
  courseId: z.string().min(1),
  reason: z.string().min(5).trim(),
})

const assignSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(5).trim(),
})

export function JobDescriptionManagePanel({
  jd,
  courses,
}: {
  jd: JobDescription
  courses: Course[]
}) {
  const router = useRouter()
  const [linkPending, startLink] = useTransition()
  const [assignPending, startAssign] = useTransition()
  const [courseId, setCourseId] = useState<string>()
  const [userId, setUserId] = useState<string>()
  const { users, loading: usersLoading } = useTenantUsers()
  const courseItems = useMemo(() => coursesToSelectItems(courses), [courses])

  const linkedIds = new Set((jd.courses ?? []).map((c) => c.courseId ?? c.course?.id))
  const availableCourses = courses.filter((c) => !linkedIds.has(c.id))

  const linkForm = useForm<z.infer<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
  })
  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
  })

  const courseRows = jd.courses ?? []
  const userRows = jd.userLinks ?? []

  return (
    <Tabs defaultValue="courses" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="courses" className="gap-2">
          <BookOpenIcon className="h-4 w-4" />
          Courses ({courseRows.length})
        </TabsTrigger>
        <TabsTrigger value="people" className="gap-2">
          <UserPlusIcon className="h-4 w-4" />
          People ({userRows.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4 text-primary" />
              Required courses
            </CardTitle>
            <CardDescription>
              Link catalog courses required for this job description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {courseRows.length === 0 ? (
              <CatalogEmptyState
                title="No courses linked"
                description="Add required training courses from your catalog."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Course</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseRows.map((row) => (
                      <TableRow key={row.courseId}>
                        <TableCell className="font-medium">
                          {row.course?.name ?? row.courseId}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <form
              className="space-y-4 rounded-lg border bg-muted/20 p-4"
              onSubmit={linkForm.handleSubmit((v) => {
                startLink(async () => {
                  const r = await linkCourseToJobDescription(jd.id, {
                    courseId: courseId ?? v.courseId,
                    reason: v.reason,
                  })
                  if (r.error) {
                    toast.error(formatCatalogError(r.error, r.errorCode))
                    return
                  }
                  toast.success('Course linked')
                  linkForm.reset()
                  setCourseId(undefined)
                  router.refresh()
                })
              })}
            >
              <CatalogField label="Catalog course" required>
                <SearchSelect
                  value={courseId}
                  onValueChange={(id) => {
                    setCourseId(id)
                    linkForm.setValue('courseId', id, { shouldValidate: true })
                  }}
                  items={coursesToSelectItems(availableCourses)}
                  placeholder="Search courses…"
                  emptyText="All courses already linked."
                  disabled={availableCourses.length === 0}
                />
              </CatalogField>
              <CatalogField label="Audit reason" required>
                <Textarea rows={2} {...linkForm.register('reason')} />
              </CatalogField>
              <CatalogFormActions>
                <Button type="submit" disabled={linkPending || availableCourses.length === 0}>
                  {linkPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Link course
                </Button>
              </CatalogFormActions>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="people" className="mt-4">
        <Card className="card-hover shadow-soft border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlusIcon className="h-4 w-4 text-primary" />
              Assigned people
            </CardTitle>
            <CardDescription>
              Map employees to this job description matrix row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userRows.length === 0 ? (
              <CatalogEmptyState
                title="No users assigned"
                description="Assign employees who hold this job description."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Name</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRows.map((row) => (
                      <TableRow key={row.userId}>
                        <TableCell className="font-medium">
                          {row.user?.name ?? row.userId}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.user?.employeeId ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <form
              className="space-y-4 rounded-lg border bg-muted/20 p-4"
              onSubmit={assignForm.handleSubmit((v) => {
                startAssign(async () => {
                  const r = await assignUserToJobDescription(jd.id, {
                    userId: userId ?? v.userId,
                    reason: v.reason,
                  })
                  if (r.error) {
                    toast.error(formatCatalogError(r.error, r.errorCode))
                    return
                  }
                  toast.success('User assigned')
                  assignForm.reset()
                  setUserId(undefined)
                  router.refresh()
                })
              })}
            >
              <CatalogField label="Employee" required>
                <SearchSelect
                  value={userId}
                  onValueChange={(id) => {
                    setUserId(id)
                    assignForm.setValue('userId', id, { shouldValidate: true })
                  }}
                  items={users}
                  loading={usersLoading}
                  placeholder="Search users…"
                  emptyText="No users found."
                />
              </CatalogField>
              <CatalogField label="Audit reason" required>
                <Textarea rows={2} {...assignForm.register('reason')} />
              </CatalogField>
              <CatalogFormActions>
                <Button type="submit" disabled={assignPending || usersLoading}>
                  {assignPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assign user
                </Button>
              </CatalogFormActions>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
