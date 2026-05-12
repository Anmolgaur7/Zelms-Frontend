/**
 * app/my-trainings/layout.tsx
 *
 * Layout for the Employee Training Portal.
 * Uses the same sidebar provider as the dashboard but with employee-focused navigation.
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// All /my-trainings pages read the employee session cookie + hit the API.
export const dynamic = 'force-dynamic'

export default async function TrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

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
