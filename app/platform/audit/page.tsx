import { getPlatformAuditFeed } from '@/lib/actions/platform'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata = { title: 'Platform audit' }
export const dynamic = 'force-dynamic'

export default async function PlatformAuditPage() {
  const feed = await getPlatformAuditFeed({ page: 1, limit: 50 })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform audit</h1>
        <p className="text-sm text-muted-foreground">GET /api/audit/platform</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feed.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell>{log.company?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
