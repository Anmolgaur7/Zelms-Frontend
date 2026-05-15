import { getMyQualifications } from '@/lib/actions/phase3'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BadgeCheckIcon } from 'lucide-react'

export const metadata = { title: 'My qualifications' }
export const dynamic = 'force-dynamic'

export default async function MyQualificationsPage() {
  const items = await getMyQualifications()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BadgeCheckIcon className="h-6 w-6 text-primary" />
          My qualifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Requests where you are the subject — GET /api/qualifications/my
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No qualification requests on file.
          </CardContent>
        </Card>
      ) : (
        items.map((q) => (
          <Card key={q.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{q.qualificationType}</CardTitle>
              <Badge variant="outline">{q.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {q.steps?.length
                ? `Steps: ${q.steps.map((s) => `${s.stepRole} (${s.status})`).join(' → ')}`
                : 'Pending workflow setup.'}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
