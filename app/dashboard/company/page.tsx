/**
 * app/dashboard/company/page.tsx
 *
 * Tenant branding & metadata. Admins can update the company logo here.
 * Read-only fields (name, prefix, license) reflect the values issued during
 * platform onboarding.
 */

import { getCompany } from '@/lib/actions/admin'
import { CompanyBrandingForm } from '@/components/admin/company-branding-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BuildingIcon, AlertCircleIcon } from 'lucide-react'
import { CatalogPageLayout } from '@/components/phase3/catalog-page-layout'

export const metadata = { title: 'Company' }

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? '—'}</dd>
    </div>
  )
}

export default async function CompanySettingsPage() {
  const company = await getCompany()

  if (!company) {
    return (
      <CatalogPageLayout guideId="company" showTrainingFlow={false} helpDefaultOpen>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <AlertCircleIcon className="h-8 w-8 opacity-40" />
            <p className="text-sm">Could not load company profile.</p>
            <p className="text-xs">
              Confirm you are signed in as an ADMIN or SUPER_ADMIN and that
              <code className="px-1">GET /api/admin/company</code> is reachable.
            </p>
          </CardContent>
        </Card>
      </CatalogPageLayout>
    )
  }

  return (
    <CatalogPageLayout
      guideId="company"
      showTrainingFlow={false}
      countDescription={
        company.name ? `Tenant profile: ${company.name}` : 'Company profile loaded'
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
              Branding
            </CardTitle>
            <CardDescription>
              Upload a logo to personalise sidebars, certificates, and audit
              receipts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyBrandingForm
              initialLogoUrl={company.logoDisplayUrl ?? null}
              companyName={company.name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Identifiers</CardTitle>
            <CardDescription>
              Read-only — assigned by the platform during onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <Field label="Company name" value={company.name} />
              <Field label="Employee ID prefix" value={company.employeeIdPrefix} />
              <Field label="License ID" value={company.licenseId} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </CatalogPageLayout>
  )
}
