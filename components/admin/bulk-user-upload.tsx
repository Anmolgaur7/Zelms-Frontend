'use client'

/**
 * components/admin/bulk-user-upload.tsx
 *
 * Paste-or-upload UI for `POST /api/admin/users/bulk`. Accepts CSV (with header
 * row) or JSON (array | { users: [...] }), normalises every row into the
 * `BulkUserEntry` shape, lets the admin pick a default department, and on
 * success shows the temp-password list + a "Download credentials CSV" action.
 *
 * Temp passwords are surfaced once. After download/close the page does a
 * router.refresh() so the /dashboard/users list picks up the new rows.
 */

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircleIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2,
  RotateCcwIcon,
  UploadIcon,
  UsersIcon,
} from 'lucide-react'

import { bulkCreateUsers } from '@/lib/actions/admin'
import type {
  BulkCreateResponse,
  BulkUserEntry,
  Department,
} from '@/types/admin'
import type { UserRole } from '@/types/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const ROLES: UserRole[] = ['EMPLOYEE', 'TRAINER', 'ADMIN', 'AUDITOR']

interface BulkUserUploadProps {
  departments: Department[]
}

interface ParseResult {
  rows: BulkUserEntry[]
  errors: string[]
}

// ────────────────────────────────────────────────────────────────────────────
// CSV parsing — handles quoted values + commas inside quotes. Keep it tiny;
// we don't need full RFC 4180 support since admins paste their own files.
// ────────────────────────────────────────────────────────────────────────────
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCsv(text: string): ParseResult {
  const errors: string[] = []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return { rows: [], errors: ['Empty input.'] }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const idx = {
    name: header.indexOf('name'),
    role: header.indexOf('role'),
    email: header.indexOf('email'),
    employeeId:
      header.indexOf('employeeid') !== -1
        ? header.indexOf('employeeid')
        : header.indexOf('employee_id'),
    departmentId:
      header.indexOf('departmentid') !== -1
        ? header.indexOf('departmentid')
        : header.indexOf('department_id'),
  }
  if (idx.name === -1 || idx.role === -1) {
    return {
      rows: [],
      errors: ['CSV header must include at least "name" and "role".'],
    }
  }

  const rows: BulkUserEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const name = cells[idx.name] ?? ''
    const role = (cells[idx.role] ?? '').toUpperCase()
    if (!name) {
      errors.push(`Row ${i + 1}: missing name.`)
      continue
    }
    if (!ROLES.includes(role as UserRole)) {
      errors.push(`Row ${i + 1}: invalid role "${role}".`)
      continue
    }
    const entry: BulkUserEntry = { name, role: role as UserRole }
    if (idx.email !== -1 && cells[idx.email]) entry.email = cells[idx.email]
    if (idx.employeeId !== -1 && cells[idx.employeeId])
      entry.employeeId = cells[idx.employeeId]
    if (idx.departmentId !== -1 && cells[idx.departmentId])
      entry.departmentId = cells[idx.departmentId]
    rows.push(entry)
  }
  return { rows, errors }
}

