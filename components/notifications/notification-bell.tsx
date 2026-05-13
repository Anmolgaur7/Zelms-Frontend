'use client'

/**
 * components/notifications/notification-bell.tsx
 *
 * Header notification bell — works for every authenticated role.
 *
 *   - Initial server fetch happens via {@link NotificationBell.initial}.
 *   - Client refreshes:
 *       a) every 60s (`POLL_INTERVAL_MS`); cleared on unmount,
 *       b) on dropdown open,
 *       c) after every mutation (`markRead` / `markAllRead`).
 *   - Optimistic mark-as-read keeps the UI responsive; a refetch always follows
 *     to reconcile with backend state and recover from `ApiError`.
 *
 * The bell intentionally **never throws** — if the API returns 500 / 403 the
 * count drops to 0 and the dropdown shows a small inline error banner. The
 * rest of the header keeps working.
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { toastActionError } from '@/lib/toast-action-error'
import { LiveDot } from '@/components/ui/live-dot'
import {
  BellIcon,
  CheckCheckIcon,
  Loader2Icon,
  AlertCircleIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsResult,
} from '@/lib/actions/notifications'
import { isUnread, type NotificationItem } from '@/types/notifications'

const POLL_INTERVAL_MS = 60_000

interface Props {
  initial: NotificationsResult
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function deepLink(n: NotificationItem): string | null {
  // Backend-supplied link beats anything we infer client-side.
  const explicit = n.url ?? n.link ?? n.href
  if (typeof explicit === 'string' && explicit.length > 0) return explicit
  if (n.assignmentId) return `/my-trainings`
  if (n.sopId) return `/my-trainings/library/${n.sopId}`
  if (n.userId) return `/dashboard/users/${n.userId}`
  return null
}

function summarise(n: NotificationItem): { title: string; body: string | null } {
  const title = n.title ?? n.type ?? 'Notification'
  const body = n.message ?? n.body ?? null
  return { title: String(title), body: body ? String(body) : null }
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Date.now() - t
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}

function severityClass(n: NotificationItem): string {
  switch (n.severity) {
    case 'CRITICAL':
      return 'border-l-rose-500'
    case 'WARNING':
      return 'border-l-amber-500'
    case 'INFO':
      return 'border-l-blue-500'
    default:
      return 'border-l-transparent'
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function NotificationBell({ initial }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<NotificationsResult>(initial)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, startTransition] = useTransition()

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const next = await getNotifications()
      setState(next)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Background poll — cleared on unmount. We don't pause on hidden tabs because
  // the cost is one HTTP request per minute. If rate-limiting bites, swap to
  // `document.visibilityState === 'visible'` gating here.
  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible')
        return
      void refresh()
    }
    const id = window.setInterval(tick, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  // Refresh as the dropdown opens so the user sees the latest state.
  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const unreadCount = state.unreadCount
  const items = state.notifications
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  )

  const optimisticallyMark = (id: string) => {
    setState((prev) => {
      const next = prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true, isRead: true, unread: false } : n,
      )
      return {
        ...prev,
        notifications: next,
        unreadCount: next.reduce((acc, n) => acc + (isUnread(n) ? 1 : 0), 0),
      }
    })
  }

  const handleRead = (n: NotificationItem) => {
    if (!isUnread(n)) return
    optimisticallyMark(n.id)
    startTransition(async () => {
      const result = await markNotificationRead(n.id)
      if (result.error) {
        toastActionError(result.error, result.requestId)
      }
      await refresh()
      router.refresh()
    })
  }

  const handleReadAll = () => {
    if (unreadCount === 0) return
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({
        ...n,
        read: true,
        isRead: true,
        unread: false,
      })),
      unreadCount: 0,
    }))
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (result.error) {
        toastActionError(result.error, result.requestId)
      } else {
        toast.success('All notifications marked as read.')
      }
      await refresh()
      router.refresh()
    })
  }

  const displayBadge = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
          className="relative"
        >
          <BellIcon
            className={
              unreadCount > 0
                ? 'h-4 w-4 text-primary'
                : 'h-4 w-4'
            }
          />
          {unreadCount > 0 && (
            <>
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-1 text-[10px] font-semibold text-white shadow-soft motion-safe:animate-fade-in"
              >
                {displayBadge}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-rose-400/60 motion-safe:animate-ping"
              />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[360px] p-0 shadow-soft-lg border-border/70 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Notifications</span>
            <span className="text-[11px] text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'You\u2019re all caught up'}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={unreadCount === 0 || isRefreshing}
            onClick={handleReadAll}
            className="h-7 text-xs"
          >
            <CheckCheckIcon className="mr-1 h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>

        <Separator />

        {state.error && (
          <div className="flex items-start gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="space-y-0.5">
              <span>{state.error}</span>
              {state.requestId ? (
                <span className="block font-mono text-[10px] opacity-90">
                  Request ID: {state.requestId}
                </span>
              ) : null}
            </div>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <BellIcon className="h-7 w-7 opacity-30" />
            <p className="text-xs">No notifications yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y">
              {sorted.map((n, idx) => {
                const { title, body } = summarise(n)
                const unread = isUnread(n)
                const link = deepLink(n)
                const Inner = (
                  <div
                    className={`flex flex-col gap-0.5 border-l-2 px-4 py-3 transition-colors hover:bg-accent/50 ${severityClass(n)} ${
                      unread ? 'bg-primary/[0.05]' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium">
                        {title}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    {body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {body}
                      </p>
                    )}
                    {unread && (
                      <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 motion-safe:animate-pulse-soft" />
                    )}
                  </div>
                )

                return (
                  <li
                    key={n.id}
                    className="motion-safe:animate-fade-in"
                    style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
                  >
                    {link ? (
                      <Link
                        href={link}
                        onClick={() => {
                          handleRead(n)
                          setOpen(false)
                        }}
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRead(n)}
                        className="w-full text-left"
                      >
                        {Inner}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}

        <Separator />

        <div className="flex items-center justify-between px-4 py-2">
          <LiveDot label="Polls every 60s" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            onClick={refresh}
            className="h-7 text-xs"
          >
            {isRefreshing ? (
              <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Refresh
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
