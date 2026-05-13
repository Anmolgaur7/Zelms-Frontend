# Frontend Implementation Plan — Klonix Pharma LMS

**Sources analyzed**

- `docs/API_ENDPOINTS.md` (51 endpoints across 11 sub-systems)
- `docs/E2E_FULL_FLOW.postman_collection.json` (request/response shapes, e-sign rules, status flow)
- `docs/FRONTEND_INTEGRATION.md` (auth, error envelope, UI stack rules)
- Current frontend tree: `app/`, `components/`, `lib/`, `types/`, `middleware.ts`

This document is the single source of truth for phasing the remaining work and tracking what is already built. Treat each phase as **independently shippable**.

---

## 1. Where the frontend stands today

### 1.1 Built (working)

| Area | Routes | Endpoints wired |
|---|---|---|
| Auth | `/login`, `/set-password`, `/change-password` | `POST /api/auth/login`, `POST /api/auth/set-password`, `POST /api/auth/change-password` |
| Session enforcement | `middleware.ts`, `lib/session.ts` | httpOnly cookie session; `mustChangePassword` gate; EMPLOYEE→`/my-trainings`; everyone else→`/dashboard` |
| Admin shell | `/dashboard/*` | role-filtered sidebar (`app-sidebar.tsx`), header, theme toggle |
| User management | `/dashboard/users` | `GET /api/admin/users`, `POST /api/admin/users` (modal) |
| Departments | `/dashboard/departments` | `GET /api/admin/departments`, `POST /api/admin/departments` (modal) |
| SOPs (admin) | `/dashboard/sops` | `GET /api/sops/`, `POST /api/sops/upload` (modal), `GET /api/sops/:id/file` (signed URL on click) |
| Assignments (admin) | `/dashboard/assignments` | `POST /api/assignments/` (modal). **Listing endpoint probes 5 paths and all return 404** — backend does not expose admin listing on the deployed instance today |
| Employee training | `/my-trainings`, `/my-trainings/view/[id]`, `/my-trainings/quiz/[id]` | `GET /api/assignments/my`, `POST /api/assignments/:id/submit`, signed PDF URL |
| SOP library (employee) | `/my-trainings/library`, `/my-trainings/library/[sopId]` | `GET /api/sops/`, `GET /api/sops/:id/file`, `GET /api/sops/:id/study`, `POST /api/sops/:id/chat` |
| Certificates | `/my-trainings/certificate/[id]`, `/my-trainings/certificates` | `GET /api/assignments/:id/certificate` |
| UX | dark/light/system theme toggle | — |

### 1.2 Endpoint coverage at a glance

| Sub-system | Endpoints documented | Endpoints wired | Coverage |
|---|---:|---:|---:|
| System (health/ready/init) | 4 | 0 | 0 % |
| Auth (`/api/auth`) | 3 | 3 | **100 %** |
| Platform (`/api/platform`) | 2 | 0 | 0 % |
| Admin org (`/api/admin`) | 9 | 4 | 44 % |
| SOPs (`/api/sops`) | 7 | 4 | 57 % |
| Quizzes (`/api/quizzes`) | 2 | 1 | 50 % |
| Assignments (`/api/assignments`) | 7 | 4 | 57 % |
| Analytics (`/api/analytics`) | 3 | 0 | 0 % |
| Export (`/api/export`) | 1 | 0 | 0 % |
| Notifications (`/api/notifications`) | 3 | 0 | 0 % |
| Audit (`/api/audit`) | 4 | 0 | 0 % |
| E-signatures (`/api/esignatures`) | 2 | 0 | 0 % |
| **Total** | **47** | **16** | **34 %** |

### 1.3 Known gaps & defects (carried into the plan)

1. `/dashboard/audit`, `/dashboard/company`, `/dashboard/users/bulk` are **linked from sidebar / dashboard but don't exist** → today's 404 traps.
2. Admin assignment listing returns 404 on every probed path. Need to confirm the canonical endpoint (likely `GET /api/analytics/compliance` or a future `GET /api/admin/assignments`).
3. No real-time mechanism for notifications (HTTP polling vs SSE/WebSocket — out of scope unless backend exposes one).
4. `getSession()` is null-guarded only in layouts, not in some admin pages (pre-existing TS soft warning — suppressed via `next.config.mjs` `ignoreBuildErrors`).
5. Validation errors from the backend (`details.issues`) are not mapped into per-field react-hook-form errors yet.

---

## 2. Cross-cutting conventions (apply to every phase)

These are the patterns every phase must follow so the codebase stays uniform.

### 2.1 Server actions

