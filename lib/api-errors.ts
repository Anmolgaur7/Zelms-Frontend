/**
 * Turn raw API failures (including Express HTML 404 pages) into UI-safe text.
 */

/** Extract `Cannot POST /api/...` from default Express error HTML. */
export function messageFromHtmlErrorBody(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const pre = trimmed.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)
  if (pre?.[1]) {
    const inner = pre[1].trim()
    if (inner.length > 0 && inner.length < 500) return inner
  }

  const cannot = trimmed.match(/Cannot (GET|POST|PATCH|PUT|DELETE)\s+(\S+)/i)
  if (cannot) {
    return `Cannot ${cannot[1]} ${cannot[2]}`
  }

  return null
}

export function formatRouteNotFoundMessage(
  method: string,
  path: string,
  raw?: string,
): string {
  const hint = raw?.trim()
  const route = `${method} ${path}`
  if (hint?.includes('Cannot')) {
    return (
      `The API route ${route} is not available on your server (${hint}). ` +
      `Phase 3 catalog endpoints require a backend build that includes courses, ` +
      `course-groups, induction, etc. Check NEXT_PUBLIC_API_URL and redeploy the API.`
    )
  }
  return (
    `The API route ${route} returned 404. ` +
    `Your deployed backend may not include Phase 3 routes yet.`
  )
}

export function normalizeApiErrorMessage(
  message: string,
  status: number,
  method: string,
  path: string,
  errorCode?: string,
): { message: string; errorCode: string } {
  const htmlLine = messageFromHtmlErrorBody(message)
  if (htmlLine || (status === 404 && message.includes('<!DOCTYPE'))) {
    return {
      message: formatRouteNotFoundMessage(method, path, htmlLine ?? message),
      errorCode: 'ROUTE_NOT_FOUND',
    }
  }
  if (status === 404 && errorCode === 'UNKNOWN_ERROR') {
    return {
      message: formatRouteNotFoundMessage(method, path),
      errorCode: 'ROUTE_NOT_FOUND',
    }
  }
  return { message, errorCode: errorCode ?? 'UNKNOWN_ERROR' }
}
