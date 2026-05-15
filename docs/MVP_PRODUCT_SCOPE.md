# MVP product scope — phased roadmap

**Audience:** product, UX, sales demos, and engineering alignment.  
**Technical detail:** `docs/API_ENDPOINTS.md`, `docs/FRONTEND_INTEGRATION.md`, Postman `postman/E2E_FULL_FLOW.postman_collection.json`.

**Context:** Large pharma LMS SOPs (e.g. **SOP-HA-095**-style, 10+ year vendors) describe **very broad** workflows. This roadmap **phases** work so you ship a **credible MVP** first, then **harden for QA/regulators**, then **grow toward** that breadth—without pretending v1 is full parity.

---

## Phased roadmap (summary)

| Phase | Name | Goal | Typical duration* |
|-------|------|------|-------------------|
| **0** | **Ship & demo** | Prove end-to-end: tenant, SOPs, AI quiz, assign, complete, certificate, audit/e-sign, reporting APIs | **Done / current** |
| **1** | **MVP hardening (compliance minimum)** | Close the biggest gaps vs established vendors: controlled assign, frozen record, SoD story | **Backend done** — integrity **verify** in UI still frontend |
| **2** | **MVP+ (credibility & adoption)** | Evidence, DRAFT→publish, bulk polish, security narrative—still not “full LMS” | **Backend + evidence docs done** — optional **TRAINING_MANAGER** deferred |
| **3** | **Full-scale product** | Modalities, induction, planners, course groups, multi-step QA ladders, platform ops | **Started** — first API slice below; remainder multi-quarter |

\*Durations are planning hints, not commitments.

---

## Phase 0 — Ship & demo (foundation)

**Goal:** Demo and pilot where the regulated claim stays narrow: *controlled document + assessment + completion record + audit trail.*

**Backend / product already in this phase** (lead UI with these):

| # | User-facing headline | Backend touchpoints (examples) |
|---|------------------------|--------------------------------|
| 1 | Tenant login & forced password change | `POST /api/auth/login`, `POST /api/auth/change-password` |
| 2 | Platform onboarding (optional in same demo) | `POST /api/platform/onboard`, `POST /api/auth/set-password` |
| 3 | Admin: users & departments | `POST/GET /api/admin/users`, bulk, departments |
| 4 | SOP library (upload, list, secure view) | `POST /api/sops/upload`, `GET /api/sops`, `GET /api/sops/:id/file` |
| 5 | AI quiz from SOP | Upload + `GET /api/quizzes/sop/:sopId`; optional `POST /api/quizzes/manual` |
| 6 | Assign training & employee completion | `POST /api/assignments`, `GET /api/assignments/my`, submit, certificate |
| 7 | Study + SOP assistant (optional) | `GET /api/sops/:id/study`, `POST /api/sops/:id/chat` |
| 8 | Compliance dashboard (lite) | `GET /api/assignments/company/stats`, `GET /api/assignments/company`, analytics, CSV export |
| 9 | Per-learner training history | `GET /api/assignments/company/users/:userId` |
| 10 | Privileged actions with re-auth | `PATCH /api/sops/:id/status`, `PATCH /api/assignments/:id/unlock` |
| 11 | Audit trail & e-signature ledger + verify | `GET /api/audit/company`, `…/verify`, `GET /api/esignatures`, `…/verify` |
| 12 | Branding | `GET/POST /api/admin/company`, logo upload |

**Phase 0 story (one sentence):** *Onboard the company, load SOPs, auto-build quizzes, assign training, prove completion with certificates, and expose audit-ready reporting and integrity checks.*

---

## Phase 1 — MVP hardening (compliance minimum)

**Goal:** Address the **highest-risk gaps** when a QA-minded customer compares you to a 10-year incumbent—**without** building induction, classroom, or planners.

**Engineering status (backend):**

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | **Assignable only from ACTIVE SOP** — `POST /api/assignments`, `POST /api/assignments/bulk-department` return **409** `SOP_NOT_ASSIGNABLE` if the quiz’s SOP is not **ACTIVE** | **Done** |
| 2 | **Frozen context on assignment** — `assignedSopId`, `assignedSopTitle`, `assignedSopVersion`, `assignedQuizDifficulty` set at create (null on legacy rows before migration) | **Done** |
| 3 | **SoD for go-live** | **Done (Phase 2 backend):** `PATCH /api/sops/:id/status` — upload **DRAFT**, only **ADMIN** / **SUPER_ADMIN** may set **ACTIVE**; pair people by procedure for reviews beyond the API |
| 4 | **Integrity in UI** | **Frontend** — verify buttons and copy (APIs already exist) |

**Database:** apply schema after pull:

- **If you use `migrate deploy` on Neon and see `P3005` (schema not empty):** the DB was likely created with **`db push`** or SQL without Prisma’s `_prisma_migrations` history. **Baseline** the migrations that already match your live schema, then deploy only new ones:

  ```bash
  npx prisma migrate resolve --applied 20260507113254_init
  npx prisma migrate resolve --applied 20260507115454_rename_sop_to_sop
  npx prisma migrate resolve --applied 20260507124217_add_sop_traceability
  npx prisma migrate deploy
  ```

  Then Prisma runs **`20260512100000_phase1_assignment_training_snapshot`** only. If your live schema drifted from those three files, fix drift first or use **`db push`** once to align.

- **Simpler on dev/staging (no migration history required):** `npx prisma db push`

Migration folder (Phase 1): `prisma/migrations/20260512100000_phase1_assignment_training_snapshot` (timestamp is **after** existing migrations so `migrate deploy` order is correct).

