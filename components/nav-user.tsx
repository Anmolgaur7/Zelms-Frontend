'use client'

/**
 * components/nav-user.tsx
 *
 * Sidebar footer user menu. Accepts a SessionUser (passed from server layout).
 * Logout calls the server action.
 */

import { useTransition } from 'react'
import { useTheme } from 'next-themes'
import {
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  BadgeIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
} from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/actions/auth'
import type { SessionUser } from '@/types/auth'

/** Role → readable label */
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  EMPLOYEE: 'Employee',
  AUDITOR: 'Auditor',
  PLATFORM_ADMIN: 'Platform',
}

/** Get initials from a name */
function initials(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'U'
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NavUser({ session }: { session: SessionUser }) {
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  const displaySub = session.employeeId ?? session.email ?? ROLE_LABELS[session.role]
  const displayName =
    session.name?.trim() || ROLE_LABELS[session.role] || 'User'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displaySub}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {initials(session.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displaySub}
                  </span>
                </div>
              </div>
              {/* Role badge */}
              <div className="px-2 pb-1">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {ROLE_LABELS[session.role] ?? session.role}
                </Badge>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <UserCircleIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {session.employeeId && (
                <DropdownMenuItem disabled>
                  <BadgeIcon className="mr-2 h-4 w-4" />
                  {session.employeeId}
                </DropdownMenuItem>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {theme === 'dark' ? (
                    <MoonIcon className="mr-2 h-4 w-4" />
                  ) : theme === 'light' ? (
                    <SunIcon className="mr-2 h-4 w-4" />
                  ) : (
                    <MonitorIcon className="mr-2 h-4 w-4" />
                  )}
                  Appearance
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <SunIcon className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <MoonIcon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <MonitorIcon className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              id="nav-user-logout"
              onClick={handleLogout}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              {isPending ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