- One file per sub-system under `lib/actions/`: `auth.ts`, `admin.ts`, `employee.ts`, plus the new ones `platform.ts`, `analytics.ts`, `notifications.ts`, `audit.ts`, `esignatures.ts`.
- Every action returns one of:
  - `Promise<ActionResult<T>>` for mutations (`{ data, error?, errorCode? }`).
  - `Promise<FetchResult<T>>` for reads that need to distinguish empty vs failure.
  - Plain `Promise<T | null>` or `Promise<T[]>` for "fire and forget" reads where the UI doesn't need the error code.
- Always `console.error('[<file>.<fn>]', e)` on failure — required so devs can see the real backend error code in dev-server logs.
- Never call `cookies()` paths inside a `try/catch` that swallows `DynamicServerError`. Pages that hit cookies must declare `export const dynamic = 'force-dynamic'` (already done for `/dashboard` and `/my-trainings` layouts).

### 2.2 Types

- Single source: `types/admin.ts` and `types/auth.ts`. Add new files only when there is a new domain (`types/platform.ts`, `types/analytics.ts`, `types/notifications.ts`, `types/audit.ts`, `types/esignatures.ts`).
- Backend responses sometimes use `{ users: [...] }`, `{ data: [...] }`, or a plain array — every list action goes through the existing `unwrapList<T>()` helper or a similar tolerant extractor.

### 2.3 E-sign UX

Endpoints that require `password` (re-auth) **must** open a dedicated `ReauthDialog` (Phase 2 deliverable) that re-prompts the password, posts the action, and surfaces the GxP signature acknowledgement. Affected endpoints:

- `PATCH /api/sops/:id/status`
- `PATCH /api/assignments/:id/unlock`

The same pattern applies for the quiz submit signature step (already shipped via `quiz-interface.tsx`).

### 2.4 Forms

- Always `react-hook-form` + `zod` resolver.
- On `errorCode === 'VALIDATION_ERROR'`, map `details.issues` (Zod) into per-field errors via `setError(path, { message })`. Add this helper once in `lib/forms.ts` and reuse.

### 2.5 Error UI

- `sonner` toast for transient errors.
- Inline `<Alert variant="destructive">` banner inside cards / modals for credential / 4xx errors.
- Diagnostic banner (yellow) for "endpoint probe failed" pages, listing each path + status code (already used on `/dashboard/assignments`).

### 2.6 Routing conventions

- Admin/trainer/auditor: `/dashboard/*`.
- Employee: `/my-trainings/*` (middleware enforces).
- Platform admin: **separate Next app** (not in this repo) — `lib/actions/platform.ts` only exists for the tenant-side `auth/me/onboard-status` reads.

---

## 3. Phases

Each phase has: **Goal · Routes · Server actions · Components · Types · Endpoints · Acceptance**. They are ordered so that earlier phases unblock later ones.

---

### Phase 1 — Fill the 404 traps (≈ 1 day)

**Goal**: every link in the sidebar and dashboard quick-actions resolves to a real page. No new analytics work, just plug the holes.

| Item | Detail |
|---|---|
| Routes | `/dashboard/audit`, `/dashboard/company`, `/dashboard/users/bulk` |
| Server actions | `getCompany`, `uploadCompanyLogo`, `getAuditFeed`, `getAuditEntry`, `bulkCreateUsers` (already exists; needs UI) |
| Components | `<CompanyBrandingForm>`, `<AuditLogTable>`, `<BulkUserUpload>` (CSV/JSON paste) |
| Types | extend `Company` with `logoDisplayUrl`; new `AuditLogEntry` |
| Endpoints | `GET /api/admin/company`, `POST /api/admin/company/logo`, `GET /api/audit/company`, `GET /api/audit/:id`, `POST /api/admin/users/bulk` |
| Acceptance | All sidebar links return 200 with real content. Logo uploaded once shows in sidebar header next reload. Audit feed shows last 10 entries. Bulk import returns the per-row temp-password list and renders a downloadable CSV of credentials. |

---

### Phase 2 — Lifecycle hardening: SOP status, revise, unlock, role change (≈ 1–2 days)

**Goal**: ship all the e-signed / privileged mutations the backend already supports. Without these, admins can't change anything after creating it.

