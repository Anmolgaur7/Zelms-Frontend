# Security & deployment checklist (Phase 2)

High-level checklist before **demo**, **pilot**, or **production**. Adjust to your org’s policies.

---

## Secrets (required)

| Variable | Purpose |
|----------|---------|
| **`JWT_SECRET`** | Signing tenant + platform JWTs — use a long random value; rotation invalidates all sessions |
| **`SIGNATURE_HMAC_SECRET`** | E-signature envelope HMAC; should be stable per environment or verification of old signatures breaks |
| **`DATABASE_URL`** | PostgreSQL (e.g. Neon); restrict network access |

Optional / feature-specific: Supabase keys, Gemini API key, Resend, etc. — never commit to git.

---

## API hardening (already in product)

- **Rate limiting** on login / change-password / platform login (see `src/app.ts`).
- **Helmet** + CORS configured on the Express app.
- **Phase 1:** assignments only from **ACTIVE** SOPs + **snapshots** on assign.
- **Phase 2:** uploads default **DRAFT**; only **ADMIN / SUPER_ADMIN** may set **ACTIVE**; learners restricted to **ACTIVE** for list/file/study/chat/quizzes-by-sop.

---

## Database

- Run **`npx prisma migrate deploy`** (after baselining if needed — see `docs/MVP_PRODUCT_SCOPE.md`).
- Enable **Neon** (or provider) **branching / PITR** for production if available.
- Document **who** may run `db:flush` / destructive scripts (dev only).

---

## Incident response (one page)

1. **Credential leak** — rotate `JWT_SECRET`, force re-login, audit `AuditLog` for suspicious `LOGIN`.
2. **Data integrity concern** — use `GET /api/audit/:id/verify` and `GET /api/esignatures/:id/verify`; preserve logs before remediation.
3. **AI outage** — SOP upload may fail quiz generation; document manual quiz path (`POST /api/quizzes/manual`).

---

## Related

- `docs/COMPLIANCE_EVIDENCE_PACK_OUTLINE.md`
- `docs/API_ENDPOINTS.md`
