'use client'

/**
 * components/admin/esignature-table.tsx
 *
 * Client table for the e-signature ledger.
 * - Read-only (no mutations exist server-side).
 * - "Verify" calls `verifyEsignature(id)` and surfaces the result inline +
 *   via a toast. Result chips persist until the next verify on that row.
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  BadgeCheckIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  Loader2Icon,
  AlertCircleIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { verifyEsignature } from '@/lib/actions/esignatures'
import {
  getCreatedAt,
  getMeaning,
  getSigner,
  getTarget,
  isVerificationValid,
  type ESignatureRecord,
  type ESignatureVerifyResult,
} from '@/types/esignatures'

interface Props {
  records: ESignatureRecord[]
  /** Show informational header chip if the server returned an error. */
  error?: string | null
}

type VerifyState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'done'; valid: boolean; message?: string | null }
  | { status: 'error'; message: string }

export function ESignatureTable({ records, error }: Props) {
  const [verifications, setVerifications] = useState<
    Record<string, VerifyState>
  >({})
  const [, startTransition] = useTransition()

  const runVerify = (rec: ESignatureRecord) => {
    setVerifications((prev) => ({ ...prev, [rec.id]: { status: 'pending' } }))
    startTransition(async () => {
      const result = await verifyEsignature(rec.id)
      if (result.error || !result.data) {
        const msg = result.error ?? 'Verification failed.'
        setVerifications((prev) => ({
          ...prev,
          [rec.id]: { status: 'error', message: msg },
        }))
        toast.error(msg)
        return
      }
      const v = result.data as ESignatureVerifyResult
      const valid = isVerificationValid(v)
      setVerifications((prev) => ({
        ...prev,
        [rec.id]: {
          status: 'done',
          valid,
          message: v.message ?? v.reason ?? null,
        },
      }))
      toast[valid ? 'success' : 'error'](
        valid
          ? `Signature verified for ${rec.id.slice(0, 8)}…`
          : `Signature integrity check FAILED for ${rec.id.slice(0, 8)}…`,
      )
    })
  }

  if (error && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <AlertCircleIcon className="h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">E-signature ledger unavailable.</p>
        <p className="text-xs opacity-80">{error}</p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <ShieldCheckIcon className="h-8 w-8 opacity-30" />
        <p className="text-sm">No e-signature records yet.</p>
        <p className="text-[11px] opacity-80">
          Records appear here when an admin/trainer e-signs a regulated action
          (status change, unlock, quiz submission, etc.).
        </p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="flex items-start gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Signer</TableHead>
            <TableHead>Meaning</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec) => {
            const signer = getSigner(rec)
            const meaning = getMeaning(rec)
            const { type: targetType, id: targetId } = getTarget(rec)
            const target =
              targetType && targetId
                ? `${targetType} · ${targetId.slice(0, 8)}…`
                : targetType ?? targetId ?? '—'
            const verify = verifications[rec.id] ?? { status: 'idle' }
            const iso = getCreatedAt(rec)
            const when = iso ? new Date(iso).toLocaleString() : '—'

            return (
              <TableRow key={rec.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {when}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {signer?.name ?? '—'}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {signer?.employeeId ?? signer?.email ?? signer?.role ?? ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{meaning}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {target}
                </TableCell>
                <TableCell>
                  {verify.status === 'idle' && (
                    <Badge
                      variant="outline"
                      className="border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                    >
                      Not checked
                    </Badge>
                  )}
                  {verify.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                      Verifying
                    </span>
                  )}
                  {verify.status === 'done' && (
                    <Badge
                      variant="outline"
                      className={
                        verify.valid
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      }
                    >
                      {verify.valid ? (
                        <BadgeCheckIcon className="mr-1 h-3 w-3" />
                      ) : (
                        <ShieldAlertIcon className="mr-1 h-3 w-3" />
                      )}
                      {verify.valid ? 'Valid' : 'Invalid'}
                      {verify.message ? ` · ${verify.message}` : ''}
                    </Badge>
                  )}
                  {verify.status === 'error' && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      Error · {verify.message}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runVerify(rec)}
                    disabled={verify.status === 'pending'}
                  >
                    {verify.status === 'pending' ? (
                      <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheckIcon className="mr-1 h-3.5 w-3.5" />
                    )}
                    Verify
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
