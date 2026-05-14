import {
  ShieldCheck,
  FileCheck2,
  Users2,
} from 'lucide-react'

import { ZeavarWordmark } from '@/components/brand/zeavar-mark'
import { cn } from '@/lib/utils'

export function AuthMarketingPanel({
  className,
}: {
  className?: string
}) {
  return (
    <aside
      className={cn(
        'relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0F0E17] via-[#1C1838] to-[#2D2660] px-10 py-10 text-white lg:px-12',
        className,
      )}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -left-24 -top-48 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(91,78,232,0.35)_0%,transparent_70%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(130,80,255,0.18)_0%,transparent_70%)]"
        aria-hidden
      />

      {/* Logo */}
      <div className="relative z-[1] [&_img]:brightness-0 [&_img]:invert">
        <ZeavarWordmark size="compact" className="justify-start gap-2" />
      </div>

      {/* Main Content */}
      <div className="relative z-[1] flex-1 py-10">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5B4EE855] bg-[#5B4EE822] px-3 py-1.5 text-xs font-medium tracking-wide text-[#B8B3FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7B6EFF]" />
          Trusted by pharma training teams
        </div>

        {/* Heading */}
        <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight lg:text-[2.7rem]">
          Train smarter.
          <br />
          <span className="text-[#8B7FFF]">
            Stay compliant.
          </span>
          <br />
          Scale with confidence.
        </h1>

        {/* Description */}
        <p className="mt-5 max-w-md text-[0.96rem] leading-relaxed text-white/55">
          Centralize onboarding, SOPs, certifications,
          and compliance tracking in one secure
          pharmaceutical learning platform.
        </p>

        {/* Compact Stats */}
        <div className="mt-8 flex flex-wrap gap-8">
          <div>
            <div className="text-2xl font-bold text-white">
              GxP
            </div>
            <div className="text-xs text-white/40">
              Compliance-ready
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-white">
              Audit
            </div>
            <div className="text-xs text-white/40">
              Full activity trails
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-white">
              Multi-team
            </div>
            <div className="text-xs text-white/40">
              Roles & permissions
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#A89DFF]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Compliance Tracking
              </h3>

              <p className="mt-1 text-sm text-white/45">
                Training records, attestations, and audit history in one place.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#A89DFF]">
              <FileCheck2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                SOP Management
              </h3>

              <p className="mt-1 text-sm text-white/45">
                Assign SOPs, quizzes, and certifications seamlessly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#A89DFF]">
              <Users2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Team Learning
              </h3>

              <p className="mt-1 text-sm text-white/45">
                Organize training across departments and facilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <figure className="relative z-[1] rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md">
        <blockquote className="text-sm italic leading-relaxed text-white/70">
          “Zeavar significantly reduced our manual compliance tracking and made audits far easier to manage.”
        </blockquote>

        <figcaption className="mt-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7B6EFF] to-[#5B4EE8] text-xs font-semibold">
            LM
          </div>

          <div>
            <div className="text-sm font-medium text-white/85">
              Lauren Morgan
            </div>

            <div className="text-xs text-white/40">
              QA Lead · Example Pharma
            </div>
          </div>
        </figcaption>
      </figure>
    </aside>
  )
}