**Rationale:** (1) only **ACTIVE** SOPs may be assigned; (2) snapshots answer “what revision at assign time?”; (3) **SoD** is enforced in API as **DRAFT** upload + **ADMIN**/**SUPER_ADMIN** publish to **ACTIVE** (Phase 2); (4) integrity **verify** in UI is still frontend work — see `docs/INTEGRITY_VERIFY_SIMULATION.md`.

**Exit criteria for Phase 1:** Assign path cannot bypass **ACTIVE** training material; every **new** assignment row carries **immutable-at-assign** document identity; auditors can follow **verify** from UI + export *(verify UI = Phase 1 exit when frontend ships)*.

---

## Phase 2 — MVP+ (credibility & adoption)

**Goal:** Win trust in procurement and IT/security reviews—still **not** full LMS scope.

**Engineering / docs status**

| Theme | Status |
|--------|--------|
| **Evidence pack (RTM-lite, roles, RACI outline)** | **Doc:** `docs/COMPLIANCE_EVIDENCE_PACK_OUTLINE.md` — fill in for customers / QA |
| **Upload DRAFT + admin publish ACTIVE (SoD)** | **Done:** `POST /upload` → **DRAFT**; **`PATCH /status` → ACTIVE** only **ADMIN** / **SUPER_ADMIN**; learners restricted to **ACTIVE** for list / file / study / chat / quizzes-by-sop |
| **Bulk department dedupe** | **Done:** skips existing user+quiz; response `created` / `skipped` |
| **Single assign dedupe** | **Done:** **409** `ASSIGNMENT_ALREADY_EXISTS` |
| **Security & ops narrative** | **Doc:** `docs/SECURITY_DEPLOYMENT_CHECKLIST.md` |
| **Optional “Training Manager” role** | **Deferred** — use **ADMIN** as publisher |

---

## Phase 3 — Full-scale product

**Goal:** Grow toward incumbent breadth (modalities, catalogs, planners, qualification ladders) while keeping each release **claims-accurate**.

### Engineering status (first slices)

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | **Cross-tenant assignment read for `PLATFORM_ADMIN`** — `GET /api/platform/assignments` (paginated filters; audit `PLATFORM_ASSIGNMENTS_QUERY`; no signed SOP URLs) | **Done** |
| 2 | **Cross-tenant assignment KPIs** — `GET /api/platform/assignments/stats` | **Done** |
| 3 | **Per-company assignment KPIs** — `GET /api/platform/companies/assignment-stats` | **Done** |
| 4 | **Course catalog + course groups + group assign** — `POST/GET/PATCH /api/courses`, `/api/course-groups`, `POST …/assign-department` | **Done** |
| 5 | **Induction programs** — multi-step **COURSE** + **ACKNOWLEDGMENT**; enroll user/department; `GET …/my`; e-sign ack | **Done** |
| 6 | **Yearly training planner + review commentary** — `/api/training-plans`, items, monthly/annual reviews | **Done** |
| 7 | **JD matrices** — `/api/job-descriptions`, course links, user assignment | **Done** |
| 8 | **Qualification ladders (HOD → Head QA)** — `/api/qualifications`, e-sign per step | **Done** |

### Roadmap backlog (not scheduled as a single drop)

- Induction coordinator workflows / legacy import (beyond API catalog).
- **Full** Training Manager / QA approval matrices (beyond one publish gate).
- User group catalog and advanced rules engine (beyond course-group department assign).
- Classroom, verbal, practical demo, external training + **attendance**.
- Planner **auto-assign** from plan lines; JD **gap analysis** vs completion records.
- Division/site/temp role admin, fingerprint, knowledge library module, archive-backup workflows as product modules.
- Further **PLATFORM_ADMIN** APIs (e.g. cross-tenant stats, write operations) only with explicit security review.

---

## Established vendor (10+ years) vs us — why phases matter

| Theme | Mature vendors | Our phased response |
|--------|----------------|----------------------|
| **CSV / validation** | Full IQ/OQ/PQ packs | Phase 2: **CSV-lite** (RTM + release notes); full CSV when the business funds it. |
| **SoD & approvals** | Deep role matrices | Phase 1: **ACTIVE** assign gate; Phase 2: **DRAFT upload + ADMIN-only activate** |
| **Training record** | Frozen revision on record | Phase 1: **snapshots** on assignment. |
| **Modalities & org complexity** | Classroom, planners, induction | Phase 3 only. |

**Build-better principles (all phases):** narrow the regulated claim in writing; design one **“auditor in 5 minutes”** story; prefer **principles** (approval, effectivity, traceability) over copying 250-page legacy SOPs.

---

## Documentation map

| Doc | Use |
|-----|-----|
| **This file** | Phased MVP + roadmap messaging |
| `docs/SYSTEM_OVERVIEW.md` | **Whole system:** architecture, modules, stories, built vs backlog |
| `docs/API_ENDPOINTS.md` | What exists in the API |
| `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` | **UI build guide:** screens, nav, Phase 3 flows, sprint order |
| `docs/FRONTEND_INTEGRATION.md` | How the UI should call it (auth, errors, §6a detail) |
| `docs/INTEGRITY_VERIFY_SIMULATION.md` | QA/dev: integrity verify demos |
| `docs/COMPLIANCE_EVIDENCE_PACK_OUTLINE.md` | Phase 2: RTM-lite / intended-use / RACI starter |
| `docs/SECURITY_DEPLOYMENT_CHECKLIST.md` | Phase 2: secrets, deploy, incident basics |

---

## Versioning note

This file is **product intent**, not a legal URS. Formal URS/FRS should version requirements and map each ID to tests; use **Phase 0–3** as release planning labels internally and in customer-facing roadmaps.
