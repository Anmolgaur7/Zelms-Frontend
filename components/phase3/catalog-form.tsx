'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export function CatalogField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function CatalogEmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function CatalogFormActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t pt-4 mt-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
