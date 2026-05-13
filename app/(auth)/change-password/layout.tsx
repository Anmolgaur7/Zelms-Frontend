import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Change password',
  description:
    'Update your ZEAVAR password to meet security requirements and continue to your training dashboard.',
}

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