| Item | Detail |
|---|---|
| Routes | additions to `/dashboard/sops/[id]` (NEW), modal flows on `/dashboard/users`, `/dashboard/assignments` |
| Server actions | `changeSopStatus`, `reviseSop`, `unlockAssignment`, `changeUserRole` |
| Components | **`<ReauthDialog>`** (shared, re-prompts password + reason + opens action), `<SopStatusBadgeMenu>`, `<SopRevisionDialog>`, `<UserRoleMenu>` |
| Types | extend `SOP` with `parentSopId`, status union widened to `'DRAFT'\|'UNDER_REVIEW'\|'ACTIVE'\|'ARCHIVED'`; `AssignmentStatus` widened to include `LOCKED_OUT` |
| Endpoints | `PATCH /api/sops/:id/status`, `POST /api/sops/:id/revise`, `PATCH /api/assignments/:id/unlock`, `PATCH /api/admin/users/:id/role` |
| Acceptance | Admin can archive an SOP via password re-auth and the table flips status. Revise creates a new DRAFT row, visible on a new `/dashboard/sops/[id]` detail page. Locked-out assignment unlock confirms via `ReauthDialog`. Role change updates the row in place. |

---

### Phase 3 — Notifications & E-signature ledger (≈ 1 day)

**Goal**: a notification bell in the header (count + dropdown) and a `/dashboard/audit/signatures` view (auditor + admin).

