/**
 * components/site-header.tsx
 *
 * Server component — fetches the notification snapshot in parallel with the
 * session so the bell hydrates with real data on first paint. The header
 * itself stays light: only client-side things (theme toggle, bell popover)
 * mount on the client.
 */

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { getNotifications } from '@/lib/actions/notifications'
import type { SessionUser } from '@/types/auth'

export async function SiteHeader({ session }: { session: SessionUser }) {
  // `getNotifications` is fully tolerant — it returns an envelope with an
  // error string instead of throwing — so the header keeps rendering even if
  // the notifications endpoint is unhappy.
  const notifications = await getNotifications()

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height,box-shadow] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 transition-transform hover:scale-110" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {session.companyName ?? 'Klonix Pharma LMS'}
          </span>
          {session.employeeId && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · {session.employeeId}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell initial={notifications} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
