'use client'

/**
 * components/app-sidebar.tsx
 *
 * Client component — uses pathname to highlight the active nav item and
 * apply a smooth pill transition. Role filtering still happens here using
 * the session passed from the server layout.
 *
 * Roles: SUPER_ADMIN, ADMIN, TRAINER, EMPLOYEE, AUDITOR
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  ShieldCheckIcon,
  StampIcon,
  SettingsIcon,
  BookOpenIcon,
  AwardIcon,
  ActivityIcon,
  AlertTriangleIcon,
  TargetIcon,
  LayersIcon,
  GraduationCapIcon,
  CalendarRangeIcon,
  BriefcaseIcon,
  BadgeCheckIcon,
  MapIcon,
} from 'lucide-react'

import { ZeavarWheel } from '@/components/brand/zeavar-mark'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { SessionUser, UserRole } from '@/types/auth'

// ─── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  roles: UserRole[]   // empty = all roles
  section: string
}

const NAV_SECTION_ORDER = [
  'Overview',
  'Organization',
  'Content & training',
  'Analytics',
  'Audit & records',
  'Administration',
  'My learning',
] as const

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Overview',
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: UsersIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    section: 'Organization',
  },
  {
    title: 'Departments',
    url: '/dashboard/departments',
    icon: BuildingIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    section: 'Organization',
  },
  {
    title: 'Start here',
    url: '/dashboard/training-setup',
    icon: MapIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'SOPs',
    url: '/dashboard/sops',
    icon: FileTextIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Assignments',
    url: '/dashboard/assignments',
    icon: ClipboardCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
    section: 'Content & training',
  },
  {
    title: 'Courses',
    url: '/dashboard/courses',
    icon: BookOpenIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Course groups',
    url: '/dashboard/course-groups',
    icon: LayersIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
    section: 'Content & training',
  },
  {
    title: 'Induction',
    url: '/dashboard/induction',
    icon: GraduationCapIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Training plans',
    url: '/dashboard/training-plans',
    icon: CalendarRangeIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Job descriptions',
    url: '/dashboard/job-descriptions',
    icon: BriefcaseIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Qualifications',
    url: '/dashboard/qualifications',
    icon: BadgeCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Content & training',
  },
  {
    title: 'Compliance',
    url: '/dashboard/analytics/compliance',
    icon: ActivityIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Analytics',
  },
  {
    title: 'Risk',
    url: '/dashboard/analytics/risk',
    icon: AlertTriangleIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
    section: 'Analytics',
  },
  {
    title: 'SOP Difficulty',
    url: '/dashboard/analytics/sop-difficulty',
    icon: TargetIcon,
    // Backend: ADMIN | TRAINER (SUPER_ADMIN treated as full admin).
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
    section: 'Analytics',
  },
  {
    title: 'Audit Log',
    url: '/dashboard/audit',
    icon: ShieldCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
    section: 'Audit & records',
  },
  {
    title: 'E-Signatures',
    url: '/dashboard/audit/signatures',
    icon: StampIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
    section: 'Audit & records',
  },
  {
    title: 'Company Settings',
    url: '/dashboard/company',
    icon: SettingsIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    section: 'Administration',
  },
  {
    title: 'My Trainings',
    url: '/my-trainings',
    icon: ClipboardCheckIcon,
    roles: ['EMPLOYEE'],
    section: 'My learning',
  },
  {
    title: 'SOP Library',
    url: '/my-trainings/library',
    icon: BookOpenIcon,
    roles: ['EMPLOYEE'],
    section: 'My learning',
  },
  {
    title: 'Certificates',
    url: '/my-trainings/certificates',
    icon: AwardIcon,
    roles: ['EMPLOYEE'],
    section: 'My learning',
  },
  {
    title: 'My induction',
    url: '/my-trainings/induction',
    icon: GraduationCapIcon,
    roles: ['EMPLOYEE'],
    section: 'My learning',
  },
  {
    title: 'My qualifications',
    url: '/my-trainings/qualifications',
    icon: BadgeCheckIcon,
    roles: ['EMPLOYEE'],
    section: 'My learning',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function AppSidebar({
  session,
  companyName,
  logoUrl,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: SessionUser
  companyName?: string | null
  logoUrl?: string | null
}) {
  const pathname = usePathname() ?? ''

  const filteredNav = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(session.role),
  )

  // A nav item is "active" when the pathname starts with its url.
  // Longer urls win (so /dashboard/audit/signatures beats /dashboard/audit).
  const sortedByDepth = [...filteredNav].sort(
    (a, b) => b.url.length - a.url.length,
  )
  const activeUrl =
    sortedByDepth.find((item) =>
      item.url === '/dashboard'
        ? pathname === '/dashboard'
        : pathname === item.url || pathname.startsWith(`${item.url}/`),
    )?.url ?? null

  const displayName = companyName ?? session.companyName ?? 'Pharma LMS'
  const homeHref = session.role === 'EMPLOYEE' ? '/my-trainings' : '/dashboard'

  const itemsBySection = React.useMemo(() => {
    const map = new Map<string, NavItem[]>()
    for (const item of filteredNav) {
      const list = map.get(item.section) ?? []
      list.push(item)
      map.set(item.section, list)
    }
    return map
  }, [filteredNav])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <Link
          href={homeHref}
          title={displayName}
          className="flex justify-center rounded-md px-1 py-0.5 outline-none ring-sidebar-ring transition-transform duration-300 hover:scale-[1.01] focus-visible:ring-2 group-data-[collapsible=icon]:py-0.5"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${displayName} logo`}
              className="h-14 w-auto max-w-[min(100%,240px)] object-contain group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:max-w-9"
            />
          ) : (
            <ZeavarWheel
              alt={`${displayName} logo`}
              animate
              className="h-14 w-14 shrink-0 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9"
            />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 overflow-x-hidden">
        {NAV_SECTION_ORDER.map((section) => {
          const items = itemsBySection.get(section)
          if (!items?.length) return null
          return (
            <SidebarGroup key={section} className="p-2 py-1">
              <SidebarGroupLabel className="h-auto min-h-0 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                {section}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                  const isActive = item.url === activeUrl
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        size="default"
                        isActive={isActive}
                        tooltip={item.title}
                        className="group/nav relative h-9 min-h-9 px-2.5 py-2 text-sm transition-colors duration-150 [&>svg]:size-[18px]"
                      >
                        <Link href={item.url}>
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                            />
                          )}
                          <item.icon
                            className={
                              isActive
                                ? 'size-[18px] text-sidebar-primary'
                                : 'size-[18px] transition-transform duration-200 group-hover/nav:scale-110 group-hover/nav:text-sidebar-primary'
                            }
                          />
                          <span
                            className={
                              isActive
                                ? 'text-sidebar-accent-foreground'
                                : 'transition-colors duration-150'
                            }
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      {/* ── Footer / User ──────────────────────────────────────────────── */}
      <SidebarFooter className="gap-1.5 p-2 pt-1.5">
        <p className="px-1 text-center text-[10px] font-medium lowercase leading-snug tracking-wide text-sidebar-foreground/55">
          powered by zeavar
        </p>
        <NavUser session={session} />
      </SidebarFooter>
    </Sidebar>
  )
}
