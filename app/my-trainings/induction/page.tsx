import { getMyInductionEnrollments } from '@/lib/actions/phase3'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GraduationCapIcon } from 'lucide-react'

export const metadata = { title: 'My induction' }
export const dynamic = 'force-dynamic'

export default async function MyInductionPage() {
  const enrollments = await getMyInductionEnrollments()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCapIcon className="h-6 w-6 text-primary" />
          My induction
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          GET /api/induction-programs/my — complete COURSE steps via training;
          ACK steps require e-sign.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            You are not enrolled in any induction program yet.
          </CardContent>
        </Card>
      ) : (
        enrollments.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {e.program?.name ?? 'Induction program'}
              </CardTitle>
              <CardDescription>
                {e.status ? <Badge variant="outline">{e.status}</Badge> : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {e.progress?.length
                ? `${e.progress.length} step(s) tracked`
                : 'Progress will appear when steps are configured.'}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
