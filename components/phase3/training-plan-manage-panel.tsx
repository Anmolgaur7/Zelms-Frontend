'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarRangeIcon, ListPlusIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { addTrainingPlanItem } from '@/lib/actions/phase3'
import { formatCatalogError } from '@/lib/phase3-errors'
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
import type { Course, TrainingPlan } from '@/types/phase3'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const itemSchema = z.object({
  label: z.string().min(2).trim(),
  plannedMonth: z.coerce.number().int().min(1).max(12).optional(),
  reason: z.string().min(5).trim(),
})

export function TrainingPlanManagePanel({
  plan,
  courses,
}: {
  plan: TrainingPlan
  courses: Course[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [courseId, setCourseId] = useState<string>()
  const [deptId, setDeptId] = useState<string>()
  const { departments, loading: deptLoading } = useTenantDepartments()
  const courseItems = useMemo(() => coursesToSelectItems(courses), [courses])

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
  })

  const items = plan.items ?? []

  return (
    <Card className="card-hover shadow-soft border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarRangeIcon className="h-4 w-4 text-primary" />
          Plan line items · {plan.calendarYear}
        </CardTitle>
        <CardDescription>
          Schedule training lines for the year. Link optional catalog courses and
          departments.
        </CardDescription>
        {plan.status ? (
          <Badge variant="outline" className="w-fit">
            {plan.status}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {items.length === 0 ? (
          <CatalogEmptyState
            title="No line items yet"
            description="Add labeled rows for each planned training activity this year."
          />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Label</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Course</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      {item.plannedMonth
                        ? MONTHS[item.plannedMonth - 1] ?? item.plannedMonth
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.courseId ? item.courseId.slice(0, 8) + '…' : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <form
          className="space-y-4 rounded-lg border bg-muted/20 p-4"
          onSubmit={form.handleSubmit((v) => {
            start(async () => {
              const r = await addTrainingPlanItem(plan.id, {
                ...v,
                courseId: courseId || undefined,
                departmentId: deptId || undefined,
              })
              if (r.error) {
                toast.error(formatCatalogError(r.error, r.errorCode))
                return
              }
              toast.success('Line item added')
              form.reset()
              setCourseId(undefined)
              setDeptId(undefined)
              router.refresh()
            })
          })}
        >
          <p className="text-sm font-medium flex items-center gap-2">
            <ListPlusIcon className="h-4 w-4" /> Add line item
          </p>
          <CatalogField label="Label" required error={form.formState.errors.label?.message}>
            <Input placeholder="Q1 SOP refresh" {...form.register('label')} />
          </CatalogField>
          <div className="grid gap-4 sm:grid-cols-2">
            <CatalogField label="Planned month">
              <Select
                onValueChange={(m) =>
                  form.setValue('plannedMonth', Number(m), { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, i) => (
                    <SelectItem key={name} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CatalogField>
            <CatalogField label="Course (optional)">
              <SearchSelect
                value={courseId}
                onValueChange={setCourseId}
                items={courseItems}
                placeholder="Link course…"
                emptyText="No courses."
              />
            </CatalogField>
          </div>
          <CatalogField label="Department (optional)">
            <SearchSelect
              value={deptId}
              onValueChange={setDeptId}
              items={departments}
              loading={deptLoading}
              placeholder="Target department…"
              emptyText="No departments."
            />
          </CatalogField>
          <CatalogField label="Audit reason" required error={form.formState.errors.reason?.message}>
            <Textarea rows={2} {...form.register('reason')} />
          </CatalogField>
          <CatalogFormActions>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add item
            </Button>
          </CatalogFormActions>
        </form>
      </CardContent>
    </Card>
  )
}
