'use client'

/**
 * components/admin/sop-filters.tsx
 *
 * URL-driven filter bar for SOP lists. Shared between:
 *  - `/dashboard/sops`            (admin/trainer view — all statuses)
 *  - `/my-trainings/library`      (employee view — DRAFT/UNDER_REVIEW hidden)
 *
 * Server pages read `searchParams` and pass `{ search, status, category }`
 * into `getSOPs(...)` / `getAllSops(...)`. This component owns nothing but
 * the URL.
 */

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, SearchIcon, XIcon } from 'lucide-react'

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
import type { SopStatus } from '@/types/admin'

interface SopFiltersProps {
  /** Categories shown as chips. Pass [] to hide the chip row. */
  categories: string[]
  /**
   * Which statuses to expose in the dropdown. Defaults to all four lifecycle
   * states — the library passes a reduced list.
   */
  statusOptions?: { value: SopStatus | 'ALL'; label: string }[]
  /** Placeholder for the search box. */
  searchPlaceholder?: string
}

const DEFAULT_STATUSES: { value: SopStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export function SopFilters({
  categories,
  statusOptions = DEFAULT_STATUSES,
  searchPlaceholder = 'Title contains…',
}: SopFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('search') ?? '')
  const status = (params.get('status') ?? 'ALL') as SopStatus | 'ALL'
  const activeCategory = params.get('category') ?? ''

  // Keep local search in sync if the URL is cleared externally.
  useEffect(() => {
    setSearch(params.get('search') ?? '')
  }, [params])

  const apply = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString())
    mutate(next)
    // Filter change → back to first page when paging exists.
    if (next.has('page')) next.set('page', '1')
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

  const setCategory = (value: string) => {
    apply((next) => {
      if (!value || value === activeCategory) next.delete('category')
      else next.set('category', value)
    })
  }

  const hasFilters =
    !!params.get('search') ||
    !!params.get('status') ||
    !!params.get('category')

  const clearAll = () => {
    apply((next) => {
      next.delete('search')
      next.delete('status')
      next.delete('category')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sop-filter-status" className="text-xs">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus} disabled={pending}>
            <SelectTrigger id="sop-filter-status" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
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
          <Label htmlFor="sop-filter-search" className="text-xs">
            Search
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sop-filter-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-[240px] pl-8"
                disabled={pending}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </form>

        {hasFilters ? (
          <div className="ml-auto flex flex-col gap-1.5">
            <Label className="text-xs invisible">_</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearAll}
              disabled={pending}
            >
              <XIcon className="mr-1 h-4 w-4" /> Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
            Category
          </span>
          {categories.map((c) => {
            const active = c === activeCategory
            return (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setCategory(c)}
                disabled={pending}
              >
                {c}
                {active ? <XIcon className="ml-1 h-3 w-3" /> : null}
              </Button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
