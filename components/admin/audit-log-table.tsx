'use client'

/**
 * components/admin/audit-log-table.tsx
 *
 * Renders a paginated audit feed with a per-row "View" action that opens a
 * dialog showing the full record + a "Verify integrity" button (calls
 * /api/audit/:id/verify).
 */

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  Loader2,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'

import { verifyAuditEntry } from '@/lib/actions/admin'
import type {
  AuditLogEntry,
  AuditLogFeed,
  AuditLogVerification,
} from '@/types/admin'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AuditLogTableProps {
  feed: AuditLogFeed
}

const ACTION_COLOURS: Record<string, string> = {
  CREATED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UPDATED: 'bg-sky-100 text-sky-700 border-sky-200',
  DELETED: 'bg-rose-100 text-rose-700 border-rose-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SUBMITTED: 'bg-amber-100 text-amber-700 border-amber-200',
  PASSED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
  STATUS_CHANGED: 'bg-purple-100 text-purple-700 border-purple-200',
}

function actionColour(action: string | undefined | null): string {
  if (!action || typeof action !== 'string') {
    return 'bg-muted text-muted-foreground'
  }
  // Match on the last suffix segment (e.g. SOP_STATUS_CHANGED → STATUS_CHANGED).
  for (const key of Object.keys(ACTION_COLOURS)) {
    if (action.endsWith(key)) return ACTION_COLOURS[key]
  }
  return 'bg-muted text-muted-foreground'
}

function formatAuditWhen(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export function AuditLogTable({ feed }: AuditLogTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selected, setSelected] = useState<AuditLogEntry | null>(null)
  const [verification, setVerification] = useState<AuditLogVerification | null>(
    null,
  )
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isVerifying, startVerify] = useTransition()

  const { logs: rawLogs, page, limit, total, hasMore } = feed
  const logs = Array.isArray(rawLogs) ? rawLogs : []
  const computedHasMore =
    typeof hasMore === 'boolean'
      ? hasMore
      : typeof total === 'number'
      ? page * limit < total
      : logs.length === limit
  const canGoBack = page > 1

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(next))
    params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  const openDetails = (entry: AuditLogEntry) => {
    setSelected(entry)
    setVerification(null)
    setVerifyError(null)
  }

  const handleVerify = () => {
    if (!selected) return
    setVerifyError(null)
    setVerification(null)
    startVerify(async () => {
      const result = await verifyAuditEntry(selected.id)
      if (result.error || !result.data) {
        const msg = result.error ?? 'Could not verify entry.'
        setVerifyError(msg)
        toast.error(msg)
        return
      }
      setVerification(result.data)
      const ok = result.data.valid === true
      toast[ok ? 'success' : 'error'](
        ok ? 'Hash chain intact.' : 'Integrity check failed.',
      )
    })
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <ShieldCheckIcon className="h-10 w-10 opacity-20" />
        <p className="text-sm">No audit events yet.</p>
        <p className="text-xs">
          Privileged mutations (user create, SOP upload, assignments, quiz
          submissions) appear here as the system is used.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((entry) => {
            const actor = entry.user ?? entry.actor ?? null
            return (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatAuditWhen(entry.createdAt)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${actionColour(
                      entry.action,
                    )}`}
                  >
                    {entry.action ?? 'UNKNOWN'}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">
                    {actor?.name ?? actor?.employeeId ?? '—'}
                  </div>
                  {actor?.role && (
                    <div className="text-xs text-muted-foreground">
                      {actor.role}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{entry.targetType ?? '—'}</div>
                  {entry.targetId && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {entry.targetId}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetails(entry)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" /> View
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <div>
          Page <span className="font-medium text-foreground">{page}</span>
          {typeof total === 'number' && (
            <> · {total} event{total === 1 ? '' : 's'} total</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoBack}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeftIcon className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!computedHasMore}
            onClick={() => goToPage(page + 1)}
          >
            Next <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              Audit entry
            </DialogTitle>
            <DialogDescription>
              {selected ? formatAuditWhen(selected.createdAt) : null}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-1 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <KV label="Action" value={selected.action ?? '—'} />
                <KV label="Entry ID" value={selected.id} mono />
                <KV label="Target" value={selected.targetType ?? '—'} />
                <KV
                  label="Target ID"
                  value={selected.targetId ?? '—'}
                  mono={!!selected.targetId}
                />
                <KV
                  label="Actor"
                  value={
                    selected.user?.name ?? selected.actor?.name ?? '—'
                  }
                />
                <KV
                  label="Role"
                  value={
                    selected.user?.role ?? selected.actor?.role ?? '—'
                  }
                />
                <KV label="IP" value={selected.ip ?? '—'} />
                <KV
                  label="User-agent"
                  value={selected.userAgent ?? '—'}
                  truncate
                />
              </div>

              {selected.reason && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Reason
                  </p>
                  <p className="text-sm">{selected.reason}</p>
                </div>
              )}

              {(selected.metadata || selected.details) && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Payload
                  </p>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(
                      selected.metadata ?? selected.details,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}

              {(selected.hash || selected.previousHash) && (
                <div className="grid grid-cols-1 gap-2">
                  <KV
                    label="Hash"
                    value={selected.hash ?? '—'}
                    mono
                    truncate
                  />
                  <KV
                    label="Previous hash"
                    value={selected.previousHash ?? '—'}
                    mono
                    truncate
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="mr-2 h-4 w-4" /> Verify integrity
                    </>
                  )}
                </Button>

                {verification && (
                  <Badge
                    variant="outline"
                    className={
                      verification.valid === true
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-rose-300 bg-rose-50 text-rose-700'
                    }
                  >
                    {verification.valid === true ? (
                      <>
                        <ShieldCheckIcon className="mr-1 h-3 w-3" /> Chain
                        intact
                      </>
                    ) : (
                      <>
                        <ShieldAlertIcon className="mr-1 h-3 w-3" /> Mismatch
                      </>
                    )}
                  </Badge>
                )}
              </div>

              {verification?.message && (
                <p className="text-xs text-muted-foreground">
                  {verification.message}
                </p>
              )}
              {verifyError && (
                <p className="text-xs text-destructive">{verifyError}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function KV({
  label,
  value,
  mono,
  truncate,
}: {
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={[
          'text-sm',
          mono ? 'font-mono break-all' : '',
          truncate ? 'truncate' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  )
}
