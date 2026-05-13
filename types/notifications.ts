/**
 * types/notifications.ts
 *
 * Tenant in-app notifications. Surface is `GET /api/notifications/` (per-user).
 * The backend response shape isn't formally documented, so we accept a tolerant
 * set of optional fields and keep an index signature for forward-compat.
 */

export interface NotificationItem {
  id: string
  /** Backend may use `title`, `subject`, or only `message`. */
  title?: string | null
  message?: string | null
  body?: string | null

  /** Event code (e.g. `ASSIGNMENT_CREATED`, `SOP_STATUS_CHANGED`). */
  type?: string | null
  category?: string | null

  /** Read state — backend may use any of these. UI normalises via {@link isUnread}. */
  read?: boolean | null
  isRead?: boolean | null
  unread?: boolean | null
  readAt?: string | null

  /** Optional deep-link payload. Used when present to make the row clickable. */
  url?: string | null
  link?: string | null
  href?: string | null

  /** Optional reference ids so the UI can build its own link target. */
  assignmentId?: string | null
  sopId?: string | null
  userId?: string | null

  /** Severity hint — UI maps to a colour if present. */
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | string | null

  createdAt: string
  updatedAt?: string | null

  /** Forward-compat — backend may add fields we haven't typed yet. */
  [key: string]: unknown
}

/** Returns true when the notification is in the "unread" state. */
export function isUnread(n: NotificationItem): boolean {
  if (n.unread === true) return true
  if (n.isRead === false) return true
  if (n.read === false) return true
  if (n.readAt === null || n.readAt === undefined) {
    // Only treat absence as unread when at least one of the flags is also unset.
    if (n.read === undefined && n.isRead === undefined && n.unread === undefined) {
      return true
    }
  }
  return false
}
