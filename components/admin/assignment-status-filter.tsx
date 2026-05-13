'use client'

/**
 * components/admin/assignment-status-filter.tsx
 *
 * Tiny URL-driven status dropdown used on the trainee dossier page.
 * Kept separate from <AssignmentFilters /> so the dossier doesn't pull in the
 * trainee-name search box (the dossier is already scoped to one trainee).
 */

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AssignmentStatus } from '@/types/admin'

const STATUSES: { value: AssignmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'LOCKED_OUT', label: 'Locked out' },
]

export function AssignmentStatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = (params.get('status') ?? 'ALL') as AssignmentStatus | 'ALL'

  const setStatus = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === 'ALL') next.delete('status')
    else next.set('status', value)
    // Status change resets pagination.
    next.set('page', '1')
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="dossier-status" className="text-xs">
        Filter by status
      </Label>
      <Select value={current} onValueChange={setStatus} disabled={isPending}>
        <SelectTrigger id="dossier-status" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