| Item | Detail |
|---|---|
| Routes | none new — the bell renders globally; signatures live under `/dashboard/audit/signatures` |
| Server actions | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `listEsignatures`, `verifyEsignature` |
| Components | `<NotificationBell>` (header right of theme toggle), `<NotificationDropdownList>`, `<ESignatureTable>` |
| Types | `Notification`, `ESignatureRecord` |
| Endpoints | `GET /api/notifications/`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`, `GET /api/esignatures/`, `GET /api/esignatures/:id/verify` |
| Acceptance | Bell shows unread count, mark-as-read updates UI optimistically + refreshes server. E-signatures table shows assignment, signer, IP, timestamp, with a "verify" action that hits the verify route and toasts a result. |

---

### Phase 4 — Analytics & reporting (≈ 2 days)

**Goal**: real numbers on the admin dashboard, plus three analytics pages.

| Item | Detail |
|---|---|
| Routes | `/dashboard/analytics/compliance`, `/dashboard/analytics/risk`, `/dashboard/analytics/sop-difficulty`, replace `—` placeholders on `/dashboard` |
| Server actions | `getStats`, `getCompliance`, `getRiskReport`, `getSopDifficulty`, `exportTrainingReport` |
| Components | `<StatTile>`, `<ComplianceChart>` (recharts), `<RiskTable>`, `<SopDifficultyTable>`, `<ExportButton>` |
| Types | `Stats`, `ComplianceReport`, `RiskReport`, `SopDifficulty` (shapes inferred from response; type as `Record<string, unknown>` until backend ships an OpenAPI spec) |
| Endpoints | `GET /api/admin/stats`, `GET /api/analytics/compliance`, `GET /api/analytics/risk-report`, `GET /api/analytics/sop-difficulty`, `GET /api/export/training-report` |
| Acceptance | Dashboard tiles show real counts + delta. Compliance page renders chart + per-department breakdown. Risk page lists overdue or repeat-fail users. Export button triggers training-report download. |

**Note**: the existing `/dashboard/assignments` listing is most likely backed by `/api/analytics/compliance` (already in the probe list). After this phase ships, drop the probe and use the analytics endpoint directly.

---

### Phase 5 — Bulk operations & manual quizzes (≈ 1 day)

**Goal**: power-user features for trainers/admins.

| Item | Detail |
|---|---|
| Routes | `/dashboard/assignments/bulk` (department picker), modal on `/dashboard/sops/[id]` for manual quiz |
| Server actions | `bulkAssignByDepartment`, `createManualQuiz` |
| Components | `<DepartmentBulkAssignForm>`, `<ManualQuizBuilder>` (dnd-kit reorder of questions) |
| Types | `ManualQuizBody` |
| Endpoints | `POST /api/assignments/bulk-department`, `POST /api/quizzes/manual` |
| Acceptance | Trainer picks a department + quiz, server confirms count of users targeted. Manual quiz builder lets the trainer add/remove/reorder MCQs with explanations and saves to the SOP. |

---

### Phase 6 — SOP polish & search (≈ 0.5 day)

**Goal**: SOP list scales beyond 20 docs.

| Item | Detail |
|---|---|
| Routes | enhance `/dashboard/sops` and `/my-trainings/library` |
| Server actions | accept `category`, `status`, `search` query params on `getSOPs` / `getAllSops` |
| Components | search input + status/category filter chips |
| Types | none |
| Endpoints | `GET /api/sops/?category=&status=&search=` |
| Acceptance | Typing in the search input filters server-side; chips for ACTIVE/DRAFT/UNDER_REVIEW/ARCHIVED. Library search excludes ARCHIVED by default. |

---

### Phase 7 — Platform admin tenant onboarding (≈ 1 day, **separate Next app**)

**Goal**: small standalone Next app (or new route group `(platform)/` in the same repo behind a feature flag) for the SaaS operator.

| Item | Detail |
|---|---|
| Routes | `/platform/login`, `/platform/companies`, `/platform/companies/new`, `/platform/audit` |
| Server actions | `platformLogin`, `onboardCompany`, `getPlatformAudit` |
| Components | `<OnboardCompanyForm>`, `<TenantsTable>` |
| Types | `OnboardCompanyBody`, `OnboardCompanyResponse` |
| Endpoints | `POST /api/platform/login`, `POST /api/platform/onboard`, `GET /api/audit/platform` |
| Acceptance | Platform admin can create a tenant, copy the invite link, and audit company-creation events. |

> Per `FRONTEND_INTEGRATION.md` §2.2, this is intentionally separate from the tenant frontend. Decision point at the start of the phase: same repo with `/platform/*` route group + middleware swap, or a new Next app. Recommended **same repo, separate route group** for now.

---

### Phase 8 — Real-time + polish (≈ 1–2 days, optional)

**Goal**: live updates, request tracing, and developer experience improvements.

| Item | Detail |
|---|---|
| Routes | none |
| Server actions | wrap fetch to forward `x-request-id` header (already mentioned in docs §1) |
| Components | `<LiveDot>` for any list that should auto-refresh, `<RequestIdToast>` (devtool — shows the request id on every error toast) |
| Types | extend `ApiError` with `requestId` |
| Endpoints | none (uses headers already exposed) |
| Acceptance | Notification bell polls every 60s. Errors in toasts show a request id for backend support. All Server Actions log the request id when failing. |

---

## 4. Suggested order & rough estimate

| Sprint | Phases | Days |
|---|---|---|
| Sprint 1 | Phase 1, Phase 2 | 2–3 |
| Sprint 2 | Phase 3, Phase 4 | 3 |
| Sprint 3 | Phase 5, Phase 6 | 1.5 |
| Sprint 4 (optional) | Phase 7, Phase 8 | 2–3 |
| **Total** | | **≈ 8–10 days of focused work** |

---

## 5. Definition of done (per phase)

A phase ships only when **all** of the following are true.

1. Every documented endpoint in the phase is wired through a typed server action.
2. The new pages do not break the existing build (`npm run build` succeeds with no new errors).
3. Every new mutation that requires a password / reason calls the shared `ReauthDialog`.
4. Empty/error/loading states are explicit — no silent `catch { return [] }` is added.
5. New routes are added to `app-sidebar.tsx` with the correct role gating.
6. The doc (`docs/IMPLEMENTATION_PLAN.md`) is updated to flip the phase entry from PENDING → DONE.

---

## 6. Risks & open questions

| # | Risk / question | Mitigation |
|---|---|---|
| R1 | Admin assignment listing endpoint is undocumented; today every probe path returns 404. | Confirm with backend whether `/api/analytics/compliance` or `/api/admin/assignments` is the canonical reader before Phase 4. Until then, list is empty + diagnostic banner is shown. |
| R2 | Backend may rate-limit notification polling. | Default to 60 s; expose a setting. |
| R3 | No OpenAPI spec — response shapes are inferred from Postman happy-path. | Treat first deploy of each new page as a smoke test; surface raw error envelope in non-prod via a debug query string. |
| R4 | Platform admin "separate app" guidance vs same-repo decision. | Locked in at Phase 7 start. |
| R5 | Some `latest`-pinned deps (`recharts`, `sonner`, `@tanstack/react-table`). | Decide before Phase 4 (chart-heavy) — pin to a real version once we know charts render. |

---

## 7. Endpoint coverage matrix (post-plan target)

After Phase 6 ships:

| Sub-system | Coverage target |
|---|---:|
| Auth | **100 %** |
| Admin org | **100 %** |
| SOPs | **100 %** |
| Quizzes | **100 %** |
| Assignments | **100 %** |
| Analytics | **100 %** |
| Export | **100 %** |
| Notifications | **100 %** |
| Audit | **75 %** (platform feed handled in Phase 7) |
| E-signatures | **100 %** |
| Platform | covered by Phase 7 in a separate route group |

---

## 8. Glossary

- **Tenant**: a company on the SaaS — has its own `employeeIdPrefix`, users, SOPs, etc.
- **Platform admin**: SaaS operator who onboards tenants. Lives outside the tenant UI.
- **E-sign**: any action that requires re-entering the user's password + a ≥10-character reason. Recorded in the audit log.
- **GxP**: collective term for FDA/EMA Good-x-Practice regulations (GMP, GLP, GCP). The reason we capture audit trails + e-sigs.
