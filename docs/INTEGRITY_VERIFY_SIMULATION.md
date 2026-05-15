# Simulating failed integrity checks (dev / QA only)

Use these steps **only** in **local or disposable** environments. Changing production audit rows or e-signature blobs is a **compliance incident** and should follow your incident process, not this guide.

 <!-- what we exactly need is that  when uploading  sop  the  quiz generate by ai should be first previewd and allow manual quiz there too and  if not then we save the sop -->
---

## 1. E-signature ledger — `GET /api/esignatures/:id/verify`

### What “good” means

- **`payloadHashMatches`**: SHA-256 of a **canonical JSON** of the object stored in `signatureData.payload` at signing time must equal **`envelope.payloadHash`**.  
  Verification uses **only** that stored payload (not extra fields merged from the DB row).
- **`signatureHashMatches`**: HMAC over `{ payloadHash, metadata, signedAt, version }` from the envelope, using server **`SIGNATURE_HMAC_SECRET`** (or fallback **`JWT_SECRET`**). If the secret rotated since signing, this fails even when the payload is untouched.

### How to simulate **payload hash failure** (payload ✗)

1. List signatures: **`GET /api/esignatures/`** (tenant admin/auditor/super admin, or as documented for your role).
2. Pick **`id`** of a row that has enterprise format: `signatureData` JSON includes **`payload`** and **`envelope`** with **`version`: `"v1"`**.
3. In **Prisma Studio** or SQL, open **`ESignature`** for that `id`. Decode **`signatureData`** (it is a stringified JSON object).
4. Change **only** something inside **`payload`** (e.g. add a space in `reason`, alter `answers`, change `assignmentId` string) **without** updating **`envelope.payloadHash`** or **`envelope.signatureHash`**.
5. Save the row. Call **`GET /api/esignatures/:id/verify`**.  
   - Expect **`payloadHashMatches: false`**, **`signatureHashMatches`** may still be **true** (chain vs payload wording in your UI).

### How to simulate **signature / chain failure** (chain ✗)

1. Same row as above.
2. Corrupt **`envelope.signatureHash`** (one hex character) or **`envelope.signedAt`** / **`envelope.metadata`** so the HMAC input no longer matches what was signed.
3. Call verify. Expect **`signatureHashMatches: false`**.

### How to simulate **legacy / missing envelope**

- Remove **`envelope`** or empty it so parsing fails. Verify returns **`ok: false`** with a **legacy** reason (see `src/routes/esignature.routes.ts`).

---

## 2. Audit log — `GET /api/audit/:id/verify`

### What is checked

`verifyAuditLogIntegrity` recomputes a hash from:

- Top-level columns: **`action`**, **`userId`**, **`companyId`**, **`targetType`**, **`targetId`**, **`reason`**, **`oldValues`**, **`newValues`**
- Plus **`details`** with every key that does **not** start with **`_`** (so **`_meta`** and **`_integrity`** are excluded from the fingerprint input).

That hash is compared to **`details._integrity.eventHash`** stored when the log was written (`logAudit` in `src/services/audit.service.ts`).

### How to simulate **integrity failure** (`ok: false`, hashes differ)

1. Fetch a log id: **`GET /api/audit/company`** (or **`/api/audit/platform`** as platform admin).
2. Tamper **any field that enters the fingerprint** while leaving **`_integrity.eventHash`** unchanged, for example:
   - Change **`action`** by one character, or  
   - Change **`reason`**, **`targetId`**, **`oldValues`**, **`newValues`**, or  
   - In **`details`**, add or change a key **not** starting with `_` (e.g. add `"tampered": true`).
3. Call **`GET /api/audit/:id/verify`**.  
   - Expect **`ok: false`**, **`storedEventHash`** ≠ **`recomputedEventHash`**.

### How to simulate **“no integrity hash”**

- Delete **`details._integrity`** or **`details._integrity.eventHash`** on that row.  
- Verify returns **`ok: false`** with reason **`No integrity hash found on this audit event`**.

---

## 3. Auth quick reference (both endpoints)

| Verify | Typical caller |
|--------|----------------|
| **`GET /api/esignatures/:id/verify`** | Same company as signer; **`SUPER_ADMIN`**, **`ADMIN`**, **`AUDITOR`**; **`PLATFORM_ADMIN`** can cross-tenant per route logic — see `src/routes/esignature.routes.ts`. |
| **`GET /api/audit/:id/verify`** | Log’s **`companyId`** must match tenant (unless **`PLATFORM_ADMIN`**); roles **`SUPER_ADMIN`**, **`ADMIN`**, **`AUDITOR`** — see `src/routes/audit.routes.ts`. |

Bearer token: **`Authorization: Bearer <jwt>`**.

---

## 4. Related code

| Area | File |
|------|------|
| E-sign envelope + hash | `src/services/signature.service.ts` |
| E-sign HTTP verify | `src/routes/esignature.routes.ts` |
| Audit fingerprint + verify | `src/services/audit.service.ts` |
| Audit HTTP verify | `src/routes/audit.routes.ts` |

Route table: **`docs/API_ENDPOINTS.md`**.
