/**
 * types/esignatures.ts
 *
 * Records returned by `GET /api/esignatures/` and the verification endpoint
 * `GET /api/esignatures/:id/verify`. Backend response shape is not formally
 * documented; we keep this permissive (optional fields + index signature) so
 * the table renders for any reasonable envelope.
 */

export interface ESignatureSigner {
  id?: string
  name?: string | null
  employeeId?: string | null
  email?: string | null
  role?: string | null
}

export interface ESignatureRecord {
  id: string
  /** Event being signed — e.g. `ASSIGNMENT_SUBMITTED`, `SOP_STATUS_CHANGED`. */
  action?: string | null
  event?: string | null
  eventType?: string | null

  /** Free-form human meaning supplied at sign time. */
  meaning?: string | null
  reason?: string | null
  description?: string | null
  note?: string | null
  purpose?: string | null
  signatureMeaning?: string | null

  /** Target entity that the e-signature applies to. */
  targetType?: string | null
  targetId?: string | null
  entityType?: string | null
  entityId?: string | null

  /** Who signed it — backend may use `user`, `signer`, or `actor`. */
  user?: ESignatureSigner | null
  signer?: ESignatureSigner | null
  actor?: ESignatureSigner | null

  /** Network context (when captured). */
  ip?: string | null
  userAgent?: string | null

  /** Cryptographic value the verify endpoint checks against. */
  hash?: string | null
  signatureValue?: string | null

  /**
   * Timestamp — backend has used `createdAt`, `signedAt`, `timestamp`,
   * `createdOn`, `date`, and `at` over the project's history. Any of them
   * is accepted; UI helpers normalise via {@link getCreatedAt}.
   */
  createdAt?: string | number | null
  signedAt?: string | number | null
  timestamp?: string | number | null
  createdOn?: string | number | null
  date?: string | number | null
  at?: string | number | null

  /** Forward-compat. */
  [key: string]: unknown
}

export interface ESignatureVerifyResult {
  id: string
  /** True when chain hash / signature matches stored value. */
  valid?: boolean
  /** Backend aliases — checked in {@link isVerificationValid}. */
  isValid?: boolean
  verified?: boolean
  ok?: boolean
  success?: boolean
  status?: string | null
  message?: string | null
  reason?: string | null
  computedHash?: string | null
  expectedHash?: string | null
  /** Forward-compat. */
  [key: string]: unknown
}

/** Pick the first non-empty signer block on a record. */
export function getSigner(rec: ESignatureRecord): ESignatureSigner | null {
  return rec.user ?? rec.signer ?? rec.actor ?? null
}

/** Convenience accessor for the human-readable meaning. */
export function getMeaning(rec: ESignatureRecord): string {
  return (
    rec.meaning ??
    rec.signatureMeaning ??
    rec.reason ??
    rec.description ??
    rec.note ??
    rec.purpose ??
    rec.event ??
    rec.eventType ??
    rec.action ??
    '—'
  )
}

/** Convenience accessor for the event-target tuple. */
export function getTarget(rec: ESignatureRecord): {
  type: string | null
  id: string | null
} {
  return {
    type: rec.targetType ?? rec.entityType ?? rec.action ?? rec.event ?? null,
    id: rec.targetId ?? rec.entityId ?? null,
  }
}

/** Returns the first non-null timestamp in any supported field, as an ISO string. */
export function getCreatedAt(rec: ESignatureRecord): string | null {
  const candidates = [
    rec.createdAt,
    rec.signedAt,
    rec.timestamp,
    rec.createdOn,
    rec.date,
    rec.at,
  ]
  for (const v of candidates) {
    if (v === null || v === undefined) continue
    // Accept numeric epoch (s or ms) and ISO strings.
    if (typeof v === 'number') {
      const ms = v < 1e12 ? v * 1000 : v
      const d = new Date(ms)
      if (!Number.isNaN(d.getTime())) return d.toISOString()
    }
    if (typeof v === 'string') {
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) return d.toISOString()
    }
  }
  return null
}

/** Returns the "valid" boolean across all known backend aliases. */
export function isVerificationValid(v: ESignatureVerifyResult): boolean {
  if (v.valid !== undefined) return !!v.valid
  if (v.isValid !== undefined) return !!v.isValid
  if (v.verified !== undefined) return !!v.verified
  if (v.ok !== undefined) return !!v.ok
  if (v.success !== undefined) return !!v.success
  if (typeof v.status === 'string') {
    return ['VALID', 'OK', 'PASSED', 'TRUE'].includes(v.status.toUpperCase())
  }
  return false
}
