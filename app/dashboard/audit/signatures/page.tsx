/**
 * app/dashboard/audit/signatures/page.tsx
 *
 * E-signature ledger. Read-only view backed by `/api/esignatures/`.
 * Role gating is done in the sidebar; the backend additionally enforces
 * permission on the API itself, so unauthorised access falls back to a
 * friendly empty state.
 */

import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react'

import { listEsignatures } from '@/lib/actions/esignatures'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ESignatureTable } from '@/components/admin/esignature-table'

export const metadata = { title: 'E-signature ledger' }

export default async function ESignaturesPage() {
  const { records, error } = await listEsignatures()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            E-signature ledger
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every privileged action that required a password re-auth is
            recorded here. Use <span className="font-medium">Verify</span> to
            confirm a single record against the cryptographic chain.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/dashboard/audit">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to audit log
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
            Recorded signatures
          </CardTitle>
          <CardDescription>
            {records.length === 0
              ? 'No signatures captured yet.'
              : `${records.length} record${records.length === 1 ? '' : 's'} on file.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ESignatureTable records={records} error={error ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}
