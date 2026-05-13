'use client'

/**
 * components/admin/assignment-filters.tsx
 *
 * URL-driven filter bar for `/dashboard/assignments`. Reads from `useSearchParams`
 * and pushes new params via `router.push` so the server component re-renders.
 *
 * Why a dedicated component: server components can't own form state; we keep
 * pagination + filtering reactive without giving up server-side data fetching.
 */

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FilterIcon, Loader2, SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export function AssignmentFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('search') ?? '')
  const status = (params.get('status') ?? 'ALL') as AssignmentStatus | 'ALL'
  const overdueOnly = params.get('overdueOnly') === 'true'

  // Reset local search when the URL is changed externally (e.g. a "Clear" click).
  useEffect(() => {
    setSearch(params.get('search') ?? '')
  }, [params])

  const apply = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString())
    mutate(next)
    // Any filter change → back to page 1.
    next.set('page', '1')
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  const onSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    apply((next) => {
      const trimmed = search.trim()
      if (trimmed) next.set('search', trimmed)
      else next.delete('search')
    })
  }

  const setStatus = (value: string) => {
    apply((next) => {
      if (value === 'ALL') next.delete('status')
      else next.set('status', value)
    })
  }

  const toggleOverdue = () => {
    apply((next) => {
      if (overdueOnly) next.delete('overdueOnly')
      else next.set('overdueOnly', 'true')
    })
  }

  const hasFilters =
    !!params.get('search') ||
    !!params.get('status') ||
    params.get('overdueOnly') === 'true' ||
    !!params.get('userId') ||
    !!params.get('sopId') ||
    !!params.get('quizId')

  const clearAll = () => {
    apply((next) => {
      next.delete('search')
      next.delete('status')
      next.delete('overdueOnly')
      next.delete('userId')
      next.delete('sopId')
      next.delete('quizId')
      next.delete('assignmentId')
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-status" className="text-xs">
          Status
        </Label>
        <Select value={status} onValueChange={setStatus} disabled={isPending}>
          <SelectTrigger id="filter-status" className="w-[180px]">
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

      <form
        className="flex flex-col gap-1.5"
        onSubmit={onSubmitSearch}
        role="search"
      >
        <Label htmlFor="filter-search" className="text-xs">
          Search trainee
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="filter-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name contains…"
              className="w-[220px] pl-8"
              disabled={isPending}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs invisible">_</Label>
        <Button
          type="button"
          size="sm"
          variant={overdueOnly ? 'default' : 'outline'}
          onClick={toggleOverdue}
          disabled={isPending}
        >
          <FilterIcon className="mr-2 h-4 w-4" />
          Overdue only
        </Button>
      </div>

      {hasFilters && (
        <div className="ml-auto flex flex-col gap-1.5">
          <Label className="text-xs invisible">_</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearAll}
            disabled={isPending}
          >
            <XIcon className="mr-1 h-4 w-4" /> Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
