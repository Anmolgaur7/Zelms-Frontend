/**
 * components/app-sidebar.tsx
 *
 * Server component — reads the session and renders role-filtered nav.
 * Roles in this app: SUPER_ADMIN, ADMIN, TRAINER, EMPLOYEE, AUDITOR
 */

import * as React from 'react'
import Link from 'next/link'
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
  const filteredNav = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(session.role),
  )

  const displayName = companyName ?? session.companyName ?? 'Pharma LMS'

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* ── Header / Brand ─────────────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${displayName} logo`}
                    className="h-7 w-7 rounded-md object-contain shrink-0 bg-muted"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black shrink-0">
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
            {filteredNav.map((item) => (
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
