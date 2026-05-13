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
  HelpCircleIcon,
  FlaskConicalIcon,
  BookOpenIcon,
  AwardIcon,
  ActivityIcon,
  AlertTriangleIcon,
  TargetIcon,
} from 'lucide-react'

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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import type { SessionUser, UserRole } from '@/types/auth'

// ─── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  roles: UserRole[]   // empty = all roles
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: UsersIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Departments',
    url: '/dashboard/departments',
    icon: BuildingIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'SOPs',
    url: '/dashboard/sops',
    icon: FileTextIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
  },
  {
    title: 'Assignments',
    url: '/dashboard/assignments',
    icon: ClipboardCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
  },
  {
    title: 'Compliance',
    url: '/dashboard/analytics/compliance',
    icon: ActivityIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
  },
  {
    title: 'Risk',
    url: '/dashboard/analytics/risk',
    icon: AlertTriangleIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'AUDITOR'],
  },
  {
    title: 'SOP Difficulty',
    url: '/dashboard/analytics/sop-difficulty',
    icon: TargetIcon,
    // Backend: ADMIN | TRAINER (SUPER_ADMIN treated as full admin).
    roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
  },
  {
    title: 'Audit Log',
    url: '/dashboard/audit',
    icon: ShieldCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
  },
  {
    title: 'E-Signatures',
    url: '/dashboard/audit/signatures',
    icon: StampIcon,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
  },
  {
    title: 'Company Settings',
    url: '/dashboard/company',
    icon: SettingsIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'My Trainings',
    url: '/my-trainings',
    icon: ClipboardCheckIcon,
    roles: ['EMPLOYEE'],
  },
  {
    title: 'SOP Library',
    url: '/my-trainings/library',
    icon: BookOpenIcon,
    roles: ['EMPLOYEE'],
  },
  {
    title: 'Certificates',
    url: '/my-trainings/certificates',
    icon: AwardIcon,
    roles: ['EMPLOYEE'],
  },
]

const SECONDARY_ITEMS = [
  { title: 'Help', url: '#', icon: HelpCircleIcon },
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* ── Header / Brand ─────────────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-11 data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard" className="group/brand">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${displayName} logo`}
                    className="h-8 w-8 rounded-md object-contain shrink-0 bg-muted transition-transform duration-300 group-hover/brand:scale-105"
                  />
                ) : (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-black shrink-0 shadow-soft transition-transform duration-300 group-hover/brand:scale-105">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="grid flex-1 text-left">
                  <span className="text-sm font-semibold leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Pharma LMS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Main nav ───────────────────────────────────────────────────── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive = item.url === activeUrl
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="group/nav relative transition-colors duration-150"
                  >
                    <Link href={item.url}>
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                        />
                      )}
                      <item.icon
                        className={
                          isActive
                            ? 'h-4 w-4 text-primary'
                            : 'h-4 w-4 transition-transform duration-200 group-hover/nav:scale-110 group-hover/nav:text-primary'
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

        <SidebarSeparator />

        {/* Secondary */}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            {SECONDARY_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer / User ──────────────────────────────────────────────── */}
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
    </Sidebar>
  )
}
