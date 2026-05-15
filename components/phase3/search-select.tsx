'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type SearchSelectItem = {
  value: string
  label: string
  description?: string
  keywords?: string
}

export function SearchSelect({
  value,
  onValueChange,
  items,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches.',
  loading = false,
  disabled = false,
  className,
}: {
  value?: string
  onValueChange: (value: string) => void
  items: SearchSelectItem[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = items.find((i) => i.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'h-10 w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </span>
            ) : selected ? (
              selected.label
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.description ?? ''} ${item.keywords ?? ''}`}
                  onSelect={() => {
                    onValueChange(item.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Load tenant users client-side (reliable after hydration). */
export function useTenantUsers() {
  const [users, setUsers] = useState<SearchSelectItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    import('@/lib/actions/admin').then(({ getUsers }) => {
      getUsers()
        .then((rows) => {
          if (cancelled) return
          const items = rows
            .filter((u) => u.isActive !== false)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((u) => ({
              value: u.id,
              label: `${u.name} · ${u.employeeId}`,
              description: [
                u.department?.name,
                u.role?.replace(/_/g, ' '),
              ]
                .filter(Boolean)
                .join(' · '),
              keywords: `${u.email ?? ''} ${u.employeeId}`,
            }))
          setUsers(items)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { users, loading }
}

export function useTenantDepartments() {
  const [departments, setDepartments] = useState<SearchSelectItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    import('@/lib/actions/admin').then(({ getDepartments }) => {
      getDepartments()
        .then((rows) => {
          if (cancelled) return
          setDepartments(
            rows
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((d) => ({
                value: d.id,
                label: d.name,
                description:
                  typeof d._count?.users === 'number'
                    ? `${d._count.users} user${d._count.users === 1 ? '' : 's'}`
                    : undefined,
              })),
          )
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { departments, loading }
}

export function coursesToSelectItems(
  courses: { id: string; name: string; sop?: { title?: string } | null }[],
): SearchSelectItem[] {
  return courses.map((c) => ({
    value: c.id,
    label: c.name,
    description: c.sop?.title ? `SOP: ${c.sop.title}` : undefined,
  }))
}
