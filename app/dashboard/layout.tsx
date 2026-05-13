/**
 * app/dashboard/layout.tsx
 *
 * Server layout for all /dashboard/* pages.
 * Reads session server-side → passes to sidebar + header.
 * Unauthenticated requests are caught by middleware before reaching here.
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getCompany } from '@/lib/actions/admin'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// Every page under /dashboard reads the session cookie and hits the API, so
// nothing here can be statically generated.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Extra safety net (middleware should catch this first)
  if (!session) redirect('/login')

  // Fetch tenant branding in parallel — null-safe so the sidebar still renders
  // for roles that can't reach /api/admin/company (e.g. EMPLOYEE).
  const company = await getCompany()

  return (
    <SidebarProvider>
      <AppSidebar
        session={session}
        companyName={company?.name ?? session.companyName ?? null}
        logoUrl={company?.logoDisplayUrl ?? null}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader session={session} />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
