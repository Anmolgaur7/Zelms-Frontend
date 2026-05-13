/**
 * app/dashboard/audit/page.tsx
 *
 * Tenant audit feed. Server fetches a page, the client component handles
 * pagination + the detail dialog. Page/limit live in the URL so refresh +
 * deep-linking keep working.
 */

import { getAuditFeed } from '@/lib/actions/admin'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ShieldCheckIcon } from 'lucide-react'

export const metadata = { title: 'Audit Log' }

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function parseIntInRange(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseIntInRange(params.page, 1, 1, 10_000)
  const limit = parseIntInRange(params.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)

  const feed = await getAuditFeed({ page, limit })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cryptographically chained record of every privileged action in your
          tenant. Use the detail dialog to verify integrity.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
            Company events
          </CardTitle>
          <CardDescription>
            Showing up to {limit} events per page. Older entries are paginated.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AuditLogTable feed={feed} />
        </CardContent>
      </Card>
    </div>
  )
}
