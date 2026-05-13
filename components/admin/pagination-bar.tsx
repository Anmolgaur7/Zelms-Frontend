'use client'

/**
 * components/admin/pagination-bar.tsx
 *
 * Lightweight Prev/Next pagination tied to the `?page=` URL param.
 * Pairs with any server component that consumes `searchParams.page`.
 */

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from 'lucide-react'

interface Props {
  page: number
  /** Items shown on the current page (so we know if a "next" page exists). */
  pageCount: number
  /** Items requested per page (the same `limit` you sent to the API). */
  limit: number
  /** Total rows across all pages, when the server returns it. */
  total?: number
}

export function PaginationBar({ page, pageCount, limit, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const goTo = (next: number) => {
    const nextParams = new URLSearchParams(params.toString())
    nextParams.set('page', String(next))
    startTransition(() => router.push(`${pathname}?${nextParams.toString()}`))
  }

  const totalPages =
    typeof total === 'number' && total > 0 ? Math.max(1, Math.ceil(total / limit)) : null
  const canGoBack = page > 1
  const canGoNext = totalPages ? page < totalPages : pageCount === limit

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = (page - 1) * limit + pageCount

  return (
    <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
      <div>
        {typeof total === 'number' ? (
          <>
            Showing <span className="font-medium text-foreground">{rangeStart}</span>–
            <span className="font-medium text-foreground">{rangeEnd}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            Page <span className="font-medium text-foreground">{page}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack || isPending}
          onClick={() => goTo(page - 1)}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext || isPending}
          onClick={() => goTo(page + 1)}
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
