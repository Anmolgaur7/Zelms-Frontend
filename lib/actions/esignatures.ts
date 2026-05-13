'use server'

/**
 * lib/actions/esignatures.ts
 *
 *   GET /api/esignatures/        → list ledger (array or `{ data: [] }`)
 *   GET /api/esignatures/:id/verify → integrity check for a single record
 *
 * Read-only flow — the API does not expose a mutation route for e-signatures.
 * Permitted roles (per backend): authenticated user; the **page** that hosts
 * the ledger gates by role so auditors / admins are the typical consumers.
 */

import { api, ApiError } from '@/lib/api'
import type { ActionResult } from '@/types/auth'
import type {
  ESignatureRecord,
  ESignatureVerifyResult,
} from '@/types/esignatures'

export interface ESignatureListResult {
  records: ESignatureRecord[]
  error?: string
  errorCode?: string
  requestId?: string
}

interface ListEnvelope {
  records?: ESignatureRecord[]
  signatures?: ESignatureRecord[]
  data?: ESignatureRecord[]
  items?: ESignatureRecord[]
}

function unwrap(raw: unknown): ESignatureRecord[] {
  if (Array.isArray(raw)) return raw as ESignatureRecord[]
  if (raw && typeof raw === 'object') {
    const obj = raw as ListEnvelope
    return obj.records ?? obj.signatures ?? obj.data ?? obj.items ?? []
  }
  return []
}

export async function listEsignatures(): Promise<ESignatureListResult> {
  try {
    const raw = await api.get<unknown>('/api/esignatures/')
    const records = unwrap(raw)
    return { records }
  } catch (e) {
    console.error('[esignatures.listEsignatures]', e)
    if (e instanceof ApiError) {
      return {
        records: [],
        error: e.message,
        errorCode: e.errorCode,
        requestId: e.requestId,
      }
    }
    return { records: [], error: 'Could not load e-signature ledger.' }
  }
}

export async function verifyEsignature(
  id: string,
): Promise<ActionResult<ESignatureVerifyResult>> {
  try {
    const raw = await api.get<ESignatureVerifyResult>(
      `/api/esignatures/${id}/verify`,
    )
    if (process.env.NODE_ENV !== 'production') {
      console.log('[esignatures.verifyEsignature]', JSON.stringify(raw))
    }
    return { data: { id, ...raw } }
  } catch (e) {
    console.error('[esignatures.verifyEsignature]', e)
    if (e instanceof ApiError)
      return { error: e.message, errorCode: e.errorCode, requestId: e.requestId }
    return { error: 'Could not verify signature.' }
  }
}
