# Compliance evidence pack — outline (Phase 2)

Use this as a **customer-facing** or **internal QA** starter: fill in bracketed sections and attach screenshots / test exports. This is **not** a validated IQ/OQ package; it is **CSV-lite** evidence aligned to `docs/MVP_PRODUCT_SCOPE.md` Phase 2.

---

## 1. Intended use

| Item | Fill in |
|------|---------|
| **System name / version** | e.g. Klonixpharback API `v…` |
| **Regulated claim (narrow)** | e.g. Controlled SOP PDF + computer-based quiz + completion record + audit trail for read-and-understand training |
| **Out of scope (explicit)** | e.g. Classroom scheduling, induction programs, full multi-step QA matrices — see `docs/MVP_PRODUCT_SCOPE.md` Phase 3 |

---

## 2. Roles and segregation of duties (SoD)

| Role | Intended use in product |
|------|-------------------------|
| **TRAINER** | Upload SOP (creates **DRAFT**), build/manual quizzes, assign only when SOP **ACTIVE** |
| **ADMIN / SUPER_ADMIN** | Publish SOP (**DRAFT → ACTIVE**) via `PATCH /api/sops/:id/status` with e-sign (password + reason), user admin |
| **EMPLOYEE** | List/access only **ACTIVE** SOPs for read/study/chat; take assigned training |
| **AUDITOR** | Read audit feed, exports, verify endpoints |

**SoD story to evidence:** same person should not upload and approve without procedure; product enforces **trainer cannot activate** for training use.

---

## 3. Data flow (one diagram)

Sketch: **Browser** → **HTTPS** → **API** → **PostgreSQL** + **Supabase storage** + **email provider** + **AI (Gemini)**. Mark **PII** (names, emails) and **training records** (assignments, scores, signatures).

---

## 4. Requirements traceability matrix (RTM-lite)

| Req ID | Requirement (one line) | Evidence (test id / Postman / screenshot) | Release |
|--------|--------------------------|---------------------------------------------|---------|
| R-001 | Tenant auth + password change | E2E folder 2, 6.2–6.3 | |
| R-002 | SOP upload DRAFT, admin publish ACTIVE | E2E 5.2, 5.2b | |
| R-003 | Assign only ACTIVE + snapshot on assignment | E2E 6.1 + DB/API response fields | |
| R-004 | Audit + e-sign verify | `docs/INTEGRITY_VERIFY_SIMULATION.md` | |
| R-005 | Training CSV export | `GET /api/export/training-report` | |

Add rows as your URS grows.

---

## 5. Backup and RACI (split)

| Responsibility | Customer | Vendor (you) |
|----------------|----------|----------------|
| **DB backup / restore** | Often customer for dedicated DB | Document who runs Neon backups / PITR |
| **Application secrets** | — | Rotate `JWT_SECRET`, `SIGNATURE_HMAC_SECRET` |
| **User access removal** | HR process | API / admin UI |

---

## 6. Test evidence attachments (checklist)

- [ ] Postman E2E green (or subset documented).
- [ ] Sample **CSV** training export after controlled completion.
- [ ] Screenshot: **publish** (5.2b) + **assign** (6.1) + **verify** e-signature (optional).

---

## Related

- `docs/SECURITY_DEPLOYMENT_CHECKLIST.md`
- `docs/MVP_PRODUCT_SCOPE.md`
- `docs/API_ENDPOINTS.md`