function parseJson(text: string): ParseResult {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch (e) {
    return {
      rows: [],
      errors: [`Invalid JSON: ${(e as Error).message}`],
    }
  }
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { users?: unknown }).users)
    ? ((payload as { users: unknown[] }).users as unknown[])
    : null
  if (!list) {
    return {
      rows: [],
      errors: [
        'JSON must be an array of users, or an object with a "users" array.',
      ],
    }
  }

  const errors: string[] = []
  const rows: BulkUserEntry[] = []
  list.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Row ${i + 1}: not an object.`)
      return
    }
    const r = item as Record<string, unknown>
    const name = typeof r.name === 'string' ? r.name.trim() : ''
    const roleRaw = typeof r.role === 'string' ? r.role.toUpperCase() : ''
    if (!name) {
      errors.push(`Row ${i + 1}: missing name.`)
      return
    }
    if (!ROLES.includes(roleRaw as UserRole)) {
      errors.push(`Row ${i + 1}: invalid role "${roleRaw}".`)
      return
    }
    const entry: BulkUserEntry = { name, role: roleRaw as UserRole }
    if (typeof r.email === 'string' && r.email.trim()) entry.email = r.email.trim()
    if (typeof r.employeeId === 'string' && r.employeeId.trim())
      entry.employeeId = r.employeeId.trim()
    if (typeof r.departmentId === 'string' && r.departmentId.trim())
      entry.departmentId = r.departmentId.trim()
    rows.push(entry)
  })
  return { rows, errors }
}

const CSV_SAMPLE = `name,role,employeeId,email,departmentId
Jane Doe,EMPLOYEE,,jane@acme.com,
John Roe,TRAINER,42,,
`

const JSON_SAMPLE = JSON.stringify(
  {
    reason: 'Q2 onboarding batch',
    users: [
      {
        name: 'Jane Doe',
        role: 'EMPLOYEE',
        email: 'jane@acme.com',
        employeeId: '',
        departmentId: '',
      },
      { name: 'John Roe', role: 'TRAINER', employeeId: '42' },
    ],
  },
  null,
  2,
)

function buildCredentialsCsv(result: BulkCreateResponse): string {
  const header = 'employeeId,temporaryPassword,email'
  const lines = result.users.map(
    (u) =>
      `${u.employeeId},${u.temporaryPassword},${(u.email ?? '').replaceAll(',', ' ')}`,
  )
  return [header, ...lines].join('\n')
}

export function BulkUserUpload({ departments }: BulkUserUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [csvText, setCsvText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [response, setResponse] = useState<BulkCreateResponse | null>(null)
  const [isPending, startTransition] = useTransition()

  const rawText = format === 'csv' ? csvText : jsonText
  const parseResult = useMemo<ParseResult>(() => {
    if (!rawText.trim()) return { rows: [], errors: [] }
    return format === 'csv' ? parseCsv(rawText) : parseJson(rawText)
  }, [rawText, format])

  const previewRows = useMemo<BulkUserEntry[]>(() => {
    if (!defaultDepartmentId) return parseResult.rows
    return parseResult.rows.map((r) =>
      r.departmentId ? r : { ...r, departmentId: defaultDepartmentId },
    )
  }, [parseResult.rows, defaultDepartmentId])

  const handleFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      if (file.name.toLowerCase().endsWith('.json')) {
        setFormat('json')
        setJsonText(text)
      } else {
        setFormat('csv')
        setCsvText(text)
      }
    }
    reader.readAsText(file)
  }

  const reset = () => {
    setCsvText('')
    setJsonText('')
    setDefaultDepartmentId('')
    setReason('')
    setParseErrors([])
    setServerError(null)
    setResponse(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = () => {
    setParseErrors(parseResult.errors)
    setServerError(null)
    if (parseResult.errors.length > 0) {
      toast.error('Fix the highlighted parse errors first.')
      return
    }
    if (previewRows.length === 0) {
      toast.error('Add at least one user row.')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('Audit reason must be at least 5 characters.')
      return
    }

    startTransition(async () => {
      const result = await bulkCreateUsers({
        reason: reason.trim(),
        users: previewRows,
      })
      if (result.error || !result.data) {
        const msg = result.error ?? 'Bulk import failed.'
        setServerError(msg)
        toast.error(msg)
        return
      }
      setResponse(result.data)
      toast.success(`Created ${result.data.users.length} user(s).`)
      router.refresh()
    })
  }

  const downloadCsv = () => {
    if (!response) return
    const csv = buildCredentialsCsv(response)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `credentials-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // ─── Success view ──────────────────────────────────────────────────────────
  if (response) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200">
          <p className="font-medium">
            {response.message ?? `Created ${response.users.length} user(s).`}
          </p>
          <p className="text-xs mt-1">
            Temporary passwords are shown once. Download the CSV before leaving
            this page — they cannot be recovered later.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {response.users.length} credential row
            {response.users.length === 1 ? '' : 's'}
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadCsv}>
              <DownloadIcon className="mr-2 h-4 w-4" /> Download CSV
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcwIcon className="mr-2 h-4 w-4" /> Import more
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Temporary password</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {response.users.map((u) => (
                <TableRow key={u.employeeId}>
                  <TableCell className="font-mono text-sm">
                    {u.employeeId}
                  </TableCell>
                  <TableCell className="font-mono text-sm break-all">
                    {u.temporaryPassword}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // ─── Compose view ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bulk-reason">
            Audit reason <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bulk-reason"
            placeholder="e.g. Onboarding new hires — Q2 batch"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Min 5 characters. Stored on every created user&apos;s audit row.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-dept">
            Default department{' '}
            <span className="text-muted-foreground text-xs font-normal">
              (optional — applied to rows missing departmentId)
            </span>
          </Label>
          <Select
            value={defaultDepartmentId || undefined}
            onValueChange={(v) =>
              setDefaultDepartmentId(v === '__none__' ? '' : v)
            }
            disabled={isPending || departments.length === 0}
          >
            <SelectTrigger id="bulk-dept">
              <SelectValue
                placeholder={
                  departments.length === 0
                    ? 'No departments — create some first'
                    : 'Select a department'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No default</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <UploadIcon className="mr-2 h-4 w-4" /> Upload file
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (format === 'csv') setCsvText(CSV_SAMPLE)
                else setJsonText(JSON_SAMPLE)
              }}
              disabled={isPending}
            >
              <FileTextIcon className="mr-2 h-4 w-4" /> Load sample
            </Button>
          </div>
        </div>

        <TabsContent value="csv" className="mt-4">
          <Label htmlFor="csv-input" className="text-sm font-medium">
            CSV (header row required)
          </Label>
          <Textarea
            id="csv-input"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={CSV_SAMPLE}
            disabled={isPending}
            className="font-mono text-xs mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Columns: <code>name, role, employeeId, email, departmentId</code>.
            Leave <code>employeeId</code> blank for auto-assignment. Roles:
            EMPLOYEE | TRAINER | ADMIN | AUDITOR.
          </p>
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Label htmlFor="json-input" className="text-sm font-medium">
            JSON (array or {`{ users: [...] }`})
          </Label>
          <Textarea
            id="json-input"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={JSON_SAMPLE}
            disabled={isPending}
            className="font-mono text-xs mt-1.5"
          />
        </TabsContent>
      </Tabs>

      {(parseResult.errors.length > 0 || parseErrors.length > 0) && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4" /> Parse errors
          </p>
          <ul className="list-disc list-inside text-xs text-destructive space-y-0.5">
            {(parseErrors.length > 0 ? parseErrors : parseResult.errors).map(
              (msg, i) => (
                <li key={i}>{msg}</li>
              ),
            )}
          </ul>
        </div>
      )}

      {serverError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            Preview ({previewRows.length} row
            {previewRows.length === 1 ? '' : 's'})
          </Label>
          {previewRows.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} disabled={isPending}>
              Clear
            </Button>
          )}
        </div>

        {previewRows.length === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            Paste data above or upload a file to see a preview.
          </div>
        ) : (
          <div className="rounded-md border max-h-[360px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs">{r.role}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.email ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.employeeId || 'auto'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.departmentId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={reset} disabled={isPending}>
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || previewRows.length === 0}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" /> Import{' '}
              {previewRows.length || ''} user{previewRows.length === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
