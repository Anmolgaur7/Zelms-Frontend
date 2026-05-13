import { cn } from '@/lib/utils'

/**
 * Skeleton — uses the `.shimmer` utility from globals.css for a premium-feeling
 * loading state. Falls back gracefully when `prefers-reduced-motion: reduce`
 * (the global media query disables the shimmer animation).
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shimmer rounded-md bg-muted/70', className)}
      {...props}
    />
  )
}

export { Skeleton }
