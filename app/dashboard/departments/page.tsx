/**
 * app/dashboard/departments/page.tsx
 *
 * Departments list with inline create form.
 */

import { Suspense } from 'react'
import { getDepartments } from '@/lib/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuildingIcon, UsersIcon, PlusIcon } from 'lucide-react'
import { CreateDepartmentModal } from '@/components/modals/create-department-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Departments' }

async function DepartmentsList() {
  const departments = await getDepartments()

  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <BuildingIcon className="h-10 w-10 opacity-20" />
        <p className="text-sm">No departments yet. Create one using the form.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => (
        <Card key={dept.id} className="hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UsersIcon className="h-3.5 w-3.5" />
              <span>{dept._count?.users ?? 0} member{(dept._count?.users ?? 0) !== 1 ? 's' : ''}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DepartmentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organise employees into departments for training assignments
          </p>
        </div>
        <CreateDepartmentModal
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          }
        />
      </div>

      <div className="grid gap-6">
        {/* List */}
        <Suspense
          fallback={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-3 w-16" /></CardContent></Card>
              ))}
            </div>
          }
        >
          <DepartmentsList />
        </Suspense>
      </div>
    </div>
  )
}
