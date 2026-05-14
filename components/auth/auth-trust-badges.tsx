import { Lock, ShieldCheck, FileCheck2 } from 'lucide-react'

/**
 * Compact trust row for auth footers (mirrors reference login badges).
 */
export function AuthTrustBadges() {
  return (
    <div
      className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border pt-6 text-[11px] text-muted-foreground"
      aria-label="Security and compliance highlights"
    >
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>SOC 2 aligned controls</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>HIPAA-ready posture</span>
      </div>
      <div className="flex items-center gap-1.5">
        <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>21 CFR Part 11 alignment</span>
      </div>
    </div>
  )
}
