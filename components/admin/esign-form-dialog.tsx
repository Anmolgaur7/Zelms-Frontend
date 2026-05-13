'use client'

/**
 * components/admin/esign-form-dialog.tsx
 *
 * Shared dialog for **GxP e-signed mutations**.
 *
 * The backend's privileged endpoints all share the same envelope: a
 * `reason` (≥10 chars) and, for high-trust actions, a `password` re-auth field.
 * Rather than duplicate the same form four times, this component renders the
 * common chrome (reason + password + footer + error banner + char counter) and
 * exposes a slot for endpoint-specific inputs (a status select, a role select,
 * a version input, etc.).
 *
 * Caller passes:
 *   - <triggerButton/>       — what the user clicks to open the dialog
 *   - title / description    — dialog header text
 *   - requiresPassword       — false for endpoints that only need `reason`
 *   - submitLabel            — defaults to "Confirm"
 *   - destructive            — switches the submit button to the destructive variant
 *   - extraFields            — render-prop receiving the form helpers so the
 *                              specific dialog can add its own inputs
 *   - schema                 — Zod schema that ALWAYS includes { reason } and,
 *                              when requiresPassword, { password }
 *   - onSubmit               — async (values) => { data?, error?, errorCode? }
 *                              Standard server-action ActionResult shape.
 *   - successToast           — message shown on success
 *   - onSuccess              — optional callback (e.g. router.refresh())
 *   - tooltip                — optional hover hint. When set, wraps the trigger as
 *                              TooltipTrigger → DialogTrigger → trigger so Radix
 *                              refs compose correctly (never wrap DialogTrigger
 *                              in Tooltip as the outer node — clicks will not open).
 */

import { useEffect, useId, useState, useTransition } from 'react'
import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z, ZodTypeAny } from 'zod'
import { toast } from 'sonner'
import { AlertCircleIcon, Loader2, ShieldCheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** Standard ActionResult shape used by all admin server actions. */
export interface ActionResultLite<T> {
  data?: T
  error?: string
  errorCode?: string
}

export interface EsignFormDialogProps<TSchema extends ZodTypeAny, TData> {
  trigger: React.ReactNode
  title: string
  description?: string
  /** Set to false for endpoints that only need `reason` (revise, role change). */
  requiresPassword?: boolean
  submitLabel?: string
  destructive?: boolean
  /** Endpoint-specific Zod schema. MUST include `reason` (and `password` when requiresPassword=true). */
  schema: TSchema
  /** Initial form values (e.g. current status to pre-select). */
  defaultValues: z.infer<TSchema>
  /** Slot for action-specific inputs (status select, role select, version input…). */
  extraFields?: (form: UseFormReturn<z.infer<TSchema>>) => React.ReactNode
  onSubmit: (values: z.infer<TSchema>) => Promise<ActionResultLite<TData>>
  successToast: string | ((data: TData | undefined) => string)
  onSuccess?: (data: TData | undefined) => void
  /** Hover label; when set, composes TooltipTrigger → DialogTrigger → `trigger`. */
  tooltip?: string
}

const MIN_REASON = 10

export function EsignFormDialog<
  TSchema extends ZodTypeAny,
  TData = unknown,
>({
  trigger,
  title,
  description,
  requiresPassword = true,
  submitLabel = 'Confirm',
  destructive,
  schema,
  defaultValues,
  extraFields,
  onSubmit,
  successToast,
  onSuccess,
  tooltip,
}: EsignFormDialogProps<TSchema, TData>) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reasonFieldId = useId()
  const passwordFieldId = useId()

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Reset form whenever the dialog reopens so stale values don't linger.
  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setServerError(null)
    }
  }, [open, form, defaultValues])

  const reasonValue = (form.watch('reason' as never) as string | undefined) ?? ''
  const reasonError = (form.formState.errors as FieldValues).reason

  const submit = (values: z.infer<TSchema>) => {
    setServerError(null)
    startTransition(async () => {
      const result = await onSubmit(values)
      if (result.error) {
        const friendlyByCode: Record<string, string> = {
          INVALID_PASSWORD: 'Incorrect password. Please try again.',
          USER_ROLE_PROTECTED:
            'Only the company Super Admin can change this account. Ask a Super Admin to make this change.',
          ASSIGNMENT_NOT_LOCKED:
            'This assignment is not in a LOCKED_OUT state, so it cannot be unlocked.',
          SOP_INVALID_STATUS_TRANSITION:
            'The chosen status is not a valid next state for this SOP.',
        }
        setServerError(friendlyByCode[result.errorCode ?? ''] ?? result.error)
        return
      }
      const msg =
        typeof successToast === 'function' ? successToast(result.data) : successToast
      toast.success(msg)
      setOpen(false)
      onSuccess?.(result.data)
    })
  }

  const triggerNode = tooltip ? (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerNode}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(submit as never)}
          className="space-y-4"
          noValidate
        >
          {extraFields?.(form)}

          {/* Reason — every privileged action needs ≥10 chars. */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor={reasonFieldId}>
                Reason <span className="text-red-500">*</span>
              </Label>
              <span
                className={`text-[11px] ${
                  reasonValue.length < MIN_REASON
                    ? 'text-muted-foreground'
                    : 'text-emerald-600'
                }`}
              >
                {reasonValue.length}/{MIN_REASON}+
              </span>
            </div>
            <Textarea
              id={reasonFieldId}
              rows={3}
              placeholder="e.g. SOP supersedes prior revision after QC approval."
              {...form.register('reason' as never)}
            />
            {reasonError && (
              <p className="text-xs text-red-600">
                {String(reasonError.message ?? 'Reason is required')}
              </p>
            )}
          </div>

          {requiresPassword && (
            <div className="space-y-1.5">
              <Label htmlFor={passwordFieldId}>
                Your password <span className="text-red-500">*</span>
              </Label>
              <Input
                id={passwordFieldId}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register('password' as never)}
              />
              <p className="text-[11px] text-muted-foreground">
                Required for the e-signature on this regulated change.
              </p>
              {(form.formState.errors as FieldValues).password && (
                <p className="text-xs text-red-600">
                  {String(
                    (form.formState.errors as FieldValues).password?.message ??
                      'Password is required',
                  )}
                </p>
              )}
            </div>
          )}

          {serverError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={destructive ? 'destructive' : 'default'}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Re-export Zod helper so wrappers can build schemas without an extra import. */
export { z } from 'zod'
