/**
 * app/dashboard/users/page.tsx
 *
 * User management table — Admin / Super Admin only.
 * Shows all tenant users with role, email (nullable → "—"), and employee ID.
 */

import Link from 'next/link'
import { getUsers } from '@/lib/actions/admin'
import { getSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PlusIcon, UsersIcon, UploadIcon, ShieldCheckIcon } from 'lucide-react'
import { CreateUserModal } from '@/components/modals/create-user-modal'
import { UserRoleDialog } from '@/components/admin/user-role-dialog'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'

export const metadata = { title: 'Users' }

// ─── Role badge colours ───────────────────────────────────────────────────────
const ROLE_COLOURS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  ADMIN:       'bg-blue-100 text-blue-700 border-blue-200',
  TRAINER:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  EMPLOYEE:    'bg-slate-100 text-slate-700 border-slate-200',
  AUDITOR:     'bg-amber-100 text-amber-700 border-amber-200',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Admin',
  TRAINER:     'Trainer',
  EMPLOYEE:    'Employee',
  AUDITOR:     'Auditor',
}

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), getSession()])
  const actorRole = session?.role ?? 'ADMIN'
  const actorEmployeeId = session?.employeeId ?? null
  const isActorSuperAdmin = actorRole === 'SUPER_ADMIN'

  return (
    <CatalogPageLayout
      guideId="users"
      showTrainingFlow={false}
      count={users.length}
      countLabel="account"
      helpDefaultOpen={users.length === 0}
      action={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/users/bulk">
              <UploadIcon className="mr-2 h-4 w-4" />
              Bulk Import
            </Link>
          </Button>
          <CreateUserModal
            trigger={
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add User
              </Button>
            }
          />
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            All Users
          </CardTitle>
          <CardDescription>
            Temporary passwords are only shown once at creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <UsersIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">No users yet.</p>
              <CreateUserModal
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="mr-2 h-4 w-4" /> Create your first user
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {user.employeeId}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {user.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                          ROLE_COLOURS[user.role] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.email ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.department?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const isSelf =
                          actorEmployeeId !== null &&
                          user.employeeId === actorEmployeeId
                        const isProtected =
                          user.role === 'SUPER_ADMIN' && !isActorSuperAdmin

                        if (isSelf) {
                          return (
                            <span
                              className="text-[11px] text-muted-foreground"
                              title="You cannot change your own role"
                            >
                              You
                            </span>
                          )
                        }
                        if (isProtected) {
                          return (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-not-allowed opacity-40"
                              disabled
                              aria-label="Only a Super Admin can change this role"
                              title="Only a Super Admin can change this account"
                            >
                              <ShieldCheckIcon className="h-4 w-4" />
                            </Button>
                          )
                        }
                        return (
                          <UserRoleDialog
                            userId={user.id}
                            userName={user.name}
                            currentRole={user.role}
                            actorRole={actorRole}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Change role"
                              >
                                <ShieldCheckIcon className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </CatalogPageLayout>
  )
}
