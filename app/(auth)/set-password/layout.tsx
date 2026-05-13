import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set password',
  description:
    'Complete your ZEAVAR administrator invite by setting a secure password, then sign in from the login page.',
}

export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
