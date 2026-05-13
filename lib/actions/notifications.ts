'use server'

/**
 * lib/actions/notifications.ts
 *
 * Tenant in-app notifications — all per-user routes from `/api/notifications`.
 *
 *   GET    /api/notifications/         → list (array or `{ data: [] }`)
 *   PATCH  /api/notifications/read-all → mark every notification read
 *   PATCH  /api/notifications/:id/read → mark a single notification read
 *
 * Errors are funnelled through `ActionResult` so the UI can show a meaningful
 * banner / toast. We never throw out of these helpers — the bell stays
 * resilient if the backend returns 500 on a single poll.
 */

import { revalidatePath } from 'next/cache'
import { api, ApiError } from '@/lib/api'
import type { ActionResult } from '@/types/auth'
import type { NotificationItem } from '@/types/notifications'
import { isUnread } from '@/types/notifications'

interface NotificationListEnvelope {
  notifications?: NotificationItem[]
  data?: NotificationItem[]
  items?: NotificationItem[]
  /** Forward-compat for unread-count shorthand. */
  unread?: number
  unreadCount?: number
}

export interface NotificationsResult {
  notifications: NotificationItem[]
  unreadCount: number
  error?: string
  errorCode?: string
}

function unwrap(raw: unknown): NotificationItem[] {
  if (Array.isArray(raw)) return raw as NotificationItem[]
  if (raw && typeof raw === 'object') {
    const obj = raw as NotificationListEnvelope
    return obj.notifications ?? obj.data ?? obj.items ?? []
  }
  return []
}

/** Counts unread items; if backend provides a shortcut field we trust that. */
function countUnread(raw: unknown, items: NotificationItem[]): number {
  if (raw && typeof raw === 'object') {
    const obj = raw as NotificationListEnvelope
    if (typeof obj.unreadCount === 'number') return obj.unreadCount
    if (typeof obj.unread === 'number') return obj.unread
  }
  return items.reduce((acc, n) => acc + (isUnread(n) ? 1 : 0), 0)
}

/**
 * Fetch the current user's notifications. Returns an envelope rather than
 * throwing so the bell can render an error chip without crashing the header.
 */
export async function getNotifications(): Promise<NotificationsResult> {
  try {
    const raw = await api.get<unknown>('/api/notifications/')
    const notifications = unwrap(raw)
    return {
      notifications,
      unreadCount: countUnread(raw, notifications),
    }
  } catch (e) {
    console.error('[notifications.getNotifications]', e)
    if (e instanceof ApiError) {
      return {
        notifications: [],
        unreadCount: 0,
        error: e.message,
        errorCode: e.errorCode,
      }
    }
    return {
      notifications: [],
      unreadCount: 0,
      error: 'Could not load notifications.',
    }
  }
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await api.patch(`/api/notifications/${id}/read`, {})
    revalidatePath('/dashboard')
    revalidatePath('/my-trainings')
    return { data: { id } }
  } catch (e) {
    console.error('[notifications.markNotificationRead]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not mark notification as read.' }
  }
}

export async function markAllNotificationsRead(): Promise<
  ActionResult<{ count?: number }>
> {
  try {
    const raw = await api.patch<{ count?: number } | unknown>(
      '/api/notifications/read-all',
      {},
    )
    revalidatePath('/dashboard')
    revalidatePath('/my-trainings')
    if (raw && typeof raw === 'object' && 'count' in (raw as object)) {
      return { data: { count: (raw as { count?: number }).count } }
    }
    return { data: {} }
  } catch (e) {
    console.error('[notifications.markAllNotificationsRead]', e)
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode }
    return { error: 'Could not mark all notifications as read.' }
  }
}
