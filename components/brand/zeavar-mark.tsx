import { cn } from '@/lib/utils'

const WHEEL = '/wheellogo.png'
const WORDMARK = '/mainlogo.png'

type ZeavarWordmarkProps = {
  className?: string
  size?: 'auth' | 'compact' | 'hero'
}

export function ZeavarWordmark({
  className,
  size = 'auth',
}: ZeavarWordmarkProps) {
  const wheelWrap = cn(
    'relative flex shrink-0 items-center justify-center',

    size === 'hero' &&
      'h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48',      // was h-16/20/24 → 2×

    size === 'auth' &&
      'h-24 w-24 sm:h-28 sm:w-28',                         // was h-12/14 → 2×

    size === 'compact' && 'h-16 w-16',                      // was h-8 → 2×
  )

  const wheelPx =
    size === 'hero' ? 192 : size === 'auth' ? 112 : 64     // was 96 / 56 / 32 → 2×

  const wordmark = cn(
    'w-auto object-contain object-left',

    size === 'hero' &&
      'h-48 max-h-56 max-w-[min(96vw,1440px)] sm:h-56 sm:max-h-64 sm:max-w-[min(90vw,1720px)] lg:h-64 lg:max-h-72 lg:max-w-[min(60vw,2000px)]',
    // was h-24/28/32 → 2×

    size === 'auth' &&
      'h-32 max-h-40 max-w-[min(90vw,960px)] sm:h-40 sm:max-h-48',
    // was h-16/20 → 2×

    size === 'compact' &&
      'h-20 max-h-24 max-w-[600px]',
    // was h-10/12 → 2×
  )

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        size === 'hero'
          ? '-space-x-2 sm:-space-x-3 lg:-space-x-4'
          : '-space-x-2',
        className,
      )}
      role="img"
      aria-label="ZEAVAR"
    >
      <div className={wheelWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WHEEL}
          alt=""
          width={wheelPx}
          height={wheelPx}
          className="h-full w-full object-contain motion-safe:animate-zeavar-wheel-once"
          aria-hidden
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WORDMARK}
        alt="ZEAVAR"
        width={size === 'hero' ? 2000 : 960}
        height={size === 'hero' ? 288 : 160}
        className={wordmark}
      />
    </div>
  )
}

type ZeavarWheelProps = {
  className?: string
  animate?: boolean
  alt: string
}

export function ZeavarWheel({
  className,
  animate = true,
  alt,
}: ZeavarWheelProps) {
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