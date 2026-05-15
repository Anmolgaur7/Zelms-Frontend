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

  if (!session) redirect('/login')

  // Platform tokens have no tenant companyId — use /platform/* instead.
  if (session.role === 'PLATFORM_ADMIN') {
    redirect('/platform/assignments')
  }

  // Branding is optional; NO_COMPANY must not break the shell (sidebar uses session.companyName).
  const company = await getCompany()

  return (
    <SidebarProvider>
      <AppSidebar
        session={session}
        companyName={company?.name ?? session.companyName ?? null}
        logoUrl={company?.logoDisplayUrl ?? null}
        variant="inset"
      />
      <SidebarInset className="bg-app-shell">
        <SiteHeader session={session} />
        <div
          key={session.employeeId ?? session.name}
          className="flex flex-1 flex-col animate-fade-up motion-reduce:animate-none"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
