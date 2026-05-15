import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { PlatformSidebar } from '@/components/platform/platform-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/platform-login')
  if (session.role !== 'PLATFORM_ADMIN') redirect('/dashboard')

  return (
    <SidebarProvider>
      <PlatformSidebar session={session} variant="inset" />
      <SidebarInset className="bg-app-shell">
        <SiteHeader session={session} />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
