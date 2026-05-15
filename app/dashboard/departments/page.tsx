/**
 * app/dashboard/departments/page.tsx
 *
 * Departments list with inline create form.
 */

import { getDepartments, getUsers } from '@/lib/actions/admin'
import type { AdminUser, Department } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuildingIcon, UsersIcon, PlusIcon } from 'lucide-react'
import { CreateDepartmentModal } from '@/components/modals/create-department-modal'
import { Button } from '@/components/ui/button'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'

export const metadata = { title: 'Departments' }

/** Headcount per department id — `/api/admin/departments` often omits `_count.users`. */
function memberCountFromUsers(deptId: string, users: AdminUser[]): number {
  return users.filter(
    (u) => u.departmentId === deptId || u.department?.id === deptId,
  ).length
}

function resolvedMemberCount(dept: Department, users: AdminUser[]): number {
  const fromApi = typeof dept._count?.users === 'number' ? dept._count.users : 0
  const fromDirectory = memberCountFromUsers(dept.id, users)
  return Math.max(fromApi, fromDirectory)
}

function DepartmentsGrid({
  departments,
  users,
}: {
  departments: Department[]
  users: AdminUser[]
}) {
  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <BuildingIcon className="h-10 w-10 opacity-20" />
        <p className="text-sm">No departments yet. Create one using the button above.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => {
        const members = resolvedMemberCount(dept, users)
        return (
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
                <span>
                  {members} member{members !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default async function DepartmentsPage() {
  const [departments, users] = await Promise.all([getDepartments(), getUsers()])

  return (
    <CatalogPageLayout
      guideId="departments"
      showTrainingFlow={false}
      count={departments.length}
      countLabel="department"
      helpDefaultOpen={departments.length === 0}
      action={
        <CreateDepartmentModal
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          }
        />
      }
    >
      <DepartmentsGrid departments={departments} users={users} />
    </CatalogPageLayout>
  )
}
