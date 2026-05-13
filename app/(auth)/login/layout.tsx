import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to ZEAVAR Pharma Training LMS with your company code, employee ID, and password. GxP-compliant SOPs, assignments, and training records.',
  openGraph: {
    title: 'Sign in | ZEAVAR Pharma Training LMS',
    description:
      'Tenant login for ZEAVAR — company code, employee ID, and password.',
  },
  twitter: {
    title: 'Sign in | ZEAVAR Pharma Training LMS',
    description:
      'Tenant login for ZEAVAR — company code, employee ID, and password.',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
