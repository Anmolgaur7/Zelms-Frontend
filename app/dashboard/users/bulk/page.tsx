/**
 * app/dashboard/users/bulk/page.tsx
 *
 * Bulk user import — paste CSV or JSON, preview, submit to
 * /api/admin/users/bulk, then download the one-time credentials CSV.
 *
 * Server-side here only prefetches departments so the picker is hydrated; the
 * heavy lifting lives in <BulkUserUpload>.
 */

import Link from 'next/link'
import { ArrowLeftIcon, FileSpreadsheetIcon } from 'lucide-react'

import { getDepartments } from '@/lib/actions/admin'
import { BulkUserUpload } from '@/components/admin/bulk-user-upload'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Bulk Import Users' }

export default async function BulkUserImportPage() {
  const departments = await getDepartments()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bulk import users
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create many accounts at once. Each row returns a one-time temporary
            password — download the CSV before leaving this page.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/users">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to users
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileSpreadsheetIcon className="h-4 w-4 text-muted-foreground" />
            Import payload
          </CardTitle>
          <CardDescription>
            Paste a CSV or JSON list, or upload a file. Email is optional (omit
            for floor workers). Employee IDs auto-assign when blank.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkUserUpload departments={departments} />
        </CardContent>
      </Card>
    </div>
  )
}
