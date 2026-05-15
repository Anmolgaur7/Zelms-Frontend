'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2Icon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
} from 'lucide-react'
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
import { NavUser } from '@/components/nav-user'
import type { SessionUser } from '@/types/auth'

const ITEMS = [
  { title: 'Assignments', url: '/platform/assignments', icon: ClipboardListIcon },
  { title: 'KPIs', url: '/platform/stats', icon: LayoutDashboardIcon },
  { title: 'Companies', url: '/platform/companies', icon: Building2Icon },
  { title: 'Audit', url: '/platform/audit', icon: ScrollTextIcon },
]

export function PlatformSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: SessionUser }) {
  const pathname = usePathname() ?? ''

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Platform console</p>
        <p className="text-xs text-muted-foreground">Cross-tenant oversight</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarMenu>
            {ITEMS.map((item) => {
              const active =
                pathname === item.url || pathname.startsWith(`${item.url}/`)
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
    </Sidebar>
  )
}
