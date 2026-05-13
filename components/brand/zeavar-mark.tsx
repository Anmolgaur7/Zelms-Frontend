import { cn } from '@/lib/utils'

const WHEEL = '/wheellogo.png'
const WORDMARK = '/mainlogo.png'

type ZeavarWordmarkProps = {
  className?: string
  /** Wheel + wordmark size preset */
  size?: 'auth' | 'compact'
}

/**
 * Full ZEAVAR mark: wheel (left) + wordmark (right), aligned like the brand lockup.
 * Wheel runs a single 360° spin on load (respects prefers-reduced-motion).
 */
export function ZeavarWordmark({ className, size = 'auth' }: ZeavarWordmarkProps) {
  const isAuth = size === 'auth'

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1.5 sm:gap-2.5',
        className,
      )}
      role="img"
      aria-label="ZEAVAR"
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center',
          isAuth ? 'h-14 w-14 sm:h-[4.25rem] sm:w-[4.25rem]' : 'h-10 w-10',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- public static assets */}
        <img
          src={WHEEL}
          alt=""
          width={isAuth ? 68 : 40}
          height={isAuth ? 68 : 40}
          className="h-full w-full object-contain motion-safe:animate-zeavar-wheel-once"
          aria-hidden
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WORDMARK}
        alt="ZEAVAR"
        width={280}
        height={48}
        className={cn(
          'w-auto object-contain object-left',
          isAuth
            ? 'h-9 max-h-10 max-w-[min(72vw,280px)] sm:h-11 sm:max-h-12'
            : 'h-7 max-h-8 max-w-[200px]',
        )}
      />
    </div>
  )
}

type ZeavarWheelProps = {
  className?: string
  /** Single spin on mount */
  animate?: boolean
  alt: string
}

export function ZeavarWheel({ className, animate = true, alt }: ZeavarWheelProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={WHEEL}
      alt={alt}
      width={48}
      height={48}
      className={cn(
        'object-contain',
        animate && 'motion-safe:animate-zeavar-wheel-once',
        className,
      )}
    />
  )
}
