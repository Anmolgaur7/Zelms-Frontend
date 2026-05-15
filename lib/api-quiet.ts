import type { ApiRequestOptions } from '@/lib/api'

/** Use on optional reads so 403 / tenant mismatch does not break the dashboard shell. */
export const QUIET_TENANT_READ: ApiRequestOptions = {
  suppressLogFor: ['NO_COMPANY', 'TENANT_REQUIRED', 'UNKNOWN_ERROR'],
  suppressLogForStatus: [403],
  softFail: true,
}
