import { redirect } from 'next/navigation'

/**
 * app/page.tsx
 * Root page — middleware will handle unauthenticated users → /login.
 * Authenticated users get redirected to their role-appropriate home.
 */
export default function RootPage() {
  redirect('/dashboard')
}
