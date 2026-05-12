/**
 * app/dashboard/layout.tsx
 *
 * Server layout for all /dashboard/* pages.
 * Reads session server-side → passes to sidebar + header.
 * Unauthenticated requests are caught by middleware before reaching here.
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Extra safety net (middleware should catch this first)
  if (!session) redirect('/login')

  return (
    <SidebarProvider>
      <AppSidebar session={session} variant="inset" />
      <SidebarInset>
        <SiteHeader session={session} />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
