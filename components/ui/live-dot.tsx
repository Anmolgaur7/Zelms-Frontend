'use client'

/**
 * components/ui/live-dot.tsx
 *
 * Phase 8 — subtle “live data” affordance for auto-refreshing surfaces
 * (notification bell, future dashboards).
 */

export function LiveDot({
  label = 'Live',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-[11px] text-muted-foreground',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  )
}
